import { type FC, type ForwardedRef, forwardRef, useMemo } from 'react'
import { ActivityIndicator, Image, type ImageProps, View } from 'react-native-web'

import { DEFAULT_FADE_DURATION_MS, DEFAULT_RESIZE_MODE } from './constants/defaults'
import { toCssColor } from './helpers/cssColor'
import { placeholderUri } from './helpers/placeholderUri'
import { turboImageStatics } from './helpers/statics'
import { useFadeStyle } from './helpers/useFadeStyle'
import { useImageLoad } from './helpers/useImageLoad'
import styles from './TurboImage.styles'
import type { TurboImageApi, TurboImageProps } from './TurboImage.types'

const TurboImageView = (
    {
        // Native-only props stay out of `imageProps`, which the inner `Image` receives.
        allowHardware: _allowHardware,
        blur,
        cachePolicy: _cachePolicy,
        // Upstream hands `children` to a leaf native view. react-native-web's `Image` throws on it.
        children: _children,
        enableLiveTextInteraction: _enableLiveTextInteraction,
        fadeDuration = DEFAULT_FADE_DURATION_MS,
        format: _format,
        indicator,
        isProgressiveImageRenderingEnabled: _isProgressiveImageRenderingEnabled,
        monochrome,
        onCompletion,
        onFailure,
        onProgress,
        onStart,
        onSuccess,
        placeholder,
        resize: _resize,
        resizeMode = DEFAULT_RESIZE_MODE,
        rounded,
        showPlaceholderOnFailure,
        source,
        style,
        tint,
        ...imageProps
    }: TurboImageProps,
    ref: ForwardedRef<HTMLElement>,
) => {
    // Both errors are thrown from render, as upstream throws them.
    if (placeholder !== undefined && Object.keys(placeholder).length !== 1) {
        throw new Error('Choose only one placeholder')
    }
    if (showPlaceholderOnFailure === true && placeholder === undefined) {
        throw new Error('A placeholder is required since showPlaceholderOnFailure is true')
    }

    const { requestKey, state } = useImageLoad({
        onCompletion,
        onFailure,
        onProgress,
        onStart,
        onSuccess,
        source,
    })

    const placeholderBlurhash = placeholder?.blurhash
    const placeholderMemoryCacheKey = placeholder?.memoryCacheKey
    const placeholderThumbhash = placeholder?.thumbhash
    const shownPlaceholderUri = useMemo(
        () =>
            placeholderUri({
                blurhash: placeholderBlurhash,
                memoryCacheKey: placeholderMemoryCacheKey,
                thumbhash: placeholderThumbhash,
            }),
        // Native reads the memory cache when a request starts, so a new request reads it again.
        // oxlint-disable-next-line react-hooks/exhaustive-deps -- `requestKey` marks a new request
        [placeholderBlurhash, placeholderMemoryCacheKey, placeholderThumbhash, requestKey],
    )

    // A placeholder turns the fade off, to avoid the flicker upstream's README describes.
    const fadeStyle = useFadeStyle(
        state.phase === 'loaded',
        placeholder === undefined ? Math.max(0, fadeDuration) : 0,
    )

    const isPlaceholderShown =
        shownPlaceholderUri !== null &&
        (state.phase === 'loading' ||
            (state.phase === 'failed' && showPlaceholderOnFailure === true))
    // Upstream drops `indicator={{}}` before it reaches the native view.
    const isIndicatorShown =
        state.phase === 'loading' &&
        !isPlaceholderShown &&
        indicator !== undefined &&
        Object.keys(indicator).length > 0

    return (
        <View ref={ref} style={[styles.root, style, rounded === true && styles.rounded]}>
            {isPlaceholderShown ? (
                <Image
                    resizeMode={resizeMode}
                    source={{ uri: shownPlaceholderUri }}
                    style={styles.placeholder}
                />
            ) : null}
            {isIndicatorShown ? (
                <View style={styles.indicator}>
                    <ActivityIndicator
                        color={toCssColor(indicator.color)}
                        size={indicator.style === 'large' ? 'large' : 'small'}
                    />
                </View>
            ) : null}
            <View style={[styles.imageLayer, fadeStyle]}>
                <Image
                    // react-native-web takes react-native's view props.
                    {...(imageProps as ImageProps)}
                    blurRadius={blur}
                    resizeMode={resizeMode}
                    // The source stays unset until the image loads:
                    // react-native-web reports an error for an empty URI.
                    source={state.phase === 'loaded' ? { uri: state.image.uri } : undefined}
                    style={styles.image}
                    tintColor={toCssColor(tint)}
                />
                {monochrome === undefined ? null : (
                    <View
                        style={[styles.monochrome, { backgroundColor: toCssColor(monochrome) }]}
                    />
                )}
            </View>
        </View>
    )
}

export const TurboImage = Object.assign(
    forwardRef(TurboImageView),
    turboImageStatics,
    // Upstream's default export carries the same cast, so consumers see the same type.
) as unknown as FC<TurboImageProps> & TurboImageApi
