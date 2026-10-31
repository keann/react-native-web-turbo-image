import { defineConfig } from 'tsdown'

export default defineConfig({
    entry: ['./src/index.ts'],
    outDir: './dist',
    format: ['esm'],
    platform: 'browser',
    dts: true,
    // The declarations import their types from react-native, which apps on react-native-web have
    // installed. A dev dependency gets bundled by default, which would inline all of its types.
    deps: { neverBundle: ['react-native'] },
})
