"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { motion } from "motion/react";

import { layoutSpring, motionDuration, useMotionPreference } from "@/lib/motion";
import { cn } from "@/lib/utils";

// Figma "MainNav" (archie.ds): a row of library Buttons, md · 32. The selected item is Solid with a `tone/neutral/neutral`
// fill; the others are Outlined · Neutral with the stroke and shadow removed. Built on shadcn's Tabs (Radix), so arrow keys
// move between items and the selected one gets `aria-selected`.

type SegmentedControlContextValue = {
	selected: string | undefined;
	/** Scopes the indicator's `layoutId` to this control, so two controls on a page don't share it. */
	indicatorId: string;
};

const SegmentedControlContext = React.createContext<SegmentedControlContextValue | null>(null);

type SegmentedControlProps = React.ComponentProps<typeof TabsPrimitive.Root>;

/** A row of mutually exclusive views, one selected at a time. Built on Radix Tabs. */
function SegmentedControl({ className, value, defaultValue, onValueChange, ...props }: SegmentedControlProps) {
	// Radix owns the value; this mirrors it so the triggers know which one draws the indicator.
	const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
	const selected = value ?? uncontrolledValue;
	const indicatorId = React.useId();
	const context = React.useMemo(() => ({ selected, indicatorId }), [selected, indicatorId]);

	return (
		<SegmentedControlContext value={context}>
			<TabsPrimitive.Root
				data-slot='segmented-control'
				value={value}
				defaultValue={defaultValue}
				onValueChange={(next) => {
					setUncontrolledValue(next);
					onValueChange?.(next);
				}}
				className={cn("flex flex-col gap-2", className)}
				{...props}
			/>
		</SegmentedControlContext>
	);
}

type SegmentedControlListProps = React.ComponentProps<typeof TabsPrimitive.List>;

/** The pill-shaped row that holds the triggers. */
function SegmentedControlList({ className, ...props }: SegmentedControlListProps) {
	return (
		<TabsPrimitive.List
			data-slot='segmented-control-list'
			className={cn(
				"relative inline-flex w-fit items-center overflow-hidden rounded-full bg-background",
				// Figma's shadow is unbound and has no effect style, so it's written literally (DESIGN.md "Segmented Control").
				"shadow-[0_0_8px_0_oklch(0_0_0/8%)]",
				className,
			)}
			{...props}
		/>
	);
}

type SegmentedControlTriggerProps = React.ComponentProps<typeof TabsPrimitive.Trigger>;

/** One item. Put an optional 16px icon before the label. */
function SegmentedControlTrigger({
	className,
	value,
	children,
	onPointerDown,
	onKeyDown,
	onBlur,
	...props
}: SegmentedControlTriggerProps) {
	const context = React.useContext(SegmentedControlContext);
	const { resolve } = useMotionPreference();
	const isSelected = context !== null && context.selected === value;
	// The focus outline is for keyboard users. Chrome matches :focus-visible on a mouse click here (Radix's roving focus),
	// so a click marks the trigger and hides the outline until the next key press or blur. Same fix as intercept-ucl's Tabs.
	const [pointerFocus, setPointerFocus] = React.useState(false);

	// Stacking, bottom to top: hover fill (trigger) → the selected fill (`z-10`) → every label and the focus outline
	// (`z-20`). So labels stay readable while the fill glides over them.
	return (
		<TabsPrimitive.Trigger
			data-slot='segmented-control-trigger'
			value={value}
			data-pointer-focus={pointerFocus ? "" : undefined}
			onPointerDown={(event) => {
				setPointerFocus(true);
				onPointerDown?.(event);
			}}
			onKeyDown={(event) => {
				setPointerFocus(false);
				onKeyDown?.(event);
			}}
			onBlur={(event) => {
				setPointerFocus(false);
				onBlur?.(event);
			}}
			className={cn(
				"group/trigger relative inline-flex h-8 shrink-0 rounded-full transition-colors outline-none",
				// Figma Outlined · Neutral, Hover: `states/hover` → `accent`
				"data-[state=inactive]:hover:not-disabled:bg-accent",
				className,
			)}
			{...props}
		>
			{isSelected && (
				// Connect pattern (MOTION.md "Tabs"): one indicator per control, shared through `layoutId`, glides to the newly
				// selected trigger. Figma's selected fill: `tone/neutral/neutral`, a pill.
				<motion.span
					aria-hidden
					data-slot='segmented-control-indicator'
					layoutId={`${context.indicatorId}-indicator`}
					transition={resolve(layoutSpring)}
					className='absolute inset-0 z-10 rounded-full bg-neutral'
				/>
			)}
			<span
				data-slot='segmented-control-label'
				// The label fades to its new color over the same span the indicator takes to arrive, so it isn't white on white.
				style={{ transitionDuration: `${motionDuration.normal}s` }}
				className={cn(
					// Figma: 8px item padding + 4px icon padding on the left, 8px label padding + 4px on the right. The icon's -7px
					// margin and 4px + 8px of padding leave 5px between icon and label. Without an icon, 12px on both sides too.
					"relative z-20 inline-flex h-full items-center justify-center gap-[5px] rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap",
					"transition-colors motion-reduce:transition-none",
					"[&>svg]:pointer-events-none [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:transition-colors [&>svg]:duration-[inherit] motion-reduce:[&>svg]:transition-none",
					// An inset outline, not the library's offset ring: the list clips its children, and a ring (a box-shadow)
					// would paint under the indicator.
					"[:focus-visible:not([data-pointer-focus])>&]:outline-2 [:focus-visible:not([data-pointer-focus])>&]:-outline-offset-2 [:focus-visible:not([data-pointer-focus])>&]:outline-solid [:focus-visible:not([data-pointer-focus])>&]:outline-ring",
					// Figma Outlined · Neutral: Default, Disabled
					"group-data-[state=inactive]/trigger:text-foreground group-data-[state=inactive]/trigger:[&>svg]:text-icon",
					"group-disabled/trigger:text-foreground-subtle group-disabled/trigger:[&>svg]:text-icon-subtle",
					// Figma selected item
					"group-data-[state=active]/trigger:text-neutral-foreground",
				)}
			>
				{children}
			</span>
		</TabsPrimitive.Trigger>
	);
}

type SegmentedControlContentProps = React.ComponentProps<typeof TabsPrimitive.Content>;

/** The panel shown while its trigger is selected. Optional: leave it out when the control only switches a value. */
function SegmentedControlContent({ className, ...props }: SegmentedControlContentProps) {
	return (
		<TabsPrimitive.Content
			data-slot='segmented-control-content'
			className={cn("flex-1 outline-none", className)}
			{...props}
		/>
	);
}

export {
	SegmentedControl,
	SegmentedControlList,
	SegmentedControlTrigger,
	SegmentedControlContent,
	type SegmentedControlProps,
	type SegmentedControlListProps,
	type SegmentedControlTriggerProps,
	type SegmentedControlContentProps,
};
