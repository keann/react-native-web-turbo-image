import type {
    AccessibilityProps,
    ColorValue,
    NativeSyntheticEvent,
    StyleProp,
    ViewProps,
    ViewStyle,
} from 'react-native'

// The types copy upstream's `src/types.ts`, and `TurboImage.types.test.ts` holds the two equal.
// They import `react-native`, as upstream's do: type-only, so the JavaScript build drops it.

export type Source = {
    /** Keys the memory cache instead of `uri`, for `placeholder.memoryCacheKey` to read. */
    // oxlint-disable-next-line typescript/no-wrapper-object-types -- upstream declares `String`
    cacheKey?: String | undefined
    /** HTTP headers for the request. Sending them takes a `fetch`, which CORS applies to. */
    headers?: HeadersInit_ | undefined
    /** The URL of the image. */
    uri: string
}

export type IndicatorStyle = 'large' | 'medium'

export type Indicator = Partial<{
    /** A colour value, or a packed ARGB number from `processColor`. */
    color: number | ColorValue
    /**
     * The indicator's size.
     * @default 'medium'
     */
    style: IndicatorStyle
}>

export type ResizeMode = 'contain' | 'cover' | 'stretch' | 'center'

/** How native caches the image. The browser owns HTTP caching, so web accepts it and ignores it. */
export type CachePolicy = 'urlCache' | 'dataCache'

/** A format to decode with. Browsers detect each of them, so web accepts it and ignores it. */
export type Format = 'svg' | 'gif' | 'apng'

type State = 'running' | 'cancelled' | 'completed'

export type Placeholder = {
    /** A blurhash string, decoded to a 32 by 32 image. */
    blurhash: string
    /** The cache key of an image loaded earlier, which shows while this one loads. */
    memoryCacheKey: string
    /** A base64 thumbhash string. */
    thumbhash: string
}

type TaskState = {
    state: State
}

/** The `onStart` payload. */
export type Start = TaskState

/** The `onCompletion` payload. */
export type Completion = TaskState

/** The `onProgress` payload. */
export type Progress = {
    /** The bytes received so far. */
    completed: number
    /** The response's length in bytes, or -1 when it declares none. */
    total: number
}

/** The `onSuccess` payload. */
export type Success = {
    /** The image's intrinsic height. */
    height: number
    /** The requested URL. */
    source: string
    /** The image's intrinsic width. */
    width: number
}

/** The `onFailure` payload. */
export type Failure = {
    error: string
}

export interface TurboImageProps extends AccessibilityProps, ViewProps {
    /** Whether Android may use hardware bitmaps. Accepted and ignored on web. */
    allowHardware?: boolean
    /** Blurs the image by this radius, as a CSS filter. */
    blur?: number
    /** Accepted and ignored on web. */
    cachePolicy?: CachePolicy
    /** Whether to enable iOS Live Text. Accepted and ignored on web. */
    enableLiveTextInteraction?: boolean
    /**
     * The fade-in time in milliseconds. A `placeholder` turns the fade off.
     * @default 300
     */
    fadeDuration?: number
    /** Accepted and ignored on web. */
    format?: Format
    /** Shows an activity indicator while the image loads and no placeholder shows. */
    indicator?: Indicator
    /** Whether iOS renders the image progressively. Accepted and ignored on web. */
    isProgressiveImageRenderingEnabled?: boolean
    /** Gives the image this colour's hue and saturation, keeping its luminosity. */
    monochrome?: number | ColorValue
    /** Handler that is called after `onSuccess` or `onFailure`. */
    onCompletion?: (result: NativeSyntheticEvent<Completion>) => void
    /** Handler that is called when the image fails to load or decode. */
    onFailure?: (result: NativeSyntheticEvent<Failure>) => void
    /**
     * Handler that is called as bytes arrive.
     * Listening switches the load to a `fetch`, which CORS applies to.
     */
    onProgress?: (result: NativeSyntheticEvent<Progress>) => void
    /** Handler that is called when the request starts. */
    onStart?: (result: NativeSyntheticEvent<Start>) => void
    /** Handler that is called when the image has loaded and decoded. */
    onSuccess?: (result: NativeSyntheticEvent<Success>) => void
    /**
     * What to show while the image loads. Exactly one key must be set, or the render throws.
     */
    placeholder?: Partial<Placeholder>
    /** A decode width on native. Accepted and ignored on web. */
    resize?: number
    /**
     * How the image fits its box.
     * @default 'contain'
     */
    resizeMode?: ResizeMode
    /** Whether the box is rounded into a circle. */
    rounded?: boolean
    /** Whether the placeholder stays on screen when the load fails. Requires a `placeholder`. */
    showPlaceholderOnFailure?: boolean
    /** The image to load. */
    source: Source
    /** The box's style. The image fills it. */
    style: StyleProp<ViewStyle>
    /** Paints every non-transparent pixel in this colour. */
    tint?: number | ColorValue
}

export interface TurboImageApi {
    /** Resolves `'Success'`. The browser offers no way to clear its HTTP cache. */
    clearDiskCache: () => Promise<void>
    /** Empties the memory cache that `placeholder.memoryCacheKey` reads. */
    clearMemoryCache: () => Promise<void>
    /** Rejects, as on a device: neither native module implements it. */
    dispose: (sources: Source[]) => Promise<void>
    /** Loads the sources into the browser cache and the memory cache, keyed by URL. */
    prefetch: (sources: Source[], cachePolicy?: CachePolicy) => Promise<boolean>
}
