import type { CachePolicy, Source } from '../TurboImage.types'

import { normalizeHeaders } from './headers'
import { loadImage } from './loadImage'
import { clearMemoryCache, writeMemoryCache } from './memoryCache'
import { sourceUri } from './source'

/**
 * The static methods of the default export. They resolve the values the native modules resolve,
 * which upstream's types call `void`.
 */
export const turboImageStatics = {
    /** The browser offers no way to clear its HTTP cache. */
    clearDiskCache: () => Promise.resolve('Success'),

    clearMemoryCache: () => {
        clearMemoryCache()

        return Promise.resolve('Success')
    },

    /** No native module implements `dispose`, so the call rejects on a device too. */
    dispose: (_sources: Source[]) =>
        Promise.reject(
            new TypeError(
                'TurboImage.dispose is not a function on iOS or Android: neither native module ' +
                    'of react-native-turbo-image implements it.',
            ),
        ),

    /**
     * Resolves `true` once every source has settled, the failed ones included, as on both
     * platforms. Native builds the prefetch request from the URL alone, so the memory cache keys
     * each image by its URL, never by `cacheKey`.
     */
    prefetch: async (sources: Source[], _cachePolicy: CachePolicy = 'urlCache') => {
        await Promise.allSettled(
            sources.map(async source => {
                const uri = sourceUri(source)
                if (uri === null) {
                    return
                }
                const image = await loadImage({
                    headers: normalizeHeaders(source.headers),
                    signal: new AbortController().signal,
                    uri,
                })
                writeMemoryCache(uri, image.uri)
            }),
        )
        return true
    },
}
