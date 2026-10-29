import * as React from "react";

import { cn } from "@/lib/utils";

// Figma "Bubble" in chat-composer (archie.ds): the person's message, right-aligned. Figma binds `palettes/catalina/50`,
// which Archie's modes don't have; `info-subtle` is the nearest token (DESIGN.md "Chat panel").

type ChatMessageProps = React.ComponentProps<"div">;

/** A message the person sent to Archie, in a bubble on the right. */
function ChatMessage({ className, ...props }: ChatMessageProps) {
	return (
		<div
			data-slot='chat-message'
			className={cn(
				// Figma: 12px × 8px padding, 10px corners except the bottom right. Long messages wrap at 85% of the thread.
				"ml-auto w-fit max-w-[85%] rounded-[10px] rounded-br-none bg-info-subtle px-3 py-2 text-sm wrap-break-word whitespace-pre-wrap text-foreground",
				className,
			)}
			{...props}
		/>
	);
}

export { ChatMessage, type ChatMessageProps };
