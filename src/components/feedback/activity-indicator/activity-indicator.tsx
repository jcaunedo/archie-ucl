"use client";

import * as React from "react";
import { Loader } from "lucide-react";
import { motion } from "motion/react";

import { pendingTextVariants, useMotionPreference } from "@/lib/motion";
import { cn } from "@/lib/utils";

// Figma "Thought" row in chat-composer (archie.ds); PRD "Conversational progress feedback", Component A. Figma fills the
// label with brand → white → brand. The highlight here stops at 80% brand, so the word keeps 3:1 against the background.

type ActivityIndicatorProps = React.ComponentProps<"div">;

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
			{/* Figma: a 14px brand icon, 6px before the label. Static: the label already moves. */}
			<Loader aria-hidden className='size-3.5 shrink-0' />
			<motion.span
				data-slot='activity-indicator-label'
				className={cn(
					"min-w-0 truncate",
					shimmer &&
						"bg-[linear-gradient(90deg,var(--brand)_40%,color-mix(in_oklab,var(--brand)_80%,var(--background))_50%,var(--brand)_60%)] bg-size-[300%_100%] bg-clip-text text-transparent",
				)}
				initial={false}
				animate={shimmer ? "pending" : "idle"}
				variants={pendingTextVariants}
			>
				{children}
			</motion.span>
		</div>
	);
}

export { ActivityIndicator, type ActivityIndicatorProps };
