# AGENTS.md

`react-native-web-turbo-image` implements the API of `react-native-turbo-image` on
react-native-web. An app's bundler alias swaps it in for `react-native-turbo-image` in web builds.
Bun is the package manager and runs every script; the canary in `packageManager` is the one
`bun lint` needs.

## Checks

Run these after every change, all from the repo root:

```sh
bun fmt --check
bun lint
bun check
bun run test:unit
bun run test:stories
bun run build
bun run test:smoke
bun run build:storybook
```

`test:stories` runs in headless Chromium, which `bunx playwright install chromium` installs once.
`test:smoke` tests the built files, so it runs after `build`. `bun fmt` fixes the formatting.

## Tests

Vitest runs three projects. `unit` runs the `*.test.ts` files beside the source. `stories` runs
the `play` function of every story in Chromium, through `@storybook/addon-vitest`, so component
behavior is tested as a story. `smoke` renders the built `dist` and checks its JSX runtime and its
declarations.

Stories load images from the data URIs and canvases in `TurboImage.mocks.ts`. A story about HTTP
behaviour replaces `fetch` with a spy, so no test reaches the network. `TurboImage.types.test.ts`
compares the types with upstream's. Vitest doesn't check types, so `bun check` is the run that
fails on a mismatch.

## Imports and exports

- Runtime code imports `react-native-web`, typed by `@types/react-native-web`. Types come from
  `react-native` with `import type`, as upstream's do, so the declarations match upstream's.
  `dist/index.js` never imports `react-native`, which is a dev dependency for its types only.
- Code under `src/` never imports `react-native-turbo-image`, except files in `docs/` folders.
  An app's alias resolves that import to this package, so the package would import itself.
  Storybook and `tsconfig.json` map the name to `src/index.ts`, so stories and their demo helpers
  import the package the way an app does.
- The package root has a default export, unlike the rest of the code, because
  `react-native-turbo-image` exports its component as the default. The root mirrors its exports
  and adds no named twin.

## Pinned versions

- `typescript` stays on 6. tsdown writes the declarations with its compiler API, which TypeScript
  7 doesn't have, and Storybook's docgen needs it too. `bun check` type checks with Bun's own
  checker.
- Every `storybook` and `@storybook/*` package is on the same exact version. Bump them together.
- `react-native-turbo-image-upstream` aliases the upstream version that `TurboImage.types.ts`
  copies. Bump it together with that copy.

## Release notes

A change to the published package (`src/` outside `docs/` folders, or the dependencies in
`package.json`) adds an entry to `UNRELEASED.md` under one of its four headings:
`⚠️ Breaking Changes`, `✨ Added`, `🔧 Changed`, or `🐛 Fixed`. Write each entry for the package's
consumers, one fact per entry, with the noun or the verb first. A PR without an entry needs the
`no changelog` label, and CI fails it otherwise. After a release the file holds only a comment that
lists the headings, so the first entry under a heading adds the heading too.
