import type { ImageProps } from 'react-native-web'

/** The image to load: its URL. */
export interface TurboImageSource {
    uri: string
}

/** Props of the placeholder {@link TurboImage}: react-native-web's `Image` props with a required `source`. */
export interface TurboImageProps extends Omit<ImageProps, 'source'> {
    /** The image to load. */
    source: TurboImageSource
}
