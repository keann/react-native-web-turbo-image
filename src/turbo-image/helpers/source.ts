import type { Source } from '../TurboImage.types'

/** The URL to load, or `null` for a missing or blank one, which fails the load. */
export const sourceUri = (source: Source | undefined) => {
    const uri = typeof source?.uri === 'string' ? source.uri.trim() : ''

    return uri.length > 0 ? uri : null
}

export const sourceCacheKey = (source: Source | undefined) =>
    source?.cacheKey === undefined ? sourceUri(source) : String(source.cacheKey)
