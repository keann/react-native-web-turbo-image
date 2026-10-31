import { Image } from 'react-native-web'

import type { TurboImageProps } from './TurboImage.types'

/**
 * A placeholder that renders react-native-web's `Image`, so the build, the tests and Storybook run
 * end to end. The port of the web implementation replaces it.
 */
export const TurboImage = ({ source, ...imageProps }: TurboImageProps) => (
    <Image {...imageProps} source={source} />
)
