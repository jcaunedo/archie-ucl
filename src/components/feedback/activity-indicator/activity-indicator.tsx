"use client";

import * as React from "react";
import { motion } from "motion/react";

import {
	pendingBallVariants,
	pendingTextVariants,
	useMotionPreference,
} from "@/lib/motion";
import { cn } from "@/lib/utils";

// Figma "Thought" row in chat-composer (archie.ds); PRD "Conversational progress feedback", Component A. Figma fills the
// label with brand → white → brand; the highlight here fades to 15% brand, as Figma does (decision 2026-10-29, DESIGN.md).

type ActivityIndicatorProps = React.ComponentProps<"div">;

type ActivityIndicatorIconProps = React.ComponentProps<"span"> & {
	/** Bounces while true (the default); rests on its floor when false, e.g. for activity that has finished. */
	animate?: boolean;
};

/**
 * Archie's activity icon: a 6px ball bouncing on a floor, with gravity and squash and stretch. It
 * rises 6px, so the whole bounce fills the 14px box. It takes the text color. Use it wherever Archie shows activity (a
 * running step, a file being written), so there's one activity icon. Still, resting on its floor, under reduced motion.
 */
function ActivityIndicatorIcon({ animate = true, className, ...props }: ActivityIndicatorIconProps) {
	const { prefersReducedMotion } = useMotionPreference();
	const state = animate && !prefersReducedMotion ? "pending" : "idle";
	// A still ball is just a dot: center it in the box, like a text bullet.
	const dot = !animate;

	return (
		<span
			aria-hidden
			data-slot='activity-indicator-icon'
			className={cn("relative size-3.5 shrink-0", className)}
			{...props}
		>
			<motion.span
				className={cn(
					"absolute left-1/2 -ml-[3px] size-1.5 rounded-full bg-current",
					dot ? "top-1/2 -mt-[3px]" : "bottom-0.5",
				)}
				style={{ originY: 1 }}
				initial='idle'
				animate={state}
				variants={pendingBallVariants}
			/>
		</span>
	);
}

/** What Archie is doing right now ("Thinking…"). Replace its label in place; it's a polite live region. */
function ActivityIndicator({ className, children, ...props }: ActivityIndicatorProps) {
	const { prefersReducedMotion } = useMotionPreference();
	const shimmer = !prefersReducedMotion;

	return (
		<div
			role='status'
			data-slot='activity-indicator'
			className={cn("flex min-w-0 items-center gap-1.5 text-sm text-brand", className)}
			{...props}
		>
			{/* Figma: a 14px brand icon, 6px before the label. */}
			<ActivityIndicatorIcon />
			<motion.span
				data-slot='activity-indicator-label'
				className='min-w-0 truncate'
				initial='idle'
				animate={shimmer ? "pending" : "idle"}
				variants={pendingTextVariants}
			>
				{children}
			</motion.span>
		</div>
	);
}

export { ActivityIndicator, ActivityIndicatorIcon, type ActivityIndicatorIconProps, type ActivityIndicatorProps };
