export { cn } from "@/lib/utils";

export {
	formatRelativeDate,
	RELATIVE_CUTOVER,
	type RelativeDate,
} from "@/lib/relative-date";

export {
	motionDuration,
	motionDistance,
	motionScale,
	motionRotation,
	motionStagger,
	standardTransition,
	enterTransition,
	exitTransition,
	subtleSpring,
	responsiveSpring,
	layoutSpring,
	fadeVariants,
	rowRemoveVariants,
	revealVariants,
	expandVariants,
	dismissVariants,
	overlayVariants,
	panelVariants,
	slideVariants,
	staggerContainerVariants,
	pendingIconVariants,
	pendingIconReducedVariants,
	pendingSurfaceVariants,
	pendingTextVariants,
	pendingSpinnerVariants,
	liftPattern,
	pressPattern,
	mediaHoverPattern,
	liftWithMediaPattern,
	glidePattern,
	confirmPattern,
	reducedMotionTransition,
	resolveTransition,
	useMotionPreference,
	useExpandClip,
} from "@/lib/motion";

/* -------------------------------------------------------------------------- */
/* Buttons                                                                    */
/* -------------------------------------------------------------------------- */

export {
	Button,
	buttonVariants,
	type ButtonProps,
} from "@/components/buttons/button";

/* -------------------------------------------------------------------------- */
/* Data Display                                                               */
/* -------------------------------------------------------------------------- */

export { ChatMessage, type ChatMessageProps } from "@/components/data-display/chat-message";
export {
	ChatPanel,
	ChatPanelBody,
	ChatPanelFooter,
	ChatPanelHeader,
	ChatPanelRail,
	ChatPanelTrigger,
	type ChatPanelBodyProps,
	type ChatPanelFooterProps,
	type ChatPanelHeaderProps,
	type ChatPanelProps,
	type ChatPanelRailProps,
	type ChatPanelTriggerProps,
} from "@/components/data-display/chat-panel";

/* -------------------------------------------------------------------------- */
/* Feedback                                                                   */
/* -------------------------------------------------------------------------- */

export {
	ActivityIndicator,
	ActivityIndicatorIcon,
	type ActivityIndicatorIconProps,
	type ActivityIndicatorProps,
} from "@/components/feedback/activity-indicator";
export { Loader, loaderVariants, type LoaderProps } from "@/components/feedback/loader";
export {
	PromptAlert,
	PromptAlertActions,
	PromptAlertDescription,
	PromptAlertTitle,
	type PromptAlertActionsProps,
	type PromptAlertDescriptionProps,
	type PromptAlertProps,
	type PromptAlertTitleProps,
} from "@/components/feedback/prompt-alert";

/* -------------------------------------------------------------------------- */
/* Forms                                                                      */
/* -------------------------------------------------------------------------- */

export { Checkbox, type CheckboxProps } from "@/components/forms/checkbox";
export {
	Field,
	FieldContent,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
	FieldTitle,
	fieldVariants,
	type FieldErrorProps,
	type FieldLegendProps,
	type FieldProps,
} from "@/components/forms/field";
export { Input, inputVariants, type InputProps } from "@/components/forms/input";
export {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
	InputGroupText,
	InputGroupTextarea,
	inputGroupAddonVariants,
	inputGroupButtonVariants,
	type InputGroupAddonProps,
	type InputGroupButtonProps,
	type InputGroupInputProps,
	type InputGroupProps,
	type InputGroupTextareaProps,
	type InputGroupTextProps,
} from "@/components/forms/input-group";
export { Label, type LabelProps } from "@/components/forms/label";
export {
	PromptComposer,
	PromptComposerButton,
	PromptComposerCommands,
	PromptComposerFooter,
	PromptComposerSubmit,
	PromptComposerTextarea,
	type PromptComposerButtonProps,
	type PromptComposerCommand,
	type PromptComposerCommandsProps,
	type PromptComposerFooterProps,
	type PromptComposerProps,
	type PromptComposerSubmitProps,
	type PromptComposerTextareaProps,
} from "@/components/forms/prompt-composer";
export {
	RadioGroup,
	RadioGroupItem,
	type RadioGroupItemProps,
	type RadioGroupProps,
} from "@/components/forms/radio-group";
export { Switch, switchVariants, type SwitchProps } from "@/components/forms/switch";
export { Textarea, textareaVariants, type TextareaProps } from "@/components/forms/textarea";

/* -------------------------------------------------------------------------- */
/* Navigation                                                                 */
/* -------------------------------------------------------------------------- */

export {
	SegmentedControl,
	SegmentedControlContent,
	SegmentedControlList,
	SegmentedControlTrigger,
	type SegmentedControlContentProps,
	type SegmentedControlListProps,
	type SegmentedControlProps,
	type SegmentedControlTriggerProps,
} from "@/components/navigation/segmented-control";
export {
	Topbar,
	TopbarCenter,
	TopbarEnd,
	TopbarStart,
	type TopbarCenterProps,
	type TopbarEndProps,
	type TopbarProps,
	type TopbarStartProps,
} from "@/components/navigation/topbar";

/* -------------------------------------------------------------------------- */
/* Overlays                                                                   */
/* -------------------------------------------------------------------------- */

export {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
	tooltipContentVariants,
	type TooltipContentProps,
} from "@/components/overlays/tooltip";

/* -------------------------------------------------------------------------- */
/* Typography                                                                 */
/* -------------------------------------------------------------------------- */

export {
	Typography,
	typographyHeadings,
	typographyVariants,
	type TypographyHeading,
	type TypographyProps,
	type TypographySize,
	type TypographyWeight,
} from "@/components/typography";
