export const stageIconNames = [
	'label',
	'clock',
	'hourglass',
	'person',
	'group',
	'chat',
	'phone',
	'calendar',
	'event',
	'check',
	'star',
	'heart',
	'flag',
	'target',
	'cart',
	'money',
	'rocket',
	'pause',
	'warning',
	'archive'
] as const;

export type StageIconName = (typeof stageIconNames)[number];
