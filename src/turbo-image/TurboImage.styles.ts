import type { ViewStyle } from 'react-native'

// Plain objects: react-native-web's typings declare no `StyleSheet` value, and its renderer takes
// a plain style object as it takes a registered one.

const fill = { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 } satisfies ViewStyle

export default {
    root: {
        overflow: 'hidden',
    },
    // Upstream's `rounded && { borderRadius: 9999999 }`.
    rounded: {
        borderRadius: 9_999_999,
    },
    placeholder: fill,
    indicator: {
        ...fill,
        alignItems: 'center',
        justifyContent: 'center',
    },
    imageLayer: {
        ...fill,
        // Keeps `monochrome`'s blend inside this layer, away from the placeholder and the page.
        isolation: 'isolate',
    },
    image: fill,
    monochrome: {
        ...fill,
        // Android's `BlendMode.COLOR`: the image's luminosity with the colour's hue and saturation.
        mixBlendMode: 'color',
    },
} satisfies Record<string, ViewStyle>
