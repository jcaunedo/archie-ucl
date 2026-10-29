"use client";

import * as React from "react";
import { ArrowUp, AudioLines } from "lucide-react";

import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupTextarea,
	type InputGroupAddonProps,
	type InputGroupButtonProps,
	type InputGroupTextareaProps,
} from "@/components/forms/input-group";
import { cn } from "@/lib/utils";

// Figma "prompt-composer" (archie.ds): the box where people message Archie. Built on InputGroup: a textarea, then a row
// with the app's controls (attach, model, mic) and the Send button. PromptComposer owns the text, Enter to send, and the
// Send button; the app owns everything else in the row.

type PromptComposerContextValue = {
	value: string;
	setValue: (value: string) => void;
	submit: () => void;
	pending: boolean;
	onVoice?: () => void;
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
};

/** The message box for talking to Archie. Enter sends, Shift+Enter adds a line. */
function PromptComposer({
	value: valueProp,
	defaultValue = "",
	onValueChange,
	onSubmit,
	pending = false,
	onVoice,
	className,
	children,
	...props
}: PromptComposerProps) {
	const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
	const controlled = valueProp !== undefined;
	const value = controlled ? valueProp : uncontrolledValue;

	const context = React.useMemo<PromptComposerContextValue>(() => {
		function setValue(next: string) {
			if (!controlled) {
				setUncontrolledValue(next);
			}
			onValueChange?.(next);
		}
		return {
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
		};
	}, [value, controlled, onValueChange, onSubmit, pending, onVoice]);

	return (
		<PromptComposerContext value={context}>
			<form
				data-slot='prompt-composer'
				onSubmit={(event) => {
					event.preventDefault();
					context.submit();
				}}
				className={cn("w-full", className)}
				{...props}
			>
				{/* Figma: 12px radius and padding, 8px between the text and the row. */}
				<InputGroup className='gap-2 rounded-xl p-3'>{children}</InputGroup>
			</form>
		</PromptComposerContext>
	);
}

type PromptComposerTextareaProps = Omit<InputGroupTextareaProps, "value" | "defaultValue">;

/** The message field. Give it a `placeholder` and an `aria-label`. */
function PromptComposerTextarea({ className, onChange, onKeyDown, ...props }: PromptComposerTextareaProps) {
	const { value, setValue, submit } = usePromptComposer("PromptComposerTextarea");

	return (
		<InputGroupTextarea
			value={value}
			onChange={(event) => {
				setValue(event.target.value);
				onChange?.(event);
			}}
			onKeyDown={(event) => {
				onKeyDown?.(event);
				// `isComposing`: Enter that confirms an IME composition (Japanese, Chinese…) mustn't send.
				if (event.defaultPrevented || event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
					return;
				}
				event.preventDefault();
				submit();
			}}
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

type PromptComposerSubmitProps = Omit<PromptComposerButtonProps, "children" | "type" | "size" | "variant">;

/**
 * Send, or voice mode while the box is empty and `onVoice` is set. Without `onVoice`, an empty box shows Send, focusable
 * but disabled.
 */
function PromptComposerSubmit({ className, ...props }: PromptComposerSubmitProps) {
	const { value, pending, onVoice } = usePromptComposer("PromptComposerSubmit");
	const empty = value.trim() === "";
	const voice = empty && onVoice !== undefined && !pending;

	return (
		<PromptComposerButton
			data-slot='prompt-composer-submit'
			variant='default'
			type={voice ? "button" : "submit"}
			onClick={voice ? onVoice : undefined}
			pending={pending}
			aria-disabled={!voice && empty ? true : undefined}
			aria-label={voice ? "Start voice mode" : "Send"}
			// Figma: `tone/neutral/neutral` fill, `on-brand` icon (same value as `on-neutral`, as in SegmentedControl). Hover
			// follows Button's solid variants.
			className={cn(
				"bg-neutral text-neutral-foreground hover:not-aria-disabled:bg-[color-mix(in_srgb,var(--neutral)_80%,black)]",
				className,
			)}
			{...props}
		>
			{voice ? <AudioLines /> : <ArrowUp />}
		</PromptComposerButton>
	);
}

export {
	PromptComposer,
	PromptComposerTextarea,
	PromptComposerFooter,
	PromptComposerButton,
	PromptComposerSubmit,
	type PromptComposerProps,
	type PromptComposerTextareaProps,
	type PromptComposerFooterProps,
	type PromptComposerButtonProps,
	type PromptComposerSubmitProps,
};
