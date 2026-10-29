import type { ReactNode } from "react";
import {
	Bell,
	Bike,
	Box,
	CreditCard,
	Folder,
	Frame,
	LayoutDashboard,
	LayoutGrid,
	Package,
	Search,
	ShoppingCart,
	Store,
	UserCog,
	Warehouse,
	type LucideIcon,
} from "lucide-react";
import { motion } from "motion/react";

import { Typography } from "@/components/typography";
import { pendingSurfaceVariants, revealVariants, useMotionPreference } from "@/lib/motion";

// Layout-only (prds/chat-behavior-system.md §4 "Plan canvas"): the blueprint as Plan shows it, after the Eight Count
// references. It fills in section by section as Archie drafts it, with skeletons for the sections still to come
// (Skeleton Screens), so the chat and the canvas tell the same story (rule 11).

/** What Plan needs from a blueprint. The sample data's `Blueprint` fits it. */
type PlanBlueprint = {
	name: string;
	tagline: string;
	description: string;
	userTypes: { id: string; name: string }[];
	modules: { id: string; name: string; icon: string }[];
	coreServices: { id: string; name: string; icon: string }[];
	integrations: { id: string; name: string }[];
};

/** lucide icons by the names the blueprint uses. Anything else gets a box. */
const icons: Record<string, LucideIcon> = {
	bell: Bell,
	bike: Bike,
	"credit-card": CreditCard,
	folder: Folder,
	"layout-dashboard": LayoutDashboard,
	"layout-grid": LayoutGrid,
	package: Package,
	search: Search,
	"shopping-cart": ShoppingCart,
	store: Store,
	"user-cog": UserCog,
	warehouse: Warehouse,
};

/** How many sections the canvas has, in the order Archie drafts them. */
const planSections = 5;

function Chip({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
	return (
		<span className='flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm text-foreground'>
			{icon}
			{children}
		</span>
	);
}

/** A section still being drafted: its shape, pulsing (Pending pattern, surface). */
function SectionSkeleton() {
	const { prefersReducedMotion } = useMotionPreference();
	return (
		<motion.div
			aria-hidden
			className='flex flex-col gap-3 border-t border-border pt-6'
			animate={prefersReducedMotion ? "idle" : "pending"}
			variants={pendingSurfaceVariants}
		>
			<div className='h-4 w-32 rounded bg-muted' />
			<div className='h-3 w-64 rounded bg-muted' />
			<div className='flex gap-2'>
				<div className='h-9 w-28 rounded-lg bg-muted' />
				<div className='h-9 w-36 rounded-lg bg-muted' />
				<div className='h-9 w-24 rounded-lg bg-muted' />
			</div>
		</motion.div>
	);
}

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
	const { prefersReducedMotion } = useMotionPreference();
	return (
		<motion.section
			className='flex flex-col gap-3 border-t border-border pt-6'
			variants={revealVariants}
			initial={prefersReducedMotion ? false : "initial"}
			animate='animate'
		>
			<div className='flex flex-col gap-0.5'>
				<Typography as='h2' size='base' weight='semibold'>
					{title}
				</Typography>
				<p className='text-sm text-muted-foreground'>{description}</p>
			</div>
			<div className='flex flex-wrap gap-2'>{children}</div>
		</motion.section>
	);
}

function Count({ label, value }: { label: string; value: number }) {
	return (
		<span className='flex items-center gap-1.5 text-sm text-foreground'>
			{label}
			<span className='rounded-sm border border-border px-1.5 text-xs leading-5'>{value}</span>
		</span>
	);
}

/**
 * Plan: the blueprint's name, description, user types, modules, core services and integrations. `revealed` is how many
 * sections Archie has drafted (0 to 5); while `drafting`, the rest show as skeletons. Nothing drafted and not drafting
 * is the empty state.
 */
function PlanCanvas({ blueprint, revealed, drafting }: { blueprint: PlanBlueprint; revealed: number; drafting: boolean }) {
	if (revealed === 0 && !drafting) {
		return (
			<div className='flex h-full flex-col items-center justify-center gap-2 p-8 text-center'>
				<Frame aria-hidden className='size-6 text-icon-muted' />
				<p className='text-sm font-semibold text-foreground'>Your blueprint will show up here</p>
				<p className='max-w-sm text-sm text-muted-foreground'>
					Describe your app in the chat. After a few questions, Archie drafts its user types, modules, services and
					integrations here.
				</p>
			</div>
		);
	}

	const sections = [
		<Section key='user-types' title='User types' description='Who your product is built for.'>
			{blueprint.userTypes.map((userType) => (
				<Chip key={userType.id}>{userType.name}</Chip>
			))}
		</Section>,
		<Section key='modules' title='Modules' description='Your application, organized into independent, functional areas.'>
			{blueprint.modules.map((module) => {
				const Icon = icons[module.icon] ?? Box;
				return (
					<Chip key={module.id} icon={<Icon aria-hidden className='size-4 text-icon' />}>
						{module.name}
					</Chip>
				);
			})}
		</Section>,
		<Section key='core-services' title='Core services' description='The foundational capabilities of your application.'>
			{blueprint.coreServices.map((service) => {
				const Icon = icons[service.icon] ?? Box;
				return (
					<Chip key={service.id} icon={<Icon aria-hidden className='size-4 text-icon' />}>
						{service.name}
					</Chip>
				);
			})}
		</Section>,
		<Section key='integrations' title='Integrations' description='External services your application connects to.'>
			{blueprint.integrations.map((integration) => (
				<Chip
					key={integration.id}
					icon={
						<span aria-hidden className='flex size-5 items-center justify-center rounded-sm bg-muted text-xs font-semibold'>
							{integration.name[0]}
						</span>
					}
				>
					{integration.name}
				</Chip>
			))}
		</Section>,
	];
	const shown = sections.slice(0, Math.max(0, revealed - 1));
	const pending = drafting ? sections.length - shown.length : 0;

	return (
		<div aria-busy={drafting || undefined} className='mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-6'>
			{revealed >= 1 ? (
				<motion.div className='flex flex-col gap-4' variants={revealVariants} initial='initial' animate='animate'>
					<div className='flex flex-col gap-1'>
						<Typography as='h2' size='2xl' weight='semibold'>
							{blueprint.name}
						</Typography>
						<p className='text-sm text-muted-foreground'>{blueprint.tagline}</p>
					</div>
					<div className='flex flex-wrap gap-x-5 gap-y-2'>
						<Count label='Modules' value={revealed >= 3 ? blueprint.modules.length : 0} />
						<Count label='User types' value={revealed >= 2 ? blueprint.userTypes.length : 0} />
						<Count label='Core services' value={revealed >= 4 ? blueprint.coreServices.length : 0} />
						<Count label='Integrations' value={revealed >= 5 ? blueprint.integrations.length : 0} />
					</div>
					<div className='flex flex-col gap-2'>
						<Typography as='h2' size='base' weight='semibold'>
							Description
						</Typography>
						<p className='rounded-lg border border-border bg-background p-4 text-sm text-foreground'>{blueprint.description}</p>
					</div>
				</motion.div>
			) : (
				<SectionSkeleton />
			)}
			{shown}
			{Array.from({ length: pending }, (_, index) => (
				<SectionSkeleton key={index} />
			))}
		</div>
	);
}

export { PlanCanvas, planSections, type PlanBlueprint };
