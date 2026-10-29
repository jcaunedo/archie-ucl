import type * as React from "react";
import { Hand } from "lucide-react";

import { cn } from "@/lib/utils";

// Figma "prompt-alert" (archie.ds, node 51:6098): Archie asking for permission before it acts (progress PRD FR-09,
// approval checkpoints). Parts after shadcn's Alert (Alert, AlertTitle, AlertDescription), plus an actions row; the app
// passes its Buttons (Figma: Deny `outline`, Allow `neutral`, both `sm`).

type PromptAlertProps = React.ComponentProps<"div">;

/** Asks the person to approve or decline something Archie is about to do. It's announced once when it appears. */
function PromptAlert({ className, ...props }: PromptAlertProps) {
	return (
		<div
			data-slot='prompt-alert'
			role='alert'
			className={cn(
				// Figma: `background` fill, a 1px `foreground` border (dark, so it stands out in the thread), 12px corners and
				// padding, Figma's 0 1px 2px shadow (`shadow-xs`). 4px between title and description; the actions add 4px more.
				"flex w-full flex-col gap-1 rounded-xl border border-foreground bg-background p-3 shadow-xs",
				className,
			)}
			{...props}
		/>
	);
}

type PromptAlertTitleProps = React.ComponentProps<"div">;

/** The ask ("Ask permission"), after Figma's hand icon: lucide `hand`, flipped to point right. */
function PromptAlertTitle({ className, children, ...props }: PromptAlertTitleProps) {
	return (
		<div
			data-slot='prompt-alert-title'
			// Figma: 14/20 regular in `tone/destructive/destructive`, the icon 14px, 4px before the label.
			className={cn("flex items-center gap-1 text-sm text-destructive", className)}
			{...props}
		>
			<Hand aria-hidden className='size-3.5 shrink-0 -scale-x-100' />
			{children}
		</div>
	);
}

type PromptAlertDescriptionProps = React.ComponentProps<"div">;

/** What Archie wants to do and what it changes. */
function PromptAlertDescription({ className, ...props }: PromptAlertDescriptionProps) {
	return (
		<div
			data-slot='prompt-alert-description'
			// Figma: 14/20 `foreground`, 4px under the title.
			className={cn("text-sm text-foreground", className)}
			{...props}
		/>
	);
}

type PromptAlertActionsProps = React.ComponentProps<"div">;

/** The decision, at the end of the row: Deny then Allow, 8px apart and 8px under the description. */
function PromptAlertActions({ className, ...props }: PromptAlertActionsProps) {
	return (
		<div data-slot='prompt-alert-actions' className={cn("mt-1 flex items-center justify-end gap-2", className)} {...props} />
	);
}

export {
	PromptAlert,
	PromptAlertActions,
	PromptAlertDescription,
	PromptAlertTitle,
	type PromptAlertActionsProps,
	type PromptAlertDescriptionProps,
	type PromptAlertProps,
	type PromptAlertTitleProps,
};
