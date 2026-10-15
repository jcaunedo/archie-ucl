# Design & Component Contracts

Durable, team-visible rules about *why* things are built the way they are. Without them, a future edit or a Figma/shadcn resync could silently break these decisions. This file is committed, so it travels with the repo and every contributor (human or AI) sees it. The skills in `.claude/skills/` read it before they start.

Add an entry when a fix or convention:

- took real iteration to land on and could plausibly be "fixed" back to a worse state by someone who doesn't know the history, or
- is a contract between two pieces of code (e.g. two rules that must change together) that isn't obvious from reading either one alone.

Each entry says what the rule is, why it exists, and how to apply it. Don't restate what the code already makes obvious. Name the file it governs in the heading when there is one.

---

## Design quality bar: internal tools and customer-facing products are equal

**Rule:** every Archie product is designed to be intuitive, efficient and human. That bar applies equally to customer-facing experiences and internal or operational tools.

**Why:** it's easy to treat internal screens as lower priority because they have no external audience. This rule stops that assumption from quietly lowering the bar.

**How to apply:** don't reach for a lower-effort pattern (skipping states, motion or copy quality) because a screen is internal-only.

---

## Brand names: Archie, Archie Core, Archie Labs

**Rule:** write **Archie** with a capital A and the rest lowercase in UI copy, alt text, stories, docs, specs and comments. Never "ARCHIE", except where CSS uppercases a label. The three product lines are distinct and are never used interchangeably:

- **Archie:** the flagship full-stack app builder.
- **Archie Core:** the backend-only tier.
- **Archie Labs:** the professional services arm.

**Why:** the names are separate products with separate audiences, so a mix-up in copy points people at the wrong thing.

**How to apply:** when copy says "Archie" and the context could mean Core or Labs, ask which one. Identifiers that aren't user-facing (the `archie-ucl` package, CSS/JS names) keep their lowercase forms.

---

## Brand voice

⚠️ **Decision needed:** not defined yet. The `ucl-ux-copywriter` skill reads this section. Until it's filled in, the skill falls back to general rules and says which assumptions it made. Define:

- **Audiences:** who reads the UI (e.g. builders creating apps, team admins, internal operators), and the tone for each.
- **Voice:** three to five words for how the product sounds, plus what it never sounds like.
- **Terminology:** the words the product uses for its core objects and states (e.g. "blueprint", "project", "app"), and words to avoid.

---

## Gaps, margins and padding match Figma's literal value

**Rule:** when a Figma spacing value (gap, margin, padding) doesn't exactly match an existing spacing token, use the literal value as an arbitrary Tailwind class (e.g. `gap-[2px]`). Don't round it to the nearest token-backed utility (`gap-2` = 8px) for the sake of "consistency" with another variant or a nearby value. Check every value against the exact Figma node, per variant and state.

**Why:** in a previous UCL, a card's two variants had a real, Figma-authored difference: one used a raw `2px` gap, the other an `8px` token. The `2px` was normalized to `8px` to "avoid a non-token literal". That looked reasonable, but it was wrong. It built and rendered plausibly, so nobody caught it until a pixel comparison against Figma.

**How to apply:**

- Pull the literal value from `get_design_context` or `get_variable_defs` for the **exact node**, not a similar sibling or a different variant.
- If it matches a token's value, use that token's utility.
- If it matches no token, use the arbitrary class. An honest raw value is correct; a token that's a few pixels off is not.
- If the same visual role has different values across variants, keep the difference. If it looks like a Figma slip, ask which value wins instead of picking one.
- Applies to every component and layout, on first build and on every resync.

---

## Icon sizes match Figma's defined instance size

**Rule:** when Figma defines an icon instance at a given size (e.g. 24×24), render it at that size. Don't measure a smaller shape nested inside the instance and conclude the "visible" size is smaller.

**Why:** in a previous UCL, a plus icon was defined at 24×24, but its inner vector measured 16×16 because of a 4px inset in the source asset. It shipped at `size-4` and had to be corrected back to `size-6`. The inset is how the asset was drawn, not an instruction to shrink it.

**How to apply:**

- Take the size from the instance node's own width/height (`get_metadata` / `get_design_context`), not from a child layer.
- If a nested shape seems to disagree with the instance size, ask. Don't substitute the smaller number.

---

## Composed components are black boxes to their parents

**Rule:** once a component is placed inside another component or a layout, the parent never modifies or reaches into its internals. No deep descendant selectors (`[&_svg]:size-12`) that also match elements inside a child component's own markup.

**Why:** in a previous UCL, a card's icon slot used `[&_svg]:size-12` to size a logo passed into it. When a component with its own internal icon went into that slot, the same selector reached two levels down and resized the child's icon too. It rendered something plausible, so nothing caught it short of a visual diff.

**How to apply:**

- Scope slot styling to **direct children only** (`[&>svg]`, `[&>img]`), never `[&_svg]`.
- If a child needs to look different in a given context, add a prop or variant to the child. Don't override it from the parent with CSS.
- Before reusing a slot for a new component, check that the slot's selectors are scoped to direct children.

ℹ️ `Button`'s own `[&_svg]` rules style the icons passed directly into it, which is the component styling its own content. Don't nest another component that renders its own SVG inside a `Button` without checking this.

---

## Breakpoints include their own width (`src/styles/theme.css`, `src/lib/breakpoints.ts`)

**Rule:** a breakpoint covers widths up to and including its frame width. The frames are:

| Name  | Frame width |
| ----- | ----------- |
| `sm`  | 640         |
| `md`  | 768         |
| `lg`  | 1024        |
| `xl`  | 1280        |
| `2xl` | 1536        |
| `3xl` | 1920        |

So the lg frame at exactly 1024px gets the "lg and below" layout, and the next layout starts at 1025px.

**Why:** designs are reviewed at those exact frame widths, and each frame must show the layout designed for it. With Tailwind's default min-width breakpoints, a frame at exactly 1024px got the next layout up. Same convention as bethere-ucl and verita-ai.

**How to apply:**

- `theme.css` registers each Tailwind breakpoint 1px past its frame width (`--breakpoint-lg: 1025px`). `lg:` means above 1024 and `max-lg:` means 1024 and below. Write the usual `lg:`/`xl:` classes, never an arbitrary `min-[1025px]:`.
- JS media queries use `mediaAbove("lg")` from `@/lib/breakpoints` with `useMediaQuery` from `@/lib/hooks/use-media-query`, never a hand-written `(min-width: …)`.
- Keep `theme.css` and `src/lib/breakpoints.ts` in sync when a breakpoint changes.
- Describe breakpoints as "at `lg` (1024) and below" / "above `lg`", not "below `lg`" / "from `lg`".

⚠️ **Constraint:** `theme.css` ships to consumers, so the apps' own `sm:`–`3xl:` classes follow these boundaries too.

---

## Row removal motion: fade out, then the rows below glide up (`src/lib/motion/variants.ts`)

**Rule:** when a row leaves a table or list because its data was removed, it doesn't just vanish. It fades out on `exitTransition` (160ms), then the rows below move up into its space on `layoutSpring`. Use `rowRemoveVariants` with the wiring below, not a one-off animation.

```tsx
const MotionTableRow = motion.create(TableRow);
const { resolve } = useMotionPreference();

<TableBody>
	<AnimatePresence initial={false}>
		{rows.map((row) => (
			<MotionTableRow
				key={row.id}
				layout='position'
				variants={rowRemoveVariants}
				initial='initial'
				animate='animate'
				exit='exit'
				transition={{ layout: resolve(layoutSpring) }}
			>
				…
			</MotionTableRow>
		))}
	</AnimatePresence>
</TableBody>;
```

**Behavior:**

- **Opacity only.** No `y` nudge, because a `<tr>` moving down overlaps the next row's border.
- **No entrance.** `initial` equals `animate` and `AnimatePresence` has `initial={false}`, so rows on first render or added by a data update just appear.
- **Sequenced.** The row finishes fading before the gap closes. That's `AnimatePresence`'s default `"sync"` mode.
- **Reduced motion:** `resolve(layoutSpring)` closes the gap at once. The fade stays, so the removal is still visible.
- **Search/filter changes** use the same motion.

⚠️ **Constraint:** never `mode="popLayout"` on table rows. It pulls the exiting row out with `position: absolute`, and a `<tr>` loses its table layout: its cells collapse while it fades.

⚠️ **Constraint:** keys are the record id, never the array index, or the wrong row fades out.

---

## Figma → theme.css token map (`src/styles/theme.css`)

**Rule:** `theme.css` mirrors the `semantic` collection of the `archielabs.ds` Figma file, Archie mode in `:root, .dark` and Archie-dark in `.dark`. Each Figma variable maps to a CSS token by the table below. The mapping decisions are deliberate. A resync must keep them, not "fix" them back to shadcn defaults or to a literal Figma name.

**Why:** the Figma file uses a tone system (`tone/<tone>/<step>`, surfaces with `subtle`/`muted`/`defined`), not shadcn's role names. Several shadcn roles have no Figma variable of their own. They're mapped to the variable the matching Figma component actually binds, and that's invisible from either file alone.

**How to apply:**

- Naming: drop `colors/`, join the path with `-`, and drop the repeated last segment (`colors/tone/brand/brand` → `--brand`, `colors/card/subtle` → `--card-subtle`). `on-<tone>` becomes `--<tone>-foreground`.
- Diff every mapped variable on each sync, in both modes, against the resolved `theme.css` value. The 2026-10-15 sync checked 90 tokens × 2 modes: 0 drift.

### Mapping decisions

| CSS token | Figma variable | Why |
| --- | --- | --- |
| `--primary` / `-foreground` | `tone/brand/brand` / `tone/brand/on-brand` | Button Solid · Brand |
| `--secondary` / `-foreground` | `tone/brand/subtle` / `tone/brand/brand` | Button Flat · Brand, Figma's only filled, non-solid button. Chosen over a neutral gray |
| `--accent` / `-foreground` | `states/hover` / `foreground/foreground` | shadcn `accent` is the hover/selected surface. Button Ghost and Outlined hover bind `states/hover` |
| `--destructive-foreground` | `tone/brand/on-brand` | Button Solid · Destructive binds its label to `on-brand`. There's no `on-destructive` |
| `--muted` / `-foreground` | `background/muted` / `foreground/muted` | |
| `--input` | `input/border` | Button Outlined stroke |
| `--ring` | `input/ring-focus` | Focus ring. `input/ring` → `--input-ring` |
| `--card-foreground`, `--popover-foreground` | `foreground/foreground` | No Figma variable of their own |
| `--tone-accent*` | `tone/accent/*` | Prefixed: Figma's "accent" tone (dark gray) is not shadcn's `--accent` |
| `--veil`, `--veil-soft` | `base/opacity-veil`, `base/opacity-soft` | Renamed: `bg-opacity-*` reads like an opacity utility |
| `--shadow-color-sm/md/lg` | `shadow/sm/md/lg` | Colors for the `shadow-*` scale, which mirrors the effect styles |

### Deliberately not mirrored

- **Primitives as utilities:** only the 7 palettes the Archie modes reference (gray, vermilion, sky, info, success, warning, destructive) are declared, as `:root` variables. They aren't registered as Tailwind colors, so `bg-gray-100` stays Tailwind's gray. Components use semantic tokens. The other 15 palettes belong to other products' modes.
- **Typography:** Geist is shipped. The Figma `font-family/headline` and `/bodytext` variables say Geist, but 52 of 55 text styles still render Inter through orphaned variables. The type scale comes from the live `font-size/*` and `line-height/*` primitives (2xl = 24/32, not the old styles' 24/36). `font-size/xxs` (11px) is skipped: it has no paired line height and no text style uses it.
- **Not synced yet:** `code/*` (syntax colors), `decorative/decorative-1`, `linear-1A/1B` (gradient stops), the `components` collection (`inbox-unread`, `chat-bubble`, `overlay`), the `radius/*` component radii, the `Sonner` effect style, `paragraph-gap/*` and `breakpoint/width|height` (the artboard size, not a breakpoint). Add each with the component that needs it.
- **Spacing, font weights and base radius** already equal Tailwind's defaults and `--radius: 0.5rem`, so they aren't redefined.

### Archie-dark fixes made in Figma (2026-10-15)

These Archie-dark values were Figma slips. They were fixed in Figma and mirrored here, so a resync stays in step:

| Figma variable | Was | Now |
| --- | --- | --- |
| `input/border` | gray-200 | gray-700 |
| `input/border-disabled` | gray-700 | gray-800 |
| `input/ring-outside` | gray-50 | gray-800 |
| `states/disabled` | gray-50 | gray-800 |
| `states/active` | #f0f2f5 at 60% | gray-700 |
| `sidebar/hover` | white | `states/hover` |
| `tone/success/subtle` / `muted` | success-50 / 100 | success-900 / 800 |
| `radius/button/sm`, `md` | 8 | 6 (same as light) |

⚠️ **Decision needed:** these look off but were left as Figma has them:

- `states/active-alt` is white in dark mode.
- `icon/brand` is gray-200 in dark mode, not the brand color.
- In dark mode, `subtle` → `muted` → `defined` gets darker for brand and warning but lighter for info, success and destructive.
- `tone/emphasis/defined` equals `muted` in both modes.
- `on-brand` is gray-950 on vermilion in dark mode. ⚠️ **Accessibility:** gray-950 text measures 4.18:1 on vermilion-500 and white measures 4.47:1, so both clear 3:1 for large text but neither reaches the 4.5:1 normal-text minimum. This affects light mode too: the primary button's white label is 4.47:1.

---

## Semantic tokens are declared on `:root, .dark` (`src/styles/theme.css`)

**Rule:** the Archie (light) semantic block uses the selector `:root, .dark`, not just `:root`. The `.dark` block after it overrides only the values that differ.

**Why:** many tokens are aliases, such as `--primary: var(--brand)`. A custom property's `var()` resolves on the element that declares it, and descendants inherit the result. If the aliases were declared only on `:root` and `.dark` were applied to a wrapper below `<html>` (a Storybook decorator, a dark section), `--primary` would keep the light brand values inside it. Redeclaring the aliases on `.dark` makes them resolve against the dark values there.

**How to apply:** add new semantic tokens to the `:root, .dark` block. Add them to `.dark` too only when the dark value differs. Keep `.dark` after the shared block, because both selectors have the same specificity. Primitives stay in plain `:root`.
