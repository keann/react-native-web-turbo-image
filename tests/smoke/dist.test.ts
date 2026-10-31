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

describe('dist', () => {
    it('renders the default export', async () => {
        const { default: TurboImage } = (await import(
            resolve(DIST, 'index.js')
        )) as typeof import('../../src/index')

        const html = renderToString(
            createElement(TurboImage, { source: { uri: 'https://example.com/a.png' } }),
        )

        expect(html).toMatch(/^<div /u)
    })

    it('uses the production JSX runtime', async () => {
        const code = await readFile(resolve(DIST, 'index.js'), 'utf8')

        expect(code).toContain('react/jsx-runtime')
        expect(code).not.toContain('jsx-dev-runtime')
    })

    it('declares the default export and the prop types', async () => {
        const types = await readFile(resolve(DIST, 'index.d.ts'), 'utf8')

        expect(types).toMatch(/export \{[^}]*\bas default\b[^}]*\}|export default /u)
        expect(types).toContain('TurboImageProps')
        expect(types).toContain('TurboImageSource')
        expect(types).not.toMatch(/:\s*unknown\b/u)
    })
})
