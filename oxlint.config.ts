import { defineConfig, presets } from '@keann/lint-config'

export default defineConfig({
    extends: [presets.base, presets.react, presets.vitest],
    ignorePatterns: ['dist/', 'storybook-static/'],
})
