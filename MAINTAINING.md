# Maintaining react-native-web-turbo-image

## Releasing

Each PR that changes the published package (`src/` outside the `docs/` folders, or the
dependencies in `package.json`) adds its entries to `UNRELEASED.md`, under
`### ⚠️ Breaking Changes`, `### ✨ Added`, `### 🔧 Changed`, or `### 🐛 Fixed`. CI fails such a PR
without them, unless it has the `no changelog` label.

The Release workflow in the Actions tab publishes a release. It takes a `patch`, `minor`, or
`major` bump, and one run:

1. Stops when `UNRELEASED.md` has no entries, or has `⚠️ Breaking Changes` with a patch or minor
   bump.
2. Runs every check, the story tests in Chromium included, and builds.
3. Waits for approval in the `npm` environment, then stages the version on npm with provenance.
4. Waits up to an hour for the staged version to be approved on npmjs.com, which takes the
   maintainer's 2FA.
5. Commits the new `version` and the emptied `UNRELEASED.md` to `main`, and tags `vX.Y.Z`.
6. Creates the GitHub Release with the entries as its body.
7. Builds Storybook from the tag and deploys it to GitHub Pages.

The version reaches npm before the commit, so a declined approval leaves `main` untouched. An
approval after the hour fails step 4, and re-running the run's failed jobs finishes the release.
The staging step stays in `release.yml`, because npm's trusted publisher names that file.

## Repo setup for the first release

1. Create the `no changelog` label under Issues → Labels.
2. Create the `npm` environment under Settings → Environments, with the maintainer as its required
   reviewer.
3. Add a granular npm token with publish access as the environment secret `NPM_TOKEN`. Staged
   publishing creates the package on npm from it.
4. Set Settings → Pages → Source to GitHub Actions. The Release run deploys to the `github-pages`
   environment that this creates.

Before the second release, add a trusted publisher on npmjs.com for `release.yml` and the `npm`
environment, delete the token and its secret, and drop the `NODE_AUTH_TOKEN` line from
`release.yml`. npm drops a trusted publisher that publishes nothing within 48 hours, so it is added
on the day of that release.

## Bumping dependencies

Dependabot bumps only the pinned GitHub Actions. The npm dependencies are bumped by hand, with
exact versions, and every check in `AGENTS.md` runs after a bump.

- `storybook`, `@storybook/addon-vitest`, and `@storybook/react-vite` move together to one exact
  version. Storybook 11 is an alpha, so its release notes are read before each bump.
- `vitest`, `@vitest/browser`, and `@vitest/browser-playwright` move together to one version.
- `playwright` sets the Chromium build. `bunx playwright install chromium` installs the matching
  build after a bump.
- `typescript` stays on 6, because tsdown writes the declarations with its compiler API.
- `packageManager` pins the Bun canary that `bun lint` needs. CI installs that exact build from
  npm.

A change to `peerDependencies` changes the published package and adds an `UNRELEASED.md` entry.
