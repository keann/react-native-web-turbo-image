import { fileURLToPath } from 'node:url'

import type { StorybookConfig } from '@storybook/react-vite'
import { mergeConfig } from 'vite'

const config: StorybookConfig = {
    stories: ['../src/**/*.stories.tsx'],
    framework: '@storybook/react-vite',
    addons: ['@storybook/addon-vitest'],
    viteFinal: viteConfig =>
        mergeConfig(viteConfig, {
            resolve: {
                // The consumer's alias, pointed at the source: stories import the package the way
                // an app with the README's setup does.
                alias: {
                    'react-native': 'react-native-web',
                    'react-native-turbo-image': fileURLToPath(
                        new URL('../src/index.ts', import.meta.url),
                    ),
                },
            },
            // Vitest's browser mode serves React unbundled without this, and its CommonJS entry
            // has no default export.
            optimizeDeps: {
                include: [
                    'react',
                    'react/jsx-runtime',
                    'react/jsx-dev-runtime',
                    'react-dom',
                    'react-dom/client',
                    'react-native-web',
                ],
            },
        }),
}

export default config
