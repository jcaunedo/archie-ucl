# Archie UCL

React component library for Archie. It holds the shared UI components and the design tokens (colors, type, spacing, motion) that every Archie frontend app uses.

## How UCL Works

- **One repo, many apps.** UCL lives in its own repo, separate from the apps that use it. Apps install it like any other dependency.
- **One package, three parts.** tsup compiles the library into `dist/`:
  - `dist/index.js`: the compiled components (ESM only).
  - `dist/index.d.ts`: the type definitions.
  - `dist/styles.css`: the design tokens, a copy of `src/styles/theme.css`. Apps import it as `archie-ucl/styles`.
- **Built and reviewed in Storybook.** Every component has stories for its states, so design and engineering review the same thing before any app uses it. Storybook also holds the Foundations (colors, typography, motion) and the Guidelines.
- **Published to a private registry.** ⚠️ Not set up yet (see [Releasing](#releasing)).

## Tech Stack

- React 19
- TypeScript (strict mode)
- Tailwind CSS 4
- Radix UI
- Storybook 10
- tsup (ESM bundling)
- React Hook Form and Zod

## Using UCL in an App

### 1. Install

```bash
npm install archie-ucl
```

`react` and `react-dom` 19 are peer dependencies: the app provides them, so it doesn't get two copies of React.

⚠️ UCL isn't published to a registry yet. Until it is, install it from a local path (see [Trying unpublished changes in an app](#trying-unpublished-changes-in-an-app)). Once it's published, each app also needs a small `.npmrc` that points the package at the private registry, plus a read-only access token.

### 2. Import the styles

In the app's global CSS:

```css
@import "tailwindcss";
@import "archie-ucl/styles";
@source "../node_modules/archie-ucl/dist";
```

`@source` makes Tailwind scan UCL's compiled JS for class names. **Without it, component styles go missing without any error.** Adjust the path so it's relative to the stylesheet.

### 3. Load the fonts

UCL declares the font tokens but doesn't load the webfonts. Each app loads **Geist** (weights 300–900) and **Geist Mono** (400–700), for example with `next/font/google` or a Google Fonts `<link>`. Without them, text falls back to the system font.

### 4. Use components

```tsx
import { Button } from "archie-ucl";

export function Example() {
	return <Button>Continue</Button>;
}
```

Add the `dark` class to a parent element (usually `<html>`) to switch every token to its dark value.

## Developing UCL

### Getting Started

```bash
npm install
npm run storybook
```

Storybook launches at [http://localhost:6006](http://localhost:6006).

### Commands

| Command                   | Description                  |
| ------------------------- | ---------------------------- |
| `npm run storybook`       | Launch Storybook             |
| `npm run build`           | Build the library to `dist/` |
| `npm run dev`             | Build in watch mode          |
| `npm run lint`            | Type-check with TypeScript   |
| `npm run build-storybook` | Build static Storybook site  |

### Project Structure

```text
src/
  index.ts                  # Public API exports
  lib/                      # cn(), breakpoints, motion system, hooks
  styles/
    theme.css               # Design tokens shipped to consumers
    globals.css             # Storybook styles
  docs/                     # Storybook MDX pages (Introduction, Foundations, Guidelines)
  components/
    <category>/             # buttons, forms, cards, feedback, overlays…
      <component-name>/
        <component-name>.tsx
        <component-name>.stories.tsx
        index.ts            # Re-exports the component, variants and types
```

Add each component in its own folder under its category, then re-export it from `src/index.ts`. `CLAUDE.md` has the full conventions, and `DESIGN.md` has the design rules a change must keep.

### Day-to-Day Flow

1. **Build or update the component in Storybook**, with a story for every state: default, hover, disabled, error, loading, empty, and so on.
2. **Export it** from `src/index.ts` so apps can import it.
3. **Get it reviewed.** Design reviews it in Storybook, and engineering reviews the code in the PR. Run `npm run lint` and `npm run build` before you open the PR. Then merge it to `main`.
4. **Release a new version** (see [Releasing](#releasing)).
5. **Update each app.** Bump `archie-ucl` to the new version, check the screens that use the changed components, and ship the app through its normal deploy.

A new UCL version never changes a live site by itself. Production only changes when an app installs the new version and deploys.

### Trying Unpublished Changes in an App

To test UCL changes in an app before releasing them, link UCL locally:

```bash
# In archie-ucl
npm run dev                       # rebuilds dist/ on every change

# In the app
npm install ../archie-ucl         # a local path dependency
```

- Point the app's `@source` at the linked package's `dist/` folder, or Tailwind won't see the new classes.
- A linked UCL can load its own copy of React from `archie-ucl/node_modules`. If the app shows an "Invalid hook call" error, that's the cause: use `npx yalc publish` in UCL and `npx yalc add archie-ucl` in the app instead, which copies the package rather than linking it.

## Releasing

⚠️ **Not set up yet.** The registry, the CI workflow and the release scripts below don't exist in this repo yet. This is the agreed flow, so they can be added in this shape.

### Publishing is automated but deliberate

A CI pipeline watches `main` and publishes a new package **only when the version in `package.json` changes**. Normal merges release nothing. A release happens only when someone bumps the version on purpose, so the registry stays clean and every release is intentional.

### Release scripts

Planned `package.json` scripts, so a release is one command:

| Script                                 | What it does                                              |
| -------------------------------------- | --------------------------------------------------------- |
| `"preversion": "npm run lint"`         | Runs the type check first. If it fails, the release stops |
| `"postversion": "npm run build"`       | Rebuilds the package after the version bump               |
| `"release:patch": "npm version patch"` | Bumps the version, commits and tags it (e.g. `v1.4.3`)    |
| `"release:minor": "npm version minor"` | Same, for a minor version                                 |
| `"release:major": "npm version major"` | Same, for a major version                                 |

The release flow is then:

```bash
# The working tree must be clean: commit your work first.
npm run release:patch             # or release:minor / release:major
git push && git push --tags       # CI publishes the new version
```

### Which version to bump

| Bump      | Example       | Use it for                                                                                                                      |
| --------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Patch** | 1.4.2 → 1.4.3 | Bug fixes and visual tweaks that don't change how a component is used: padding, a color, an accessibility fix                   |
| **Minor** | 1.4.2 → 1.5.0 | New things that don't break existing use: a new component, optional prop, variant or design token                               |
| **Major** | 1.4.2 → 2.0.0 | Anything that can break an app: removing or renaming a component, prop or token, changing a default, or requiring a newer React |

ℹ️ Below 1.0.0, package managers treat a minor bump (0.7 → 0.8) as breaking, so apps don't pick it up automatically. UCL is at 0.1.0 today, so every minor release needs a manual update in each app.

## Things to Know

- **Never copy token values into an app.** Use the semantic Tailwind utilities that `archie-ucl/styles` provides (`bg-primary`, `text-muted-foreground`). The tokens change in UCL, and apps pick them up on the next version.
- **Tailwind must scan UCL.** If components render unstyled, the app's `@source` line is missing or points to the wrong folder.
- **Server rendering.** ⚠️ If an app renders on the server (e.g. Next.js Server Components), the UCL bundle must be marked `"use client"` in a post-build step. That step doesn't exist yet. Add it before the first server-rendered app uses UCL.
- **Peer dependencies stay peers.** React is a peer dependency so apps don't get two copies. ⚠️ **Decision needed:** React Hook Form and Zod are bundled today. If the apps use them too, they should become peer dependencies.
