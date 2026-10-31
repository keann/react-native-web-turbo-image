/**
 * Stands in for Nuke's and Coil's memory caches: maps a cache key to a URL to paint, either the
 * requested URL or an object URL from the `fetch` path. `placeholder.memoryCacheKey` reads it.
 *
 * Dropping an entry keeps its object URL alive, because an image on screen may still paint it.
 */
const memoryCache = new Map<string, string>()

export const readMemoryCache = (key: string) => memoryCache.get(key)

export const writeMemoryCache = (key: string, uri: string) => {
    memoryCache.set(key, uri)
}

export const clearMemoryCache = () => {
    memoryCache.clear()
}
