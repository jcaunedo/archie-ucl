"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "motion/react";

import {
	iconInVariants,
	iconSwapReducedVariants,
	motionScale,
	pendingBallVariants,
	useMotionPreference,
} from "@/lib/motion";
import { cn } from "@/lib/utils";

// Figma "loader" (archie.ds 59:705): a 28px frame, one state at a time. The glyphs are Figma's, with their fill swapped
// for `currentColor`, so each state takes its color from the root (and a `text-*` class can override it). Everything
// inside is sized as a share of the frame, so a `size-*` class scales it whole (the chat's status rows use 16px).

const loaderVariants = cva("relative inline-flex size-7 shrink-0 items-center justify-center", {
	variants: {
		state: {
			// Figma "loading": the activity ball, half the frame (14px of 28), in brand.
			loading: "text-brand",
			// Figma "steps": a step on a timeline, a hollow node on a line that runs past the frame, in foreground-subtle.
			steps: "text-foreground-subtle",
			// Figma "brand": the Archie A, 23.42 × 27 of 28, at the frame's top (Figma update 2026-10-29: it lines up with
			// the text beside it), in brand. Shown once Archie's status is "thought" (it has finished thinking).
			brand: "text-brand",
			// Figma "done": circle-check, done-filled, 27 of 28, in success.
			done: "text-success",
		},
	},
	defaultVariants: {
		state: "loading",
	},
});

type LoaderProps = React.ComponentProps<"span"> & VariantProps<typeof loaderVariants>;

/** Figma archie.ds "loader" → "Property 1=brand": the Archie A. */
function ArchieSymbol() {
	return (
		<svg viewBox='0 0 23.4238 27' fill='none' className='h-[96.43%] w-[83.66%]'>
			<path
				d='M11.7139 0C18.1816 0.000924248 23.4238 5.24591 23.4238 11.7139V24.6201C23.4231 25.9339 22.3579 27 21.0439 27C19.7303 26.9997 18.6648 25.9337 18.6641 24.6201V19.8018H11.5498L11.3076 19.7891C10.1073 19.6674 9.16992 18.6543 9.16992 17.4219C9.17001 16.1896 10.1074 15.1763 11.3076 15.0547L11.5498 15.042H18.6641V11.7139C18.6641 7.87467 15.5528 4.76069 11.7139 4.75977C7.8741 4.75977 4.75977 7.8741 4.75977 11.7139V24.6201C4.75904 25.9338 3.69375 26.9999 2.37988 27C1.06595 27 0.000727942 25.9339 0 24.6201V11.7139C0 5.24534 5.24534 0 11.7139 0Z'
				fill='currentColor'
			/>
		</svg>
	);
}

/**
 * Figma archie.ds "loader" → "Property 1=steps": the node, 11px across with a 2px stroke, on a 2px line, all in 28 (scaled
 * with the frame). The line runs past the frame, 5px above and 4px below, so steps stacked with a 4px gap join up.
 */
function StepsNode() {
	return (
		<svg viewBox='0 0 28 37' fill='none' className='absolute top-[-17.86%] left-0 h-[132.14%] w-full'>
			<path d='M13.5 0V37' stroke='currentColor' strokeWidth={2} />
			<circle cx='13.5' cy='18.5' r='5.5' stroke='currentColor' strokeWidth={2} className='fill-background' />
		</svg>
	);
}

/** Figma archie.ds "loader" → "Property 1=done": circle-check, done-filled. The check is cut out of the circle. */
function DoneCheck() {
	return (
		<svg viewBox='0 0 27 27' fill='none' className='size-[96.43%]'>
			<path
				fillRule='evenodd'
				clipRule='evenodd'
				d='M1.125 13.5C1.125 6.66548 6.66548 1.125 13.5 1.125C20.3345 1.125 25.875 6.66548 25.875 13.5C25.875 20.3345 20.3345 25.875 13.5 25.875C6.66548 25.875 1.125 20.3345 1.125 13.5ZM17.6705 10.4545C18.1098 10.8938 18.1098 11.6062 17.6705 12.0455L13.1705 16.5455C12.7312 16.9848 12.0188 16.9848 11.5795 16.5455L9.32951 14.2955C8.89017 13.8562 8.89017 13.1438 9.32951 12.7045C9.76885 12.2652 10.4812 12.2652 10.9205 12.7045L12.375 14.159L16.0795 10.4545C16.5188 10.0152 17.2312 10.0152 17.6705 10.4545Z'
				fill='currentColor'
			/>
		</svg>
	);
}

/**
 * Where Archie's work stands, as one icon, 28px unless a `size-*` class scales it (Figma archie.ds "loader"): `loading` bounces the activity ball (as
 * ActivityIndicator does) while Archie works, `steps` marks a step on a timeline, `brand` grows the Archie A in once its status turns to "thought", and
 * `done` grows a green check in. Decorative unless it has an `aria-label`, then it's an image with that name. Under reduced motion the
 * ball rests in the middle, as Figma draws it.
 */
function Loader({ className, state = "loading", ...props }: LoaderProps) {
	const { prefersReducedMotion } = useMotionPreference();
	const bouncing = state === "loading" && !prefersReducedMotion;
	const labelled = props["aria-label"] !== undefined;

	return (
		<span
			role={labelled ? "img" : undefined}
			aria-hidden={labelled ? undefined : true}
			data-slot='loader'
			data-state={state}
			className={cn(loaderVariants({ state, className }))}
			{...props}
		>
			{state === "loading" && (
				// Half the frame. Its floor is the frame's bottom and it rises its own height, so the bounce fills the frame at any
				// size. Still, it sits in the middle.
				<motion.span
					className={cn("absolute left-1/4 size-1/2 rounded-full bg-current", bouncing ? "bottom-0" : "top-1/4")}
					style={{ originY: 1 }}
					initial='idle'
					animate={bouncing ? "pending" : "idle"}
					custom={`${motionScale.ballRise * 100}%`}
					variants={pendingBallVariants}
				/>
			)}
			{state === "steps" && <StepsNode />}
			{(state === "brand" || state === "done") && (
				// Grow in: the A or the check fades in as it grows from `motionScale.iconIn`, each time it appears (keyed by
				// state, so brand → done grows again). Instant under reduced motion. Inside `AnimatePresence initial={false}`,
				// a loader already there on the first render shows as it is.
				<motion.span
					key={state}
					data-slot={`loader-${state}`}
					className={cn("flex size-full justify-center", state === "brand" ? "items-start" : "items-center")}
					initial='hidden'
					animate='shown'
					variants={prefersReducedMotion ? iconSwapReducedVariants : iconInVariants}
				>
					{state === "brand" ? <ArchieSymbol /> : <DoneCheck />}
				</motion.span>
			)}
		</span>
	);
}

export { Loader, loaderVariants, type LoaderProps };
