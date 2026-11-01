import * as React from "react";

/**
 * Docs-only blocks for the Foundations/Colors page. They read `theme.css` itself (passed in as raw text by the MDX
 * page), so a color token appears here as soon as it's added. Nothing to keep in sync.
 */

interface ColorToken {
	/** Tailwind color name, e.g. `brand-subtle` → `bg-brand-subtle`, `text-brand-subtle`. */
	name: string;
	/** The CSS value behind it, e.g. `var(--brand-subtle)`. */
	value: string;
}

interface ColorGroup {
	/** The comment above the group's first token in `@theme inline`, e.g. `Tones`. */
	title: string;
	tokens: ColorToken[];
}

/** The body of the first (or last) `<selector> {` block in `css`, or `""`. */
function readBlock(css: string, selector: string, which: "first" | "last" = "first") {
	const start = which === "first" ? css.indexOf(`${selector} {`) : css.lastIndexOf(`${selector} {`);
	if (start === -1) return "";
	return css.slice(start, css.indexOf("\n}", start));
}

/** `name → value` for every `--<name>: <value>;` declaration in a block. */
function readDeclarations(block: string) {
	const declarations = new Map<string, string>();
	for (const match of block.matchAll(/--([\w-]+):\s*([^;]+);/g)) declarations.set(match[1], match[2].trim());
	return declarations;
}

/** The `--color-*` tokens of `@theme inline`, grouped under the one-line comment above each run of them. */
function parseColorGroups(css: string): ColorGroup[] {
	const groups: ColorGroup[] = [];
	let title = "";
	for (const raw of readBlock(css, "@theme inline").split("\n")) {
		const line = raw.trim();
		const comment = line.match(/^\/\*\s*(.+?)\s*\*\/$/);
		if (comment) {
			title = comment[1];
			continue;
		}
		const declaration = line.match(/^--color-([\w-]+):\s*(.+?);/);
		if (!declaration) continue;
		if (groups.at(-1)?.title !== title) groups.push({ title, tokens: [] });
		groups.at(-1)!.tokens.push({ name: declaration[1], value: declaration[2] });
	}
	return groups;
}

/** `var(--gray-800)` → `gray-800`; a literal such as `oklch(0 0 0 / 2%)` is shown as given. */
const describe = (value: string | undefined) => value?.replace(/^var\(--([\w-]+)\)$/, "$1") ?? "";

function Swatch({ value, dark }: { value: string; dark?: boolean }) {
	// The outer border stays outside `.dark`, so both swatches share the page's light border. The fill re-resolves
	// inside `.dark`, where semantic tokens are redeclared (DESIGN.md "Semantic tokens are declared on `:root, .dark`"),
	// over that mode's own background, so translucent tokens (`muted`, `veil`, `highlight`) read as they do in an app.
	return (
		<div className='size-10 shrink-0 overflow-hidden rounded-md border border-border'>
			<div className={dark ? "dark size-full bg-background" : "size-full bg-background"}>
				<div className='size-full' style={{ background: value }} />
			</div>
		</div>
	);
}

/** Every semantic color token, grouped as in `theme.css`, with its Archie and Archie-dark values side by side. */
function ColorTokens({ css }: { css: string }) {
	const light = readDeclarations(readBlock(css, ":root,\n.dark"));
	const dark = new Map([...light, ...readDeclarations(readBlock(css, "\n.dark", "last"))]);
	return (
		<div className='sb-unstyled flex flex-col gap-10'>
			{parseColorGroups(css).map((group) => (
				<section key={group.title} className='flex flex-col gap-4'>
					<h3 className='text-lg font-semibold text-foreground'>{group.title}</h3>
					<div className='grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3'>
						{group.tokens.map((token) => {
							const cssName = token.value.match(/^var\(--([\w-]+)\)$/)?.[1] ?? token.name;
							return (
								<div key={token.name} className='flex items-center gap-2'>
									<Swatch value={token.value} />
									<Swatch value={token.value} dark />
									<div className='min-w-0 pl-1'>
										<div className='font-mono text-sm font-medium break-words text-foreground'>
											{token.name}
										</div>
										<div className='font-mono text-xs break-words text-muted-foreground'>
											{describe(light.get(cssName))}
											{dark.get(cssName) !== light.get(cssName) && ` · ${describe(dark.get(cssName))}`}
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</section>
			))}
		</div>
	);
}

/**
 * The primitive ramps in `:root` (`--gray-50` … `--gray-950`). They're CSS variables only, not Tailwind colors, so
 * there's no `bg-gray-100` for them: semantic tokens point at them.
 */
function PrimitiveRamps({ css }: { css: string }) {
	const families = new Map<string, { step: string; value: string }[]>();
	for (const [name, value] of readDeclarations(readBlock(css, ":root"))) {
		const match = name.match(/^(.*)-(\d+)$/);
		if (match) families.set(match[1], [...(families.get(match[1]) ?? []), { step: match[2], value }]);
	}
	return (
		<div className='sb-unstyled flex flex-col gap-5'>
			{[...families].map(([family, steps]) => (
				<div key={family}>
					<div className='mb-2 font-mono text-sm font-medium text-foreground'>{family}</div>
					<div className='flex gap-1'>
						{steps.map(({ step, value }) => (
							<div key={step} className='min-w-0 flex-1 text-center'>
								<div className='h-10 rounded-sm border border-border' style={{ background: value }} />
								<div className='mt-1 font-mono text-xs text-foreground'>{step}</div>
							</div>
						))}
					</div>
				</div>
			))}
		</div>
	);
}

export { ColorTokens, PrimitiveRamps };
