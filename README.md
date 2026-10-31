<div align="center">

# react-native-web-turbo-image

<img alt="npm" src="https://img.shields.io/npm/v/react-native-web-turbo-image" align="absmiddle" /> ·
[Releases](https://github.com/keann/react-native-web-turbo-image/releases)

</div>

[`react-native-turbo-image`](https://github.com/duguyihou/react-native-turbo-image) for
[react-native-web](https://necolas.github.io/react-native-web/). A bundler alias swaps this package
in for `react-native-turbo-image` in web builds, and app code keeps importing
`react-native-turbo-image` on every platform.

> [!NOTE]
> Made for Storybook docs and browser tests, not for serving images to real users. It covers the
> `react-native-turbo-image` API broadly, so components built on it render and behave on web. Most
> of it is vibe-coded: it does the job, but it won't win any benchmarks.

## Why

`react-native-turbo-image` renders native iOS and Android views and has no web build. Aliasing it
to react-native's `Image` renders the picture, but drops the placeholders, the load events, and the
static cache methods that components built on it use. This package implements those on
react-native-web.

## Setup

```sh
bun add -dE react-native-web-turbo-image
```

The peers are `react` 18 or newer and `react-native-web` 0.19 or newer. Its dependencies,
`blurhash` and `thumbhash`, decode the placeholders.

### Vite and Vitest

```ts
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
    resolve: {
        alias: {
            'react-native': 'react-native-web',
            'react-native-turbo-image': 'react-native-web-turbo-image',
        },
    },
})
```

Vitest reads `vite.config.ts` when the project has no `vitest.config.ts`, so its tests get the
alias too. A separate `vitest.config.ts` needs the same `resolve.alias`.

### Storybook

```ts
// .storybook/main.ts
import { defineMain } from '@storybook/react-vite/node'
import { mergeConfig } from 'vite'

export default defineMain({
    framework: '@storybook/react-vite',
    stories: ['../src/**/*.stories.tsx'],
    viteFinal: config =>
        mergeConfig(config, {
            resolve: {
                alias: {
                    'react-native': 'react-native-web',
                    'react-native-turbo-image': 'react-native-web-turbo-image',
                },
            },
        }),
})
```

`@storybook/react-native-web-vite` aliases `react-native` itself and needs only the
`react-native-turbo-image` entry.

## Usage

```tsx
import TurboImage from 'react-native-turbo-image'

export const Avatar = () => (
    <TurboImage
        source={{ uri: 'https://example.com/avatar.png' }}
        style={{ width: 48, height: 48 }}
    />
)
```

The import stays `react-native-turbo-image`, and the alias resolves it on web. TypeScript still
reads the types from the `react-native-turbo-image` package that the native app installs. This
package declares the same types, and imports the React Native ones from `react-native`.

### Holding the loading state

```tsx
<TurboImage source={{ uri: 'pending:avatar' }} style={{ width: 48, height: 48 }} />
```

A `source.uri` that starts with `pending:` fires `onStart` and never settles. A story or a test can
show the loading state with it, without depending on how fast the network is. Only this package
knows the prefix.

## Behaviour on web

The component follows upstream's TypeScript, Swift, and Kotlin sources. Where iOS and Android
differ, it follows one of them, and where a browser can't do what a device does, it does the
nearest thing.

### Matches native

It renders as upstream does:

- A clipping `View` takes `style` and the `ref`, and the image inside fills it. The other view and
  accessibility props, `testID` included, go to the inner image.
- More than one `placeholder` key throws upstream's error from render, and so does
  `showPlaceholderOnFailure` without a `placeholder`.
- `resizeMode` defaults to `contain`.
- `rounded`, `blur`, `tint`, and `monochrome` style the image.
- `indicator` shows while the image loads, unless a placeholder shows. `indicator={{}}` shows
  nothing.
- `fadeDuration` fades the image in, and a `placeholder` sets it to 0.

It loads as upstream does:

- The events fire in upstream's order with its payloads: `onStart`, `onProgress` after each chunk,
  `onSuccess` or `onFailure`, and `onCompletion` after either one.
- `onProgress` reports a `total` of -1 when the response has no `Content-Length`, as OkHttp does
  on Android.
- `source.headers` go with the request, and `source.cacheKey` keys the memory cache that
  `placeholder.memoryCacheKey` reads.
- `placeholder.blurhash` and `placeholder.thumbhash` decode to an image, and a malformed hash shows
  no placeholder. `showPlaceholderOnFailure` keeps the placeholder after a failure.
- `prefetch` loads each source into the memory cache under its URL, and ignores `source.cacheKey`.
- `dispose` rejects with a `TypeError`, because neither native module implements it.

### Differs from native

These follow one platform:

- `fadeDuration` defaults to 300 ms, as on iOS. Android's default is 100 ms.
- `onSuccess` reports the image's intrinsic size in pixels, as on iOS. Android reports the size it
  decoded to, which follows the view's size.
- An empty or blank `source.uri` fires `onFailure` and then `onCompletion`, with no `onStart`, as
  on Android. iOS fires only `onFailure`.
- `resizeMode="center"` scales a larger image down to fit, as on Android. iOS keeps its natural
  size, and the wrapper clips it.
- `showPlaceholderOnFailure={false}` shows no placeholder after a failure, as on iOS. Android shows
  it whenever the prop is set.
- `onProgress` repeats its last event when the response ends, as on Android.

These are browser limits:

- Only `fetch` sends headers and counts bytes, so `source.headers` or an `onProgress` listener
  load the image with `fetch`, which CORS applies to. When CORS or the network rejects it, the image
  loads through an `<img>` that sends no headers and reports no progress, and the console warns
  once for that URL.
- Every load fires `onStart`, and fades in unless a placeholder is set. On a device, a memory cache
  hit skips the fade, and on iOS it skips `onStart` too. Here the memory cache only feeds
  placeholders, and the browser's HTTP cache serves repeated loads.
- A change to `blur`, `tint`, or `monochrome` alone restyles the image and fires no events. A
  device loads the image again to apply them.
- `blur` is a CSS `filter`, which softens the image's edges. The native blurs clamp at the edges.
- `rounded` rounds the wrapper. A device crops the bitmap to a circle, which looks different with
  `resizeMode="contain"`.

### Accepted but inert

These props type-check and do nothing on web:

- `cachePolicy`, because the browser owns HTTP caching.
- `format`, because browsers detect SVG, GIF, and APNG themselves.
- `resize`, which only limits the size a device decodes to.
- `allowHardware`, an Android bitmap setting.
- `enableLiveTextInteraction` and `isProgressiveImageRenderingEnabled`, which are iOS only.
- `children`, which react-native-web's `Image` throws on.

`clearDiskCache` resolves `'Success'` and clears nothing, for the same reason as `cachePolicy`. A
load keeps running while the page is hidden, where iOS cancels it in the background and Android
disposes of it on pause.

## Development

`bun run storybook` serves the stories on port 6006. [AGENTS.md](AGENTS.md) lists the checks that
every change runs, and [MAINTAINING.md](MAINTAINING.md) covers releases.
