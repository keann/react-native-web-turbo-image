<div align="center">

# react-native-web-turbo-image

<img alt="npm" src="https://img.shields.io/npm/v/react-native-web-turbo-image" align="absmiddle" /> ·
[Releases](https://github.com/keann/react-native-web-turbo-image/releases)

</div>

The API of [`react-native-turbo-image`](https://github.com/duguyihou/react-native-turbo-image) for
[react-native-web](https://necolas.github.io/react-native-web/). A bundler alias swaps this package
in for `react-native-turbo-image` in web builds, so app code keeps importing
`react-native-turbo-image` on every platform.

## Setup

```sh
bun add -E react-native-web-turbo-image
```

The package needs `react` 18 or newer and `react-native-web` 0.19 or newer as peers.

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

The alias resolves every import of `react-native-turbo-image` to this package. Storybook with a
Vite framework takes the same `resolve.alias` in the config that `viteFinal` returns.

```tsx
import TurboImage from 'react-native-turbo-image'

export const Avatar = () => (
    <TurboImage
        source={{ uri: 'https://example.com/avatar.png' }}
        style={{ width: 48, height: 48 }}
    />
)
```

## Status

`TurboImage` renders react-native-web's `Image` with the given `source.uri` and passes every other
prop to it. The props that `react-native-turbo-image` adds to an image are not implemented.

## Development

`bun run storybook` serves the stories on port 6006. [AGENTS.md](AGENTS.md) lists the checks that
every change runs, and [MAINTAINING.md](MAINTAINING.md) describes releases.
