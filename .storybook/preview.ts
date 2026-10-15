import type { Preview } from "@storybook/react-vite";
import "../src/styles/globals.css";

const preview: Preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
		options: {
			storySort: {
				// Docs pages first, in reading order. Component categories follow in file order.
				order: [
					"Introduction",
					"Foundations",
					["Colors", "Typography", "Motion"],
					"Guidelines",
					[
						"Overview",
						"Voice and copy",
						"Tables and lists",
						"Page layout",
						"Building from Figma",
						"Developer contracts",
					],
				],
			},
		},
	},
};

export default preview;
