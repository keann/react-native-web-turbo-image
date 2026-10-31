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

## Setup

```sh
bun add -dE react-native-web-turbo-image
```

The peers are `react` 18 or newer and `react-native-web` 0.19 or newer.

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
reads the types from the `react-native-turbo-image` package that the native app installs.

## Development

`bun run storybook` serves the stories on port 6006. [AGENTS.md](AGENTS.md) lists the checks that
every change runs, and [MAINTAINING.md](MAINTAINING.md) covers releases.
