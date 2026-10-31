import type { ColorValue } from 'react-native'

/**
 * Turns a colour prop into a CSS colour. A number is the packed ARGB integer that `processColor`
 * makes, which upstream's colour props accept and CSS doesn't.
 */
export const toCssColor = (color: number | ColorValue | undefined) => {
    if (typeof color !== 'number') {
        // react-native-web resolves an `OpaqueColorValue` to a string.
        return color as string | undefined
    }
    // `>>>` reads the bits unsigned, as Android's signed integers need.
    const alpha = (color >>> 24) / 255

    return `rgba(${(color >>> 16) & 255}, ${(color >>> 8) & 255}, ${color & 255}, ${alpha})`
}
