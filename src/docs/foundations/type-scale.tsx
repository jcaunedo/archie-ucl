/**
 * Docs-only blocks for the Foundations/Typography page. Sizes and font stacks come from `theme.css` (passed in as raw
 * text by the MDX page), so a new `--text-*` token appears here as soon as it's added.
 */

const SAMPLE = "Clarity before code";

/** `name → value` for every `--<prefix>-*` declaration in `css`, e.g. `text-sm` → `0.875rem`. */
function readTokens(css: string, prefix: string) {
	const tokens = new Map<string, string>();
	for (const match of css.matchAll(new RegExp(`--${prefix}-([\\w-]+):\\s*([^;]+);`, "g"))) {
		tokens.set(match[1], match[2].trim());
	}
	return tokens;
}

const toPx = (rem: string) => (rem.endsWith("rem") ? `${parseFloat(rem) * 16}px` : rem);

/** Tailwind's default weights. `theme.css` overrides some of them (`--font-weight-*`); the rest keep these values. */
const TAILWIND_WEIGHTS = [
	["light", 300],
	["normal", 400],
	["medium", 500],
	["semibold", 600],
	["bold", 700],
	["extrabold", 800],
	["black", 900],
] as const;

const cell = "border-b border-border py-3 pr-4 align-middle";
const head = `${cell} text-xs font-semibold text-muted-foreground`;

/** One row per `--text-*` size: its utility, px size / line height, and a sample. */
function TypeScale({ css }: { css: string }) {
	const text = readTokens(css, "text");
	const sizes = [...text].filter(([name]) => !name.includes("--"));
	return (
		<table className='sb-unstyled w-full border-collapse text-left text-sm' style={{ tableLayout: "fixed" }}>
			<colgroup>
				<col style={{ width: 96 }} />
				<col style={{ width: 160 }} />
				<col />
			</colgroup>
			<thead>
				<tr>
					<th className={head}>Utility</th>
					<th className={head}>Font size / line height</th>
					<th className={head}>Sample</th>
				</tr>
			</thead>
			<tbody>
				{sizes.map(([name, size]) => {
					const lineHeight = text.get(`${name}--line-height`);
					return (
						<tr key={name}>
							<td className={`${cell} font-mono`}>text-{name}</td>
							<td className={`${cell} font-mono whitespace-nowrap text-muted-foreground`}>
								{toPx(size)} / {toPx(lineHeight ?? "")}
							</td>
							<td className={`${cell} text-foreground`}>
								{/* Inline values: a `text-${name}` class built at runtime isn't one Tailwind can find and generate. */}
								<span className='block truncate' style={{ fontSize: size, lineHeight }}>
									{SAMPLE}
								</span>
							</td>
						</tr>
					);
				})}
			</tbody>
		</table>
	);
}

/** One row per font weight: its utility, UCL's value (from `--font-weight-*` in `theme.css`), Tailwind's, and a sample. */
function FontWeights({ css }: { css: string }) {
	const overrides = readTokens(css, "font-weight");
	return (
		<table className='sb-unstyled w-full border-collapse text-left text-sm' style={{ tableLayout: "fixed" }}>
			<colgroup>
				<col style={{ width: 160 }} />
				<col style={{ width: 80 }} />
				<col style={{ width: 120 }} />
				<col />
			</colgroup>
			<thead>
				<tr>
					<th className={head}>Utility</th>
					<th className={head}>UCL</th>
					<th className={head}>Tailwind default</th>
					<th className={head}>Sample</th>
				</tr>
			</thead>
			<tbody>
				{TAILWIND_WEIGHTS.map(([name, tailwind]) => {
					const value = Number(overrides.get(name) ?? tailwind);
					const changed = value !== tailwind;
					return (
						<tr key={name}>
							<td className={`${cell} font-mono`}>font-{name}</td>
							<td className={`${cell} font-mono ${changed ? "text-foreground" : "text-muted-foreground"}`} style={{ fontWeight: changed ? 650 : undefined }}>
								{value}
							</td>
							<td className={`${cell} font-mono text-muted-foreground`}>{changed ? tailwind : "same"}</td>
							<td className={`${cell} truncate text-base text-foreground`} style={{ fontWeight: value }}>
								{SAMPLE}
							</td>
						</tr>
					);
				})}
			</tbody>
		</table>
	);
}

/** The `--font-sans` and `--font-mono` stacks, each with a sample in its own family. */
function FontFamilies({ css }: { css: string }) {
	const families = readTokens(css, "font");
	return (
		<table className='sb-unstyled w-full border-collapse text-left text-sm' style={{ tableLayout: "fixed" }}>
			<colgroup>
				<col style={{ width: 120 }} />
				<col style={{ width: 320 }} />
				<col />
			</colgroup>
			<tbody>
				{["sans", "mono"].map((name) => (
					<tr key={name}>
						<td className={`${cell} font-mono`}>font-{name}</td>
						<td className={`${cell} font-mono text-xs text-muted-foreground`}>{families.get(name)}</td>
						<td className={`${cell} truncate text-base text-foreground`} style={{ fontFamily: families.get(name) }}>
							{SAMPLE}
						</td>
					</tr>
				))}
			</tbody>
		</table>
	);
}

export { TypeScale, FontWeights, FontFamilies };
