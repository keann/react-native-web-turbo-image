import { decode as decodeBlurhash } from 'blurhash'
import { rgbaToDataURL, rgbaToThumbHash, thumbHashToRGBA } from 'thumbhash'
import { describe, expect, it } from 'vitest'

import { writeMemoryCache } from './memoryCache'
import { placeholderUri } from './placeholderUri'

/** The blurhash from woltapp/blurhash's README: 4 by 3 components. */
const BLURHASH = 'LEHV6nWB2yk8pyo0adR*.7kCMdnj'

/** A 2 by 1 image, red then blue, as a base64 thumbhash. */
const THUMBHASH_BYTES = rgbaToThumbHash(2, 1, [255, 0, 0, 255, 0, 0, 255, 255])
const THUMBHASH = btoa(String.fromCodePoint(...THUMBHASH_BYTES))

describe('placeholderUri', () => {
    it('rasterises a blurhash at 32 by 32 pixels', () => {
        expect(placeholderUri({ blurhash: BLURHASH })).toBe(
            rgbaToDataURL(32, 32, decodeBlurhash(BLURHASH, 32, 32)),
        )
    })

    it('rasterises a thumbhash at its own size', () => {
        const { h: height, rgba, w: width } = thumbHashToRGBA(THUMBHASH_BYTES)

        expect(placeholderUri({ thumbhash: THUMBHASH })).toBe(rgbaToDataURL(width, height, rgba))
    })

    it('returns null for a malformed hash', () => {
        expect(placeholderUri({ blurhash: 'nope' })).toBeNull()
        expect(placeholderUri({ thumbhash: 'AAAA' })).toBeNull()
        // The header alone, which the decoder reads past.
        expect(
            placeholderUri({
                thumbhash: btoa(String.fromCodePoint(...THUMBHASH_BYTES.slice(0, 5))),
            }),
        ).toBeNull()
        expect(placeholderUri({ thumbhash: 'not base64!' })).toBeNull()
    })

    it('reads a memory cache key from the cache', () => {
        expect(placeholderUri({ memoryCacheKey: 'placeholder-test' })).toBeNull()

        writeMemoryCache('placeholder-test', 'https://example.com/a.png')

        expect(placeholderUri({ memoryCacheKey: 'placeholder-test' })).toBe(
            'https://example.com/a.png',
        )
    })

    it('returns null without a placeholder', () => {
        expect(placeholderUri(undefined)).toBeNull()
        expect(placeholderUri({})).toBeNull()
    })
})
