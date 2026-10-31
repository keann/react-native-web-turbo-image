/** A decoded image: what to paint, and its intrinsic size in pixels. */
export interface LoadedImage {
    height: number
    /** The requested URL, or an object URL on the `fetch` path. */
    uri: string
    width: number
}

interface LoadImageOptions {
    headers?: Record<string, string>
    onProgress?: (completed: number, total: number) => void
    signal: AbortSignal
    uri: string
}

/** OkHttp's `contentLength()` for a response without `Content-Length`. */
const UNKNOWN_CONTENT_LENGTH = -1

/** URLs that already fell back from `fetch` to `<img>`, so each one warns once. */
const fetchFallbacks = new Set<string>()

/** Decodes `uri`, naming `requestedUri` in the error: an object URL means nothing to a reader. */
const decode = (uri: string, requestedUri = uri) =>
    new Promise<LoadedImage>((resolve, reject) => {
        const image = new globalThis.Image()
        image.addEventListener('load', () => {
            resolve({ height: image.naturalHeight, uri, width: image.naturalWidth })
        })
        image.addEventListener('error', () => {
            reject(new Error(`Failed to decode resource ${requestedUri}`))
        })
        image.src = uri
    })

/** Loads through an `<img>`: no headers, no byte progress, and no CORS check. */
const loadWithElement = async (uri: string) => {
    try {
        return await decode(uri)
    } catch {
        // Matches react-native-web's own `onError` wording.
        throw new Error(`Failed to load resource ${uri}`)
    }
}

/** Loads through `fetch`, the one way to send headers or count bytes. */
const loadWithFetch = async ({ headers, onProgress, signal, uri }: LoadImageOptions) => {
    const response = await fetch(uri, { headers, signal })
    if (!response.ok) {
        throw new Error(`Failed to load resource ${uri} (${response.status})`)
    }
    const declaredLength = response.headers.get('content-length')
    const total = declaredLength === null ? UNKNOWN_CONTENT_LENGTH : Number(declaredLength)

    let blob: Blob
    if (onProgress !== undefined && response.body !== null) {
        const reader = response.body.getReader()
        const chunks: Uint8Array<ArrayBuffer>[] = []
        let completed = 0
        for (;;) {
            // oxlint-disable-next-line no-await-in-loop -- a stream yields its chunks in order
            const { done, value } = await reader.read()
            if (done) {
                break
            }
            chunks.push(value)
            completed += value.byteLength
            // Coil reports the running total after every read.
            onProgress(completed, total)
        }
        // Coil reports it once more for the read that ends the stream.
        onProgress(completed, total)
        blob = new Blob(chunks, { type: response.headers.get('content-type') ?? '' })
    } else {
        blob = await response.blob()
        onProgress?.(blob.size, total)
    }

    const objectUri = URL.createObjectURL(blob)
    try {
        return await decode(objectUri, uri)
    } catch (error) {
        URL.revokeObjectURL(objectUri)
        throw error
    }
}

/**
 * Loads and decodes an image. Headers or a progress listener take the `fetch` path. When CORS or
 * the network rejects the `fetch`, the load retries through an `<img>`, which sends no headers
 * and reports no progress.
 */
export const loadImage = async (options: LoadImageOptions) => {
    const { headers, onProgress, signal, uri } = options
    if (headers === undefined && onProgress === undefined) {
        return loadWithElement(uri)
    }
    try {
        return await loadWithFetch(options)
    } catch (error) {
        // `fetch` rejects with a `TypeError` for CORS and network failures only.
        if (signal.aborted || !(error instanceof TypeError)) {
            throw error
        }
        if (!fetchFallbacks.has(uri)) {
            fetchFallbacks.add(uri)
            console.warn(
                `[react-native-web-turbo-image] fetch() failed for ${uri} (${String(error)}). ` +
                    'Loading it through an <img> instead, which sends no source.headers and ' +
                    'reports no onProgress.',
            )
        }
        return loadWithElement(uri)
    }
}

/** Frees the object URL of an image that won't be painted. */
export const releaseLoadedImage = (image: LoadedImage) => {
    if (image.uri.startsWith('blob:')) {
        URL.revokeObjectURL(image.uri)
    }
}
