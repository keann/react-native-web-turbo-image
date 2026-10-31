import type { Source } from '../TurboImage.types'

/** Turns `source.headers` into a plain object, or `undefined` when it holds no header. */
export const normalizeHeaders = (headers: Source['headers']) => {
    if (headers === undefined) {
        return undefined
    }
    try {
        const entries = [...new Headers(headers).entries()]

        return entries.length > 0 ? Object.fromEntries(entries) : undefined
    } catch {
        // An invalid header name or value sends the request without headers.
        return undefined
    }
}
