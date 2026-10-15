# Archie UCL (Unified Component Library)

Shared React component library for Archie frontend applications. Built with React 19, Tailwind CSS 4, shadcn/ui (Radix) and TypeScript.

## Project

Everything specific to this project is in this section, "Stack", "Figma", and DESIGN.md → "Brand names" / "Brand voice". The rest of the setup is project-agnostic.

| Item         | Value                                                        |
| ------------ | ------------------------------------------------------------ |
| Project      | Archie                                                       |
| Package      | `archie-ucl`                                                 |
| Apps         | ⚠️ Not defined. List the apps that consume UCL (used for `src/layouts/<app>/`) |
| Brand        | DESIGN.md → "Brand names", "Brand voice"                     |

## How the rules work

- **CLAUDE.md** (this file): how things are built here. Covers the stack, folder structure, component and story conventions, the motion system and theme tokens.
- **[DESIGN.md](DESIGN.md)**: design contracts. Covers why a component is built the way it is, rules that a future edit or Figma/shadcn resync could silently break, and the brand voice.
- **Skills** in `.claude/skills/` (`ucl-ds-sync`, `ucl-generate-component`, `ucl-generate-layout`, `ucl-ux-copywriter`) are project-agnostic. They read both files before they start and take every project value (package, Figma file, categories, apps, component APIs, voice) from them. **When a skill and these files disagree, these files win.**
- **Not defined here?** Ask, then record the answer in the right file so the next run doesn't have to ask again.

## Quick Reference

| Command                   | Purpose                                      |
| ------------------------- | -------------------------------------------- |
| `npm run build`           | Build library to `dist/` (ESM + types + CSS) |
| `npm run dev`             | Watch mode build                             |
| `npm run storybook`       | Launch Storybook on port 6006                |
| `npm run build-storybook` | Build static Storybook site                  |
| `npm run lint`            | Type-check with `tsc --noEmit`               |

`.npmrc` sets `include=dev`, so installs keep dev dependencies even when `NODE_ENV=production` is set in the environment.

## Stack

The stack is set per project so UCL matches what the Archie dev team ships. Change a row only after agreeing it with the dev team, then update every section below that depends on it.

| Concern              | Choice                                                     | Status                     |
| -------------------- | ---------------------------------------------------------- | -------------------------- |
| Framework            | React 19 (`react`, `react-dom` as peer dependencies)       | Set                        |
| Base components      | shadcn/ui on Radix (`@radix-ui/react-*`)                   | ⚠️ Confirm with dev team   |
| Styling              | Tailwind CSS 4, tokens in `src/styles/theme.css` (oklch)   | Set                        |
| Variants             | `class-variance-authority` (`cva`) + `cn()`                | Set                        |
| Icons                | `lucide-react`                                             | ⚠️ Confirm with dev team   |
| Motion               | `motion` (`motion/react`)                                  | Set                        |
| Forms                | `react-hook-form` + `zod`, bundled dependencies            | ⚠️ Decide: peer dependency? |
| App rendering        | Unknown: client-only or server rendering (Next.js)         | ⚠️ Ask dev team            |
| Build                | tsup, ESM only                                             | Set                        |
| Workbench            | Storybook 10 (`@storybook/react-vite`, `addon-docs`)       | Set                        |

- **Forms:** if the apps also use react-hook-form/zod, make them peer dependencies so apps don't get two copies.
- **Server rendering:** if the apps render on the server (e.g. Next.js Server Components), the build needs a post-build step that marks the bundle `"use client"`.

## Figma

The design system is split across two files:

| Item                    | Value                                     |
| ----------------------- | ----------------------------------------- |
| Master design system    | `archielabs.ds`, fileKey `w8YHn6HqwgvKEyFOYkDFmW`. Generic tokens and components shared by every project that uses it, with a mode per project |
| Archie design system    | `archie.ds`, fileKey `fNWSwWgNnAh58GfSb0p76X`. Components only Archie uses, built on the master's tokens |
| Modes                   | Light + dark: the master's `semantic` collection's **Archie** mode → `:root`, **Archie-dark** → `.dark`. Its other modes (Solara, TowerLoan, Itopia, itopia-dark, AIassist, MergeIT) belong to other products and are not synced |

- **Tokens** (`theme.css`) come only from `archielabs.ds`, Archie modes only.
- **Components** can come from either file. Shared components come from `archielabs.ds` and Archie-only ones from `archie.ds`. Both land in the same `src/components/<category>/` folders. A component in `archie.ds` that overrides a master component wins for UCL.
- ⚠️ If `archie.ds` uses a variable that isn't in the master's `semantic` collection, flag it before adding a token. Archie-only tokens must not leak into the shared master.
- ⚠️ **Status (Oct 15, 2026):** `archie.ds` has only a cover frame, no components yet, and doesn't use `archielabs.ds` as a library. Until it does, its components can't reference the master's variables. Check this before the first component sync from `archie.ds`.

Skills compare every Figma URL's `fileKey` against both files in this table and flag any other file before proceeding.

## Architecture

- **Package:** `archie-ucl`, ESM-only. Not published yet (see "Release & Publishing").
- **Build:** tsup bundles `src/index.ts` → `dist/index.js` + `dist/index.d.ts`. `src/styles/theme.css` is copied raw to `dist/styles.css`.
- **Styling:** two CSS files.
  - `src/styles/theme.css`: design tokens, `@theme inline` mappings, breakpoints, `:root` and `.dark` variables. Ships to consumers as `archie-ucl/styles`.
  - `src/styles/globals.css`: imports Tailwind + `theme.css`. Used only by Storybook.
- **Components:** one folder per component, grouped by category under `src/components/<category>/<name>/`. Each folder holds:
  - `<name>.tsx`
  - `<name>.stories.tsx`
  - `index.ts` barrel
  - optional `<name>.mdx` docs page

  Categories: `buttons`, `forms`, `cards`, `data-display`, `feedback`, `overlays`, `navigation`, `typography`. Create a category folder when its first component arrives. Don't invent a category that isn't listed here without asking.
- **Layouts:** full-page reference compositions under `src/layouts/<app>/<name>/`, previewed in Storybook and **not** exported from `src/index.ts`. Layouts used by more than one app go in `src/layouts/shared/`. Apps are listed in "Project". Screens in a multi-screen flow nest under `src/layouts/<app>/<flow>/`; list each flow here when it's created.
- **Lib:** `src/lib/`
  - `utils.ts`: `cn()`
  - `breakpoints.ts`: `breakpoints`, `mediaAbove()`
  - `hooks/use-media-query.ts`
  - `motion/`: tokens, transitions, variants, patterns, reduced-motion and scroll helpers
  - `relative-date.ts`: `formatRelativeDate()`
- **Imports:** use the `@/` alias (`@/lib/utils`, `@/components/<category>/<name>`). Import another component through its folder `index.ts`, never a deep relative path.
- **Docs:** Storybook MDX pages live in `src/docs/`. Sidebar order (`.storybook/preview.ts`) is Introduction → Foundations → Guidelines → component categories. MDX supports GitHub-flavored Markdown tables through `remark-gfm`.
  - **Foundations** (`foundations/`): Colors, Typography, Motion. Each is generated from source by a docs-only `.tsx` beside it (`color-tokens.tsx`, `type-scale.tsx`, `motion-tokens.tsx`) that reads `theme.css` or `src/lib/motion/` as raw text. A new token appears without editing the page.
  - **Guidelines** (`guidelines/`): Overview, Voice and copy, Tables and lists, Page layout, Building from Figma, Developer contracts. They restate DESIGN.md (and the Figma rules above) for a wider audience. When a DESIGN.md rule changes, update its page in the same change. Add a page only for a rule DESIGN.md records, and add it to the Overview table and the sidebar order.

## Code style

- Tabs for indentation, double quotes in TS, single quotes in JSX attributes (`data-slot='button'`).
- React 19: `ref` is a regular prop. Don't use `React.forwardRef`.
- Props are typed as `React.ComponentProps<"el"> & VariantProps<typeof <name>Variants> & { …extras }`.
- Named exports only, collected at the bottom of the file: `export { Button, buttonVariants };`.

## Adding a shadcn Primitive (scaffold → relocate)

The shadcn CLI writes a flat file into `src/components/ui/`. Here that folder is only for **staging**:

```bash
npx shadcn add <component>
```

1. Move `src/components/ui/<component>.tsx` → `src/components/<category>/<component>/<component>.tsx`.
2. Rewrite sibling-component imports to the `@/components/<category>/<name>` alias.
3. Convert any `React.forwardRef` to a plain function component (see "Code style").
4. Add `index.ts` re-exporting the component, its variants and its types.
5. Add `<component>.stories.tsx` (see below).
6. Export from `src/index.ts` under the category banner, then delete the empty `src/components/ui/`.

Always check shadcn's current source, not memory: `https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/v4/registry/new-york-v4/ui/<component>.tsx`.

## Creating a Custom Component

Create `src/components/<category>/<name>/` with these files (use `buttons/button/` as the template):

### `<name>.tsx`

- `cva` for variants, with `defaultVariants` set. `cn()` from `@/lib/utils` to merge classes.
- Default `variant`/`size` in the parameter list, and set `data-slot='<name>'`, `data-variant` and `data-size` on the root element.
- Use `asChild` (`Slot` from `@radix-ui/react-slot`) when the component should be able to render as a link or other element.
- Use tokens through Tailwind utilities (`bg-primary`, `text-muted-foreground`, `rounded-md`). Never raw hex.
- A one-line JSDoc on the exported component.

### `<name>.stories.tsx`

- `const meta = { … } satisfies Meta<typeof Component>` with `title: "<Category>/<Component>"` (e.g. `Buttons/Button`).
- One story per variant/state, plus an `AllVariants` story that renders every variant and size together.
- `tags: ["autodocs"]`, unless the component has its own `<name>.mdx` page. The MDX page replaces autodocs.

### `<name>.mdx` (optional)

Add one when a component needs usage guidance beyond props: when to use each variant, accessibility notes, do's and don'ts. Attach it with `<Meta of={Stories} />` and show stories with `<Canvas of={…} />`. Example: `buttons/button/button.mdx`.

### `index.ts`

Re-export the component, its `<name>Variants` and any prop types. Then add the same names to `src/index.ts` under the category banner:

```ts
/* -------------------------------------------------------------------------- */
/* Buttons                                                                    */
/* -------------------------------------------------------------------------- */

export { Button, buttonVariants } from "@/components/buttons/button";
```

## Updating an Existing Component

- Modify the component file directly. Preserve everything the change doesn't touch.
- Update stories (and the MDX page, if any) when the API changes.
- Update `src/index.ts` when exports change.
- Renaming or removing a `cva` variant key, prop or exported type is **breaking** for consuming apps. Call it out.
- Run `npm run lint` and `npm run build`.

## Current Component APIs

Mirror these names when a new component has the same concept. Keep this list current when components are added.

- **Button** (`buttons/button`):
  - `variant`: `default` | `secondary` | `outline` | `ghost` | `link` | `destructive`
  - `size`: `default` | `sm` | `lg` | `icon`
  - `asChild` renders the button styles on its child (use for links)

## Theme & Tokens

All tokens live in `src/styles/theme.css`:

- **`@theme inline`:** maps Tailwind utilities to the CSS variables (`--color-primary: var(--primary)`), so `.dark` overrides work. Also holds radius and the `--shadow-*` scale.
- **`@theme`:** breakpoints (set 1px past each frame width, see DESIGN.md "Breakpoints include their own width"), fonts (`--font-sans` Geist, `--font-mono` Geist Mono) and the `--text-*` scale with paired line heights.
- **`:root`:** primitives (`--gray-500`, `--vermilion-500`, …). **`:root, .dark`:** Archie (light) semantic values. **`.dark`:** Archie-dark values that differ. Colors are written in `oklch`. Don't mix formats.
- **Semantic roles** use shadcn names: `background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive` (each with `-foreground`), and `border`, `input`, `ring`. Figma's extra roles sit beside them: tones (`brand`, `tone-accent`, `emphasis`, `neutral`, `info`, `success`, `warning`, `destructive`, each with `-subtle`/`-muted`, most with `-defined`/`-foreground`), surfaces (`background-subtle`, `card-muted`, `border-subtle`, `modal`, …), `icon-*`, states (`link`, `active`, `highlight`, `disabled`, `veil`), `chart-1`–`5` and `sidebar-*`. DESIGN.md → "Figma → theme.css token map" has the full map.
- **Use semantic utilities** (`bg-brand-subtle`, `text-icon-muted`). Primitives aren't Tailwind utilities: `bg-gray-100` is Tailwind's gray, not Archie's.
- **Radius:** one `--radius` (0.5rem). `rounded-sm/md/lg` (4/6/8px) derive from it.
- **Shadows:** `shadow-xs` … `shadow-2xl` follow the Figma effect styles. Their colors switch per mode.
- **Spacing and font weights:** Tailwind's defaults already match Figma. Don't redefine them.

To add a token, add it to `:root, .dark` (plus `.dark` when the dark value differs), then map it in `@theme inline`. Adding a token is a minor version; renaming or removing one is breaking.

## Motion System

Use Motion for React from `motion/react`. All motion values come from `src/lib/motion/`. Use those exports; don't write raw durations, easings or distances in components.

Motion explains a change in state, preserves spatial continuity and keeps the interface responsive. Don't animate for decoration. If an animation doesn't improve clarity, feedback, orientation or perceived speed, leave it out. When unsure, choose the more subtle option.

### Personality

Calm, refined, natural, responsive. Never bouncy, cartoonish, mechanical or distracting.

- **Prefer:** fade, soft scale, gentle elevation, short directional slide, crossfade, shared-element transition, smooth layout transition, subtle stagger.
- **Use sparingly:** rotation under 2°, parallax, scroll-linked movement, expressive springs.
- **Avoid unless asked:** bounce, shake, spin, elastic overshoot, full-screen wipes, dramatic zoom, long travel.

### Tokens (`src/lib/motion/tokens.ts`)

| Token                         | Value  | Use                                    |
| ----------------------------- | ------ | -------------------------------------- |
| `motionDuration.instant`      | 120 ms | Instant feedback                       |
| `motionDuration.fast`         | 160 ms | Hover/press feedback, exits            |
| `motionDuration.normal`       | 300 ms | Standard UI transitions                |
| `motionDuration.slow`         | 500 ms | Panels, overlays, entrances            |
| `motionDuration.deliberate`   | 600 ms | Page-level transitions, auto-scroll    |
| `motionDistance.hover`        | 3 px   | Lift                                   |
| `motionDistance.subtle`       | 8 px   | Reveal                                 |
| `motionDistance.small`        | 12 px  | Component transitions                  |
| `motionDistance.medium`       | 24 px  | Panels, Glide                          |
| `motionDistance.large`        | 40 px  | Page transitions                       |
| `motionScale.press`           | 0.98   | Press                                  |
| `motionScale.mediaHover`      | 1.03   | Media inside a Lift card               |

Don't go past `deliberate` (600 ms). A new value goes in `tokens.ts` with a comment saying what it's for, never inline in a component.

### Transitions (`transitions.ts`)

- `standardTransition`: common UI changes. Smooth acceleration, controlled deceleration, no overshoot.
- `enterTransition`: elements arriving. Quick start, gentle finish.
- `exitTransition`: elements leaving. Shorter than enter, decisive.
- `subtleSpring` / `responsiveSpring` / `layoutSpring`: press, direct manipulation, layout and shared-element movement. High damping, no visible bounce.

### Vocabulary

Use these named patterns before inventing new motion. Gesture patterns live in `patterns.ts`, presence patterns in `variants.ts`.

| Pattern  | Use for                                | Implementation                                  |
| -------- | -------------------------------------- | ----------------------------------------------- |
| Lift     | Hoverable cards and surfaces           | `liftPattern`, `liftWithMediaPattern`           |
| Press    | Buttons, cards, direct interactions    | `pressPattern`                                  |
| Reveal   | Content appearing in context           | `revealVariants`                                |
| Expand   | A region opening/closing in place      | `expandVariants` + `useExpandClip()`            |
| Connect  | Shared-element transitions             | `layoutId` + `layoutSpring`                     |
| Flow     | Small groups entering together         | `staggerContainerVariants` + children `revealVariants` |
| Glide    | Directional navigation                 | `slideVariants` (`custom={1 \| -1}`), `glidePattern` |
| Dismiss  | Content removed or closed              | `dismissVariants`; table/list rows: `rowRemoveVariants` |
| Confirm  | Lightweight success feedback           | `confirmPattern`                                |
| Pending  | Work in progress on an element's behalf | `pendingIconVariants`, `pendingSurfaceVariants` |

Plus `fadeVariants`, `overlayVariants` (scrims), `panelVariants` (drawers) and `iconSwapVariants` (one small element replacing another in place).

### Component guidance

- **Buttons:** press scale 0.98, fast release, never delay the action for the animation, never animate dimensions.
- **Cards:** Lift on hover, media scale up to 1.03, no motion on non-interactive cards.
- **Inputs:** motion clarifies focus, validation and conditional fields. Keep layout stable. No shake.
- **Menus/dropdowns:** short fade plus a small movement from the trigger.
- **Dialogs/overlays:** `AnimatePresence`, overlay fade, small surface movement, exit shorter than entrance. Usable immediately.
- **Tabs:** active indicator via shared `layoutId`.
- **Lists:** `AnimatePresence` with stable unique keys (never the index). Don't replay entrances on routine data updates.
- **Loading:** subtle opacity pulse. No aggressive or high-contrast loaders.

### Layout and presence

- Use `layout` for size/position changes and `layoutId` for shared elements. Don't hand-compute positions Motion can manage.
- Use `AnimatePresence` only for mount/unmount. Its direct children need stable unique keys.
- Animate `opacity` and `transform` by preference. Avoid continuously animating `top`/`left`/`margin`/`padding`/`box-shadow`.
- Never animate the same property with CSS and Motion at once.

### Accessibility

Always respect reduced motion: use `useMotionPreference()` and its `resolve()` helper. Under reduced motion:
- Remove nonessential transforms, parallax and large movement.
- Prefer opacity.
- Keep state-change feedback: it becomes near-instant (`reducedMotionTransition`), it doesn't disappear.

Motion is never the only signal of a state change. Keyboard behavior, focus order and visible focus must survive every animation.

### Validation

After motion work, check that:
- The build passes.
- There's no flash or layout shift.
- Exits complete.
- Rapid repeated interaction doesn't break state.
- Reduced motion works.
- Nothing blocks clicks, scrolling or navigation.

## Key Files

| File                      | Purpose                                                       |
| ------------------------- | ------------------------------------------------------------- |
| `src/index.ts`            | Public API: every consumer-facing export                      |
| `src/styles/theme.css`    | Design tokens and breakpoints, shipped to consumers           |
| `src/styles/globals.css`  | Storybook entry CSS                                           |
| `src/lib/`                | `cn()`, breakpoints, media query hook, motion system          |
| `src/docs/`               | Storybook Introduction and Foundations pages                  |
| `components.json`         | shadcn CLI configuration                                      |
| `tsup.config.ts`          | Library build configuration                                   |
| `.storybook/`             | Storybook setup, Tailwind plugin, `@/` alias, sidebar order   |

## Release & Publishing

⚠️ **Not set up yet.** The intended flow:

- **Registry:** a private registry (e.g. GitHub Packages). Apps get a small `.npmrc` scoping the package to it, plus a read-only token.
- **Version bump:** `npm run release:patch|minor|major` (wrapping `npm version`). `preversion` runs `npm run lint` and `postversion` runs `npm run build`.
- **Publish:** CI publishes only when the version in `package.json` changes on the main branch. Normal merges release nothing.
- **Semver:**
  - **Patch:** fixes and visual tweaks.
  - **Minor:** new components, optional props, variants or tokens.
  - **Major:** removing or renaming a component, prop or token, or changing a default.
  - Below 1.0.0, a minor bump is treated as breaking by package managers.

## Consumer Integration

```bash
npm install archie-ucl
```

```css
/* In the consuming app's global CSS */
@import "tailwindcss";
@import "archie-ucl/styles";
@source "../node_modules/archie-ucl/dist";
```

`@source` makes Tailwind scan UCL's bundled JS for class names. Without it, component styles silently go missing.

UCL declares the font tokens but doesn't load the webfonts. Each app loads **Geist** (weights 300–900) and **Geist Mono** (400–700), e.g. with `next/font/google` or a Google Fonts `<link>` (Storybook's is in `.storybook/preview-head.html`). Without them, text falls back to the system sans.

```tsx
import { Button } from "archie-ucl";
```

## product-specs writing conventions

Conventions for every doc under `product-specs/`.

### Status labels

Every inline prose note that flags a gap, risk, decision, confirmation or fix gets an emoji **plus a bold word label**:

- ⚠️ for anything unresolved or needing attention: `**Gap:**`, `**Constraint:**`, `**Risk:**`, `**Decision needed:**`, `**Accessibility:**`, or a more specific word that fits.
- ✅ for anything verified or resolved: `**Resolved:**`, `**Confirmed in Figma:**`, `**Copy fix:**`, or similar.
- ℹ️ for purely informative notes, with **no bold label**.

Lists where every line already starts with the same emoji don't need labels.

### Creation header

New docs open with this comment block. Update `Last updated:` whenever the content changes:

```html
<!--
Created: Oct 15, 2026
Created by: Julio Caunedo
Last updated: Oct 15, 2026
Scope: one or two lines on which spec doc(s) this file governs.
Purpose: one or two lines on why the file exists.
-->
```
