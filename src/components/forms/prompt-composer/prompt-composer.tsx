"use client";

import * as React from "react";
import { ArrowUp, AudioLines, CornerDownRight, Square, SquareSlash } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupTextarea,
	type InputGroupAddonProps,
	type InputGroupButtonProps,
	type InputGroupTextareaProps,
} from "@/components/forms/input-group";
import {
	enterTransition,
	iconSwapReducedVariants,
	iconSwapVariants,
	motionDistance,
	motionScale,
	useMotionPreference,
} from "@/lib/motion";
import { cn } from "@/lib/utils";

// Figma "prompt-composer" (archie.ds): the box where people message Archie. Built on InputGroup: a textarea, then a row
// with the app's controls (attach, commands, model, mic) and the Send button. PromptComposer owns the text, Enter to
// send, the commands menu and the Send button; the app owns everything else in the row. The commands menu interacts as
// intercept-ucl's ChatComposer does (decision 2026-10-29).

/** A slash command: typed as "/name", described in the commands menu. */
type PromptComposerCommand = { name: string; description: string };

type PromptComposerContextValue = {
	value: string;
	setValue: (value: string) => void;
	submit: () => void;
	pending: boolean;
	onVoice?: () => void;
	onStop?: () => void;
	commands: PromptComposerCommand[];
	fieldRef: React.RefObject<HTMLTextAreaElement | null>;
	menu: {
		id: string;
		open: boolean;
		matches: PromptComposerCommand[];
		active: PromptComposerCommand | undefined;
		move: (step: 1 | -1) => void;
		hover: (command: PromptComposerCommand) => void;
		pick: (command: PromptComposerCommand) => void;
		/** Opens the menu from the slash button: on an empty box it writes "/", over text it lists every command. */
		show: () => void;
		dismiss: () => void;
		release: () => void;
	};
};

const PromptComposerContext = React.createContext<PromptComposerContextValue | null>(null);

function usePromptComposer(part: string) {
	const context = React.useContext(PromptComposerContext);
	if (!context) {
		throw new Error(`${part} must be inside a PromptComposer.`);
	}
	return context;
}

type PromptComposerProps = Omit<React.ComponentProps<"form">, "onSubmit" | "defaultValue"> & {
	value?: string;
	defaultValue?: string;
	onValueChange?: (value: string) => void;
	/** Called with the trimmed message on Enter or Send. When uncontrolled, the box then clears itself. */
	onSubmit?: (message: string) => void;
	/** Archie is answering: Send shows Button's `pending` state, and Enter and Send do nothing. */
	pending?: boolean;
	/** Starts voice mode. When set, an empty composer shows the voice button in place of Send. */
	onVoice?: () => void;
	/**
	 * Archie is working and can be stopped. An empty box shows Stop in place of voice and Send. With text, Send becomes
	 * "Add to queue" (`onSubmit` still gets the message; the app queues it) and a smaller Stop sits before it.
	 */
	onStop?: () => void;
	/**
	 * Slash commands. Typing "/" at the start, or `PromptComposerCommands` (the slash button), opens the commands menu
	 * above the box. It filters as the command is typed; ↑ ↓ move, Enter or Tab picks, Escape closes it. Picking writes
	 * "/name " into the message, for the app to act on when it's sent.
	 */
	commands?: PromptComposerCommand[];
};

/** The message box for talking to Archie. Enter sends, Shift+Enter adds a line, "/" opens the commands. */
function PromptComposer({
	value: valueProp,
	defaultValue = "",
	onValueChange,
	onSubmit,
	pending = false,
	onVoice,
	onStop,
	commands = [],
	className,
	children,
	...props
}: PromptComposerProps) {
	const { prefersReducedMotion, resolve } = useMotionPreference();
	const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
	const controlled = valueProp !== undefined;
	const value = controlled ? valueProp : uncontrolledValue;
	const fieldRef = React.useRef<HTMLTextAreaElement>(null);
	const menuId = React.useId();

	// The commands menu: open while the message is only a command being typed ("/the"), or when the slash button asks
	// for it over other text, until it's dismissed.
	const [menuForced, setMenuForced] = React.useState(false);
	const [menuDismissed, setMenuDismissed] = React.useState(false);
	const [activeIndex, setActiveIndex] = React.useState(0);
	const typed = /^\/(\S*)$/.exec(value)?.[1];
	const query = typed ?? (menuForced ? "" : undefined);
	const matches =
		query === undefined ? [] : commands.filter((command) => command.name.startsWith(query.toLowerCase()));
	const open = matches.length > 0 && !menuDismissed;
	const active = matches[Math.min(activeIndex, matches.length - 1)];

	function setValue(next: string) {
		if (!controlled) {
			setUncontrolledValue(next);
		}
		onValueChange?.(next);
		setMenuDismissed(false);
		setActiveIndex(0);
	}

	const context: PromptComposerContextValue = {
		value,
		setValue,
		submit() {
			const message = value.trim();
			if (message === "" || pending) {
				return;
			}
			onSubmit?.(message);
			if (!controlled) {
				setUncontrolledValue("");
			}
		},
		pending,
		onVoice,
		onStop,
		commands,
		fieldRef,
		menu: {
			id: menuId,
			open,
			matches,
			active,
			move(step) {
				setActiveIndex((matches.indexOf(active!) + step + matches.length) % matches.length);
			},
			hover(command) {
				setActiveIndex(matches.indexOf(command));
			},
			// A picked command replaces the one being typed, or goes before the text already there.
			pick(command) {
				setValue(`/${command.name} ${value.replace(/^\/\S*\s?/, "")}`);
				setMenuForced(false);
				fieldRef.current?.focus();
			},
			show() {
				if (value === "") {
					setValue("/");
				} else {
					setMenuForced(true);
				}
				setMenuDismissed(false);
				fieldRef.current?.focus();
			},
			dismiss() {
				setMenuDismissed(true);
				setMenuForced(false);
			},
			release() {
				setMenuForced(false);
			},
		},
	};

	return (
		<PromptComposerContext value={context}>
			<form
				data-slot='prompt-composer'
				onSubmit={(event) => {
					event.preventDefault();
					context.submit();
				}}
				// `relative` places the commands menu above the box.
				className={cn("relative w-full", className)}
				{...props}
			>
				{/* The commands menu, above the box: the menus' surface, fading and rising in like them (Menus and dropdowns). */}
				<AnimatePresence>
					{open && (
						<motion.ul
							key='commands'
							id={menuId}
							role='listbox'
							aria-label='Commands'
							initial={
								prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: motionScale.popIn, y: motionDistance.subtle }
							}
							animate={{ opacity: 1, scale: 1, y: 0, transition: resolve(enterTransition) }}
							exit={{ opacity: 0, transition: { duration: 0 } }}
							className='absolute inset-x-0 bottom-full z-50 mb-2 flex max-h-64 origin-bottom flex-col gap-0.5 overflow-y-auto rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-xl'
						>
							{matches.map((command) => (
								<li
									key={command.name}
									id={`${menuId}-${command.name}`}
									role='option'
									aria-selected={command === active}
									// Keeps focus in the field, so picking doesn't close the menu first.
									onMouseDown={(event) => event.preventDefault()}
									onClick={() => context.menu.pick(command)}
									onMouseMove={() => context.menu.hover(command)}
									className='flex cursor-pointer items-baseline gap-2 rounded-md px-2 py-1.5 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground'
								>
									<span className='font-medium'>/{command.name}</span>
									<span className='truncate text-xs text-muted-foreground'>{command.description}</span>
								</li>
							))}
						</motion.ul>
					)}
				</AnimatePresence>
				{/* Figma: 12px radius and padding, 8px between the text and the row. */}
				<InputGroup className='gap-2 rounded-xl p-3'>{children}</InputGroup>
			</form>
		</PromptComposerContext>
	);
}

type PromptComposerTextareaProps = Omit<InputGroupTextareaProps, "value" | "defaultValue">;

/** The message field. Give it a `placeholder` and an `aria-label`. With commands, it's a combobox over the menu. */
function PromptComposerTextarea({ className, onChange, onKeyDown, onBlur, ...props }: PromptComposerTextareaProps) {
	const { value, setValue, submit, commands, fieldRef, menu } = usePromptComposer("PromptComposerTextarea");
	const withCommands = commands.length > 0;

	return (
		<InputGroupTextarea
			ref={fieldRef}
			value={value}
			onChange={(event) => {
				setValue(event.target.value);
				onChange?.(event);
			}}
			onBlur={(event) => {
				menu.release();
				onBlur?.(event);
			}}
			onKeyDown={(event) => {
				onKeyDown?.(event);
				if (event.defaultPrevented) {
					return;
				}
				if (menu.open && menu.active) {
					if (event.key === "ArrowDown" || event.key === "ArrowUp") {
						event.preventDefault();
						menu.move(event.key === "ArrowDown" ? 1 : -1);
						return;
					}
					if ((event.key === "Enter" || event.key === "Tab") && !event.shiftKey && !event.nativeEvent.isComposing) {
						event.preventDefault();
						menu.pick(menu.active);
						return;
					}
					if (event.key === "Escape") {
						// Closes the menu only, not a panel or dialog around the composer.
						event.preventDefault();
						event.stopPropagation();
						menu.dismiss();
						return;
					}
				}
				// `isComposing`: Enter that confirms an IME composition (Japanese, Chinese…) mustn't send.
				if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
					return;
				}
				event.preventDefault();
				submit();
			}}
			role={withCommands ? "combobox" : undefined}
			aria-autocomplete={withCommands ? "list" : undefined}
			aria-expanded={withCommands ? menu.open : undefined}
			aria-controls={menu.open ? menu.id : undefined}
			aria-activedescendant={menu.open && menu.active ? `${menu.id}-${menu.active.name}` : undefined}
			// Figma: two lines tall when empty, then it grows. The group holds the padding. Cap it with `max-h-*`.
			className={cn("min-h-10 p-0", className)}
			{...props}
		/>
	);
}

type PromptComposerFooterProps = Omit<InputGroupAddonProps, "align">;

/** The row under the field. Children sit at both ends: put the right-hand controls and Send in one wrapper. */
function PromptComposerFooter({ className, ...props }: PromptComposerFooterProps) {
	return <InputGroupAddon align='block-end' className={cn("justify-between p-0", className)} {...props} />;
}

type PromptComposerButtonProps = InputGroupButtonProps;

/** A round 32px button for the row: ghost by default (Figma's attach), `outline` for the mic. Give it an `aria-label`. */
function PromptComposerButton({ className, size = "icon-sm", ...props }: PromptComposerButtonProps) {
	// Figma: `icon/foreground`. Without it, the icon takes the addon's muted text color.
	return <InputGroupButton size={size} className={cn("rounded-full text-icon", className)} {...props} />;
}

type PromptComposerCommandsProps = Omit<PromptComposerButtonProps, "children" | "type" | "onClick">;

/**
 * The slash button: opens the commands menu, or closes it. Figma prompt-composer (archie.ds 51:6099): a 32px Ghost icon
 * button with lucide `square-slash`, 5px after attach. Needs `commands` on PromptComposer.
 */
function PromptComposerCommands({ className, ...props }: PromptComposerCommandsProps) {
	const { menu } = usePromptComposer("PromptComposerCommands");

	return (
		<PromptComposerButton
			type='button'
			aria-label='Commands'
			aria-expanded={menu.open}
			aria-controls={menu.open ? menu.id : undefined}
			// Keeps focus in the field, which the menu reads its keys from.
			onMouseDown={(event) => event.preventDefault()}
			onClick={() => (menu.open ? menu.dismiss() : menu.show())}
			className={cn("aria-expanded:bg-accent", className)}
			{...props}
		>
			<SquareSlash />
		</PromptComposerButton>
	);
}

type PromptComposerSubmitProps = Omit<PromptComposerButtonProps, "children" | "type" | "size" | "variant">;

// Voice and Stop: Figma's `tone/neutral/neutral` fill, `on-brand` icon (same value as `on-neutral`, as in
// SegmentedControl). Send and Add to queue: `brand` (decision 2026-10-29), so the button that sends stands out once
// there's something to send. Hover follows Button's solid variants.
const neutralButton =
	"bg-neutral text-neutral-foreground hover:not-aria-disabled:bg-[color-mix(in_srgb,var(--neutral)_80%,black)]";
const brandButton =
	"bg-brand text-brand-foreground hover:not-aria-disabled:bg-[color-mix(in_srgb,var(--brand)_85%,black)]";

/**
 * The button growing in whenever it changes role (voice → Send, Stop → Add to queue): Motion's Swap pattern
 * (`iconSwapVariants`) on the whole button. Not on first render, so the composer doesn't animate on load.
 */
function Swap({ animateIn, children }: { animateIn: boolean; children: React.ReactNode }) {
	const { prefersReducedMotion } = useMotionPreference();
	return (
		<motion.span
			className='flex'
			initial={animateIn ? "hidden" : false}
			animate='shown'
			variants={prefersReducedMotion ? iconSwapReducedVariants : iconSwapVariants}
		>
			{children}
		</motion.span>
	);
}

/**
 * Send, or voice mode while the box is empty and `onVoice` is set. Without `onVoice`, an empty box shows Send, focusable
 * but disabled. While `onStop` is set (Archie is working, Figma Archie-App "Queue"), an empty box shows Stop, and text
 * turns Send into "Add to queue" with a smaller Stop before it.
 */
function PromptComposerSubmit({ className, ...props }: PromptComposerSubmitProps) {
	const { value, pending, onVoice, onStop } = usePromptComposer("PromptComposerSubmit");
	const empty = value.trim() === "";
	const mounted = React.useRef(false);
	React.useEffect(() => {
		mounted.current = true;
	}, []);

	if (onStop && empty) {
		return (
			<Swap key='stop' animateIn={mounted.current}>
				<PromptComposerButton
					data-slot='prompt-composer-submit'
					variant='default'
					type='button'
					onClick={onStop}
					aria-label='Stop'
					className={cn(neutralButton, className)}
					{...props}
				>
					<Square className='size-3 fill-current' />
				</PromptComposerButton>
			</Swap>
		);
	}

	if (onStop) {
		return (
			<div className='flex items-center gap-2'>
				<PromptComposerButton variant='outline' type='button' onClick={onStop} aria-label='Stop'>
					<Square className='size-3 fill-current' />
				</PromptComposerButton>
				<Swap key='queue' animateIn={mounted.current}>
					<PromptComposerButton
						data-slot='prompt-composer-submit'
						variant='default'
						type='submit'
						aria-label='Add to queue'
						className={cn(brandButton, className)}
						{...props}
					>
						<CornerDownRight />
					</PromptComposerButton>
				</Swap>
			</div>
		);
	}

	const voice = empty && onVoice !== undefined && !pending;

	return (
		<Swap key={voice ? "voice" : "send"} animateIn={mounted.current}>
			<PromptComposerButton
				data-slot='prompt-composer-submit'
				variant='default'
				type={voice ? "button" : "submit"}
				onClick={voice ? onVoice : undefined}
				pending={pending}
				aria-disabled={!voice && empty ? true : undefined}
				aria-label={voice ? "Start voice mode" : "Send"}
				className={cn(voice ? neutralButton : brandButton, className)}
				{...props}
			>
				{voice ? <AudioLines /> : <ArrowUp />}
			</PromptComposerButton>
		</Swap>
	);
}

export {
	PromptComposer,
	PromptComposerTextarea,
	PromptComposerFooter,
	PromptComposerButton,
	PromptComposerCommands,
	PromptComposerSubmit,
	type PromptComposerCommand,
	type PromptComposerCommandsProps,
	type PromptComposerProps,
	type PromptComposerTextareaProps,
	type PromptComposerFooterProps,
	type PromptComposerButtonProps,
	type PromptComposerSubmitProps,
};
