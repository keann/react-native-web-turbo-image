import { useEffect, useRef, useState } from 'react'
import type { NativeSyntheticEvent } from 'react-native'

import { PENDING_URI_PREFIX } from '../constants/defaults'
import type { Source, TurboImageProps } from '../TurboImage.types'

import { normalizeHeaders } from './headers'
import { type LoadedImage, loadImage, releaseLoadedImage } from './loadImage'
import { writeMemoryCache } from './memoryCache'
import { sourceCacheKey, sourceUri } from './source'

type LoadState =
    { phase: 'loading' } | { image: LoadedImage; phase: 'loaded' } | { phase: 'failed' }

type LoadHandlers = Pick<
    TurboImageProps,
    'onCompletion' | 'onFailure' | 'onProgress' | 'onStart' | 'onSuccess'
>

interface LoadOptions extends LoadHandlers {
    /** Required by the types, and still checked: JavaScript callers can leave it out. */
    source: Source | undefined
}

/** The fields of `source` whose change starts a new request. */
interface Request {
    cacheKey: string | null
    headers: Record<string, string> | null
    uri: string | null
}

const startState = (uri: string | null): LoadState =>
    uri === null ? { phase: 'failed' } : { phase: 'loading' }

/** Native fills only `nativeEvent`, and consumers read only that. */
const emit = <Payload>(
    handler: ((event: NativeSyntheticEvent<Payload>) => void) | undefined,
    nativeEvent: Payload,
) => {
    handler?.({ nativeEvent } as NativeSyntheticEvent<Payload>)
}

/**
 * Loads `source` and fires upstream's events with native's payloads: `onStart`, `onProgress`,
 * then `onSuccess` or `onFailure`, then `onCompletion`. A missing or blank URL fails without
 * `onStart`, as on Android. Returns the load's state and the key that names its request.
 */
export const useImageLoad = ({ source, ...handlers }: LoadOptions) => {
    // Kept in refs, so an inline arrow handler or a new `source` object with the same fields
    // doesn't restart the load. The effect below updates the refs before the load effect runs.
    const handlersRef = useRef(handlers)
    const sourceRef = useRef(source)
    useEffect(() => {
        handlersRef.current = handlers
        sourceRef.current = source
    })

    const uri = sourceUri(source)
    const requestKey = JSON.stringify({
        cacheKey: sourceCacheKey(source),
        headers: normalizeHeaders(source?.headers) ?? null,
        uri,
    } satisfies Request)

    const [state, setState] = useState(() => startState(uri))
    const [stateRequestKey, setStateRequestKey] = useState(requestKey)
    if (stateRequestKey !== requestKey) {
        // Reset during render: an effect would first commit the new source with the old result.
        setStateRequestKey(requestKey)
        setState(startState(uri))
    }

    useEffect(() => {
        const request = JSON.parse(requestKey) as Request
        if (request.uri === null) {
            emit(handlersRef.current.onFailure, {
                error: `invalid source: ${JSON.stringify(sourceRef.current ?? null)}`,
            })
            emit(handlersRef.current.onCompletion, { state: 'completed' })
            return undefined
        }

        const { cacheKey, headers } = request
        const requestUri = request.uri
        emit(handlersRef.current.onStart, { state: 'running' })
        if (requestUri.startsWith(PENDING_URI_PREFIX)) {
            return undefined
        }

        let isCancelled = false
        const controller = new AbortController()
        const reportProgress =
            handlersRef.current.onProgress === undefined
                ? undefined
                : (completed: number, total: number) => {
                      if (!isCancelled) {
                          emit(handlersRef.current.onProgress, { completed, total })
                      }
                  }

        loadImage({
            headers: headers ?? undefined,
            onProgress: reportProgress,
            signal: controller.signal,
            uri: requestUri,
        }).then(
            image => {
                if (isCancelled) {
                    releaseLoadedImage(image)
                    return
                }
                if (cacheKey !== null) {
                    writeMemoryCache(cacheKey, image.uri)
                }
                setState({ image, phase: 'loaded' })
                // Native reports the requested URL, never the URL of the decoded bitmap.
                emit(handlersRef.current.onSuccess, {
                    height: image.height,
                    source: requestUri,
                    width: image.width,
                })
                emit(handlersRef.current.onCompletion, { state: 'completed' })
            },
            (error: unknown) => {
                if (isCancelled) {
                    return
                }
                setState({ phase: 'failed' })
                emit(handlersRef.current.onFailure, {
                    error: error instanceof Error ? error.message : String(error),
                })
                emit(handlersRef.current.onCompletion, { state: 'completed' })
            },
        )

        return () => {
            isCancelled = true
            controller.abort()
        }
    }, [requestKey])

    return { requestKey, state }
}
