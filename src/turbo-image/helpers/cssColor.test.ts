import { describe, expect, it } from 'vitest'

import { toCssColor } from './cssColor'

describe('toCssColor', () => {
    it('unpacks an ARGB number from processColor', () => {
        expect(toCssColor(0xff_33_66_99)).toBe('rgba(51, 102, 153, 1)')
        expect(toCssColor(0x80_ff_00_00)).toBe(`rgba(255, 0, 0, ${0x80 / 255})`)
    })

    it('reads a negative number as the same 32 bits', () => {
        // 0xff0000ff as the signed integer processColor returns on Android.
        expect(toCssColor(-0xff_ff_01)).toBe('rgba(0, 0, 255, 1)')
    })

    it('passes a CSS colour through', () => {
        expect(toCssColor('teal')).toBe('teal')
        expect(toCssColor(undefined)).toBeUndefined()
    })
})
