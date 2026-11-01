// Image imports in layouts resolve to their URL (Vite in Storybook). Layouts aren't bundled into the package.
declare module "*.png" {
	const src: string;
	export default src;
}

declare module "*.svg" {
	const src: string;
	export default src;
}
