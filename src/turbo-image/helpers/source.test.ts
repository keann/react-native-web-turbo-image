import { describe, expect, it } from 'vitest'

import { sourceCacheKey, sourceUri } from './source'

describe('sourceUri', () => {
    it('returns the trimmed URL', () => {
        expect(sourceUri({ uri: ' https://example.com/a.png ' })).toBe('https://example.com/a.png')
    })

    it('returns null for a missing or blank URL', () => {
        expect(sourceUri(undefined)).toBeNull()
        expect(sourceUri({ uri: '   ' })).toBeNull()
        // Untyped JavaScript callers can pass anything.
        expect(sourceUri({ uri: 42 } as unknown as { uri: string })).toBeNull()
    })
})

describe('sourceCacheKey', () => {
    it('prefers cacheKey over the URL', () => {
        expect(sourceCacheKey({ cacheKey: 'avatar', uri: 'https://example.com/a.png' })).toBe(
            'avatar',
        )
        expect(sourceCacheKey({ uri: 'https://example.com/a.png' })).toBe(
            'https://example.com/a.png',
        )
    })
})
