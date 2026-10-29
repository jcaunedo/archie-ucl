import * as React from "react";

import { cn } from "@/lib/utils";

// Figma "topbar" (archie.ds): the bar across the top of the app. Three areas: the logo and project on the left, MainNav
// (SegmentedControl) in the middle, actions and the account on the right. Topbar draws only the frame; apps fill the areas.

type TopbarProps = React.ComponentProps<"header">;

/** The app's top bar. Renders a `header`, so it's the page's banner landmark when it isn't inside `main` or an `article`. */
function Topbar({ className, ...props }: TopbarProps) {
	return (
		<header
			data-slot='topbar'
			className={cn(
				// Figma: no fill, so the app's background shows through (DESIGN.md "Topbar"). 8px top, bottom and left, 12px
				// right. The 32px row inside makes it 48px tall.
				"flex w-full shrink-0 items-center py-2 pr-3 pl-2",
				className,
			)}
			{...props}
		/>
	);
}

type TopbarStartProps = React.ComponentProps<"div">;

/** The left area: logo, org and project. It shares the leftover width equally with `TopbarEnd`. */
function TopbarStart({ className, ...props }: TopbarStartProps) {
	return (
		<div
			data-slot='topbar-start'
			className={cn("flex min-w-0 flex-1 items-center gap-1.5", className)}
			{...props}
		/>
	);
}

type TopbarCenterProps = React.ComponentProps<"div">;

/** The middle area, for the SegmentedControl. It stays centered on the bar whatever the two sides hold. */
function TopbarCenter({ className, ...props }: TopbarCenterProps) {
	return <div data-slot='topbar-center' className={cn("flex shrink-0 items-center", className)} {...props} />;
}

type TopbarEndProps = React.ComponentProps<"div">;

/** The right area: actions and the account, aligned to the right edge. */
function TopbarEnd({ className, ...props }: TopbarEndProps) {
	return (
		<div
			data-slot='topbar-end'
			className={cn("flex min-w-0 flex-1 items-center justify-end gap-3", className)}
			{...props}
		/>
	);
}

export {
	Topbar,
	TopbarStart,
	TopbarCenter,
	TopbarEnd,
	type TopbarProps,
	type TopbarStartProps,
	type TopbarCenterProps,
	type TopbarEndProps,
};
