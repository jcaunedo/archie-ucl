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
- Apps load Geist as a variable font (`wght@100..900`, as CLAUDE.md "Consumer Integration" and `.storybook/preview-head.html` do), since UCL uses weights from 280 to 650 (DESIGN.md "Font weight scale"). A static weight set would fall back to the nearest loaded weight.
- Digits that line up in columns use `tabular-nums` per element. That's a typographic choice, not part of this rule.

⚠️ **Constraint:** `theme.css` ships to consumers, so every app's text renders this way, including text outside UCL components. `antialiased` makes text look slightly lighter on macOS: compare it with Figma before changing font weights to make up for it.

---

## Button: pending, focusable disabled and `type="button"` (`src/components/buttons/button/button.tsx`)

**Rule:** Button differs from shadcn's in four ways. A resync from shadcn must keep all of them:

- **`pending`** sets `aria-busy` and `aria-disabled`, keeps the button focusable, ignores clicks, and pulses the content with `pendingSurfaceVariants`. The label doesn't change, so the width doesn't either.
- **`aria-disabled="true"`** blocks clicks in `handleClick` but keeps focus, hover and the `not-allowed` cursor, so a tooltip can say why the button is unavailable. It works with `asChild` links too: `preventDefault` stops the navigation.
- **`type` defaults to `"button"`**, so a Button inside a form doesn't submit it. Pass `type="submit"` for the form's submit button.
- **The content is always wrapped in a `motion.span`** (except with `asChild`). The pulse needs it, and rendering it always keeps the DOM stable when `pending` toggles.

**Why:** the critique of 2026-10-20 found that a double click on "Generate" fired twice, a disabled "Continue" couldn't be focused to explain itself (sign-in spec), and a Button in a form submitted it. Archie's AI actions all start from a Button, so it owns the pending state instead of each app building its own.

**How to apply:**

- Use `pending` for work the button started. Use `disabled` only when the button is truly unavailable and needs no explanation. Use `aria-disabled` when it needs one (a tooltip or helper text).
- During generation, show a separate Stop button next to the pending one. Button doesn't swap itself into Stop, because Stop is a different action with its own handler.
- Hovers are written `hover:not-aria-disabled:…`, so blocked buttons don't react. Keep that form when adding a variant.
- To truncate a long label, wrap its text in `<span className='truncate'>`. The button stops at its container's width (`max-w-full`).
- ℹ️ The `motion.span` makes Button a client component. If the apps use React Server Components, the build needs the `"use client"` step (CLAUDE.md → "Stack").

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
| `font-normal` | 400 | **350** | `regular` |
| `font-medium` | 500 | **450** | `medium` |
| `font-semibold` | 600 | **550** | `semibold` |
| `font-bold` | 700 | **650** | `bold` |
| `font-extrabold` | 800 | 800 | |
| `font-black` | 900 | 900 | `black` |

`body` uses the normal weight (`font-weight: var(--font-weight-normal)` in `theme.css`'s base layer), so all text inherits 350 at every size unless a `font-*` utility is set. The `--text-*` sizes don't set a weight. Inside a bold parent, text inherits bold, as normal CSS does.

**Why:** product decision (2026-10-20). Geist's standard weights read heavy in the UI, so each step from normal to bold is 50 lighter, and light is 20 lighter (280). Geist is a variable font, so these are real weights, not fallbacks.

**How to apply:**

- Use the named utilities (`font-medium`, `font-bold`) or Typography's `weight`. Never write `font-[500]` or `font-[700]` to get Tailwind's values back.
- Regular text needs no class: it inherits 350 from `body`. Add `font-normal` only to reset a bolder parent.
- Changing one step changes every component that uses it: Button (`font-medium`), Label, FieldLegend, the Typography headings (`font-bold`). Check them in Storybook.
- ⚠️ **Constraint:** apps must load Geist as a variable font (`wght@100..900`), as Storybook does in `.storybook/preview-head.html`. A static weight list would round 280, 350, 450, 550 and 650 to the nearest loaded weight.
- ⚠️ **Constraint:** `theme.css` ships to consumers, so the apps' own `font-normal`/`medium`/`semibold`/`bold` change too, and all their unstyled text becomes 350.
- ✅ **Resolved in Figma (2026-10-20):** the weights live in `semantic` → `font-weight/light` … `/black` (scope: font weight), so each product's mode can set its own. Archie and Archie-dark are 280, 350, 450, 550, 650, 800 and 900, the same as `theme.css`; Itopia and itopia-dark keep the standard 300–900. They moved from `primitives` → `font-weight/*`, which were deleted after their only users (the three `7xl` styles) were rebound. Figma renders them through Geist's variable `wght` axis.
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

### Deliberately not mirrored

- **Primitives as utilities:** only the 7 palettes the Archie modes reference (gray, vermilion, sky, info, success, warning, destructive) are declared, as `:root` variables. They aren't registered as Tailwind colors, so `bg-gray-100` stays Tailwind's gray. Components use semantic tokens. The other 15 palettes belong to other products' modes.
- **Typography:** Geist is shipped, from `semantic` → `font-family/headline` and `/bodytext`. The type scale comes from `primitives` → `font-size/*` and `line-height/*` (2xl = 24/32). All 55 text styles bind to these since 2026-10-20; before, 48 rendered Inter at old line heights through orphaned variables. `font-size/xxs` (11px) is skipped: it has no paired line height and no text style uses it.
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
