import * as React from "react";
import { Bell, ChevronDown, MessageCirclePlus, Plug, Share } from "lucide-react";

import { Button } from "@/components/buttons/button";
import { ChatPanelTrigger } from "@/components/data-display/chat-panel";

import { ArchieAIcon, HistoryIcon } from "./icons";
import archieLogomark from "./images/archie-logomark.svg";
import creditsIcon from "./images/credits.svg";
import githubIcon from "./images/github.svg";

// Layout-only parts: UCL has no component for these yet (project and chat switchers, Avatar, model picker, notification
// dot), or they hold the page's copy. They match Figma; when UCL gets the real component, swap it in.

/** Figma topbar "Button Archie": a 32px outlined link home with the brand Archie A, 16 × 18.44, centered. */
function LogoLink() {
	return (
		<Button asChild variant='outline' size='icon-md' className='[&_svg]:text-brand'>
			<a href='#' aria-label='Archie home'>
				{/* A square box as tall as the glyph: the viewBox keeps the A at Figma's 16 × 18.44, centered. A `size-*` class
				also opts out of Button's 16px icon size. */}
				<ArchieAIcon aria-hidden className='size-[18.4428px]' />
			</a>
		</Button>
	);
}

/** Figma topbar "Frame 23": org, a slash, and the project that opens the project menu. */
function ProjectSwitcher({ org, project }: { org: string; project: string }) {
	return (
		<div className='flex h-7 min-w-0 items-center gap-1.5 px-1.5 text-base'>
			<span className='truncate font-semibold text-muted-foreground'>{org}</span>
			<span aria-hidden className='text-foreground-subtle'>
				/
			</span>
			<button type='button' className='flex min-w-0 items-center gap-[3px] font-semibold text-foreground'>
				<span className='truncate'>{project}</span>
				<ChevronDown aria-hidden className='size-4 shrink-0' />
			</button>
		</div>
	);
}

/** Figma topbar's right-hand group: Button md · 32, Outlined · Neutral, 4px apart. */
function TopbarActions({ credits }: { credits: number }) {
	return (
		<div className='flex items-center gap-1'>
			<Button variant='outline'>
				{/* Figma "credits": a 16px pie of the credits left. Figma's drawing, not yet driven by `credits`. */}
				<img data-icon='inline-start' alt='' src={creditsIcon} className='size-4' />
				{credits} credits
			</Button>
			<Button variant='outline'>
				<Plug data-icon='inline-start' aria-hidden />
				MCP
			</Button>
			<Button variant='outline' size='icon-md' aria-label='GitHub'>
				<img alt='' src={githubIcon} className='size-4' />
			</Button>
			<span className='relative inline-flex'>
				<Button variant='outline' size='icon-md' aria-label='Notifications, new activity'>
					<Bell aria-hidden />
				</Button>
				{/* Figma "Notification Circle": 6px, 4px in from the top right corner. */}
				<span aria-hidden className='absolute top-1 right-1 size-1.5 rounded-full bg-emphasis' />
			</span>
			<Button variant='outline'>
				<Share data-icon='inline-start' aria-hidden />
				Share
			</Button>
		</div>
	);
}

function Account({ avatar }: { avatar: string }) {
	return (
		<button type='button' aria-label='Account' className='size-8 shrink-0 overflow-hidden rounded-full'>
			<img alt='' src={avatar} className='size-full' />
		</button>
	);
}

/** Figma chat header "{current-chat} ⌄": switches between chats. */
function ChatSwitcher({ title }: { title: string }) {
	return (
		<button type='button' className='flex min-w-0 items-center gap-1 text-sm font-medium text-foreground'>
			<span className='truncate'>{title}</span>
			<ChevronDown aria-hidden className='size-4 shrink-0 text-icon' />
		</button>
	);
}

/** Figma chat header actions: 28px ghost buttons with 16px icons, 2px apart. New chat, history, collapse. */
function ChatActions() {
	return (
		<div className='flex items-center gap-0.5'>
			<Button variant='ghost' size='icon-sm' aria-label='New chat'>
				<MessageCirclePlus aria-hidden className='size-4' />
			</Button>
			<Button variant='ghost' size='icon-sm' aria-label='Chat history'>
				<HistoryIcon aria-hidden className='size-4' />
			</Button>
			<ChatPanelTrigger />
		</div>
	);
}

/** Figma chat-composer State=collapsed: the mark on the rail, an 18px brand circle with the white logomark. */
function ArchieMark() {
	return (
		<span aria-hidden className='flex size-4.5 items-center justify-center rounded-full bg-brand'>
			<img alt='' src={archieLogomark} />
		</span>
	);
}

/** Figma prompt-composer "Auto ⌄": the model picker. */
function ModelPicker({ model }: { model: string }) {
	return (
		<button
			type='button'
			aria-label={`Model: ${model}`}
			className='flex h-7 items-center gap-[2px] rounded-full pr-2 pl-3 text-sm text-muted-foreground transition-colors hover:bg-accent'
		>
			{model}
			<ChevronDown aria-hidden className='size-4 text-icon-muted' />
		</button>
	);
}

/** The chat's width: 440px by default (Figma), adjustable between these. The canvas always keeps `chatCanvasMin`. */
const chatWidth = { default: 440, min: 320, max: 720, step: 16 };
const chatCanvasMin = 480;

/**
 * The handle between the chat and the canvas: drag it to resize the chat (not in Figma; decision 2026-10-29). It's the
 * 2px gap between them, with an 8px hit area, a resize cursor and a grip on hover or while dragging. A focusable
 * separator: ← → resize by 16px, Home / End jump to the limits, double-click resets to 440px.
 */
function ChatResizeHandle({
	width,
	onWidthChange,
	onResizingChange,
}: {
	width: number;
	onWidthChange: (width: number) => void;
	onResizingChange: (resizing: boolean) => void;
}) {
	const start = React.useRef<{ x: number; width: number } | null>(null);
	const max = () => Math.min(chatWidth.max, window.innerWidth - chatCanvasMin);
	const clamp = (value: number) => Math.round(Math.min(max(), Math.max(chatWidth.min, value)));

	return (
		<div
			role='separator'
			aria-orientation='vertical'
			aria-label='Resize chat'
			aria-valuemin={chatWidth.min}
			aria-valuemax={chatWidth.max}
			aria-valuenow={width}
			tabIndex={0}
			onPointerDown={(event) => {
				event.preventDefault();
				event.currentTarget.setPointerCapture(event.pointerId);
				start.current = { x: event.clientX, width };
				onResizingChange(true);
			}}
			onPointerMove={(event) => {
				if (start.current) {
					onWidthChange(clamp(start.current.width + event.clientX - start.current.x));
				}
			}}
			onPointerUp={(event) => {
				event.currentTarget.releasePointerCapture(event.pointerId);
				start.current = null;
				onResizingChange(false);
			}}
			onDoubleClick={() => onWidthChange(chatWidth.default)}
			onKeyDown={(event) => {
				const next = {
					ArrowLeft: width - chatWidth.step,
					ArrowRight: width + chatWidth.step,
					Home: chatWidth.min,
					End: max(),
				}[event.key];
				if (next !== undefined) {
					event.preventDefault();
					onWidthChange(clamp(next));
				}
			}}
			className='group relative w-0.5 shrink-0 cursor-col-resize touch-none outline-none'
		>
			{/* The hit area, wider than the 2px gap it sits in. */}
			<span aria-hidden className='absolute inset-y-0 -right-[3px] -left-[3px]' />
			{/* The grip: shown on hover, while dragging, or when focused from the keyboard. */}
			<span
				aria-hidden
				className='absolute top-1/2 left-1/2 h-10 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-icon-muted opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 group-focus-visible:ring-2 group-focus-visible:ring-ring group-active:opacity-100'
			/>
		</div>
	);
}

export {
	Account,
	ArchieMark,
	ChatActions,
	ChatResizeHandle,
	ChatSwitcher,
	chatWidth,
	LogoLink,
	ModelPicker,
	ProjectSwitcher,
	TopbarActions,
};
