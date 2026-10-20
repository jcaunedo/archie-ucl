import type { Meta, StoryObj } from "@storybook/react-vite";

import { Typography, type TypographySize, type TypographyWeight } from "./typography";

const sizes: TypographySize[] = ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl"];
const weights: TypographyWeight[] = ["regular", "medium", "semibold", "bold", "black"];
/** UCL's value for each `weight` (theme.css `--font-weight-*`), and Tailwind's for comparison. */
const weightValues: Record<TypographyWeight, [ucl: number, tailwind: number]> = {
	regular: [350, 400],
	medium: [450, 500],
	semibold: [550, 600],
	bold: [650, 700],
	black: [900, 900],
};

const meta = {
	title: "Typography/Typography",
	component: Typography,
	parameters: {
		layout: "padded",
	},
	argTypes: {
		size: { control: "select", options: sizes },
		weight: { control: "select", options: weights },
		as: { control: "select", options: ["p", "span", "h1", "h2", "h3", "h4", "label"] },
	},
	args: {
		children: "Archie turns your idea into a blueprint before writing any code.",
	},
} satisfies Meta<typeof Typography>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A paragraph: `base` regular, Figma `base/base`. */
export const Default: Story = {};

/** Every size at regular weight, with its font size and line height. */
export const Sizes: Story = {
	render: () => (
		<div className='flex flex-col gap-4'>
			{sizes.map((size) => (
				<div key={size} className='flex items-baseline gap-6'>
					<Typography as='span' size='xs' className='w-24 shrink-0 font-mono text-muted-foreground'>
						{size}
					</Typography>
					<Typography size={size} className='truncate'>
						Clarity before code
					</Typography>
				</div>
			))}
		</div>
	),
};

/** Every weight at `base`, with UCL's value and Tailwind's. Regular to bold are 50 lighter than Tailwind's. */
export const Weights: Story = {
	render: () => (
		<div className='flex flex-col gap-2'>
			{weights.map((weight) => {
				const [ucl, tailwind] = weightValues[weight];
				return (
					<div key={weight} className='flex items-baseline gap-6'>
						<Typography as='span' size='xs' className='w-48 shrink-0 font-mono text-muted-foreground'>
							{weight} · {ucl}
							{ucl !== tailwind && ` (Tailwind ${tailwind})`}
						</Typography>
						<Typography weight={weight}>Generate the blueprint</Typography>
					</div>
				);
			})}
		</div>
	),
};

/** `h1`–`h4` without `size`/`weight` use the heading defaults. */
export const Headings: Story = {
	render: () => (
		<div className='flex flex-col gap-3'>
			<Typography as='h1'>h1 · 2xl bold · Inventory tracker</Typography>
			<Typography as='h2'>h2 · xl bold · Modules</Typography>
			<Typography as='h3'>h3 · lg bold · User types</Typography>
			<Typography as='h4'>h4 · base bold · Permissions</Typography>
		</div>
	),
};

/** Figma "Page Title" (`3xl/3xl -bold`): still an `h1`, one size larger. */
export const PageTitle: Story = {
	render: () => (
		<div className='flex flex-col gap-2'>
			<Typography as='h1' size='3xl'>
				Your apps
			</Typography>
			<Typography className='text-muted-foreground'>Every app you've generated with Archie.</Typography>
		</div>
	),
};

/** Color isn't part of Typography: pass a text token through `className`. */
export const WithColor: Story = {
	render: () => (
		<div className='flex flex-col gap-1'>
			<Typography weight='medium'>Blueprint ready</Typography>
			<Typography size='sm' className='text-muted-foreground'>
				4 modules, 3 user types, 12 services.
			</Typography>
		</div>
	),
};

/** Every Figma text style: 11 sizes × 5 weights. */
export const AllVariants: Story = {
	render: () => (
		<div className='flex flex-col gap-3'>
			{sizes.map((size) => (
				<div key={size} className='flex items-baseline gap-6'>
					<Typography as='span' size='xs' className='w-10 shrink-0 font-mono text-muted-foreground'>
						{size}
					</Typography>
					{weights.map((weight) => (
						<Typography key={weight} as='span' size={size} weight={weight} className='whitespace-nowrap'>
							Aa
						</Typography>
					))}
				</div>
			))}
		</div>
	),
};
