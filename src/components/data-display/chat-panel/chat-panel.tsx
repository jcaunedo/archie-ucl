"use client";

import * as React from "react";

import { Button, type ButtonProps } from "@/components/buttons/button";
import {
	enterTransition,
	exitTransition,
	motionDuration,
	reducedMotionTransition,
	standardTransition,
	useMotionPreference,
} from "@/lib/motion";
import { cn } from "@/lib/utils";

// Figma "chat-composer" (archie.ds), State=expanded | collapsed: the chat column. Expanded, a header (chat switcher and
// actions), the thread, and the PromptComposer pinned at the bottom. Collapsed, a 32px rail (36px on hover) that expands
// it again.
// ChatPanel draws the frame and the areas; apps fill them. Open state follows shadcn's Sidebar (`open`, `defaultOpen`,
// `onOpenChange`, `data-state`).
//
// Motion (MOTION.md, timing from `src/lib/motion`): the width is a CSS transition, as in shadcn's Sidebar, so whatever
// sits beside the panel follows it frame by frame. Collapsing, the content fades out quickly while the panel narrows,
// then the rail fades in. Expanding, the rail goes, the panel widens, then the content fades in once it has its full
// width, so nothing visibly reflows. Content hides with `display: none` (`transition-discrete`) and fades in from
// `@starting-style`.

type ChatPanelContextValue = {
	open: boolean;
	setOpen: (open: boolean) => void;
};

const ChatPanelContext = React.createContext<ChatPanelContextValue | null>(null);

function useChatPanel(part: string) {
	const context = React.useContext(ChatPanelContext);
	if (!context) {
		throw new Error(`${part} must be inside a ChatPanel.`);
	}
	return context;
}

type ChatPanelProps = React.ComponentProps<"section"> & {
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
};

/** The chat column. Renders a `section`: give it an `aria-label` ("Chat") to make it a landmark. */
function ChatPanel({ open: openProp, defaultOpen = true, onOpenChange, className, style, ...props }: ChatPanelProps) {
	const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
	const open = openProp ?? uncontrolledOpen;
	const { prefersReducedMotion } = useMotionPreference();

	// Transitions switch on with the first toggle (set during that same render), so the panel doesn't fade in on load.
	const [previousOpen, setPreviousOpen] = React.useState(open);
	const [animated, setAnimated] = React.useState(false);
	if (open !== previousOpen) {
		setPreviousOpen(open);
		setAnimated(true);
	}

	const context = React.useMemo<ChatPanelContextValue>(
		() => ({
			open,
			setOpen(next) {
				if (openProp === undefined) {
					setUncontrolledOpen(next);
				}
				onOpenChange?.(next);
			},
		}),
		[open, openProp, onOpenChange],
	);

	return (
		<ChatPanelContext value={context}>
			<section
				data-slot='chat-panel'
				data-state={open ? "expanded" : "collapsed"}
				data-animate={animated || undefined}
				className={cn(
					// Figma: 16px corners, `form/border` → `input`, "Shadow Prompt", and a fill that fades from `background` to
					// `background-subtle` from 60.675% down.
					"group/chat-panel relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-input bg-linear-to-b from-background from-[60.675%] to-background-subtle shadow-prompt",
					// Figma State=collapsed: 32px wide. The attribute selector outweighs a width the app sets for the open panel.
					// Hovered, the rail widens to 36px (decision 2026-10-29) at hover speed; the canvas beside it follows.
					"data-[state=collapsed]:w-8 data-[state=collapsed]:hover:w-9 data-[state=collapsed]:hover:duration-(--chat-panel-hover)",
					"transition-[width] duration-(--chat-panel-width) ease-(--chat-panel-width-ease)",
					className,
				)}
				style={{ ...panelTiming(prefersReducedMotion), ...style }}
				{...props}
			/>
		</ChatPanelContext>
	);
}

/** `cubic-bezier()` for a motion-lib transition, so CSS transitions use the same curves. */
function cssEase(transition: { ease?: unknown }) {
	return `cubic-bezier(${(transition.ease as number[]).join(", ")})`;
}

/**
 * The panel's timing as CSS variables: the width on `standardTransition`, and the collapsed rail's hover widening at
 * `motionDuration.fast`; the content out on `exitTransition` at
 * `motionDuration.instant`; the content in on `enterTransition`'s curve at `motionDuration.fast`, after the width lands.
 * Under reduced motion, every step is near-instant (`reducedMotionTransition`) and nothing waits.
 */
function panelTiming(prefersReducedMotion: boolean | null) {
	const instant = `${reducedMotionTransition.duration}s`;
	return {
		"--chat-panel-width": prefersReducedMotion ? instant : `${motionDuration.normal}s`,
		"--chat-panel-width-ease": cssEase(standardTransition),
		"--chat-panel-hover": prefersReducedMotion ? instant : `${motionDuration.fast}s`,
		"--chat-panel-out": prefersReducedMotion ? instant : `${motionDuration.instant}s`,
		"--chat-panel-out-ease": cssEase(exitTransition),
		"--chat-panel-in": prefersReducedMotion ? instant : `${motionDuration.fast}s`,
		"--chat-panel-in-ease": cssEase(enterTransition),
		"--chat-panel-in-delay": prefersReducedMotion ? "0s" : `${motionDuration.normal}s`,
	} as React.CSSProperties;
}

/** The open state for a part, or `undefined` outside a ChatPanel. Hidden parts are `inert` from the first frame of the
 * fade, so focus and screen readers never reach a half-hidden header, thread or rail. */
function useInertWhen(hiddenWhenOpen: boolean) {
	const context = React.useContext(ChatPanelContext);
	if (!context) {
		return undefined;
	}
	return context.open === hiddenWhenOpen || undefined;
}

// Collapsed, the header, thread and composer stay mounted (a draft or the scroll position survives), just hidden.
// They fade out fast as the panel narrows, and fade in after it has widened.
const hiddenWhenCollapsed = cn(
	// `transition-none` until the first toggle: CSS transitions every property by default, and the durations below would
	// otherwise fade the content in on load.
	"transition-none group-data-animate/chat-panel:transition-[opacity,display] group-data-animate/chat-panel:transition-discrete",
	"starting:opacity-0 group-data-[state=expanded]/chat-panel:delay-(--chat-panel-in-delay) group-data-[state=expanded]/chat-panel:duration-(--chat-panel-in) group-data-[state=expanded]/chat-panel:ease-(--chat-panel-in-ease)",
	"group-data-[state=collapsed]/chat-panel:hidden group-data-[state=collapsed]/chat-panel:opacity-0 group-data-[state=collapsed]/chat-panel:duration-(--chat-panel-out) group-data-[state=collapsed]/chat-panel:ease-(--chat-panel-out-ease)",
);

type ChatPanelHeaderProps = React.ComponentProps<"div">;

/** The top bar: the chat switcher on the left, actions on the right. */
function ChatPanelHeader({ className, ...props }: ChatPanelHeaderProps) {
	const inert = useInertWhen(false);
	return (
		<div
			data-slot='chat-panel-header'
			inert={inert}
			className={cn(
				// Figma: 48px, 16px left and 8px right, `background` over the panel's fill.
				"flex h-12 shrink-0 items-center justify-between gap-4 border-b border-input bg-background py-2 pr-2 pl-4",
				hiddenWhenCollapsed,
				className,
			)}
			{...props}
		/>
	);
}

type ChatPanelBodyProps = React.ComponentProps<"div">;

/** The thread. It scrolls, and it's a `log` live region, so new messages are announced. */
function ChatPanelBody({ className, ...props }: ChatPanelBodyProps) {
	const inert = useInertWhen(false);
	return (
		<div
			role='log'
			data-slot='chat-panel-body'
			inert={inert}
			// Figma: 8px body padding + 8px thread padding, 16px between messages.
			className={cn("scrollbar-soft flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4", hiddenWhenCollapsed, className)}
			{...props}
		/>
	);
}

type ChatPanelFooterProps = React.ComponentProps<"div">;

/** The bottom area, for the PromptComposer. */
function ChatPanelFooter({ className, ...props }: ChatPanelFooterProps) {
	const inert = useInertWhen(false);
	return (
		<div
			data-slot='chat-panel-footer'
			inert={inert}
			className={cn("shrink-0 p-2", hiddenWhenCollapsed, className)}
			{...props}
		/>
	);
}

/** `panel-left-alt` (archielabs.ds icon, node `6154:10308`): a panel with its divider set in from the left. Not lucide's `panel-left`. */
function PanelLeftAltIcon(props: React.ComponentProps<"svg">) {
	return (
		<svg viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
			<path
				d='M8 7V17M5 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3Z'
				stroke='currentColor'
				strokeWidth={2}
				strokeLinecap='round'
				strokeLinejoin='round'
			/>
		</svg>
	);
}

type ChatPanelTriggerProps = Omit<ButtonProps, "children" | "variant" | "size">;

/** Collapses the panel. Put it in the header's actions (Figma's `panel-left` button). */
function ChatPanelTrigger({ onClick, ...props }: ChatPanelTriggerProps) {
	const { open, setOpen } = useChatPanel("ChatPanelTrigger");

	return (
		<Button
			data-slot='chat-panel-trigger'
			variant='ghost'
			size='icon-sm'
			aria-label={open ? "Collapse chat" : "Expand chat"}
			aria-expanded={open}
			onClick={(event) => {
				onClick?.(event);
				if (!event.defaultPrevented) {
					setOpen(!open);
				}
			}}
			{...props}
		>
			{/* Figma: archie.ds `panel-left-alt`, 16px in the 28px button. */}
			<PanelLeftAltIcon aria-hidden className='size-4' />
		</Button>
	);
}

type ChatPanelRailProps = Omit<React.ComponentProps<"button">, "type">;

/** The collapsed panel: the whole 32px strip is one button that expands it. Put the Archie mark inside. */
function ChatPanelRail({ className, onClick, ...props }: ChatPanelRailProps) {
	const { open, setOpen } = useChatPanel("ChatPanelRail");

	return (
		<button
			type='button'
			data-slot='chat-panel-rail'
			inert={open || undefined}
			aria-label='Expand chat'
			aria-expanded={false}
			onClick={(event) => {
				onClick?.(event);
				if (!event.defaultPrevented) {
					setOpen(true);
				}
			}}
			className={cn(
				// Figma State=collapsed: the mark centered on the strip. Hover widens the panel (ChatPanel); focus is an inset
				// ring. Laid over the panel, so it never pushes the content while one fades into the other.
				"absolute inset-0 flex items-center justify-center rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
				// The reverse of the content: it goes fast when the panel opens, and fades in once the panel has narrowed.
				"transition-none group-data-animate/chat-panel:transition-[opacity,display] group-data-animate/chat-panel:transition-discrete",
				"starting:opacity-0 group-data-[state=collapsed]/chat-panel:delay-(--chat-panel-in-delay) group-data-[state=collapsed]/chat-panel:duration-(--chat-panel-in) group-data-[state=collapsed]/chat-panel:ease-(--chat-panel-in-ease)",
				"group-data-[state=expanded]/chat-panel:hidden group-data-[state=expanded]/chat-panel:opacity-0 group-data-[state=expanded]/chat-panel:duration-(--chat-panel-out) group-data-[state=expanded]/chat-panel:ease-(--chat-panel-out-ease)",
				className,
			)}
			{...props}
		/>
	);
}

export {
	ChatPanel,
	ChatPanelHeader,
	ChatPanelBody,
	ChatPanelFooter,
	ChatPanelTrigger,
	ChatPanelRail,
	type ChatPanelProps,
	type ChatPanelHeaderProps,
	type ChatPanelBodyProps,
	type ChatPanelFooterProps,
	type ChatPanelTriggerProps,
	type ChatPanelRailProps,
};
