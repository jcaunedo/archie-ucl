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

**How to apply:** when copy says "Archie" and the context could mean Core or Labs, ask which one. Identifiers that aren't user-facing (the `@jcaunedo/archie-ucl` package, the `archie-ucl` repo, CSS/JS names) keep their lowercase forms.

---

## Brand voice

**Rule:** Archie's UI is **clear, calm and confident**. Use plain words and short sentences, and say what's happening. It never sounds like hype, jargon, cute or blaming.

- **Audiences:** builders (founders, product teams and developers creating apps with Archie, the primary audience), team admins, internal operators, and end users of generated apps. The same voice applies to all of them.
- **Terminology:** blueprint, module, user type, service, tech stack, prototype, app. Say "social sign-in" for consumer OAuth buttons (Google, Microsoft, Github), never "SSO", which is reserved for enterprise SAML/OIDC.

**Why:** Archie's position is clarity before code, so the copy has to show that clarity. The calm tone matches the motion personality (CLAUDE.md → "Motion System"). The `ucl-ux-copywriter` skill reads this section, and PRODUCT.md repeats it for Impeccable.

**How to apply:**

- Use the terms above for the product's core objects. Don't swap in synonyms ("project", "plan", "spec") for the same thing.
- **Playful exception (decision 2026-10-29):** when a message can't be read (random keys), Archie's reply may be playful and creative, often with a nod to the project ("That one slipped its chain."), and it changes each time. It still never blames the person, and it always asks again with a hint of what to send. Everywhere else, the rule above holds. The replies are in `src/layouts/archie/project/sample-archie.ts` (`garbledReplies`); prds/chat-behavior-system.md rule 4.
- ⚠️ **Decision needed:** tone per audience (for example, more technical for developers or more guided for first-time founders) isn't defined. Until it is, use the one voice above for everyone.

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

**Rule:** a breakpoint covers widths up to and including its frame width. So the lg frame at exactly 1024px gets the "lg and below" layout, and the next layout starts at 1025px.

UCL's breakpoints, each with the frame designs are reviewed at:

| Token   | Frame (W × H) | Tailwind variant starts at | Alignment              |
| ------- | ------------- | -------------------------- | ---------------------- |
| `md`    | 768 × 600     | 769px                      | Tailwind default width |
| `lg`    | 1024 × 768    | 1025px                     | Tailwind default width |
| `xl`    | 1280 × 800    | 1281px                     | Tailwind default width |
| `2xl`   | 1536 × 900    | 1537px                     | Tailwind default width |
| `2.5xl` | 1728 × 972    | 1729px                     | Custom                 |
| `3xl`   | 1920 × 1080   | 1921px                     | Custom                 |

The 1728px frame sits halfway between 1536 and 1920. `sm` (640, variant from 641px) is also registered, with the same +1px rule, for small mobile-to-tablet splits, but it isn't a design review frame.

**Why:** designs are reviewed at those exact frame widths, and each frame must show the layout designed for it. With Tailwind's default min-width breakpoints, a frame at exactly 1024px got the next layout up. Same convention as bethere-ucl and verita-ai.

**How to apply:**

- `theme.css` registers each Tailwind breakpoint 1px past its frame width (`--breakpoint-lg: 1025px`). `lg:` means above 1024 and `max-lg:` means 1024 and below. Write the usual `lg:`/`xl:` classes, never an arbitrary `min-[1025px]:`.
- `2.5xl` (1728, custom, halfway between `2xl` and `3xl`) is registered as `--breakpoint-2\.5xl`. The dot has to be escaped, because Tailwind turns `--breakpoint-2_5xl` into `max-2.5xl:` only, with no `2.5xl:`.
- JS media queries use `mediaAbove("lg")` from `@/lib/breakpoints` with `useMediaQuery` from `@/lib/hooks/use-media-query`, never a hand-written `(min-width: …)`.
- Keep `theme.css` and `src/lib/breakpoints.ts` in sync when a breakpoint changes.
- Describe breakpoints as "at `lg` (1024) and below" / "above `lg`", not "below `lg`" / "from `lg`".

⚠️ **Constraint:** `theme.css` ships to consumers, so the apps' own `sm:`–`3xl:` classes follow these boundaries too.

---

## Every clickable element shows the pointer cursor (`src/styles/theme.css`)

**Rule:** anything clickable shows `cursor: pointer` on hover, and disabled controls show `cursor: not-allowed`. One global `@layer base` rule at the end of `theme.css` enforces it, not each component. Don't add `cursor-pointer` to a component.

The rule matches real interactive elements and roles:

- `button`, `a[href]`, `label[for]`, `summary`, `select`, and `input` of type checkbox, radio, submit, button, reset and file.
- `[role="button"]`, and the roles Radix/shadcn render: `checkbox`, `radio`, `switch`, `tab`, `option`, `menuitem`, `menuitemcheckbox`, `menuitemradio`. These are skipped when `aria-disabled="true"` or `data-disabled` is set.
- A `button` or link with `aria-disabled="true"` (Button's focusable disabled mode) gets `not-allowed`, not the pointer. A busy Button (`aria-busy`, set by `pending`) shows `progress` through its own `aria-busy:cursor-progress` utility.

**Why:** Tailwind 4's preflight sets `cursor: default` on `<button>`, a change from v3's `pointer`. Left alone, every clickable control showed the arrow unless someone remembered `cursor-pointer` on each component. In bethere-ucl, components that did hand-roll it each handled the disabled state differently. One global rule keeps the affordance consistent. Same convention as bethere-ucl, extended here with tabs, menu items, options and native inputs.

**How to apply:**

- A new component built on a real interactive element or role gets the cursor for free. Don't add a redundant `cursor-pointer` class.
- A custom clickable element (a `div` acting as a button) needs `role="button"`, plus `aria-disabled="true"` when disabled. A bare `div` with only `onClick` doesn't get the cursor, and isn't accessible either.
- A new interactive role that isn't covered: extend the selector list in `theme.css` and this section together. Never patch the one component.
- A component that needs a different cursor (`cursor-text` on a text-entry combobox, `cursor-grab` on a drag handle) sets it with a utility. Utilities win over `@layer base`.
- ℹ️ `Button` keeps shadcn's `disabled:pointer-events-none`, so a `disabled` button ignores the pointer and shows no cursor change at all. Use `aria-disabled` when the button should still show `not-allowed`, a tooltip or keyboard focus (see "Button: pending and focusable disabled").

⚠️ **Constraint:** `theme.css` ships to consumers, so the apps' own buttons, links and controls get the pointer cursor too.

---

## Text rendering: antialiased, kerned, no faux styles (`src/styles/theme.css`)

**Rule:** one global `@layer base` rule on `html` at the end of `theme.css` sets how every app renders text. Added Oct 25, 2026, same as intercept-ucl.

| Property | Value | Effect |
| --- | --- | --- |
| `-webkit-font-smoothing` / `-moz-osx-font-smoothing` | `antialiased` / `grayscale` | macOS only (Chrome, Safari, Firefox): thinner, crisper text than the platform's heavier default smoothing. Same as Tailwind's `antialiased`. No effect on Windows or Linux |
| `font-kerning` | `normal` | The font's kerning at every size, not only where the browser decides |
| `font-synthesis` | `none` | The browser never fakes bold or italic. A weight an app didn't load falls back to a loaded weight instead of a blurry smeared one |
| `-webkit-text-size-adjust` / `text-size-adjust` | `100%` | iOS doesn't enlarge text after rotation |

**Why:** browser defaults render text heavier on macOS than Figma draws it, and a missing webfont weight shows as faux bold. UCL declares the font tokens but doesn't load the webfonts (CLAUDE.md "Consumer Integration"), so `font-synthesis: none` protects apps that load fewer weights than the components use.

**How to apply:**

- Don't add `antialiased` or these properties to a component. The global rule covers it.
- `text-rendering: optimizeLegibility` is deliberately not set globally: modern browsers already kern and apply ligatures, and on long pages it can slow rendering. Use it per element only if a specific heading needs it.
- Apps load Geist as a variable font (`wght@100..900`, as CLAUDE.md "Consumer Integration" and `.storybook/preview-head.html` do), since UCL uses weights from 280 to 680 (DESIGN.md "Font weight scale"). A static weight set would fall back to the nearest loaded weight.
- Digits that line up in columns use `tabular-nums` per element. That's a typographic choice, not part of this rule.

⚠️ **Constraint:** `theme.css` ships to consumers, so every app's text renders this way, including text outside UCL components. `antialiased` makes text look slightly lighter on macOS: compare it with Figma before changing font weights to make up for it.

---

## Button: Figma's Button set, plus pending, focusable disabled and `type="button"` (`src/components/buttons/button/button.tsx`)

**Rule:** Button follows Figma's "Button" set (`archie.ds`, node `36:3337`, moved from `archielabs.ds` node `41:604` on 2026-10-28 with the same 210 variants and bindings to the master's `semantic` variables, read in Archie mode) on shadcn's structure, synced 2026-10-28. A resync from Figma or shadcn must keep the mapping and the four behaviors below.

**Figma → code:**

| Figma | Code |
| --- | --- |
| Solid · Brand / Flat · Brand / Outlined · Neutral / Ghost · Neutral / Link · Brand / Solid · Destructive / Flat · Destructive | `variant`: `default` / `secondary` / `outline` / `ghost` / `link` / `destructive` / `destructive-secondary` |
| Solid · Neutral (not in the Button set) | `variant`: `neutral`. Figma has no Solid · Neutral variant: prompt-alert's Allow and MainNav override Solid · Brand's fill with `tone/neutral/neutral`. Code makes it a variant so it's reused, not re-overridden: `neutral` fill, `neutral-foreground` label, hover mixes 20% black like the other solids, disabled uses the neutral disabled colors. Decision 2026-10-29. ⚠️ **Gap:** add Solid · Neutral to the Figma Button set |
| Size xs · 24 / sm · 28 / md · 32 / lg · 36 / xl · 40, Type=Text | `size`: `xs` / `sm` / `md` (default) / `lg` / `xl` |
| The same sizes, Type=Icon | `size`: `icon-xs` … `icon-xl`, with 12 / 14 / 16 / 18 / 20px icons |
| `radius/button/xs` … `xl` (6 / 8 / 8 / 8 / 10px) | `rounded-button-xs` … `rounded-button-xl`, new tokens |
| State=Hover on Solid: 20% black over the fill | `hover:not-aria-disabled:bg-[color-mix(in_srgb,var(--primary)_80%,black)]`: sRGB, as Figma composites layers (oklab comes out darker: `#a02d20` instead of Figma's `#ad3326`); not `/90`, which lightens |
| State=Hover on Flat / Outlined, Ghost / Link | `brand-muted`, `destructive-muted` / `accent` (`states/hover`, near-black at 4%, Figma update 2026-10-29) / `brand-subtle`, no underline. On Outlined the tint is a gradient layer over the white fill, not a replacement: replaced, the button turns see-through and on the gray topbar hovers to `#e7e9ed` instead of `#f8f8f8` (fixed 2026-10-28). Ghost has no fill, so its tint shows what's behind it, as in Figma |
| State=Disabled | `data-disabled:` colors per variant: `states/disabled` fill and `foreground/subtle` text, `input/border-disabled` on Outlined. Solid · Brand Type=Text keeps `on-brand` text on `tone/brand/muted`; Type=Icon uses the neutral pair (a compound variant). No `opacity-50` |
| State=Loading | `pending`: Figma's `loader-circle` at the size's icon size, centered over the label |
| Outlined's `shadow-xs` | `shadow-xs`, dropped when disabled |

- **Spacing:** each size's padding, gap and icon size come from the Archie-mode values of the bound `spacing/*` variables (md: 12px sides, 8px on the side with an icon, 5px icon to label; see the comments in `buttonVariants`). The side with an icon is tighter only when the icon says which side it's on: `data-icon='inline-start'` or `'inline-end'` on the svg. CSS can't tell a leading icon from a trailing one, and shadcn's `has-[>svg]` narrows both sides.
- **Labels:** 14px medium (`font-size/sm`, `font-weight/medium`, 480 in code since 2026-10-28), 12px at `xs`, 16px at `xl`.

ℹ️ The xs and sm labels' text isn't bound to variables in Figma (12 and 14px at weight 500). UCL uses `font-medium` (480), like the bound sizes.

**Behaviors (keep on every resync):**

- **`pending`** sets `aria-busy` and `aria-disabled`, keeps the button focusable and ignores clicks. Figma's Loading state replaces the label with the spinner and narrows the button (60 → 54px at md); here the label stays, transparent, under the spinner, so the width doesn't change and the label stays the accessible name (`opacity-0`, not `invisible`, which would drop it from the name). Decision 2026-10-28. The spinner turns once per `motionDuration.pendingLoop` (`pendingSpinnerVariants`) and pulses under reduced motion. A pending button keeps its colors; it doesn't look disabled.
- **`aria-disabled="true"`** blocks clicks in `handleClick` but keeps focus and the `not-allowed` cursor, so a tooltip can say why the button is unavailable. It looks disabled (`data-disabled`). It works with `asChild` links too: `preventDefault` stops the navigation.
- **`type` defaults to `"button"`**, so a Button inside a form doesn't submit it. Pass `type="submit"` for the form's submit button.
- **The content is always wrapped in a span** (`data-slot='button-content'`, except with `asChild`), so the DOM and width are stable when `pending` toggles.

**Why:** the critique of 2026-10-20 found that a double click on "Generate" fired twice, a disabled "Continue" couldn't be focused to explain itself (sign-in spec), and a Button in a form submitted it. Archie's AI actions all start from a Button, so it owns the pending state instead of each app building its own. The 2026-10-28 sync brought the sizes, corners, text, shadow, hover and disabled colors in line with Figma: the old Button was 36px icons, 6px corners, 12px text at `sm` and no shadow, which made the topbar look off.

**How to apply:**

- Use `pending` for work the button started. Use `disabled` only when the button is truly unavailable and needs no explanation. Use `aria-disabled` when it needs one (a tooltip or helper text).
- During generation, show a separate Stop button next to the pending one. Button doesn't swap itself into Stop, because Stop is a different action with its own handler.
- Hovers are written `hover:not-aria-disabled:…`, so blocked buttons don't react. Disabled colors are written `data-disabled:…`. Keep both forms when adding a variant.
- Mark icons beside a label with `data-icon`. An icon-only button uses an `icon-*` size and needs an `aria-label`.
- To truncate a long label, wrap its text in `<span className='truncate'>`. The button stops at its container's width (`max-w-full`).
- ℹ️ The spinner's `motion.span` makes Button a client component. If the apps use React Server Components, the build needs the `"use client"` step (CLAUDE.md → "Stack").

---

## Input: how Figma's Textfield maps to tokens (`src/components/forms/input/input.tsx`)

**Rule:** `Input` follows Figma's "Input" set (`archielabs.ds`, node `61:133`), Type=Textfield. Every state is a straight copy of its Figma bindings:

| State | Border | Fill | Text |
| --- | --- | --- | --- |
| Default / HasValue | `input` | `background`, `shadow-xs` | `foreground`, placeholder `muted-foreground` |
| Hover | `input-ring` (`input/ring`: gray-400, gray-300 in dark), lighter than Focus | | |
| Focus | `ring` + 3px `ring-outside` halo, no shadow | | |
| Error (`aria-invalid`) | `destructive` | `destructive-subtle` | `destructive` |
| Read-only | `input-disabled` | `background-subtle`, no shadow | `foreground` |
| Disabled | `input-disabled` | `background-subtle`, no shadow | `foreground-subtle` |

✅ **Resolved in Figma (2026-10-20):**
- **The Input set had 18 stale variables** across all 7 types (deleted `semantic` variables, plus the old `tokens` and `foundation` libraries). They were rebound to current variables: 177 nodes and 10 icon overrides; a census found 0 stale bindings left. Most kept their value. Four changed on purpose:
  - `alerts/danger` (#E22323) → `tone/destructive/destructive`, and its 5% tint → `tone/destructive/subtle`;
  - `alerts/success` → `tone/success/success`;
  - `text/dark` (gray-600 in both modes) → `foreground` on text and `icon/foreground` on icons.
- **Textfield made consistent:** Disabled uses `input/border-disabled` and `foreground/subtle` at both sizes, and Focus uses `input/ring-focus` at both sizes.
- **Slips fixed:** `radius/input` is 8px (`radius/2`) in Archie-dark too, and the 40px HasValue field is 40px tall.
- **Textarea made consistent too:** Focus uses `input/ring-focus`, Read-only uses `background/subtle`, and the 40px Error has `shadow-xs` like the 36px one (in Textfield too).
- **Designer update (2026-10-20, synced):** `input/ring-outside` (the Focus halo) moved from gray-50 to gray-200 in Archie mode, so `--ring-outside` in `theme.css` followed. A full token diff found it to be the only drift (259 values). The 40px Date Picker and Payment Method Focus halos were bound to `base/opacity-soft`, left over from the stale-variable remap, and were rebound to `input/ring-outside`. Hover moved from `input/ring-focus` to `input/ring` in Textfield and Textarea. Textarea's placeholder had become `foreground/subtle` (gray-400, 2.5:1, fails AA). It was set back to `foreground/muted`, like Textfield, and its 40px Disabled text to `foreground/subtle`, like every other Disabled.
- **Designer update (2026-10-20, synced):** the Payment Method type was removed from the set (86 → 72 variants). UCL never built it. Textfield and Textarea bindings didn't change, and a full token diff found 0 drift in 273 values (colors plus `font-weight/*`).
- ⚠️ **Gap:** Dropdown, Combobox and Date Picker weren't checked for consistency between sizes. Check them the same way when their components are built.
- ✅ **Resolved in Figma (2026-10-20):** all 55 text styles are Geist and bind their family (`semantic` → `font-family/bodytext` for xs–xl, `/headline` for 2xl–7xl), size, line height and paragraph spacing (`primitives` → `font-size/*`, `line-height/*`, `paragraph-gap/*`) and weight (`semantic` → `font-weight/*`). They render UCL's weights in the Archie modes, and the `2xl` styles moved from 24/36 to 24/32. 45 unstyled Input text layers were given their matching style, and the set has 0 stale bindings.
- **Textarea** (`src/components/forms/textarea/textarea.tsx`) copies Input's state classes. Keep the two in sync. Its `size` is a minimum height, `field-sizing-content` grows it, and its padding is `px-3 py-2`, because Figma's 3px right and bottom insets only place the resize grip it draws.

- **Sizes:** Figma `lg · 36` → `size="default"` (`h-9`), `xl · 40` → `size="lg"` (`h-10`), mirroring Button's names. Padding is `px-3` (12px) at both sizes.
- **Radius:** `rounded-lg` (8px), `radius/input` in both modes.
- **Font size:** shadcn's `text-base md:text-sm`. Figma draws 14px, which UCL uses above `md`. Below it, 16px stops iOS Safari from zooming into a focused field.
- **The Focus variant's 8px right padding** makes room for the clear "×" button. That belongs to the future InputGroup, not the bare Input.

---

## Checkbox, Radio Group and Switch (`src/components/forms/{checkbox,radio-group,switch}`)

**Rule:** the three controls follow Figma's "Checkbox" (`662:123`), "Radio Button" (`662:157`) and "Switch" (`295:2020`) sets, with these decisions (2026-10-20):

- **Colors:**
  - **Checkbox and radio:** `foreground` border on `background` with `shadow-xs`; when selected, `neutral` (`tone/neutral/neutral`), with a `neutral-foreground` checkmark (`tone/neutral/on-neutral`). Designer change 2026-10-20: they used brand (`primary`) before.
  - **Disabled:** `foreground-subtle` border and `shadow-sm`, as Figma draws it. Selected + disabled isn't drawn, so it fades to 50%.
  - **Switch:** `neutral` when on (brand before 2026-10-20), `input` when off, and a `background` thumb with `shadow-sm`.
- **Focus and error aren't in Figma.** Focus uses Button's ring (`ring-2 ring-ring ring-offset-2 ring-offset-background`), not Input's 3px `ring-outside` halo: the halo is gray-200 (about 1.3:1 on white) and too faint next to a dark border. Error uses Input's `destructive` border.
- **Option labels:** Figma's option label is regular weight (`sm/sm`) and turns `muted` when its control is disabled. A field label is medium weight and stays `foreground`. `Label` tells them apart with `peer`: the control comes first and has `peer` plus its `data-slot`. Keep the `peer-data-[slot=…]` rules in `label.tsx` in sync when adding a control.
- **Whole-pixel sizes for scaled Figma drawings:**
  - **Small Switch:** Figma scales it to 0.8× (28.8 × 16 track, 12.8px thumb, 1.6px padding). UCL uses 28 × 16, a 12px thumb and 2px padding.
  - **Radio dot:** 10px (Figma 10.2px).

These are scaling artifacts, not design values; DESIGN.md's literal-spacing rule doesn't apply.
- ✅ **Resolved in Figma (2026-10-20):**
  - **Disabled border:** the stale `base/dimmed` became `foreground/subtle` (same value).
  - **Shadows:** `shadow 5` became `shadow/sm`. The missing `shadow-default` style, the stale `shadow 10` and the unbound Checkbox shadows became the local `shadow-xs` style.
  - **Switch thumbs:** every thumb now uses `shadow-sm`.
  - **Check:** a census found 0 stale bindings in the three sets.

---

## Typography specs live in three places (`typography.tsx`, `typography.mdx`, `foundations/typography.mdx`)

**Rule:** the full typography spec (fonts, every size with its line height, the weight scale and base weight, heading defaults, page title, the color rule) is written out in:

1. the spec comment at the top of `src/components/typography/typography.tsx`;
2. Storybook "Typography/Typography" (`src/components/typography/typography.mdx`);
3. Storybook "Foundations/Typography" (`src/docs/foundations/typography.mdx`), whose tables are generated from `theme.css`.

Any change to a type token (`--text-*`, `--font-weight-*`, `--font-*`) or to `typographyHeadings` updates all three in the same change. So does this file, where the change is a decision ("Font weight scale", "Heading element → Typography pairing").

**Why:** typography values are read in three places: by developers in the code, by designers and developers in Storybook, and by the Foundations page generated from tokens. A value changed in `theme.css` alone leaves the hand-written tables in the other two quietly wrong, as nearly happened with the weight change of 2026-10-20.

**How to apply:** after editing a type token, search for its old value in the three files above and update every table. The Foundations tables regenerate on their own; the component's comment and MDX tables don't.

---

## Font weight scale (`src/styles/theme.css`)

**Rule:** UCL's weights are lighter than Tailwind's from `light` to `bold`:

| Utility | Tailwind default | UCL | Typography `weight` |
| --- | --- | --- | --- |
| `font-light` | 300 | **280** | |
| `font-normal` | 400 | **380** | `regular` |
| `font-medium` | 500 | **480** | `medium` |
| `font-semibold` | 600 | **580** | `semibold` |
| `font-bold` | 700 | **680** | `bold` |
| `font-extrabold` | 800 | 800 | |
| `font-black` | 900 | 900 | `black` |

`body` uses the normal weight (`font-weight: var(--font-weight-normal)` in `theme.css`'s base layer), so all text inherits 380 at every size unless a `font-*` utility is set. The `--text-*` sizes don't set a weight. Inside a bold parent, text inherits bold, as normal CSS does.

**Why:** product decision (2026-10-20). Geist's standard weights read heavy in the UI, so each step from normal to bold is lighter than Tailwind's, and light is 20 lighter (280). Revised 2026-10-28 from 350/450/550/650 to 380/480/580/680 (20 lighter than Tailwind's instead of 50): the first scale read too thin. `light` stays 280. Geist is a variable font, so these are real weights, not fallbacks.

**How to apply:**

- Use the named utilities (`font-medium`, `font-bold`) or Typography's `weight`. Never write `font-[500]` or `font-[700]` to get Tailwind's values back.
- Regular text needs no class: it inherits 380 from `body`. Add `font-normal` only to reset a bolder parent.
- Changing one step changes every component that uses it: Button (`font-medium`), Label, FieldLegend, the Typography headings (`font-bold`). Check them in Storybook.
- ⚠️ **Constraint:** apps must load Geist as a variable font (`wght@100..900`), as Storybook does in `.storybook/preview-head.html`. A static weight list would round 280, 380, 480, 580 and 680 to the nearest loaded weight.
- ⚠️ **Constraint:** `theme.css` ships to consumers, so the apps' own `font-normal`/`medium`/`semibold`/`bold` change too, and all their unstyled text becomes 380.
- ✅ **Resolved in Figma (2026-10-20):** the weights live in `semantic` → `font-weight/light` … `/black` (scope: font weight), so each product's mode can set its own. Archie and Archie-dark were set to 280, 350, 450, 550, 650, 800 and 900; Itopia and itopia-dark keep the standard 300–900. They moved from `primitives` → `font-weight/*`, which were deleted after their only users (the three `7xl` styles) were rebound. Figma renders them through Geist's variable `wght` axis.
- ⚠️ **Gap:** since 2026-10-28 `theme.css` is 380 / 480 / 580 / 680 for normal to bold, and Figma's Archie and Archie-dark `font-weight/normal` … `/bold` are still 350 / 450 / 550 / 650. Update them in Figma so designs and code render the same weight.
- **Sync:** `semantic` → `font-weight/<name>` (Archie mode) maps to `--font-weight-<name>` in `theme.css`. Compare them on every token sync, like the colors.
- ✅ **Resolved in Figma (2026-10-20):** all 55 text styles are Geist and bind their family (`semantic` → `font-family/bodytext` for xs–xl, `/headline` for 2xl–7xl), size, line height and paragraph spacing (`primitives` → `font-size/*`, `line-height/*`, `paragraph-gap/*`) and weight (`semantic` → `font-weight/*`). They render UCL's weights in the Archie modes, and the `2xl` styles moved from 24/36 to 24/32. 45 unstyled Input text layers were given their matching style, and the set has 0 stale bindings. The `7xl` styles moved off `font-family/font`, which resolves to the literal "String value" in the Itopia modes.

---

## Tooltip: no arrow, motion from the trigger (`src/components/overlays/tooltip/tooltip.tsx`)

**Rule:** Tooltip follows Figma's "Tooltip" (`archielabs.ds`, Feedback page, node `1172:2290`) on shadcn's structure, with three differences from shadcn:

- **No arrow:** Figma draws none. Because of that, `sideOffset` defaults to 4px (shadcn uses 0, with the arrow as the gap). ⚠️ **Decision needed:** Figma doesn't specify the gap; 4px is a placeholder.
- **Motion from `src/lib/motion`, not `tw-animate-css`:** the surface is a `motion.div` that fades in and moves `motionDistance.subtle` from the trigger's side with `enterTransition`. Reduced motion keeps only the fade. Radix unmounts it on close, so the exit is instant.
- **Sizes:** Figma Medium → `size="default"` (`sm/sm`, 6 × 14 padding), Small → `size="sm"` (`xs/xs`, 4 × 8). Colors are `foreground` / `background`, so the tooltip inverts in dark mode.

✅ **Resolved in Figma (2026-10-20):** the corner radius was bound to the old `radius/rounded-md` and now uses `semantic` → `radius/menu/container` (6px).

**How to apply:** wrap the app once in `TooltipProvider`. Put interactive triggers in `TooltipTrigger asChild`. The tooltip becomes the trigger's accessible description, so it should say what the control does, not repeat its label.

---

## Segmented Control: Figma's MainNav on shadcn Tabs (`src/components/navigation/segmented-control/segmented-control.tsx`)

**Rule:** SegmentedControl follows Figma's "MainNav" (`archie.ds`, page "Main Navigation", node `21:381`) on shadcn's Tabs structure and API. Figma builds it from library Buttons (md · 32), so the item states come from the Button set:

- **Shape (Figma update 2026-10-28):** the row is a white pill (`background`, `rounded-full`) with no border, and every item is a pill too. The old 8px corners and the inside border are gone, and so is the stacking rule that put the selected fill over the border.
- **Selected:** Button Solid with its fill overridden, a pill. The fill is an indicator element, not the trigger's background (see Motion).
- **Selected fill (Figma update 2026-10-29):** a subtle top-to-bottom linear gradient, from a lighter gray into `tone/neutral/neutral` → `neutral`. Figma's stops are raw, not variables: the bottom (#31373f) is gray-700, `neutral` itself; the top (#626262) has no token. Code makes the top `neutral` mixed 24% with white in oklab (`from-[color-mix(in_oklab,var(--neutral)_76%,white)] to-neutral`), which lands on the same lightness, so it stays on the token and dark mode (where `neutral` is light) gets the same lift. `bg-neutral` stays underneath as the fallback. ⚠️ **Gap:** bind the stops to variables in Figma (the top stop needs a new one in `archielabs.ds` `semantic`, not `archie.ds`).
- **Unselected:** Button Outlined · Neutral with the stroke, shadow and fill removed: transparent on the row's `background`, label `foreground`, icon `icon`. Hover is `states/hover` → `accent`, a pill. Disabled is `foreground/subtle` → `foreground-subtle`, icon `icon-subtle` (same value; the Button set hides its icon layers, so the icon binding couldn't be read).
- **Stacking:** bottom to top, an unselected item's hover fill, the selected fill (`z-10`), then every label and the focus outline (`z-20`, on the trigger's label span). Labels stay readable while the fill glides over them.
- **Motion:** the selected fill is one indicator per control, shared through `layoutId` (MOTION.md "Tabs", the Connect pattern, `layoutSpring`). It glides to the newly selected item. The labels fade to their new color over `motionDuration.normal`, about the time the fill takes to arrive, so the new label isn't white on white. Under reduced motion both are near-instant. The `layoutId` is scoped with `useId()`, so two controls on one page never trade indicators.
- **Focus is an inset outline, keyboard only:** the list clips its children, so the library's offset ring would be cut off, and a `ring` (a box-shadow) would paint under the indicator. An outline on the label span (a pill) paints above it. Chrome matches `:focus-visible` on a mouse click here (Radix's roving focus), so the trigger marks itself `data-pointer-focus` on pointer down and clears it on any key press or blur; the outline needs `:focus-visible:not([data-pointer-focus])`. Same fix as intercept-ucl's Tabs. Don't swap it back to plain `focus-visible:`. Figma's Button set has no Focus state.
- **Selected label is `neutral-foreground`:** Figma binds the selected label and icon to `tone/brand/on-brand`, left over from the Solid · Brand Button. It has the same value as `tone/neutral/on-neutral` in both modes, and the pair follows the fill, as Checkbox does.
- **Spacing:** 12px on both sides (8 item + 4 icon padding on the left, 8 label + 4 item padding on the right), 5px between icon and label (4 + 8 padding, −7 margin). The same 12px without an icon.
- **Shadow:** Figma's is an unbound drop shadow, 0 0 8px black at 8%, with no effect style. It's written literally, `shadow-[0_0_8px_0_oklch(0_0_0/8%)]`, decision 2026-10-28.

⚠️ **Gap:** the shadow needs an effect style (or a `semantic` shadow variable) in `archielabs.ds`. Until then it doesn't change in dark mode, where the rest of the `shadow-*` scale gets darker. When it exists, add it to the `shadow-*` scale and swap the literal.

✅ **Resolved:** the MainNav frame's fill now binds the `semantic` `background/background`, and the old `colors/form/border` stroke is gone.

✅ **Confirmed in Figma (2026-10-28 resync):** fill, pill shape, item padding, selected fill and label colors, text and shadow all match the code; nothing changed.

ℹ️ Figma's MainNav doesn't clip its content; the code's `overflow-hidden` on the list looks the same, since every item is a pill inside the pill.

**How to apply:** give `SegmentedControlList` an `aria-label`. Use `SegmentedControlContent` when each item owns a panel; leave it out when the control only switches a value. Don't add a `variant` or `size` until Figma has one.

---

## InputGroup: shadcn's structure, Input's skin (`src/components/forms/input-group/input-group.tsx`)

**Rule:** InputGroup follows shadcn's current `input-group.tsx` for structure, props and alignment. Its look comes from UCL Input, not from shadcn: the group draws Input's border, fill, `shadow-xs`, radius and every state, and the control inside (`InputGroupInput` / `InputGroupTextarea`) drops its own in every state, read-only and invalid included.

- **States come from the control**, read with `has-[[data-slot=input-group-control]…]`: hover `input-ring`, focus `ring` border plus the 3px `ring-outside` ring, `aria-invalid` red border and `destructive-subtle` fill, read-only and disabled `input-disabled` border and `background-subtle` fill. These match Input's exactly; change both together.
- **The classes are written out in full.** Tailwind finds classes by reading the source, so a selector built with a template string (`has-[${control}…]`) produces no CSS and fails silently.
- **Differences from shadcn:** no `dark:bg-input/30` (Input has no such fill); `InputGroupInput` is `h-full`, so it fits inside the border instead of overflowing it by 2px; a click on an addon focuses a textarea too, not only an input; `InputGroupText` styles direct-child icons only ("Composed components are black boxes"); an addon's own `onClick` still runs.

ℹ️ No Figma "Input group" component exists yet. If one is added to `archielabs.ds`, sync this against it.

---

## PromptComposer: Figma's prompt-composer on InputGroup (`src/components/forms/prompt-composer/prompt-composer.tsx`)

**Rule:** PromptComposer follows Figma's "prompt-composer" (`archie.ds`, node `29:2778`). It owns the text, Enter to send and the Send button. The app owns the other controls in the row (attach, model, mic) and passes them in as `PromptComposerButton`s.

- **Frame:** InputGroup with Figma's 12px radius (`rounded-xl`, Tailwind's 12px; Figma's value is unbound) and 12px padding, and 8px between the text and the row. Figma's stroke is drawn inside and doesn't count in the layout, so the content sits 12px from the outer edge; the CSS border puts it 13px in, the same as Input. The box is 106px tall where Figma's is 108.
- **Text:** two lines (40px) when empty, then it grows with its content. Cap it with `max-h-*` on `PromptComposerTextarea`: Figma doesn't show a cap. Placeholder `muted-foreground`. Figma's text style binds the old `typography/*` variables at weight 400; UCL keeps body weight 380, as Input does.
- **Enter sends, Shift+Enter adds a line.** Enter that confirms an IME composition doesn't send. The message is trimmed; an empty one doesn't send. When uncontrolled, the box clears itself after sending.
- **Send and voice:** decision 2026-10-28. Figma shows only the empty state, with a voice button. With `onVoice` set, an empty box shows voice mode ("Start voice mode", `AudioLines`); once there's text, the same button becomes Send (`ArrowUp`). Without `onVoice`, an empty box shows Send with `aria-disabled`, focusable but inactive (see Button). `pending` shows Button's pending state on Send and blocks Enter.
- **Stop and queue (`onStop`):** decision 2026-10-29, from Figma Archie-App "Queue" frames (not `archie.ds`; prds/chat-behavior-system.md rule 7). While Archie works, the app passes `onStop`: an empty box shows Stop (a filled 12px square: solid, it reads larger than the 16px line icons beside it); with text, Send becomes "Add to queue" (`CornerDownRight`) with a smaller outline Stop before it. Submitting still calls `onSubmit`; the app queues the message. It replaces the earlier "Stop is a separate control" rule, because Figma puts Stop in Send's place.
- **Slash commands (`commands`):** decision 2026-10-29: the same interaction as intercept-ucl's ChatComposer (its DESIGN.md "ChatComposer"), so the two products' composers behave alike. Figma's placeholder already says "type / for options". "/" at the start of the message, or the slash button (`PromptComposerCommands`: Figma's 32px Ghost icon button with lucide `square-slash`, 5px after attach, `accent` while the menu is open; archie.ds `51:6099`, Figma update 2026-10-29), opens the commands menu above the box: the menus' surface (`popover`, `border`, `rounded-lg`, `shadow-xl`, 4px padding), max 256px tall, fading and rising in like menus (`motionScale.popIn`, `motionDistance.subtle`, `enterTransition`). Items show "/name" medium (never wrapping) and the description, when there is one, xs `muted-foreground`; the active one is `accent`. Commands with a different `group` are separated by a 1px `border` divider (not an option, so the keyboard skips it); Archie's prototype shortcuts come first, without descriptions, under the title "Preview interactions", with the divider between them and Archie's commands (`commandGroups`, xs medium `muted-foreground`; decision 2026-10-29). It filters by what's typed after the slash; ↑ ↓ move, Enter or Tab picks, Escape closes it without closing anything around the composer. Picking writes "/name " into the message (replacing the command being typed, or before the text there); acting on it is the app's job. The field is a combobox over the listbox (`aria-activedescendant`). ⚠️ **Gap:** the menu isn't in Figma; add it to `archie.ds`.
- **The button grows in when it changes role** (voice → Send, Stop → Add to queue): Motion's Swap pattern (`iconSwapVariants`) on the whole button, not on first render. Decision 2026-10-29.
- **Colors:** Send and Add to queue are `brand` (decision 2026-10-29: the button that sends stands out once there's something to send). Voice and Stop are `tone/neutral/neutral` → `bg-neutral` with a `neutral-foreground` icon (Figma binds `on-brand`, the same value; see Segmented Control). The row's buttons use `icon/foreground` → `text-icon`. The border binds the old `colors/form/input`; UCL uses `input`, as for MainNav.

⚠️ **Gap:** the solid buttons' hover mixes their fill with black (neutral 80%, brand 85%), following Button's solid variants. Figma has no hover for it; confirm it in Figma.

✅ **Resolved:** the mic is Button `outline` with its `shadow-xs` since the 2026-10-28 Button sync. InputGroupButton no longer adds shadcn's `shadow-none`.

⚠️ **Gap:** the model picker ("Default ⌄") is a stand-in in the stories until Select or DropdownMenu exists.

**How to apply:** give the textarea a `placeholder` and an `aria-label`, and every `PromptComposerButton` an `aria-label`. Put `PromptComposerSubmit` last in the footer's right-hand group.

---

## PromptAlert: Figma's prompt-alert (`src/components/feedback/prompt-alert/prompt-alert.tsx`)

**Rule:** PromptAlert follows Figma's "prompt-alert" (`archie.ds`, node `51:6098`), with shadcn Alert's parts (decision 2026-10-29). It's Archie asking permission before a consequential action (progress PRD FR-09).

- **Frame:** `background`, a 1px `foreground` border (dark on purpose: the one card in the thread that needs a decision), 12px corners (`rounded-xl`) and padding, Figma's effect "shadow-sm", whose values (0 1px 2px) are UCL's `shadow-xs`.
- **Title:** lucide `hand` at 14px, flipped to point right as Figma draws it, 4px before the label, both `tone/destructive/destructive`, 14/20 regular (Figma's weight 400, not shadcn AlertTitle's medium).
- **Description:** 14/20 `foreground`, 4px under the title. **Actions:** right-aligned, 8px apart, 8px under the description: Deny `outline`, Allow `neutral` (see Button), both `sm` · 28.
- **Accessibility:** `role='alert'` (shadcn's), so it's announced once when it appears.

**How to apply:** put the decision's consequence in the description, so Allow is an informed choice. **In the Archie chat (decision 2026-10-29):** a waiting request sits on top of the composer, covering it: bottom-aligned with it, centered and as wide as it, sliding up (`slideUpVariants`) when Archie asks. A taller prompt extends up over the end of the thread. The composer under it is `inert` until the person decides. It isn't in the thread while it waits. Deciding sends the choice; the prompt leaves, and the thread keeps one line: "Asked permission: Remove Cart & Checkout · Denied".

---

## Chat panel, ChatMessage and ActivityIndicator (`src/components/data-display/chat-{panel,message}`, `src/components/feedback/activity-indicator`)

**Rule:** Figma's "chat-composer" (`archie.ds`, node `29:2886`) is split into three components, decision 2026-10-28. `ChatPanel` is the frame with header, body and footer slots, like Topbar. `ChatMessage` is the person's bubble. `ActivityIndicator` is the "Thinking…" row, the PRD's Component A (`prds/conversational-progress-feedback.md`). PromptComposer goes in the footer.

- **Panel:** 16px corners (`rounded-2xl`, Tailwind's 16px; Figma's value is unbound), `form/border` → `input`, the "Shadow Prompt" effect style → `shadow-prompt` (a new token), and a fill from `background` to `background-subtle`, starting at 60.675% as in Figma. The header is 48px, `background`, 16px left and 8px right padding, with a bottom border. The body has 16px padding and 16px between messages, scrolls, and is a `log` live region. The footer insets the composer by 8px. ChatPanel's category is `data-display`, next to ChatMessage; nobody chose it explicitly, so move it if a better home appears.
- **ChatMessage:** `bg-info-subtle`, `foreground`, 12px × 8px padding, Figma's unbound 10px corners with a square bottom right (`rounded-[10px] rounded-br-none`), right-aligned. Figma binds `palettes/catalina/50` (#edf2ff), a palette Archie's modes don't declare; `info-subtle` (info-50) is the nearest token, decision 2026-10-28. Long messages wrap at 85% of the thread (not in Figma) and keep their line breaks.
- **ActivityIndicator:** a 14px brand icon (a bouncing ball), 6px gap, `text-sm` label. Decision 2026-10-29, replacing 2026-10-28's still icon and 3:1 highlight:
  - **All Motion:** every part of the effect, including the gradient fill and the 3D perspective, is set by Motion variants (`src/lib/motion/`), not CSS classes. Decision 2026-10-29.
  - **Label:** a highlight sweeps across it (`pendingTextVariants`, 2s, linear, looping), fading to 15% of the label's color mixed with `background`, as Figma's brand → white → brand does. Letters drop well below 3:1 while the highlight passes over them; this was chosen knowingly, to match the reference. The words are still announced (`role='status'`), and each letter is solid brand most of the time.
  - **Icon (decision 2026-10-29, replacing the spoke icon):** a 6px ball bouncing on a floor, with real physics (`pendingBallVariants`, one bounce per `motionDuration.pendingBounce`, 0.72s). It falls under gravity, speeding up (a quadratic ease-in, the curve of free fall), squashes on contact (70% tall, 130% wide, about the same area), springs off and rises slowing down (a quadratic ease-out), stretched a little (110% tall, 92% wide) while it's fastest. It rises 6px (`motionDistance.bounce`), so the bounce fills the 14px box. Plain 2D transforms, so it stays sharp. **One activity icon (decision 2026-10-29):** the ball is exported as `ActivityIndicatorIcon` and used wherever Archie shows activity: running steps and the file being written bounce it in their line's color, and "Thought for Ns" shows it at rest, a plain gray dot centered on the text. No shadow (decision 2026-10-29). No spinners elsewhere in the chat.
  - **Reduced motion:** the icon is still and the label is solid brand. It's `role='status'`: change its children to update it in place (PRD FR-02), never add a second one.
- **Scrollbar (decision 2026-10-29):** the thread uses `scrollbar-soft` (theme.css): a thin scrollbar, its thumb `icon-muted` at 70% opacity on a clear track, so it reads softer than the browser's default. Safari gets the same through `::-webkit-scrollbar` (6px, round).
- **Resizable in the Archie layout (decision 2026-10-29, not in Figma):** the 2px gap between the chat and the canvas is a drag handle (`ChatResizeHandle`, `src/layouts/archie/project/parts.tsx`): an 8px hit area, `col-resize` cursor, a 4 × 40px `icon-muted` grip on hover, while dragging or on keyboard focus. Width 440px by default (Figma), 320–720px, the canvas keeps at least 480px; ← → step 16px, Home / End jump to the limits, double-click resets. ChatPanel's width transition is off while dragging, so the panel follows the pointer. Hidden while collapsed.
- **Header text:** Figma's chat name is raw black (unbound); UCL uses `foreground`.
- **Collapsed and expanded (Figma `State`, added 2026-10-28):** collapsed, the panel is a 32px rail with the same frame (corners, border, fill, shadow) and the Archie mark centered: an 18px `brand` circle (`colors/brand/archie`) with the white logomark. The API is shadcn Sidebar's: `open`, `defaultOpen`, `onOpenChange`, `data-state='expanded' | 'collapsed'`. `ChatPanelTrigger` (Figma's `panel-left` header button) collapses it; the whole rail is one button, `ChatPanelRail`, that expands it. The app's width for the open panel (e.g. `w-110`) loses to `data-[state=collapsed]:w-8`, so apps don't switch widths themselves. Hovered, the collapsed rail widens to 36px at `motionDuration.fast` (not in Figma; decision 2026-10-29), and whatever sits beside it follows. Header, thread and composer stay mounted and are hidden while collapsed, so a draft and the scroll position survive. The Archie mark is the app's (a child of the rail), not built into ChatPanel.

⚠️ **Gap:** the PRD lists Default, Completed and Failed states for the activity indicator; Figma shows only Active. Add them when Figma has them. Archie's own replies have no Figma either, so ChatMessage has no variant for them.

- **Header actions (Figma update 2026-10-28):** 28px ghost buttons (`icon-sm`) with 16px icons, 2px apart. The history button uses archie.ds's "history, time" glyph, not lucide's (`src/layouts/archie/project/icons.tsx`). `ChatPanelTrigger` is the third one.

⚠️ **Gap:** these are archie.ds's own "Button / Icon" set (Size=Smaller, 6px corners, 16px icons), not the master Button. UCL draws them with Button `icon-sm` (8px corners, so the icon is set to `size-4`). Move them to the master Button in Figma, or confirm the 6px corners.

⚠️ **Gap:** the chat switcher ("{current-chat} ⌄") and the model picker are stand-ins in the stories until DropdownMenu or Select exists.

- **Collapse and expand motion (2026-10-28):** the width is a CSS transition (`motionDuration.normal`, `standardTransition`'s curve), as in shadcn's Sidebar, so whatever sits beside the panel follows it frame by frame. A Motion `layout` animation would scale the panel and make its neighbors jump. Collapsing, the content fades out on `exitTransition` at `motionDuration.instant` while the panel narrows, then the rail fades in. Expanding, the rail goes, the panel widens, then the content fades in (`motionDuration.fast`, enter curve) once it has its full width, so no reflow is visible. Content hides with `display: none` through `transition-discrete` and fades in from `@starting-style`. Transitions start with the first toggle (`data-animate`), so nothing fades on load; before that the parts are `transition-none`, because CSS transitions every property by default. Under reduced motion every step is near-instant (`reducedMotionTransition`). Timing lives in CSS variables set from `src/lib/motion` (`panelTiming`).
- **Hidden parts are `inert`:** the header, thread and composer while collapsed, the rail while expanded, from the first frame of the fade. Focus and screen readers never reach a half-hidden part, and only one control is "Expand chat" at a time.
- **Collapse icon:** `panel-left-alt` (archielabs.ds icon, node `6154:10308`) (a panel with its divider set in from the left), drawn inline in `ChatPanelTrigger` with `currentColor`. Not lucide's `panel-left`.

ℹ️ Figma has no hover for the rail; it has only the inset focus ring.

⚠️ **Gap:** the panel's border and the bubble still bind the old `tokens` library and a non-Archie palette. Rebind them in Figma.

**How to apply:** give `ChatPanel` an `aria-label`, and every icon-only header button an `aria-label`. Show one `ActivityIndicator` while Archie works and remove it when the reply starts streaming (PRD Component A).

---

## Topbar: a frame with three slots (`src/components/navigation/topbar/topbar.tsx`)

**Rule:** Topbar follows Figma's "topbar" (`archie.ds`, node `26:528`). It draws only the frame and three areas; apps fill them. Don't add content props (`orgName`, `credits`…): a new action would mean a new prop.

- **Frame:** a `header` with no fill, 8px top, bottom and left padding, 12px right. With a 32px row inside, it's 48px tall.
- **Areas:** `TopbarStart` (6px gap) and `TopbarEnd` (12px gap, right-aligned) are both `flex-1` from zero width, so `TopbarCenter` sits in the middle of the padded area whatever the sides hold. The padding is uneven, so that's 2px left of the bar's middle, as in Figma. The Default story tests this. Figma's 4px gap between the action buttons belongs to the app's own button group, not to `TopbarEnd`.
- **No background (Figma update 2026-10-28):** the frame's fill is gone, so the bar shows the app's background. The Archie project page puts `bg-muted` behind it, and so do the stories. Before, Topbar painted `bg-muted` itself. Apps that relied on that need to set it on the page.

⚠️ **Gap:** parts of the Figma bar that UCL doesn't have yet are stand-ins in the stories, not exported: the Archie logo mark, the org and project switcher, Avatar, the credits meter and the bell's notification dot. Build each from its own Figma component, then replace the stand-in. The dot uses `bg-emphasis` (sky-500): Figma binds the old `colors/brand/accent-1` (#008cf7), which matches no token. Design decision 2026-10-28.

⚠️ **Gap:** the credits meter (Figma icon "credits", 16px, on the credits Button's left) is a pie: the track binds `background/muted`, and the green arc is a raw #00d659, unbound. The story uses Figma's SVG as is. Before it becomes a component that shows the real balance, bind the arc to a token (`success` is the nearest role) and decide what the pie measures (credits left of the plan's total?).

✅ **Resolved:** the action buttons are Button `outline` at `md` and `icon-md` (32px, 8px corners, 14px text, `shadow-xs`) since the 2026-10-28 Button sync, so the bar is 48px. Figma update 2026-10-28: the order is credits, MCP, GitHub, notifications, Share; the logo is an outlined 32px icon button with the brand Archie A (Figma "Button Archie"; the A is 16 × 18.44 since the third update that day); the org and project names are semibold; the notification dot sits 4px in from the corner. Second update the same day: the frame lost its fill, and the credits button gained the credits meter on its left ("397 credits").

⚠️ **Gap:** the notification dot's fill still binds the old remote `tokens` library (`colors/brand/accent-1`). Rebind it in Figma, as for MainNav.

✅ **Resolved:** the logo button ("Button Archie", 2026-10-28) now binds `colors/background/background`, `colors/input/border`, `radius/button/md` (8px) and `shadow-xs`, which are exactly Button `outline` at `icon-md`. The A is 16 × 18.44, centered (8px in from the left, 6.78px from the top).

⚠️ **Gap:** the A's fill is a raw #d83f37, not bound to a variable. The code uses `text-brand` (vermilion-500, #d8402f), the nearest token and a near-identical red, so it follows dark mode. Bind the glyph to `colors/brand/archie` in Figma.

⚠️ **Decision needed:** narrow screens. With the Archie project page's content (`src/layouts/archie/project`), the right-hand group was 373px and MainNav 458px, so below 1225px the right group slid under MainNav (the credits button disappeared at 1024). Measured before the credits pie and "397 credits" made the credits button wider, so the overlap now starts a little higher. It doesn't overflow the page, it overlaps to the left, so nothing flags it. Figma only has 1728. Options: drop button labels below a breakpoint, move credits and MCP into a menu, or let MainNav stop centering. Design the narrow topbar in Figma first.

**How to apply:** put SegmentedControl in `TopbarCenter`, and the project on the left. Give each icon-only button an `aria-label`. With more than one Topbar on a page (as in AllVariants), give each an `aria-label`.

---

## Heading element → Typography pairing (`src/components/typography/typography.tsx`)

**Rule:** `Typography` with `as="h1"`–`"h4"` and no `size`/`weight` renders these defaults (`typographyHeadings`):

| Element | `size` / `weight` | Figma text style | Metrics | Source |
| --- | --- | --- | --- | --- |
| `h1` | `2xl` / `bold` | `2xl/2xl -bold` | 24/32 | Figma description "h1, Modal Title" |
| `h2` | `xl` / `bold` | `xl/xl -bold` | 20/30 | ⚠️ Product decision (2026-10-20) |
| `h3` | `lg` / `bold` | `lg/lg -bold` | 18/28 | ⚠️ Product decision (2026-10-20) |
| `h4` | `base` / `bold` | `base/base -bold` | 16/24 | ⚠️ Product decision (2026-10-20) |

A **page title** is Figma's `3xl/3xl -bold` ("Page Title"). It's still the page's `h1`: write `<Typography as="h1" size="3xl">`. A modal title uses the plain `h1` default.

**Why:** Figma tags only `h1` and the page title. Without set defaults, every heading picks a plausible size by eye. bethere-ucl had an `h1` built at a "reasonable" `3xl` that turned out to be wrong against Figma. The levels below `h1` keep its bold weight and step down one size each, so the hierarchy comes from size alone.

**How to apply:**

- Write `<Typography as="h2">` and let the default apply. Pass `size`/`weight` only when a specific Figma frame binds something else; that value wins for that instance.
- Pick the element for meaning (heading level), not for looks. A small bold label that isn't a heading is `as="p"` or `"span"` with `weight="bold"`.
- Typography never sets color. Use a text token in `className`.
- ⚠️ **Decision needed (designer):** tag `xl/xl -bold`, `lg/lg -bold` and `base/base -bold` as h2, h3 and h4 in their Figma descriptions, so both sources agree.

ℹ️ Unlike bethere-ucl, there's no display font or per-size tracking. Every Archie text style is Geist with 0 letter spacing.

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
- Diff every mapped variable on each sync, in both modes, against the resolved `theme.css` value. The second 2026-10-15 sync checked 169 CSS tokens (259 token × mode values, primitives included): 0 color drift. The one change was `font-family/code`, which went from Roboto Mono to Geist Mono. The 2026-10-20 sync checked 257 color values (79 primitives, 89 semantic tokens per mode, shadcn aliases included) plus the type scale and font tokens: 0 drift, and no Figma `button` variables yet (see "Proposed for Figma" below).
- ℹ️ Two false alarms to skip on the next sync. `success-500` differs by 0.007 in red after the RGB round trip, but Figma's `#0dae52` converts to the same `oklch(0.657 0.178 150.15)` that `theme.css` has; it's 3-decimal oklch rounding on a saturated green. `icon/on-brand` maps to `--icon-on-brand`, not `--icon-foreground`, despite the `on-<tone>` naming rule: it's an icon role, not a tone.

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
| `--shadow-prompt` | Effect style "Shadow Prompt" | 0 6px 12px −2px in `shadow-color-sm`. Added 2026-10-28 for the chat panel |

### Deliberately not mirrored

- **Primitives as utilities:** only the 7 palettes the Archie modes reference (gray, vermilion, sky, info, success, warning, destructive) are declared, as `:root` variables. They aren't registered as Tailwind colors, so `bg-gray-100` stays Tailwind's gray. Components use semantic tokens. The other 15 palettes belong to other products' modes.
- **Typography:** Geist is shipped, from `semantic` → `font-family/headline` and `/bodytext`. The type scale comes from `primitives` → `font-size/*` and `line-height/*` (2xl = 24/32). All 55 text styles bind to these since 2026-10-20; before, 48 rendered Inter at old line heights through orphaned variables. `font-size/xxs` (11px) is skipped: it has no paired line height and no text style uses it.
- **Not synced yet:** `code/*` (syntax colors), `decorative/decorative-1`, `linear-1A/1B` (gradient stops), the `components` collection (`inbox-unread`, `chat-bubble`, `overlay`), the `radius/*` component radii other than `radius/button/*` (synced with Button 2026-10-28), the `Sonner` effect style, `paragraph-gap/*` and `breakpoint/width|height` (the artboard size, not a breakpoint). Add each with the component that needs it.
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
- `on-brand` is gray-950 on vermilion in dark mode. ⚠️ **Accessibility:** gray-950 text measures 4.18:1 on vermilion-500 and white measures 4.47:1, so both clear 3:1 for large text but neither reaches the 4.5:1 normal-text minimum. This affects light mode too: the primary button's white label is 4.47:1. The fix is proposed below.

### Proposed for Figma: Button colors that pass WCAG 2.2 AA (2026-10-20)

⚠️ **Decision needed:** apply in `archielabs.ds` (Archie and Archie-dark modes), then run `ucl-ds-sync`. Until Figma changes, UCL keeps today's values, so UCL and Figma stay in step. Proposed by the Button critique of 2026-10-20 (`.impeccable/critique/`).

**Today's labels fail the 4.5:1 normal-text minimum** (Button text is 14px medium, not large text):

| Button | Light | Dark |
| --- | --- | --- |
| Primary | 4.47 (hover 3.92) | 4.18 (hover 3.56) |
| Secondary | 3.87 | 1.94 (vermilion-500 on vermilion-700) |
| Destructive | 5.79 | 3.22 |

The `/90` and `/80` hover overlays lower contrast further. Primary and destructive fills also look like the same red: they are 1.30:1 apart, with about 1° of hue between them.

**Proposal.** Every pair below passes, and all of them use existing primitives:

| Button | Light | Dark |
| --- | --- | --- |
| Primary | white on vermilion-600 · 6.14 | gray-950 on vermilion-400 · 5.06 |
| Primary hover | white on vermilion-700 · 8.68 | gray-950 on vermilion-300 · 6.41 |
| Secondary | vermilion-600 on vermilion-50 · 5.32 | vermilion-100 on vermilion-700 · 6.02 |
| Secondary hover | vermilion-700 on vermilion-100 · 6.02 | vermilion-100 on vermilion-800 · 8.36 |
| Destructive | white on destructive-800 · 11.48 | white on destructive-700 · 8.22 |

- **Hover:** each hover is an explicit color step, not an opacity overlay, so hovering never lowers contrast.
- **Destructive stays solid, but darker, and always carries a warning icon.** Darkening it widens the gap from primary to 1.87:1 in light mode and 2.23:1 in dark mode. Vermilion and the destructive red share almost the same hue, so in light mode the icon does most of the work of telling them apart. Color is never the only signal.
- **Destructive dark label:** dark mode uses a white label, not `on-brand` (gray-950), because gray-950 on a dark red fails.

✅ **Resolved (2026-10-20): the brand color stays vermilion-500 for now.** Apply the proposal as Button-only variables in Figma and leave `tone/brand/*` unchanged. Brand icons, links and other brand uses keep vermilion-500. In the same sync, add the matching `--button-*` tokens to the map above, and point Button's variants at them instead of `--primary`, `--secondary` and `--destructive`.

ℹ️ The solid primary button will be one step darker than the brand color elsewhere (vermilion-600 in light mode, vermilion-400 in dark). That's the trade-off for passing contrast without changing the brand. Reopen this decision if the brand color itself changes later.

---

## Semantic tokens are declared on `:root, .dark` (`src/styles/theme.css`)

**Rule:** the Archie (light) semantic block uses the selector `:root, .dark`, not just `:root`. The `.dark` block after it overrides only the values that differ.

**Why:** many tokens are aliases, such as `--primary: var(--brand)`. A custom property's `var()` resolves on the element that declares it, and descendants inherit the result. If the aliases were declared only on `:root` and `.dark` were applied to a wrapper below `<html>` (a Storybook decorator, a dark section), `--primary` would keep the light brand values inside it. Redeclaring the aliases on `.dark` makes them resolve against the dark values there.

**How to apply:** add new semantic tokens to the `:root, .dark` block. Add them to `.dark` too only when the dark value differs. Keep `.dark` after the shared block, because both selectors have the same specificity. Primitives stay in plain `:root`.
