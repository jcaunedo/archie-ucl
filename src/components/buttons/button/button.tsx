import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "motion/react";

import { pendingSurfaceVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";

// Hovers skip `aria-disabled` buttons (also set while `pending`), so a blocked button doesn't look clickable.
const buttonVariants = cva(
	"inline-flex max-w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:not-aria-busy:opacity-50 aria-busy:cursor-progress [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				default: "bg-primary text-primary-foreground hover:not-aria-disabled:bg-primary/90",
				destructive:
					"bg-destructive text-destructive-foreground hover:not-aria-disabled:bg-destructive/90",
				outline:
					"border border-input bg-background hover:not-aria-disabled:bg-accent hover:not-aria-disabled:text-accent-foreground",
				secondary:
					"bg-secondary text-secondary-foreground hover:not-aria-disabled:bg-secondary/80",
				ghost: "hover:not-aria-disabled:bg-accent hover:not-aria-disabled:text-accent-foreground",
				link: "text-primary underline-offset-4 hover:not-aria-disabled:underline",
			},
			size: {
				default: "h-9 px-4 py-2",
				sm: "h-8 rounded-md px-3 text-xs",
				lg: "h-10 rounded-md px-6",
				icon: "size-9",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

type ButtonProps = React.ComponentProps<"button"> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
		/** The work this button started is in progress: it stays focusable, ignores clicks and pulses its content. */
		pending?: boolean;
	};

/** Triggers an action or event, such as submitting a form or moving to the next step. */
function Button({
	className,
	variant = "default",
	size = "default",
	asChild = false,
	pending = false,
	type,
	onClick,
	children,
	...props
}: ButtonProps) {
	const Component = asChild ? Slot : "button";
	const ariaDisabled = props["aria-disabled"];
	const blocked = pending || ariaDisabled === true || ariaDisabled === "true";

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
				// Always rendered, so the button's DOM and width don't change when `pending` toggles. Opacity only, which
				// MOTION.md keeps under reduced motion; the label stays the same, so nothing shifts.
				<motion.span
					className='inline-flex min-w-0 items-center gap-2'
					initial={false}
					animate={pending ? "pending" : "idle"}
					variants={pendingSurfaceVariants}
				>
					{children}
				</motion.span>
			)}
		</Component>
	);
}

export { Button, buttonVariants, type ButtonProps };
