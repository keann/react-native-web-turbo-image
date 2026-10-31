export type { TurboImageProps, TurboImageSource } from './turbo-image'

// A default export, unlike the rest of the code: a bundler alias swaps this package in for
// react-native-turbo-image, whose API is a default export.
export { TurboImage as default } from './turbo-image'
