import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import { motion } from "motion/react";

import { pendingIconReducedVariants, pendingSpinnerVariants, useMotionPreference } from "@/lib/motion";
import { cn } from "@/lib/utils";

// Figma "Button" (archielabs.ds, node 41:604). Style · Tone → `variant`; Size and Type (Text or Icon) → `size`.
// States: Hover → `hover:not-aria-disabled:` (blocked buttons don't react), Disabled → `data-disabled:` (set for
// `disabled`, and for `aria-disabled` while not pending), Loading → `pending`.
const buttonVariants = cva(
	[
		"relative inline-flex max-w-full shrink-0 items-center justify-center font-medium whitespace-nowrap transition-colors outline-none",
		"focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
		"disabled:pointer-events-none aria-busy:cursor-progress",
		"[&_svg]:pointer-events-none [&_svg]:shrink-0",
	],
	{
		variants: {
			variant: {
				// Figma Solid · Brand. Hover lays 20% black over the fill, mixed in sRGB as Figma composites layers (oklab
				// would come out darker). Disabled: `tone/brand/muted`, the label stays `on-brand` (the icon-only sizes use
				// the neutral disabled colors, below).
				default:
					"bg-primary text-primary-foreground hover:not-aria-disabled:bg-[color-mix(in_srgb,var(--primary)_80%,black)] data-disabled:bg-brand-muted",
				// Figma Solid · Destructive
				destructive:
					"bg-destructive text-destructive-foreground hover:not-aria-disabled:bg-[color-mix(in_srgb,var(--destructive)_80%,black)] data-disabled:bg-disabled data-disabled:text-foreground-subtle",
				// Figma Flat · Brand
				secondary:
					"bg-secondary text-secondary-foreground [&_svg]:text-icon-brand hover:not-aria-disabled:bg-brand-muted data-disabled:bg-disabled data-disabled:text-foreground-subtle data-disabled:[&_svg]:text-foreground-subtle",
				// Figma Flat · Destructive
				"destructive-secondary":
					"bg-destructive-subtle text-destructive hover:not-aria-disabled:bg-destructive-muted data-disabled:bg-disabled data-disabled:text-foreground-subtle",
				// Figma Outlined · Neutral. Hover: `states/hover` is a 3% tint, so it's laid over the white fill (a gradient
				// layer) instead of replacing it. Replaced, the button turns see-through and darkens on the gray topbar.
				outline:
					"border border-input bg-background text-foreground shadow-xs [&_svg]:text-icon hover:not-aria-disabled:bg-[linear-gradient(var(--accent),var(--accent))] data-disabled:border-input-disabled data-disabled:shadow-none data-disabled:text-foreground-subtle data-disabled:[&_svg]:text-foreground-subtle",
				// Figma Ghost · Neutral
				ghost:
					"text-foreground [&_svg]:text-icon hover:not-aria-disabled:bg-accent data-disabled:text-foreground-subtle data-disabled:[&_svg]:text-foreground-subtle",
				// Figma Link · Brand: hover fills `tone/brand/subtle`; there's no underline.
				link: "text-primary hover:not-aria-disabled:bg-brand-subtle data-disabled:text-foreground-subtle",
			},
			size: {
				// Figma Type=Text. The side with an icon (`data-icon='inline-start' | 'inline-end'` on the svg) is tighter.
				// xs · 24: 8px sides, 4px gap, 12px text and icons.
				xs: "h-6 gap-1 rounded-button-xs px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
				// sm · 28: 11px sides (8 + 3 label padding), 8px beside an icon, 5px to it, 14px icons.
				sm: "h-7 gap-[5px] rounded-button-sm px-[11px] text-sm has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
				// md · 32: 12px sides (4 + 8 label padding), 8px beside an icon, 5px to it (4 + 8 − 7), 16px icons.
				md: "h-8 gap-[5px] rounded-button-md px-3 text-sm has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-4",
				// lg · 36: 14px sides (8 + 6), 10px beside an icon, 6px to it (2 − 2 + 6), 16px icons.
				lg: "h-9 gap-1.5 rounded-button-lg px-3.5 text-sm has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-4",
				// xl · 40: 18px sides (8 + 10), 12px beside an icon, 6px to it (4 − 8 + 10), 16px text and icons.
				xl: "h-10 gap-1.5 rounded-button-xl px-4.5 text-base has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-4",
				// Figma Type=Icon: square, the icon centered. 12 / 14 / 16 / 18 / 20px icons.
				"icon-xs": "size-6 rounded-button-xs [&_svg:not([class*='size-'])]:size-3",
				"icon-sm": "size-7 rounded-button-sm [&_svg:not([class*='size-'])]:size-3.5",
				"icon-md": "size-8 rounded-button-md [&_svg:not([class*='size-'])]:size-4",
				"icon-lg": "size-9 rounded-button-lg [&_svg:not([class*='size-'])]:size-4.5",
				"icon-xl": "size-10 rounded-button-xl [&_svg:not([class*='size-'])]:size-5",
			},
		},
		compoundVariants: [
			// Figma Type=Icon, Solid · Brand, Disabled uses the neutral disabled colors, unlike Type=Text.
			{
				variant: "default",
				size: ["icon-xs", "icon-sm", "icon-md", "icon-lg", "icon-xl"],
				className: "data-disabled:bg-disabled data-disabled:text-foreground-subtle",
			},
		],
		defaultVariants: {
			variant: "default",
			size: "md",
		},
	},
);

type ButtonProps = React.ComponentProps<"button"> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
		/** The work this button started is in progress: a spinner covers the label, it stays focusable and ignores clicks. */
		pending?: boolean;
	};

/** Triggers an action or event, such as submitting a form or moving to the next step. */
function Button({
	className,
	variant = "default",
	size = "md",
	asChild = false,
	pending = false,
	type,
	onClick,
	children,
	...props
}: ButtonProps) {
	const Component = asChild ? Slot : "button";
	const { prefersReducedMotion } = useMotionPreference();
	const ariaDisabled = props["aria-disabled"];
	const blocked = pending || ariaDisabled === true || ariaDisabled === "true";
	// Disabled colors: a truly disabled button, or a blocked one that isn't busy (a pending button keeps its colors).
	const looksDisabled = props.disabled || (blocked && !pending);

	function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
		// `pending` and `aria-disabled` keep the button focusable, so the click is blocked here instead. preventDefault also
		// stops a form submit or, with `asChild`, a link's navigation.
		if (blocked) {
			event.preventDefault();
			return;
		}
		onClick?.(event);
	}

	return (
		<Component
			data-slot='button'
			data-variant={variant}
			data-size={size}
			data-pending={pending || undefined}
			data-disabled={looksDisabled || undefined}
			type={asChild ? type : (type ?? "button")}
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
			aria-busy={pending ? true : props["aria-busy"]}
			aria-disabled={blocked || undefined}
			onClick={handleClick}
		>
			{asChild ? (
				children
			) : (
				<>
					{/* Always rendered, so the DOM doesn't change when `pending` toggles. While pending it's transparent but
					    keeps its space (the width doesn't change under the spinner) and stays the accessible name. Not
					    `invisible`: that would drop it from the name. */}
					<span
						data-slot='button-content'
						className={cn("inline-flex min-w-0 items-center gap-[inherit]", pending && "opacity-0")}
					>
						{children}
					</span>
					{pending && (
						// Figma State=Loading: `loader-circle` at the size's icon size, centered. Reduced motion: it pulses.
						<span data-slot='button-spinner' className='absolute inset-0 flex items-center justify-center'>
							<motion.span
								className='inline-flex'
								initial={false}
								animate='pending'
								variants={prefersReducedMotion ? pendingIconReducedVariants : pendingSpinnerVariants}
							>
								<LoaderCircle aria-hidden />
							</motion.span>
						</span>
					)}
				</>
			)}
		</Component>
	);
}

export { Button, buttonVariants, type ButtonProps };
