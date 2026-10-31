import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

/**
 * Smoke tests against the BUILT `dist` artifact: the files that get published. Unit and story tests
 * run the source, so they can't catch a bundler regression.
 */

const DIST = resolve(import.meta.dirname, '../../dist')

/**
 * The type names that the `export { … }` and `export type { … }` lists declare: every name in a
 * type-only list, and the names marked `type` in the others.
 */
const exportedTypeNames = (declarations: string) =>
    [...declarations.matchAll(/export (type )?\{([^}]*)\}/gu)]
        .flatMap(([, typeOnly, names]) =>
            names
                .split(',')
                .map(name => name.trim())
                .filter(name => typeOnly === 'type ' || name.startsWith('type ')),
        )
        .map(name =>
            name
                .replace(/^type /u, '')
                .split(/\s+as\s+/u)
                .at(-1),
        )
        .filter((name): name is string => name !== undefined && name !== '')
        .toSorted((left, right) => left.localeCompare(right))

describe('dist', () => {
    it('renders the default export', async () => {
        const { default: TurboImage } = (await import(
            resolve(DIST, 'index.js')
        )) as typeof import('../../src/index')

        const html = renderToString(
            createElement(TurboImage, {
                source: { uri: 'https://example.com/a.png' },
                style: { height: 48, width: 48 },
            }),
        )

        expect(html).toMatch(/^<div /u)
    })

    it('has the static methods', async () => {
        const { default: TurboImage } = (await import(
            resolve(DIST, 'index.js')
        )) as typeof import('../../src/index')

        await expect(TurboImage.clearDiskCache()).resolves.toBe('Success')
        await expect(TurboImage.clearMemoryCache()).resolves.toBe('Success')
        await expect(TurboImage.dispose([])).rejects.toThrow(TypeError)
        await expect(TurboImage.prefetch([])).resolves.toBe(true)
    })

    it('uses the production JSX runtime and never imports react-native', async () => {
        const code = await readFile(resolve(DIST, 'index.js'), 'utf8')

        expect(code).toContain('react/jsx-runtime')
        expect(code).not.toContain('jsx-dev-runtime')
        expect(code).not.toMatch(/from\s*["']react-native["']/u)
    })

    it('declares the default export and the type names of react-native-turbo-image', async () => {
        const types = await readFile(resolve(DIST, 'index.d.ts'), 'utf8')
        const upstreamTypes = await readFile(
            resolve(
                import.meta.dirname,
                '../../node_modules/react-native-turbo-image-upstream/lib/typescript/src/index.d.ts',
            ),
            'utf8',
        )

        expect(types).toMatch(/export \{[^}]*\bas default\b[^}]*\}|export default /u)
        expect(exportedTypeNames(types)).toEqual(exportedTypeNames(upstreamTypes))
        // Imported, not inlined: a bundled copy of react-native's types runs to 100 KB and
        // references a file that isn't published.
        expect(types).toMatch(/from\s*["']react-native["']/u)
        expect(types).not.toMatch(/:\s*unknown\b/u)
        expect(types).not.toMatch(/from\s*["']react-native-web["']/u)
    })
})
