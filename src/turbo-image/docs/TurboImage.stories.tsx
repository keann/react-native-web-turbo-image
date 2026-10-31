import { useState } from 'react'
import TurboImage, { type Source } from 'react-native-turbo-image'
import { View } from 'react-native-web'
import { expect, fn, spyOn, waitFor } from 'storybook/test'

import preview from '../../../.storybook/preview'

import { Boundary, Button, Case, Label, LoggedTurboImage, Row, shortUri } from './demo'
import { logLines, turboImageParts } from './queries'
import {
    BROKEN_URI,
    SAMPLE_BLURHASH,
    SAMPLE_BYTES,
    SAMPLE_SIZE,
    SAMPLE_THUMBHASH,
    SAMPLE_URI,
    TILE_STYLE,
} from './TurboImage.mocks'

/**
 * What a static method resolves.
 * Upstream types the clearing ones as `void`, and they resolve `'Success'`.
 */
const resolved = (promise: Promise<unknown>) => promise.then(String)

const SQUARE_STYLE = { backgroundColor: '#222', height: 200, width: 200 } as const

const SAMPLE_SUCCESS = `onSuccess ${SAMPLE_SIZE.width}x${SAMPLE_SIZE.height} ${shortUri(SAMPLE_URI)}`

/**
 * **TurboImage** for react-native-web: `react-native-turbo-image`'s component and static methods
 * on browser images. App code imports `react-native-turbo-image`, and a bundler alias resolves it
 * to this package on web.
 *
 * A `source.uri` that starts with `pending:` starts a load that never settles, so a story or a
 * test can hold a component in its loading state.
 */
const meta = preview.meta({
    title: 'Components/TurboImage',
    component: TurboImage,
    args: {
        onCompletion: fn(),
        onFailure: fn(),
        onStart: fn(),
        onSuccess: fn(),
        source: { uri: SAMPLE_URI },
        style: TILE_STYLE,
        testID: 'image',
    },
})

export const Sandbox = meta.story({
    play: async ({ args, canvasElement }) => {
        await waitFor(() => expect(args.onCompletion).toHaveBeenCalledOnce())

        await expect(args.onStart).toHaveBeenCalledWith({ nativeEvent: { state: 'running' } })
        await expect(args.onSuccess).toHaveBeenCalledWith({
            nativeEvent: { ...SAMPLE_SIZE, source: SAMPLE_URI },
        })
        await expect(args.onCompletion).toHaveBeenCalledWith({
            nativeEvent: { state: 'completed' },
        })
        await expect(args.onFailure).not.toHaveBeenCalled()
        await waitFor(() =>
            expect(turboImageParts(canvasElement, 'image').imageUri).toBe(SAMPLE_URI),
        )
    },
})

/**
 * `center` follows Android: it scales the image down to fit and never up, where iOS keeps the
 * natural size and crops it.
 */
export const ResizeMode = meta.story({
    render: args => (
        <Row>
            <Case title="default">
                <TurboImage {...args} style={SQUARE_STYLE} testID="resize-default" />
            </Case>
            {(['contain', 'cover', 'stretch', 'center'] as const).map(resizeMode => (
                <Case key={resizeMode} title={resizeMode}>
                    <TurboImage
                        {...args}
                        resizeMode={resizeMode}
                        style={SQUARE_STYLE}
                        testID={`resize-${resizeMode}`}
                    />
                </Case>
            ))}
        </Row>
    ),
    play: async ({ canvasElement }) => {
        const backgroundSize = (testID: string) =>
            getComputedStyle(turboImageParts(canvasElement, testID).painter).backgroundSize

        await waitFor(async () => {
            await expect(backgroundSize('resize-default')).toBe('contain')
            await expect(backgroundSize('resize-contain')).toBe('contain')
            await expect(backgroundSize('resize-cover')).toBe('cover')
            await expect(backgroundSize('resize-stretch')).toBe('100% 100%')
            // 320 by 180 scaled down into 200 by 200.
            await expect(backgroundSize('resize-center')).toBe('200px 113px')
        })
    },
})

/**
 * The props that change pixels natively are CSS on web. `blur` is a CSS filter, so it fades out
 * at the edges where native clamps. `rounded` rounds the wrapper, where native crops the bitmap
 * itself, which shows with `contain`.
 *
 * Colours take a CSS colour or the packed ARGB number that `processColor` makes.
 */
export const Rendering = meta.story({
    render: args => (
        <Row>
            <Case title="none">
                <TurboImage {...args} testID="rendering-none" />
            </Case>
            <Case title="blur={8}">
                <TurboImage {...args} blur={8} testID="rendering-blur" />
            </Case>
            <Case title="tint='#6f4bd8'">
                <TurboImage {...args} testID="rendering-tint" tint="#6f4bd8" />
            </Case>
            <Case title="monochrome={0xff41b3a3}">
                <TurboImage {...args} monochrome={0xff_41_b3_a3} testID="rendering-monochrome" />
            </Case>
            <Case title="rounded">
                <TurboImage
                    {...args}
                    resizeMode="cover"
                    rounded
                    style={{ height: 135, width: 135 }}
                    testID="rendering-rounded"
                />
            </Case>
        </Row>
    ),
    play: async ({ canvasElement }) => {
        const parts = (testID: string) => turboImageParts(canvasElement, testID)
        await waitFor(() => expect(parts('rendering-rounded').imageUri).toBe(SAMPLE_URI))

        await expect(getComputedStyle(parts('rendering-none').painter).filter).toBe('none')
        await expect(getComputedStyle(parts('rendering-blur').painter).filter).toBe('blur(8px)')
        await expect(getComputedStyle(parts('rendering-tint').painter).filter).toMatch(/^url\(/u)

        const overlay = parts('rendering-monochrome').layer.lastElementChild as HTMLElement
        await expect(getComputedStyle(overlay).mixBlendMode).toBe('color')
        await expect(getComputedStyle(overlay).backgroundColor).toBe('rgb(65, 179, 163)')

        const radius = getComputedStyle(parts('rendering-rounded').root).borderTopLeftRadius
        await expect(Number.parseFloat(radius)).toBeGreaterThan(1_000_000)
    },
})

/**
 * `fadeDuration` defaults to 300 ms, as on iOS; Android's default is 100 ms. Natively a memory
 * cache hit skips the fade, and on web every load fades.
 */
export const Fade = meta.story({
    render: function Render(args) {
        const [generation, setGeneration] = useState(0)

        return (
            <View style={{ gap: 16 }}>
                <Button onPress={() => setGeneration(value => value + 1)} title="Reload" />
                <Row>
                    {[0, 300, 2000].map(fadeDuration => (
                        <Case key={fadeDuration} title={`fadeDuration={${fadeDuration}}`}>
                            <TurboImage
                                {...args}
                                fadeDuration={fadeDuration}
                                key={generation}
                                testID={`fade-${fadeDuration}`}
                            />
                        </Case>
                    ))}
                    <Case title="fadeDuration={2000} with a placeholder">
                        <TurboImage
                            {...args}
                            fadeDuration={2000}
                            key={generation}
                            placeholder={{ blurhash: SAMPLE_BLURHASH }}
                            testID="fade-placeholder"
                        />
                    </Case>
                </Row>
            </View>
        )
    },
    play: async ({ canvasElement }) => {
        const layerStyle = (testID: string) =>
            getComputedStyle(turboImageParts(canvasElement, testID).layer)

        await expect(layerStyle('fade-0').transitionDuration).toBe('0s')
        await expect(layerStyle('fade-300').transitionDuration).toBe('0.3s')
        await expect(layerStyle('fade-2000').transitionDuration).toBe('2s')
        await expect(layerStyle('fade-placeholder').transitionDuration).toBe('0s')

        // Once the fade is due, the transition is dropped, so a hidden tab can't strand it.
        await waitFor(async () => {
            await expect(layerStyle('fade-300').opacity).toBe('1')
            await expect(layerStyle('fade-300').transitionProperty).toBe('none')
        })
    },
})

/**
 * Blurhash and thumbhash decode with the reference libraries, blurhash at 32 by 32 pixels as on
 * iOS. A malformed hash shows nothing, as native's decoders return no image.
 *
 * The thumbhash here is encoded from the sample image, so it reads as a blurred copy of it.
 */
export const Placeholders = meta.story({
    render: args => (
        <Row>
            <Case title="blurhash">
                <TurboImage
                    {...args}
                    placeholder={{ blurhash: SAMPLE_BLURHASH }}
                    source={{ uri: 'pending:blurhash' }}
                    testID="placeholder-blurhash"
                />
            </Case>
            <Case title="thumbhash">
                <TurboImage
                    {...args}
                    placeholder={{ thumbhash: SAMPLE_THUMBHASH }}
                    source={{ uri: 'pending:thumbhash' }}
                    testID="placeholder-thumbhash"
                />
            </Case>
            <Case title="the image it encodes">
                <TurboImage {...args} testID="placeholder-sample" />
            </Case>
            <Case title="malformed blurhash">
                <TurboImage
                    {...args}
                    placeholder={{ blurhash: 'not a blurhash' }}
                    source={{ uri: 'pending:malformed' }}
                    testID="placeholder-malformed"
                />
            </Case>
            <Case title="blurhash, then the image">
                <TurboImage
                    {...args}
                    placeholder={{ blurhash: SAMPLE_BLURHASH }}
                    testID="placeholder-loaded"
                />
            </Case>
        </Row>
    ),
    play: async ({ canvasElement }) => {
        const parts = (testID: string) => turboImageParts(canvasElement, testID)

        await expect(parts('placeholder-blurhash').placeholderUri).toMatch(
            /^data:image\/png;base64,/u,
        )
        await expect(parts('placeholder-thumbhash').placeholderUri).toMatch(
            /^data:image\/png;base64,/u,
        )
        await expect(parts('placeholder-malformed').placeholderUri).toBeNull()
        await waitFor(async () => {
            await expect(parts('placeholder-loaded').imageUri).toBe(SAMPLE_URI)
            await expect(parts('placeholder-loaded').placeholderUri).toBeNull()
        })
    },
})

/**
 * `placeholder.memoryCacheKey` shows an image loaded earlier, from the memory cache. A loaded
 * image goes in under `source.cacheKey`, or under its URL without one.
 *
 * Native reads the cache when a request starts, so the placeholder of a view that started before
 * the image loaded stays empty.
 */
export const MemoryCacheKey = meta.story({
    render: function Render(args) {
        const [isLoaded, setIsLoaded] = useState(false)

        return (
            <Row>
                <Case title="source.cacheKey: 'sunset'">
                    <TurboImage
                        {...args}
                        onSuccess={() => setIsLoaded(true)}
                        source={{ cacheKey: 'sunset', uri: SAMPLE_URI }}
                        testID="memory-source"
                    />
                </Case>
                <Case title="memoryCacheKey: 'sunset', mounted first">
                    <TurboImage
                        {...args}
                        placeholder={{ memoryCacheKey: 'sunset' }}
                        source={{ uri: 'pending:memory-early' }}
                        testID="memory-early"
                    />
                </Case>
                {isLoaded ? (
                    <Case title="memoryCacheKey: 'sunset', mounted after">
                        <TurboImage
                            {...args}
                            placeholder={{ memoryCacheKey: 'sunset' }}
                            source={{ uri: 'pending:memory-late' }}
                            testID="memory-late"
                        />
                    </Case>
                ) : null}
            </Row>
        )
    },
    beforeEach: async () => {
        await TurboImage.clearMemoryCache()
    },
    play: async ({ canvasElement }) => {
        await waitFor(() =>
            expect(turboImageParts(canvasElement, 'memory-late').placeholderUri).toBe(SAMPLE_URI),
        )
        await expect(turboImageParts(canvasElement, 'memory-early').placeholderUri).toBeNull()
    },
})

/**
 * `showPlaceholderOnFailure={false}` drops the placeholder on failure, as iOS does. Android keeps
 * the placeholder whenever the prop is set at all.
 */
export const PlaceholderOnFailure = meta.story({
    args: { source: { uri: BROKEN_URI } },
    render: args => (
        <Row>
            <Case title="showPlaceholderOnFailure">
                <TurboImage
                    {...args}
                    placeholder={{ blurhash: SAMPLE_BLURHASH }}
                    showPlaceholderOnFailure
                    testID="failure-shown"
                />
            </Case>
            <Case title="showPlaceholderOnFailure={false}">
                <TurboImage
                    {...args}
                    placeholder={{ blurhash: SAMPLE_BLURHASH }}
                    showPlaceholderOnFailure={false}
                    testID="failure-hidden"
                />
            </Case>
        </Row>
    ),
    play: async ({ args, canvasElement }) => {
        await waitFor(() => expect(args.onFailure).toHaveBeenCalledTimes(2))

        await expect(turboImageParts(canvasElement, 'failure-shown').placeholderUri).toMatch(
            /^data:/u,
        )
        await expect(turboImageParts(canvasElement, 'failure-hidden').placeholderUri).toBeNull()
    },
})

/**
 * A placeholder beats the activity indicator, as on both platforms. `indicator={{}}` shows
 * nothing, because upstream drops an empty object before it reaches the native view.
 */
export const Indicator = meta.story({
    args: { source: { uri: 'pending:indicator' } },
    render: args => (
        <Row>
            <Case title="{}">
                <TurboImage {...args} indicator={{}} testID="indicator-empty" />
            </Case>
            <Case title="{ style: 'medium' }">
                <TurboImage {...args} indicator={{ style: 'medium' }} testID="indicator-medium" />
            </Case>
            <Case title="{ color: '#41b3a3', style: 'large' }">
                <TurboImage
                    {...args}
                    indicator={{ color: '#41b3a3', style: 'large' }}
                    testID="indicator-large"
                />
            </Case>
            <Case title="{ color: 0xffe0785f }">
                <TurboImage
                    {...args}
                    indicator={{ color: 0xff_e0_78_5f }}
                    testID="indicator-number"
                />
            </Case>
            <Case title="with a placeholder">
                <TurboImage
                    {...args}
                    indicator={{ style: 'large' }}
                    placeholder={{ blurhash: SAMPLE_BLURHASH }}
                    testID="indicator-placeholder"
                />
            </Case>
        </Row>
    ),
    play: async ({ canvasElement }) => {
        const indicator = (testID: string) => turboImageParts(canvasElement, testID).indicator
        const size = (testID: string) =>
            indicator(testID)?.firstElementChild?.getBoundingClientRect().width
        const stroke = (testID: string) => {
            const circle = indicator(testID)?.querySelector('circle')
            return circle === null || circle === undefined ? null : getComputedStyle(circle).stroke
        }

        await expect(indicator('indicator-empty')).toBeNull()
        await expect(indicator('indicator-placeholder')).toBeNull()
        await expect(size('indicator-medium')).toBe(20)
        await expect(size('indicator-large')).toBe(36)
        await expect(stroke('indicator-large')).toBe('rgb(65, 179, 163)')
        await expect(stroke('indicator-number')).toBe('rgb(224, 120, 95)')
    },
})

/**
 * Every event, in order: `onStart`, `onProgress` while bytes arrive, then `onSuccess` or
 * `onFailure`, then `onCompletion`. `onSuccess` reports the image's intrinsic size and the
 * requested URL, as on iOS. Android reports the size it decoded at.
 */
export const Lifecycle = meta.story({
    render: function Render(args) {
        const [generation, setGeneration] = useState(0)

        return (
            <View style={{ gap: 12 }}>
                <Button onPress={() => setGeneration(value => value + 1)} title="Reload" />
                <LoggedTurboImage {...args} key={generation} testID="lifecycle" />
            </View>
        )
    },
    play: async ({ canvasElement, userEvent, canvas }) => {
        const expected = ['onStart running', SAMPLE_SUCCESS, 'onCompletion completed']
        await waitFor(() => expect(logLines(canvasElement, 'lifecycle')).toEqual(expected))

        await userEvent.click(canvas.getByText('Reload'))

        await waitFor(() => expect(logLines(canvasElement, 'lifecycle')).toEqual(expected))
    },
})

/**
 * A new request starts when the URL, the headers, or the cache key changes, and the old one's
 * events stop. A new `source` object with the same fields, or a new handler, doesn't restart the
 * load. The image clears as soon as the request changes.
 */
export const SourceChange = meta.story({
    render: function Render(args) {
        const sources: Source[] = [
            { uri: 'pending:first' },
            { uri: SAMPLE_URI },
            { uri: 'pending:second' },
        ]
        const [step, setStep] = useState(0)
        const [renders, setRenders] = useState(0)

        return (
            <View style={{ gap: 12 }}>
                <Row>
                    <Button onPress={() => setStep(value => (value + 1) % 3)} title="Next source" />
                    <Button onPress={() => setRenders(value => value + 1)} title="Render again" />
                </Row>
                <Label>{`source: ${shortUri(sources[step].uri)}, renders: ${renders}`}</Label>
                <LoggedTurboImage {...args} source={{ ...sources[step] }} testID="change" />
            </View>
        )
    },
    play: async ({ canvas, canvasElement, userEvent }) => {
        const lines = () => logLines(canvasElement, 'change')
        await waitFor(() => expect(lines()).toEqual(['onStart running']))

        await userEvent.click(canvas.getByText('Render again'))
        await expect(lines()).toEqual(['onStart running'])

        await userEvent.click(canvas.getByText('Next source'))
        await waitFor(() =>
            expect(lines()).toEqual([
                'onStart running',
                'onStart running',
                SAMPLE_SUCCESS,
                'onCompletion completed',
            ]),
        )
        await waitFor(() =>
            expect(turboImageParts(canvasElement, 'change').imageUri).toBe(SAMPLE_URI),
        )

        await userEvent.click(canvas.getByText('Next source'))
        await expect(turboImageParts(canvasElement, 'change').imageUri).toBeNull()
        await expect(lines()).toHaveLength(5)
    },
})

/**
 * `source.headers` and `onProgress` need a `fetch`, so either one switches the load to it. Here a
 * mocked `fetch` serves the sample image in 4 KB chunks.
 *
 * `onProgress` reports the running total after every chunk and once more when the stream ends, as
 * Android does, with `total` from `Content-Length`, or -1 without it.
 *
 * When CORS or the network rejects the `fetch`, the load warns once per URL and retries through an
 * `<img>`, which sends no headers and reports no progress.
 */
export const Network = meta.story({
    args: { onProgress: fn() },
    beforeEach: () => {
        const CHUNK_SIZE = 4096
        const fetchSpy = spyOn(globalThis, 'fetch').mockImplementation(input => {
            const url = input instanceof Request ? input.url : input.toString()
            if (url.startsWith('data:')) {
                return Promise.reject(new TypeError('Failed to fetch'))
            }
            if (url.endsWith('/missing.png')) {
                return Promise.resolve(new Response(null, { status: 404 }))
            }
            const body = new ReadableStream<Uint8Array>({
                start: controller => {
                    for (let offset = 0; offset < SAMPLE_BYTES.length; offset += CHUNK_SIZE) {
                        controller.enqueue(SAMPLE_BYTES.slice(offset, offset + CHUNK_SIZE))
                    }
                    controller.close()
                },
            })
            return Promise.resolve(
                new Response(body, {
                    headers: {
                        'content-length': String(SAMPLE_BYTES.length),
                        'content-type': 'image/png',
                    },
                }),
            )
        })
        const warnSpy = spyOn(console, 'warn').mockReturnValue(undefined)

        return () => {
            fetchSpy.mockRestore()
            warnSpy.mockRestore()
        }
    },
    render: ({ onProgress, ...args }) => (
        <Row>
            <Case title="headers">
                <LoggedTurboImage
                    {...args}
                    source={{
                        headers: { Authorization: 'Bearer token' },
                        uri: 'https://images.example/headers.png',
                    }}
                    testID="network-headers"
                />
            </Case>
            <Case title="onProgress">
                <LoggedTurboImage
                    {...args}
                    onProgress={onProgress}
                    source={{ uri: 'https://images.example/progress.png' }}
                    testID="network-progress"
                />
            </Case>
            <Case title="HTTP 404">
                <LoggedTurboImage
                    {...args}
                    source={{
                        headers: { Accept: 'image/*' },
                        uri: 'https://images.example/missing.png',
                    }}
                    testID="network-missing"
                />
            </Case>
            <Case title="fetch rejected">
                <LoggedTurboImage
                    {...args}
                    source={{ headers: { Accept: 'image/*' }, uri: SAMPLE_URI }}
                    testID="network-fallback"
                />
            </Case>
        </Row>
    ),
    play: async ({ canvasElement }) => {
        const lines = (testID: string) => logLines(canvasElement, testID)
        const parts = (testID: string) => turboImageParts(canvasElement, testID)

        await waitFor(async () => {
            await expect(lines('network-headers')).toEqual([
                'onStart running',
                `onSuccess ${SAMPLE_SIZE.width}x${SAMPLE_SIZE.height} https://images.example/headers.png`,
                'onCompletion completed',
            ])
        })
        await expect(globalThis.fetch).toHaveBeenCalledWith(
            'https://images.example/headers.png',
            expect.objectContaining({ headers: { authorization: 'Bearer token' } }),
        )
        await waitFor(() => expect(parts('network-headers').imageUri).toMatch(/^blob:/u))

        const total = SAMPLE_BYTES.length
        const chunks = Math.ceil(total / 4096)
        const progress = Array.from(
            { length: chunks },
            (_, index) => `onProgress ${Math.min((index + 1) * 4096, total)}/${total}`,
        )
        await waitFor(async () => {
            await expect(lines('network-progress')).toEqual([
                'onStart running',
                ...progress,
                `onProgress ${total}/${total}`,
                `onSuccess ${SAMPLE_SIZE.width}x${SAMPLE_SIZE.height} https://images.example/progress.png`,
                'onCompletion completed',
            ])
        })

        await waitFor(async () => {
            await expect(lines('network-missing')).toEqual([
                'onStart running',
                'onFailure Failed to load resource https://images.example/missing.png (404)',
                'onCompletion completed',
            ])
        })

        await waitFor(async () => {
            await expect(lines('network-fallback')).toEqual([
                'onStart running',
                SAMPLE_SUCCESS,
                'onCompletion completed',
            ])
        })
        await waitFor(() => expect(parts('network-fallback').imageUri).toBe(SAMPLE_URI))
    },
})

/**
 * A missing or blank URL fails without `onStart` and without a request, as on Android, where
 * Coil rejects the request before it starts. iOS fires only `onFailure` there.
 */
export const Failures = meta.story({
    render: args => (
        <Row>
            <Case title="uri: ''">
                <LoggedTurboImage {...args} source={{ uri: '' }} testID="failure-blank" />
            </Case>
            <Case title="no source">
                <LoggedTurboImage
                    {...args}
                    // Untyped JavaScript can leave `source` out.
                    source={undefined as unknown as Source}
                    testID="failure-missing"
                />
            </Case>
            <Case title="undecodable image">
                <LoggedTurboImage {...args} source={{ uri: BROKEN_URI }} testID="failure-broken" />
            </Case>
        </Row>
    ),
    play: async ({ canvasElement }) => {
        const lines = (testID: string) => logLines(canvasElement, testID)

        await waitFor(async () => {
            await expect(lines('failure-blank')).toEqual([
                'onFailure invalid source: {"uri":""}',
                'onCompletion completed',
            ])
            await expect(lines('failure-missing')).toEqual([
                'onFailure invalid source: null',
                'onCompletion completed',
            ])
            await expect(lines('failure-broken')).toEqual([
                'onStart running',
                `onFailure Failed to load resource ${BROKEN_URI}`,
                'onCompletion completed',
            ])
        })
    },
})

/** Upstream throws these two errors while rendering, and so does this package. */
export const Invariants = meta.story({
    render: args => (
        <Row>
            <Case title="two placeholder keys">
                <Boundary testID="invariant-placeholders">
                    <TurboImage
                        {...args}
                        placeholder={{ blurhash: SAMPLE_BLURHASH, thumbhash: SAMPLE_THUMBHASH }}
                    />
                </Boundary>
            </Case>
            <Case title="showPlaceholderOnFailure without a placeholder">
                <Boundary testID="invariant-failure">
                    <TurboImage {...args} showPlaceholderOnFailure />
                </Boundary>
            </Case>
        </Row>
    ),
    play: async ({ canvas }) => {
        await expect(await canvas.findByTestId('invariant-placeholders')).toHaveTextContent(
            'threw: Choose only one placeholder',
        )
        await expect(await canvas.findByTestId('invariant-failure')).toHaveTextContent(
            'threw: A placeholder is required since showPlaceholderOnFailure is true',
        )
    },
})

/**
 * `prefetch` loads into the browser cache and the memory cache, and keys each image by its URL:
 * native builds prefetch requests from the URL alone, so it ignores `cacheKey`.
 *
 * `dispose` rejects, as on a device, where neither native module implements it.
 * `clearDiskCache` resolves without clearing anything: the browser offers no way to.
 */
export const Statics = meta.story({
    render: function Render(args) {
        const [lines, setLines] = useState<string[]>([])
        const [generation, setGeneration] = useState(0)
        const log = (line: string) => setLines(previous => [...previous, line])
        const remount = () => setGeneration(value => value + 1)

        return (
            <View style={{ gap: 12 }}>
                <Row>
                    <Button
                        onPress={async () => {
                            const result = await TurboImage.prefetch([
                                { cacheKey: 'statics-key', uri: SAMPLE_URI },
                            ])
                            log(`prefetch → ${String(result)}`)
                            remount()
                        }}
                        title="prefetch"
                    />
                    <Button
                        onPress={() => {
                            TurboImage.dispose([{ uri: SAMPLE_URI }]).catch((error: unknown) =>
                                log(`dispose → ${String(error)}`),
                            )
                        }}
                        title="dispose"
                    />
                    <Button
                        onPress={async () => {
                            log(
                                `clearMemoryCache → ${await resolved(TurboImage.clearMemoryCache())}`,
                            )
                            remount()
                        }}
                        title="clearMemoryCache"
                    />
                    <Button
                        onPress={async () => {
                            log(`clearDiskCache → ${await resolved(TurboImage.clearDiskCache())}`)
                        }}
                        title="clearDiskCache"
                    />
                </Row>
                <Row>
                    <Case title="memoryCacheKey: the URL">
                        <TurboImage
                            {...args}
                            key={`url-${generation}`}
                            placeholder={{ memoryCacheKey: SAMPLE_URI }}
                            source={{ uri: 'pending:statics-url' }}
                            testID="statics-url"
                        />
                    </Case>
                    <Case title="memoryCacheKey: 'statics-key'">
                        <TurboImage
                            {...args}
                            key={`key-${generation}`}
                            placeholder={{ memoryCacheKey: 'statics-key' }}
                            source={{ uri: 'pending:statics-key' }}
                            testID="statics-key"
                        />
                    </Case>
                    <View testID="statics-log">
                        {lines.map((line, index) => (
                            // oxlint-disable-next-line react/no-array-index-key -- append-only log
                            <Label key={index}>{line}</Label>
                        ))}
                    </View>
                </Row>
            </View>
        )
    },
    beforeEach: async () => {
        await TurboImage.clearMemoryCache()
    },
    play: async ({ canvas, canvasElement, userEvent }) => {
        const lines = () => logLines(canvasElement, 'statics')
        const placeholder = (testID: string) =>
            turboImageParts(canvasElement, testID).placeholderUri
        await expect(placeholder('statics-url')).toBeNull()

        await userEvent.click(canvas.getByText('prefetch'))
        await waitFor(() => expect(placeholder('statics-url')).toBe(SAMPLE_URI))
        await expect(placeholder('statics-key')).toBeNull()

        await userEvent.click(canvas.getByText('dispose'))
        await waitFor(() =>
            expect(lines()).toContain(
                'dispose → TypeError: TurboImage.dispose is not a function on iOS or Android: ' +
                    'neither native module of react-native-turbo-image implements it.',
            ),
        )

        await userEvent.click(canvas.getByText('clearMemoryCache'))
        await waitFor(() => expect(placeholder('statics-url')).toBeNull())

        await userEvent.click(canvas.getByText('clearDiskCache'))
        await waitFor(() =>
            expect(lines()).toEqual([
                'prefetch → true',
                expect.stringMatching(/^dispose → TypeError: /u),
                'clearMemoryCache → Success',
                'clearDiskCache → Success',
            ]),
        )
    },
})

/**
 * View and accessibility props go to the inner image, as upstream spreads them on its native
 * image view. `style` goes to the clipping wrapper, and the ref points at it, as upstream's does.
 *
 * `allowHardware`, `cachePolicy`, `enableLiveTextInteraction`, `format`,
 * `isProgressiveImageRenderingEnabled`, and `resize` only mean something on a device, so web
 * accepts and ignores them.
 */
export const ViewProps = meta.story({
    args: {
        accessibilityLabel: 'A sunset over two mountains',
        allowHardware: false,
        cachePolicy: 'dataCache',
        enableLiveTextInteraction: true,
        format: 'gif',
        isProgressiveImageRenderingEnabled: false,
        resize: 100,
    },
    play: async ({ canvasElement }) => {
        const { image, root } = turboImageParts(canvasElement, 'image')
        await waitFor(() => expect(image.querySelector('img')).not.toBeNull())

        await expect(image).toHaveAttribute('aria-label', 'A sunset over two mountains')
        await expect(image.querySelector('img')).toHaveAttribute(
            'alt',
            'A sunset over two mountains',
        )
        await expect(root).not.toHaveAttribute('aria-label')
        await expect(root.getBoundingClientRect().width).toBe(TILE_STYLE.width)
        await expect(root.getBoundingClientRect().height).toBe(TILE_STYLE.height)
    },
})
