import { decode as decodeBlurhash } from 'blurhash'
import { rgbaToDataURL, thumbHashToRGBA } from 'thumbhash'

import type { Placeholder } from '../TurboImage.types'

import { readMemoryCache } from './memoryCache'

/** iOS decodes a blurhash at 32 by 32 pixels, Android at 8 by 8. */
const BLURHASH_SIZE = 32

/** Decoding is pure, so a hash decodes once, however many views and requests show it. */
const decodedUris = new Map<string, string | null>()

const memoize = (key: string, decode: () => string | null) => {
    if (!decodedUris.has(key)) {
        let uri: string | null
        try {
            uri = decode()
        } catch {
            // A malformed hash: the native decoders return no image, so no placeholder shows.
            uri = null
        }
        decodedUris.set(key, uri)
    }
    return decodedUris.get(key) ?? null
}

const blurhashUri = (blurhash: string) =>
    memoize(`blurhash:${blurhash}`, () =>
        rgbaToDataURL(
            BLURHASH_SIZE,
            BLURHASH_SIZE,
            decodeBlurhash(blurhash, BLURHASH_SIZE, BLURHASH_SIZE),
        ),
    )

const thumbhashUri = (thumbhash: string) =>
    memoize(`thumbhash:${thumbhash}`, () => {
        const bytes = Uint8Array.from(atob(thumbhash), character => character.codePointAt(0) ?? 0)
        // The header takes 5 bytes and the first coefficients 1 more. A shorter hash reads past
        // the end and decodes to garbage.
        if (bytes.length < 6) {
            return null
        }
        const { h: height, rgba, w: width } = thumbHashToRGBA(bytes)

        return width > 0 && height > 0 ? rgbaToDataURL(width, height, rgba) : null
    })

/**
 * The image URL that `placeholder` shows, or `null` when it shows nothing: no placeholder, a
 * malformed hash, or a memory cache key with no entry yet.
 */
export const placeholderUri = (placeholder: Partial<Placeholder> | undefined) => {
    if (placeholder?.blurhash !== undefined) {
        return blurhashUri(placeholder.blurhash)
    }
    if (placeholder?.thumbhash !== undefined) {
        return thumbhashUri(placeholder.thumbhash)
    }
    if (placeholder?.memoryCacheKey !== undefined) {
        return readMemoryCache(placeholder.memoryCacheKey) ?? null
    }
    return null
}
