import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArrowRight, Sparkles, Square } from "lucide-react";
import { expect, fn } from "storybook/test";

import { Button } from "./button";

const meta = {
	title: "Buttons/Button",
	component: Button,
	parameters: {
		layout: "centered",
	},
	argTypes: {
		variant: {
			control: "select",
			options: ["default", "neutral", "secondary", "outline", "ghost", "link", "destructive", "destructive-secondary"],
		},
		size: {
			control: "select",
			options: ["xs", "sm", "md", "lg", "xl", "icon-xs", "icon-sm", "icon-md", "icon-lg", "icon-xl"],
		},
	},
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		children: "Continue",
	},
};

const variants = [
	{ variant: "default", label: "Generate", figma: "Solid · Brand" },
	{ variant: "neutral", label: "Allow", figma: "Solid · Neutral (override)" },
	{ variant: "secondary", label: "Preview", figma: "Flat · Brand" },
	{ variant: "outline", label: "Share", figma: "Outlined · Neutral" },
	{ variant: "ghost", label: "Cancel", figma: "Ghost · Neutral" },
	{ variant: "link", label: "View docs", figma: "Link · Brand" },
	{ variant: "destructive", label: "Delete", figma: "Solid · Destructive" },
	{ variant: "destructive-secondary", label: "Remove", figma: "Flat · Destructive" },
] as const;

const sizes = ["xs", "sm", "md", "lg", "xl"] as const;

/** Figma's Button set: every variant, enabled, disabled and pending, at md · 32. */
export const AllVariants: Story = {
	render: () => (
		<div className='grid grid-cols-[auto_repeat(4,auto)] items-center justify-items-start gap-x-4 gap-y-3 text-sm text-muted-foreground'>
			<span />
			<span>Default</span>
			<span>With icon</span>
			<span>Disabled</span>
			<span>Pending</span>
			{variants.map(({ variant, label, figma }) => (
				<React.Fragment key={variant}>
					<span>
						{variant} <span className='text-foreground-subtle'>({figma})</span>
					</span>
					<Button variant={variant}>{label}</Button>
					<Button variant={variant}>
						<Sparkles data-icon='inline-start' aria-hidden='true' />
						{label}
					</Button>
					<Button variant={variant} disabled>
						{label}
					</Button>
					<Button variant={variant} pending>
						{label}
					</Button>
				</React.Fragment>
			))}
		</div>
	),
};

/** Figma Size=xs · 24 to xl · 40, Type=Text and Type=Icon. */
export const Sizes: Story = {
	render: () => (
		<div className='grid grid-cols-[auto_auto_auto_auto] items-center justify-items-start gap-x-4 gap-y-3 text-sm text-muted-foreground'>
			{sizes.map((size) => (
				<React.Fragment key={size}>
					<span>{size}</span>
					<Button size={size}>Continue</Button>
					<Button size={size} variant='outline'>
						<Sparkles data-icon='inline-start' aria-hidden='true' />
						Generate
					</Button>
					<Button size={`icon-${size}`} variant='outline' aria-label='Continue'>
						<ArrowRight aria-hidden='true' />
					</Button>
				</React.Fragment>
			))}
		</div>
	),
};

export const WithIcon: Story = {
	args: {
		children: (
			<>
				Continue
				<ArrowRight data-icon='inline-end' aria-hidden='true' />
			</>
		),
	},
};

export const Disabled: Story = {
	args: {
		children: "Continue",
		disabled: true,
	},
};

export const AsLink: Story = {
	render: () => (
		<Button asChild variant='outline'>
			<a href='#'>View blueprint</a>
		</Button>
	),
};

/**
 * Figma State=Loading: a spinner covers the label, which keeps its space, so the width doesn't change.
 * Test: a pending button is busy and blocked, ignores clicks, stays reachable by keyboard, and keeps its width.
 */
export const Pending: Story = {
	args: {
		pending: true,
		onClick: fn(),
		children: (
			<>
				<Sparkles data-icon='inline-start' aria-hidden='true' />
				Generating app
			</>
		),
	},
	play: async ({ args, canvas, userEvent }) => {
		const button = canvas.getByRole("button", { name: "Generating app" });
		await expect(button).toHaveAttribute("aria-busy", "true");
		await expect(button.querySelector("[data-slot='button-spinner']")).not.toBeNull();
		await expect(button).toHaveAttribute("aria-disabled", "true");

		// Still reachable by keyboard (a `disabled` button would be skipped), and Enter does nothing.
		await userEvent.tab();
		await expect(button).toHaveFocus();
		await userEvent.keyboard("{Enter}");

		await userEvent.click(button);
		await userEvent.dblClick(button);
		await expect(args.onClick).not.toHaveBeenCalled();
	},
};

function GenerateWithStop() {
	const [generating, setGenerating] = React.useState(false);

	return (
		<div className='flex items-center gap-3'>
			<Button pending={generating} onClick={() => setGenerating(true)}>
				<Sparkles data-icon='inline-start' aria-hidden='true' />
				{generating ? "Generating app" : "Generate app"}
			</Button>
			{generating && (
				<Button variant='outline' onClick={() => setGenerating(false)}>
					<Square data-icon='inline-start' aria-hidden='true' />
					Stop
				</Button>
			)}
		</div>
	);
}

/**
 * Click "Generate app": it turns pending and ignores more clicks, and a Stop button appears beside it.
 * Test: the whole Generate → Stop cycle, including a repeat click while pending.
 */
export const PendingWithStop: Story = {
	render: () => <GenerateWithStop />,
	play: async ({ canvas, userEvent, step }) => {
		await step("Generate starts the work", async () => {
			await userEvent.click(canvas.getByRole("button", { name: "Generate app" }));
			await expect(canvas.getByRole("button", { name: "Generating app" })).toHaveAttribute("aria-busy", "true");
			await expect(canvas.getByRole("button", { name: "Stop" })).toBeVisible();
		});

		await step("Clicking again while pending changes nothing", async () => {
			await userEvent.click(canvas.getByRole("button", { name: "Generating app" }));
			await expect(canvas.getAllByRole("button")).toHaveLength(2);
			await expect(canvas.getByRole("button", { name: "Generating app" })).toHaveAttribute("aria-busy", "true");
		});

		await step("Stop ends it", async () => {
			await userEvent.click(canvas.getByRole("button", { name: "Stop" }));
			await expect(canvas.getByRole("button", { name: "Generate app" })).not.toHaveAttribute("aria-busy");
			await expect(canvas.queryByRole("button", { name: "Stop" })).not.toBeInTheDocument();
		});
	},
};

/**
 * `aria-disabled` keeps the button focusable, so the reason can be read out and shown on hover.
 * Test: it takes focus, announces the reason, and ignores clicks.
 */
export const FocusableDisabled: Story = {
	args: { onClick: fn() },
	render: (args) => (
		<div className='flex flex-col items-start gap-2'>
			<Button {...args} aria-disabled='true' aria-describedby='continue-reason' title='Enter a valid work email first'>
				Continue
			</Button>
			<p id='continue-reason' className='text-sm text-muted-foreground'>
				Enter a valid work email first.
			</p>
		</div>
	),
	play: async ({ args, canvas, userEvent }) => {
		const button = canvas.getByRole("button", { name: "Continue" });

		await userEvent.tab();
		await expect(button).toHaveFocus();
		await expect(button).toHaveAccessibleDescription("Enter a valid work email first.");

		await userEvent.click(button);
		await userEvent.keyboard("{Enter}");
		await expect(args.onClick).not.toHaveBeenCalled();
	},
};

export const LongLabel: Story = {
	render: () => (
		<div className='flex w-60 flex-col items-start gap-3 rounded-md border border-dashed border-border p-3'>
			<Button>
				<span className='truncate'>Generate the blueprint for every module in this app</span>
			</Button>
			<Button variant='outline'>
				<ArrowRight data-icon='inline-start' aria-hidden='true' />
				<span className='truncate'>Continue to the deployment settings for production</span>
			</Button>
		</div>
	),
};

function BlueprintForm() {
	const [status, setStatus] = React.useState("Nothing saved yet.");

	return (
		<form
			className='flex flex-col items-start gap-3'
			onSubmit={(event) => {
				event.preventDefault();
				setStatus("Blueprint saved.");
			}}
		>
			<div className='flex items-center gap-3'>
				<Button variant='outline' onClick={() => setStatus("Module added. Not saved.")}>
					Add module
				</Button>
				<Button type='submit'>Save blueprint</Button>
			</div>
			<p role='status' className='text-sm text-muted-foreground'>
				{status}
			</p>
		</form>
	);
}

/**
 * Inside a form only the `type="submit"` button submits. "Add module" no longer submits by accident.
 * Test: "Add module" runs its own handler without submitting; "Save blueprint" submits.
 */
export const InForm: Story = {
	render: () => <BlueprintForm />,
	play: async ({ canvas, userEvent }) => {
		const status = canvas.getByRole("status");

		await userEvent.click(canvas.getByRole("button", { name: "Add module" }));
		await expect(status).toHaveTextContent("Module added. Not saved.");

		await userEvent.click(canvas.getByRole("button", { name: "Save blueprint" }));
		await expect(status).toHaveTextContent("Blueprint saved.");
	},
};
