export const ANSI_CODES = {
	// Reset
	reset: '\x1b[0m',

	// Color
	black: '\x1b[30m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	cyan: '\x1b[36m',
	white: '\x1b[37m',
	gray: '\x1b[90m',

	// Bright Color
	brightRed: '\x1b[91m',
	brightGreen: '\x1b[92m',
	brightYellow: '\x1b[93m',
	brightBlue: '\x1b[94m',
	brightMagenta: '\x1b[95m',
	brightCyan: '\x1b[96m',
	brightWhite: '\x1b[97m',

	// Background
	bgBlack: '\x1b[40m',
	bgRed: '\x1b[41m',
	bgGreen: '\x1b[42m',
	bgYellow: '\x1b[43m',
	bgBlue: '\x1b[44m',
	bgMagenta: '\x1b[45m',
	bgCyan: '\x1b[46m',
	bgWhite: '\x1b[47m',
	bgGray: '\x1b[100m',

	// Bright Background
	bgBrightRed: '\x1b[101m',
	bgBrightGreen: '\x1b[102m',
	bgBrightYellow: '\x1b[103m',
	bgBrightBlue: '\x1b[104m',
	bgBrightMagenta: '\x1b[105m',
	bgBrightCyan: '\x1b[106m',
	bgBrightWhite: '\x1b[107m',

	// Text Styles
	bold: '\x1b[1m',
	dim: '\x1b[2m',
	italic: '\x1b[3m',
	underline: '\x1b[4m',
	blink: '\x1b[5m',
	reverse: '\x1b[7m',
	strikethrough: '\x1b[9m'
};

export const ANSI_CLOSE_CODES = {
	fg: '\x1b[39m', // Close foreground colors
	bg: '\x1b[49m', // Close background colors

	// Text Styles
	bold: '\x1b[22m',
	dim: '\x1b[22m',
	italic: '\x1b[23m',
	underline: '\x1b[24m',
	blink: '\x1b[25m',
	reverse: '\x1b[27m',
	strikethrough: '\x1b[29m'
};

export default { ANSI_CODES, ANSI_CLOSE_CODES };
