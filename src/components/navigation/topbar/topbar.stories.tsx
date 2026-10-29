/// <reference types="vite/client" />
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bell, ChevronDown, Database, FileIcon, Frame, MousePointer2, Palette, Plug, Share } from "lucide-react";
import { expect } from "storybook/test";

import { Button } from "@/components/buttons/button";
import {
	SegmentedControl,
	SegmentedControlList,
	SegmentedControlTrigger,
} from "@/components/navigation/segmented-control";

import { Topbar, TopbarCenter, TopbarEnd, TopbarStart } from "./topbar";
import archieA from "./story-assets/archie-a.svg";
import avatar from "./story-assets/avatar.png";
import creditsIcon from "./story-assets/credits.svg";
import githubIcon from "./story-assets/github.svg";

// Stand-ins for parts UCL doesn't have yet (Avatar, the logo mark, the project switcher, the credits meter, the
// notification dot). They match Figma but aren't exported; each gets built from its own Figma component later.

const phases = [
	{ value: "plan", label: "Plan", icon: Frame },
	{ value: "design", label: "Design", icon: Palette },
	{ value: "frontend", label: "Frontend", icon: MousePointer2 },
	{ value: "backend", label: "Backend", icon: Database },
	{ value: "assets", label: "Assets", icon: FileIcon },
] as const;

/** Figma "Button / Icon", Outlined: a 32px link home with the 18px brand Archie A. */
function LogoStandIn() {
	return (
		<Button asChild variant='outline' size='icon-md'>
			<a href='#' aria-label='Archie home'>
				<img alt='' src={archieA} className='size-4.5' />
			</a>
		</Button>
	);
}

/** Figma "Frame 23": org name, a slash, and the project title that opens the project menu. */
function ProjectStandIn() {
	return (
		<div className='flex h-7 min-w-0 items-center gap-1.5 px-1.5 text-base'>
			<span className='truncate font-semibold text-muted-foreground'>Org name</span>
			<span aria-hidden className='text-foreground-subtle'>
				/
			</span>
			<button type='button' className='flex min-w-0 items-center gap-[3px] font-semibold text-foreground'>
				<span className='truncate'>Project title</span>
				<ChevronDown aria-hidden className='size-4 shrink-0' />
			</button>
		</div>
	);
}

function MainNav() {
	return (
		<SegmentedControl defaultValue='plan'>
			<SegmentedControlList aria-label='Blueprint'>
				{phases.map(({ value, label, icon: Icon }) => (
					<SegmentedControlTrigger key={value} value={value}>
						<Icon />
						{label}
					</SegmentedControlTrigger>
				))}
			</SegmentedControlList>
		</SegmentedControl>
	);
}

/** Figma's right-hand group: Button md · 32, Outlined · Neutral, 4px apart. Credits, MCP, GitHub, notifications, Share. */
function Actions() {
	return (
		<div className='flex items-center gap-1'>
			<Button variant='outline'>
				{/* Figma "credits": a 16px pie of the credits left. */}
				<img data-icon='inline-start' alt='' src={creditsIcon} className='size-4' />
				397 credits
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

function AccountStandIn() {
	return (
		<button type='button' aria-label='Account' className='size-8 shrink-0 overflow-hidden rounded-full'>
			<img alt='' src={avatar} className='size-full' />
		</button>
	);
}

const meta = {
	title: "Navigation/Topbar",
	component: Topbar,
	parameters: {
		layout: "fullscreen",
	},
	// Topbar has no fill. This is the background the Archie project page puts behind it.
	decorators: [
		(Story) => (
			<div className='bg-muted'>
				<Story />
			</div>
		),
	],
	tags: ["autodocs"],
} satisfies Meta<typeof Topbar>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Figma "topbar": logo and project on the left, MainNav centered, actions and account on the right.
 * Test: the bar is the page's banner, and MainNav sits in the middle of the bar's padded area even though the two sides
 * differ in width. The padding is 8px left and 12px right, so that's 2px left of the bar's middle, as in Figma.
 */
export const Default: Story = {
	render: (args) => (
		<Topbar {...args}>
			<TopbarStart>
				<LogoStandIn />
				<ProjectStandIn />
			</TopbarStart>
			<TopbarCenter>
				<MainNav />
			</TopbarCenter>
			<TopbarEnd>
				<Actions />
				<AccountStandIn />
			</TopbarEnd>
		</Topbar>
	),
	play: async ({ canvas }) => {
		const bar = canvas.getByRole("banner");
		const { paddingLeft, paddingRight } = getComputedStyle(bar);
		const box = bar.getBoundingClientRect();
		const padded = { left: box.left + parseFloat(paddingLeft), right: box.right - parseFloat(paddingRight) };
		const nav = canvas.getByRole("tablist", { name: "Blueprint" }).getBoundingClientRect();
		const navMiddle = nav.left + nav.width / 2;
		await expect(Math.abs((padded.left + padded.right) / 2 - navMiddle)).toBeLessThan(1);
	},
};

/** Without `TopbarCenter`, the two sides split the bar. */
export const StartAndEnd: Story = {
	render: (args) => (
		<Topbar {...args}>
			<TopbarStart>
				<LogoStandIn />
				<ProjectStandIn />
			</TopbarStart>
			<TopbarEnd>
				<Actions />
				<AccountStandIn />
			</TopbarEnd>
		</Topbar>
	),
};

export const AllVariants: Story = {
	render: () => (
		<div className='flex flex-col gap-6 py-6 text-sm text-muted-foreground'>
			{[
				{ name: "Start, center and end", center: true },
				{ name: "Start and end", center: false },
			].map(({ name, center }) => (
				<div key={name} className='flex flex-col gap-2'>
					<span className='px-3'>{name}</span>
					<Topbar aria-label={name}>
						<TopbarStart>
							<LogoStandIn />
							<ProjectStandIn />
						</TopbarStart>
						{center && (
							<TopbarCenter>
								<MainNav />
							</TopbarCenter>
						)}
						<TopbarEnd>
							<Actions />
							<AccountStandIn />
						</TopbarEnd>
					</Topbar>
				</div>
			))}
		</div>
	),
};
