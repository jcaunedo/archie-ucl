# Archie UCL (Unified Component Library)

Shared React component library for Archie frontend applications. Built with React 19, Tailwind CSS 4, shadcn/ui (Radix) and TypeScript.

This repo is where Archie's product design happens. It holds:

- design decisions and the rationale behind them (DESIGN.md, `product-specs/`)
- prototypes
- production-ready frontend components and layouts

## Project

Everything specific to this project is in this section, "Stack", "Figma", and DESIGN.md → "Brand names" / "Brand voice". The rest of the setup is project-agnostic.

| Item         | Value                                                        |
| ------------ | ------------------------------------------------------------ |
| Project      | Archie                                                       |
| Package      | `@jcaunedo/archie-ucl` (repo `archie-ucl`)                          |
| Apps         | ⚠️ Not defined. List the apps that consume UCL (used for `src/layouts/<app>/`) |
| Brand        | DESIGN.md → "Brand names", "Brand voice"                     |

## How the rules work

- **CLAUDE.md** (this file): how things are built here. Covers the stack, folder structure, component and story conventions and theme tokens.
- **[MOTION.md](MOTION.md)**: the motion system. Covers principles, the named patterns, component guidance, accessibility and validation. Read it before any animation work. The values live in `src/lib/motion/`.
- **[DESIGN.md](DESIGN.md)**: design contracts. Covers why a component is built the way it is, rules that a future edit or Figma/shadcn resync could silently break, and the brand voice.
- **Skills** in `.claude/skills/` (`ucl-ds-sync`, `ucl-generate-component`, `ucl-generate-layout`, `ucl-ux-copywriter`) are project-agnostic. They read CLAUDE.md and DESIGN.md before they start (plus MOTION.md when the work involves animation) and take every project value (package, Figma file, categories, apps, component APIs, voice) from them. **When a skill and these files disagree, these files win.**
- **Not defined here?** Ask, then record the answer in the right file so the next run doesn't have to ask again.

## Quick Reference

| Command                   | Purpose                                      |
| ------------------------- | -------------------------------------------- |
| `npm run build`           | Build library to `dist/` (ESM + types + CSS) |
| `npm run dev`             | Watch mode build                             |
| `npm run storybook`       | Launch Storybook on port 6006                |
| `npm run build-storybook` | Build static Storybook site                  |
| `npm run lint`            | Type-check with `tsc --noEmit`               |
| `npm test`                | Run every story as a test (Vitest, headless Chromium) |
| `npm run test:watch`      | Same, re-running on change                   |

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
| Tests                | `@storybook/addon-vitest`: Vitest 5 + Playwright (Chromium) runs each story as a test | Set |

- **Forms:** if the apps also use react-hook-form/zod, make them peer dependencies so apps don't get two copies.
- **Server rendering:** if the apps render on the server (e.g. Next.js Server Components), the build needs a post-build step that marks the bundle `"use client"`.

## Figma

The design system is split across two files:

| Item                    | Value                                     |
| ----------------------- | ----------------------------------------- |
| Master design system    | `archielabs.ds`, fileKey `w8YHn6HqwgvKEyFOYkDFmW`. Generic tokens and components shared by every project that uses it, with a mode per project |
| Archie design system    | `archie.ds`, fileKey `fNWSwWgNnAh58GfSb0p76X`. Components only Archie uses, built on the master's tokens |
| Modes                   | Light + dark: the master's `semantic` collection's **Archie** mode → `:root`, **Archie-dark** → `.dark`. Its other modes (Itopia, itopia-dark as of Oct 20, 2026) belong to other products and are not synced |

- **Tokens** (`theme.css`) come only from `archielabs.ds`, Archie modes only.
- **Components** can come from either file. Shared components come from `archielabs.ds` and Archie-only ones from `archie.ds`. Both land in the same `src/components/<category>/` folders. A component in `archie.ds` that overrides a master component wins for UCL.
- ⚠️ If `archie.ds` uses a variable that isn't in the master's `semantic` collection, flag it before adding a token. Archie-only tokens must not leak into the shared master.
- **Status (Oct 20, 2026):** `archie.ds` uses `archielabs.ds` as a library and has no variables of its own. Its first components are the Sidebar family (page "Sidebar": `sidebar`, `sidebar-menu-button`, `sidebar-menu-list`, `account-switcher`). Their old `tokens`/`foundation` library bindings were rebound to `archielabs.ds` `semantic`/`primitives` (0 left).
- ⚠️ **Constraint:** `archielabs.ds` hides its `primitives` → `radius/*` from publishing, so `archie.ds` uses the `semantic` radii (`radius/menu/item` 6, `radius/default` 8). There's no published 4px radius: the icon buttons in the Sidebar sets keep a raw 4px until one is added.

Skills compare every Figma URL's `fileKey` against both files in this table and flag any other file before proceeding.

## Architecture

- **Package:** `@jcaunedo/archie-ucl`, ESM-only, published to GitHub Packages (see "Release & Publishing").
- **Build:** tsup bundles `src/index.ts` → `dist/index.js` + `dist/index.d.ts`. `src/styles/theme.css` is copied raw to `dist/styles.css`.
- **Styling:** two CSS files.
  - `src/styles/theme.css`: design tokens, `@theme inline` mappings, breakpoints, `:root` and `.dark` variables. Ships to consumers as `@jcaunedo/archie-ucl/styles`.
  - `src/styles/globals.css`: imports Tailwind + `theme.css`. Used only by Storybook.
- **Components:** one folder per component, grouped by category under `src/components/<category>/<name>/`. Each folder holds:
  - `<name>.tsx`
  - `<name>.stories.tsx`
  - `index.ts` barrel
  - optional `<name>.mdx` docs page

  Categories: `buttons`, `forms`, `cards`, `data-display`, `feedback`, `overlays`, `navigation`, `typography`. Create a category folder when its first component arrives. Don't invent a category that isn't listed here without asking.

  Exception: `typography` holds a single component, so its files sit directly in `src/components/typography/` (no `typography/typography/`), as in bethere-ucl. Import it from `@/components/typography`.
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
- Every story is a test (`npm test`): it fails if the story doesn't render. When a story shows a behavior (a click that's blocked, a state that changes, an error that's announced), add a `play` function that checks it with `expect`, `fn` and `userEvent` from `storybook/test`. Query by role and accessible name (`canvas.getByRole("button", { name: "Continue" })`), so the test also checks what a screen reader gets. Say what the test checks in the story's JSDoc ("Test: …").

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
  - `pending` marks work in progress: `aria-busy`, stays focusable, ignores clicks (mirror this name for other components that start async work)
  - `aria-disabled` is the focusable disabled state; `disabled` removes it from focus and pointer
  - `type` defaults to `"button"`
- **Input** (`forms/input`):
  - `size`: `default` (36px) | `lg` (40px). Replaces the native `size` attribute
  - States come from the element: `aria-invalid` (error), `readOnly`, `disabled`. No `variant` prop
  - Bare field only. Label and helper text come from Label/Field; icons and addons from InputGroup (not built yet)
- **Textarea** (`forms/textarea`): same `size` and states as Input; `size` sets a minimum height, and it grows with its content
- **Label** (`forms/label`): Radix Label. Above a field: medium weight, keeps its color when disabled. After a checkbox/radio/switch (`peer`): regular weight, `muted-foreground` when disabled
- **Checkbox** (`forms/checkbox`): Radix Checkbox. `checked`: `true` | `false` | `"indeterminate"` (Figma "Partial")
- **RadioGroup** / **RadioGroupItem** (`forms/radio-group`): Radix Radio Group
- **Switch** (`forms/switch`): Radix Switch. `size`: `default` (36 × 20) | `sm` (28 × 16)
- **Tooltip** (`overlays/tooltip`): Radix Tooltip. `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider` (wrap the app once)
  - `TooltipContent` `size`: `default` (Figma Medium) | `sm` (Figma Small); `side`, `sideOffset` (default 4) from Radix
- **Typography** (`typography/`, the category folder itself):
  - `size`: `xs` | `sm` | `base` | `lg` | `xl` | `2xl` | `3xl` | `4xl` | `5xl` | `6xl` | `7xl` (the `--text-*` scale)
  - `weight`: `regular` | `medium` | `semibold` | `bold` | `black`
  - `as`: element to render, `p` by default. `h1`–`h4` default to `typographyHeadings` (DESIGN.md "Heading element → Typography pairing")
  - Color isn't a prop: pass a text token in `className` (`text-muted-foreground`)
- **Field** (`forms/field`): `Field`, `FieldLabel`, `FieldDescription`, `FieldError`, `FieldContent`, `FieldTitle`, `FieldGroup`, `FieldSet`, `FieldLegend` (shadcn's API, no `FieldSeparator` until Separator exists)
  - `orientation`: `vertical` | `horizontal` | `responsive`
  - Error: `data-invalid` on `Field`, `aria-invalid` on the control, message in `FieldError` (`errors` takes react-hook-form errors)

## Theme & Tokens

All tokens live in `src/styles/theme.css`:

- **`@theme inline`:** maps Tailwind utilities to the CSS variables (`--color-primary: var(--primary)`), so `.dark` overrides work. Also holds radius and the `--shadow-*` scale.
- **`@theme`:** breakpoints (set 1px past each frame width, see DESIGN.md "Breakpoints include their own width"), fonts (`--font-sans` Geist, `--font-mono` Geist Mono) and the `--text-*` scale with paired line heights.
- **`:root`:** primitives (`--gray-500`, `--vermilion-500`, …). **`:root, .dark`:** Archie (light) semantic values. **`.dark`:** Archie-dark values that differ. Colors are written in `oklch`. Don't mix formats.
- **Semantic roles** use shadcn names: `background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive` (each with `-foreground`), and `border`, `input`, `ring`. Figma's extra roles sit beside them: tones (`brand`, `tone-accent`, `emphasis`, `neutral`, `info`, `success`, `warning`, `destructive`, each with `-subtle`/`-muted`, most with `-defined`/`-foreground`), surfaces (`background-subtle`, `card-muted`, `border-subtle`, `modal`, …), `icon-*`, states (`link`, `active`, `highlight`, `disabled`, `veil`), `chart-1`–`5` and `sidebar-*`. DESIGN.md → "Figma → theme.css token map" has the full map.
- **Use semantic utilities** (`bg-brand-subtle`, `text-icon-muted`). Primitives aren't Tailwind utilities: `bg-gray-100` is Tailwind's gray, not Archie's.
- **Radius:** one `--radius` (0.5rem). `rounded-sm/md/lg` (4/6/8px) derive from it.
- **Shadows:** `shadow-xs` … `shadow-2xl` follow the Figma effect styles. Their colors switch per mode.
- **Spacing:** Tailwind's default scale already matches Figma. Don't redefine it.
- **Font weights:** lighter than Tailwind's: `light` 280, `normal` 350, `medium` 450, `semibold` 550, `bold` 650 (`extrabold`/`black` unchanged). `body` uses the normal weight, so all text is 350 unless a `font-*` is set (DESIGN.md "Font weight scale").
- **Typography specs:** the full spec is written out in `typography.tsx`'s top comment, Storybook "Typography/Typography" and "Foundations/Typography". Changing a type token or heading default updates all three in the same change (DESIGN.md "Typography specs live in three places").

To add a token, add it to `:root, .dark` (plus `.dark` when the dark value differs), then map it in `@theme inline`. Adding a token is a minor version; renaming or removing one is breaking.

## Motion System

The motion rules live in [MOTION.md](MOTION.md): principles, personality, the named patterns (Lift, Press, Reveal…), component guidance, accessibility and the validation checklist. **Read it before adding or changing any animation.**

- Import Motion APIs from `motion/react`.
- Take every duration, easing, spring, distance and variant from `src/lib/motion/`. Never write raw motion values in a component.
- Respect reduced motion with `useMotionPreference()` and its `resolve()` helper.

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
| `vitest.config.ts`        | Story tests: `storybookTest` plugin, headless Chromium        |
| `netlify.toml`            | Netlify hosting for the static Storybook site                 |

## Release & Publishing

- **Registry:** GitHub Packages, under the repo owner's scope: `@jcaunedo/archie-ucl` (`publishConfig` in `package.json`). GitHub Packages only accepts a package whose scope matches the repo owner.
- **Version bump:** `npm run release:patch|minor|major` (wrapping `npm version`). `preversion` runs `npm run lint` and `postversion` runs `npm run build`. The working tree must be clean. Then `git push && git push --tags`.
- **Publish:** `.github/workflows/publish.yml` runs when `package.json` changes on `main` (or by hand from the Actions tab). It publishes only when that version isn't in the registry yet, so normal merges release nothing.
- **Apps:** each app has an `.npmrc` mapping `@jcaunedo` to `https://npm.pkg.github.com`, plus a token with `read:packages` (see "Consumer Integration").
- **Semver:**
  - **Patch:** fixes and visual tweaks.
  - **Minor:** new components, optional props, variants or tokens.
  - **Major:** removing or renaming a component, prop or token, or changing a default.
  - Below 1.0.0, a minor bump is treated as breaking by package managers.
- **Moving to a company org:** ℹ️ the package lives under a personal account for now. Moving the repo to an org renames the package to `@<org>/archie-ucl`, which is a breaking change for every app. README.md → "Moving UCL to a company org" has the steps. The fewer apps use UCL, the cheaper the move.

## Consumer Integration

Each app first maps the `@jcaunedo` scope to GitHub Packages in an `.npmrc` at its root, and sets `NPM_TOKEN` to a GitHub personal access token (classic) with the `read:packages` scope:

```ini
@jcaunedo:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NPM_TOKEN}
```

```bash
npm install @jcaunedo/archie-ucl
```

```css
/* In the consuming app's global CSS */
@import "tailwindcss";
@import "@jcaunedo/archie-ucl/styles";
@source "../node_modules/@jcaunedo/archie-ucl/dist";
```

`@source` makes Tailwind scan UCL's bundled JS for class names. Without it, component styles silently go missing.

UCL declares the font tokens but doesn't load the webfonts. Each app loads **Geist** as a variable font (`wght@100..900`, needed for UCL's 280–650 weights) and **Geist Mono** (400–700), e.g. with `next/font/google` or a Google Fonts `<link>` (Storybook's is in `.storybook/preview-head.html`). Without them, text falls back to the system sans.

```tsx
import { Button } from "@jcaunedo/archie-ucl";
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
