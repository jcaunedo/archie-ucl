import * as React from "react";

import { cn } from "@/lib/utils";

// Figma "Bubble" in chat-composer (archie.ds): the person's message, right-aligned, light gray (`muted`, decision
// 2026-10-29; Figma's fill is still the light blue `palettes/catalina/50`, DESIGN.md "Chat panel").

type ChatMessageProps = React.ComponentProps<"div">;

/** A message the person sent to Archie, in a bubble on the right. */
function ChatMessage({ className, ...props }: ChatMessageProps) {
	return (
		<div
			data-slot='chat-message'
			className={cn(
				// Figma: 12px × 8px padding, 10px corners except the bottom right. Long messages wrap at 85% of the thread.
				"ml-auto w-fit max-w-[85%] rounded-[10px] rounded-br-none bg-muted px-3 py-2 text-sm wrap-break-word whitespace-pre-wrap text-foreground",
				className,
			)}
			{...props}
		/>
	);
}

export { ChatMessage, type ChatMessageProps };
