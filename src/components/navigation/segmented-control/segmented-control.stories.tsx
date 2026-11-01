import type { Meta, StoryObj } from "@storybook/react-vite";
import { Database, FileIcon, Frame, MousePointer2, Palette } from "lucide-react";
import { expect } from "storybook/test";

import {
	SegmentedControl,
	SegmentedControlContent,
	SegmentedControlList,
	SegmentedControlTrigger,
} from "./segmented-control";

// The blueprint phases from Figma's MainNav, in order.
const phases = [
	{ value: "plan", label: "Plan", icon: Frame },
	{ value: "design", label: "Design", icon: Palette },
	{ value: "frontend", label: "Frontend", icon: MousePointer2 },
	{ value: "backend", label: "Backend", icon: Database },
	{ value: "assets", label: "Assets", icon: FileIcon },
] as const;

const meta = {
	title: "Navigation/SegmentedControl",
	component: SegmentedControl,
	parameters: {
		layout: "centered",
	},
	tags: ["autodocs"],
	args: {
		defaultValue: "plan",
	},
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Figma MainNav: icon and label on every item, Plan selected. The selected fill glides to the new item.
 * Test: clicking Design selects it and deselects Plan, and the one indicator moves with it.
 */
export const Default: Story = {
	render: (args) => (
		<SegmentedControl {...args}>
			<SegmentedControlList aria-label='Blueprint'>
				{phases.map(({ value, label, icon: Icon }) => (
					<SegmentedControlTrigger key={value} value={value}>
						<Icon />
						{label}
					</SegmentedControlTrigger>
				))}
			</SegmentedControlList>
		</SegmentedControl>
	),
	play: async ({ canvas, userEvent }) => {
		const plan = canvas.getByRole("tab", { name: "Plan" });
		const design = canvas.getByRole("tab", { name: "Design" });
		await expect(plan).toHaveAttribute("aria-selected", "true");

		await userEvent.click(design);
		await expect(design).toHaveAttribute("aria-selected", "true");
		await expect(plan).toHaveAttribute("aria-selected", "false");

		const indicators = canvas.getAllByRole("tab").filter((tab) => tab.querySelector("[data-slot='segmented-control-indicator']"));
		await expect(indicators).toEqual([design]);
	},
};

/** Test: arrow keys move focus and select the next item, and wrap from the last item to the first. */
export const KeyboardNavigation: Story = {
	...Default,
	play: async ({ canvas, userEvent }) => {
		await userEvent.click(canvas.getByRole("tab", { name: "Backend" }));
		await userEvent.keyboard("{ArrowRight}");
		const assets = canvas.getByRole("tab", { name: "Assets" });
		await expect(assets).toHaveFocus();
		await expect(assets).toHaveAttribute("aria-selected", "true");

		await userEvent.keyboard("{ArrowRight}");
		await expect(canvas.getByRole("tab", { name: "Plan" })).toHaveFocus();
	},
};

/** Figma "Show Icon L" off: 12px on both sides of the label. */
export const LabelsOnly: Story = {
	render: (args) => (
		<SegmentedControl {...args}>
			<SegmentedControlList aria-label='Blueprint'>
				{phases.map(({ value, label }) => (
					<SegmentedControlTrigger key={value} value={value}>
						{label}
					</SegmentedControlTrigger>
				))}
			</SegmentedControlList>
		</SegmentedControl>
	),
};

/** Each item owns a panel. Test: selecting Backend shows its panel and hides Plan's. */
export const WithContent: Story = {
	render: (args) => (
		<SegmentedControl {...args} className='w-[28rem]'>
			<SegmentedControlList aria-label='Blueprint'>
				{phases.map(({ value, label, icon: Icon }) => (
					<SegmentedControlTrigger key={value} value={value}>
						<Icon />
						{label}
					</SegmentedControlTrigger>
				))}
			</SegmentedControlList>
			{phases.map(({ value, label }) => (
				<SegmentedControlContent key={value} value={value} className='text-sm text-muted-foreground'>
					{label} for your app goes here.
				</SegmentedControlContent>
			))}
		</SegmentedControl>
	),
	play: async ({ canvas, userEvent }) => {
		await expect(canvas.getByRole("tabpanel")).toHaveTextContent("Plan for your app goes here.");

		await userEvent.click(canvas.getByRole("tab", { name: "Backend" }));
		await expect(canvas.getByRole("tabpanel")).toHaveTextContent("Backend for your app goes here.");
	},
};

/** Figma Outlined · Neutral, State=Disabled. Test: a disabled item can't be selected, and arrow keys skip it. */
export const Disabled: Story = {
	render: (args) => (
		<SegmentedControl {...args}>
			<SegmentedControlList aria-label='Blueprint'>
				{phases.map(({ value, label, icon: Icon }) => (
					<SegmentedControlTrigger key={value} value={value} disabled={value === "frontend"}>
						<Icon />
						{label}
					</SegmentedControlTrigger>
				))}
			</SegmentedControlList>
		</SegmentedControl>
	),
	play: async ({ canvas, userEvent }) => {
		const frontend = canvas.getByRole("tab", { name: "Frontend" });
		await expect(frontend).toBeDisabled();

		await userEvent.click(canvas.getByRole("tab", { name: "Design" }));
		await userEvent.keyboard("{ArrowRight}");
		await expect(canvas.getByRole("tab", { name: "Backend" })).toHaveFocus();
		await expect(frontend).toHaveAttribute("aria-selected", "false");
	},
};

export const AllVariants: Story = {
	render: () => (
		<div className='grid grid-cols-[auto_auto] items-center gap-x-6 gap-y-4 text-sm text-muted-foreground'>
			{[
				{ name: "Icon + label", icons: true, disabled: undefined },
				{ name: "Label only", icons: false, disabled: undefined },
				{ name: "Disabled item", icons: true, disabled: "frontend" },
			].map(({ name, icons, disabled }) => (
				<div key={name} className='contents'>
					<span>{name}</span>
					<SegmentedControl defaultValue='plan'>
						<SegmentedControlList aria-label={name}>
							{phases.map(({ value, label, icon: Icon }) => (
								<SegmentedControlTrigger key={value} value={value} disabled={value === disabled}>
									{icons && <Icon />}
									{label}
								</SegmentedControlTrigger>
							))}
						</SegmentedControlList>
					</SegmentedControl>
				</div>
			))}
		</div>
	),
};
