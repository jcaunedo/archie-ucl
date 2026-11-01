import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import remarkGfm from "remark-gfm";

const config: StorybookConfig = {
	stories: ["../src/**/*.mdx", "../src/**/*.stories.@(ts|tsx)"],
	addons: [
		{
			name: "@storybook/addon-docs",
			// GitHub-flavored Markdown (tables, task lists) in the MDX docs pages, which plain MDX doesn't parse.
			options: { mdxPluginOptions: { mdxCompileOptions: { remarkPlugins: [remarkGfm] } } },
		},
		// Runs every story as a Vitest test in a real browser (Playwright, Chromium). See vitest.config.ts.
		"@storybook/addon-vitest",
	],
	framework: {
		name: "@storybook/react-vite",
		options: {},
	},
	viteFinal: async (viteConfig) => {
		viteConfig.plugins = viteConfig.plugins || [];
		viteConfig.plugins.push(tailwindcss());
		viteConfig.resolve = viteConfig.resolve || {};
		viteConfig.resolve.alias = {
			...viteConfig.resolve.alias,
			"@": path.resolve(import.meta.dirname, "../src"),
		};
		return viteConfig;
	},
};

export default config;
