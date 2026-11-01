"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { Button } from "@/components/buttons/button";
import { Input } from "@/components/forms/input";
import { Textarea } from "@/components/forms/textarea";
import { cn } from "@/lib/utils";

// shadcn's InputGroup, skinned with UCL Input's tokens (DESIGN.md "Input: how Figma's Textfield maps to tokens"): the
// group draws the field's border, fill, shadow and states, and the control inside goes bare. States come from the
// control (`[data-slot=input-group-control]`): focus, `aria-invalid`, read-only and disabled.

type InputGroupProps = React.ComponentProps<"div">;

/** A text field with addons (icons, text, buttons) inside its border. */
function InputGroup({ className, ...props }: InputGroupProps) {
	return (
		<div
			data-slot='input-group'
			role='group'
			className={cn(
				"group/input-group relative flex w-full min-w-0 items-center rounded-lg border border-input bg-background shadow-xs transition-[color,background-color,border-color,box-shadow] outline-none",
				"h-9 has-[>textarea]:h-auto",
				// Variants based on alignment.
				"has-[>[data-align=inline-start]]:[&>input]:pl-2",
				"has-[>[data-align=inline-end]]:[&>input]:pr-2",
				"has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>[data-align=block-start]]:[&>input]:pb-3",
				"has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-end]]:[&>input]:pt-3",
				// Input's states, read from the control. Written out in full: Tailwind can't see classes built at runtime.
				"not-has-[[data-slot=input-group-control]:read-only]:not-has-[[data-slot=input-group-control][aria-invalid=true]]:hover:border-input-ring",
				"has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:shadow-none has-[[data-slot=input-group-control]:focus-visible]:ring-[3px] has-[[data-slot=input-group-control]:focus-visible]:ring-ring-outside",
				"has-[[data-slot=input-group-control][aria-invalid=true]]:border-destructive has-[[data-slot=input-group-control][aria-invalid=true]]:bg-destructive-subtle has-[[data-slot=input-group-control][aria-invalid=true]]:ring-destructive/20",
				// `:read-only` also matches a disabled control, which shares the Read-only fill and border in Figma.
				"has-[[data-slot=input-group-control]:read-only]:border-input-disabled has-[[data-slot=input-group-control]:read-only]:bg-background-subtle has-[[data-slot=input-group-control]:read-only]:shadow-none",
				className,
			)}
			{...props}
		/>
	);
}

const inputGroupAddonVariants = cva(
	"flex h-auto items-center justify-center gap-2 py-1.5 text-sm font-medium text-muted-foreground select-none group-data-[disabled=true]/input-group:opacity-50 [&>kbd]:rounded-[calc(var(--radius)-5px)] [&>svg:not([class*='size-'])]:size-4",
	{
		variants: {
			align: {
				"inline-start": "order-first pl-3 has-[>button]:ml-[-0.45rem] has-[>kbd]:ml-[-0.35rem]",
				"inline-end": "order-last pr-3 has-[>button]:mr-[-0.45rem] has-[>kbd]:mr-[-0.35rem]",
				"block-start":
					"order-first w-full justify-start px-3 pt-3 group-has-[>input]/input-group:pt-2.5 [.border-b]:pb-3",
				"block-end": "order-last w-full justify-start px-3 pb-3 group-has-[>input]/input-group:pb-2.5 [.border-t]:pt-3",
			},
		},
		defaultVariants: {
			align: "inline-start",
		},
	},
);

type InputGroupAddonProps = React.ComponentProps<"div"> & VariantProps<typeof inputGroupAddonVariants>;

/** Icons, text or buttons placed beside the control (`inline-*`) or above or below it (`block-*`). */
function InputGroupAddon({ className, align = "inline-start", onClick, ...props }: InputGroupAddonProps) {
	return (
		<div
			role='group'
			data-slot='input-group-addon'
			data-align={align}
			className={cn(inputGroupAddonVariants({ align }), className)}
			onClick={(event) => {
				onClick?.(event);
				// A click on the addon's empty space focuses the field, as a click inside its border would. shadcn only looks
				// for an input; this also finds a textarea.
				if ((event.target as HTMLElement).closest("button")) {
					return;
				}
				event.currentTarget.parentElement?.querySelector<HTMLElement>("[data-slot=input-group-control]")?.focus();
			}}
			{...props}
		/>
	);
}

// shadcn's sizes, each drawn by the matching Figma Button size: xs and icon-xs are 24px (Button `xs`), sm and icon-sm
// 32px (Button `md`). Unlike shadcn, outlined buttons keep Button's shadow, as Figma's do inside the prompt composer.
const inputGroupButtonVariants = cva("", {
	variants: {
		size: {
			xs: "",
			sm: "",
			"icon-xs": "",
			"icon-sm": "",
		},
	},
	defaultVariants: {
		size: "xs",
	},
});

const buttonSize = { xs: "xs", sm: "md", "icon-xs": "icon-xs", "icon-sm": "icon-md" } as const;

type InputGroupButtonProps = Omit<React.ComponentProps<typeof Button>, "size"> &
	VariantProps<typeof inputGroupButtonVariants>;

/** A Button sized to sit inside the field. Ghost by default. */
function InputGroupButton({ className, variant = "ghost", size = "xs", ...props }: InputGroupButtonProps) {
	return (
		<Button
			data-size={size}
			variant={variant}
			size={buttonSize[size ?? "xs"]}
			className={cn(inputGroupButtonVariants({ size }), className)}
			{...props}
		/>
	);
}

type InputGroupTextProps = React.ComponentProps<"span">;

/** Static text in an addon, such as a unit or a prefix. */
function InputGroupText({ className, ...props }: InputGroupTextProps) {
	return (
		<span
			className={cn(
				"flex items-center gap-2 text-sm text-muted-foreground [&>svg]:pointer-events-none [&>svg:not([class*='size-'])]:size-4",
				className,
			)}
			{...props}
		/>
	);
}

// The group draws the border, fill, shadow and ring, so the control drops its own, in every state.
const bareControl =
	"flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 read-only:bg-transparent aria-invalid:bg-transparent";

type InputGroupInputProps = React.ComponentProps<typeof Input>;

/** The single-line control. Takes Input's props. */
function InputGroupInput({ className, ...props }: InputGroupInputProps) {
	return <Input data-slot='input-group-control' className={cn(bareControl, "h-full", className)} {...props} />;
}

type InputGroupTextareaProps = React.ComponentProps<typeof Textarea>;

/** The multi-line control. Takes Textarea's props and grows with its content. */
function InputGroupTextarea({ className, ...props }: InputGroupTextareaProps) {
	return (
		<Textarea data-slot='input-group-control' className={cn(bareControl, "resize-none py-3", className)} {...props} />
	);
}

export {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupText,
	InputGroupInput,
	InputGroupTextarea,
	inputGroupAddonVariants,
	inputGroupButtonVariants,
	type InputGroupProps,
	type InputGroupAddonProps,
	type InputGroupButtonProps,
	type InputGroupTextProps,
	type InputGroupInputProps,
	type InputGroupTextareaProps,
};
