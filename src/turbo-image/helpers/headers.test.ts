import { describe, expect, it } from 'vitest'

import { normalizeHeaders } from './headers'

describe('normalizeHeaders', () => {
    it('turns each HeadersInit shape into a plain object with lowercase names', () => {
        const expected = { authorization: 'Bearer token' }

        expect(normalizeHeaders({ Authorization: 'Bearer token' })).toEqual(expected)
        expect(normalizeHeaders([['Authorization', 'Bearer token']])).toEqual(expected)
        expect(normalizeHeaders(new Headers({ Authorization: 'Bearer token' }))).toEqual(expected)
    })

    it('returns undefined for no headers', () => {
        expect(normalizeHeaders(undefined)).toBeUndefined()
        expect(normalizeHeaders({})).toBeUndefined()
    })

    it('returns undefined for an invalid header', () => {
        expect(normalizeHeaders({ 'bad name': 'value' })).toBeUndefined()
    })
})
