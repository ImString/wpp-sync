import { ANSI_CLOSE_CODES, ANSI_CODES } from '../constants/ansi.js';

export type AnsiInputText = string | number | null | undefined;

export type AnsiColorFunction = (text: AnsiInputText) => string;

export class Ansi {
	private static createWrap(ansi_code: string, close_code?: string): AnsiColorFunction {
		close_code = close_code || ANSI_CODES.reset;

		return (text: AnsiInputText) => {
			const textString = String(text);

			const content = textString.includes(close_code)
				? textString.replaceAll(close_code, close_code + ansi_code)
				: textString;

			return `${ansi_code}${content}${close_code}`;
		};
	}

	// Color methods
	static black = Ansi.createWrap(ANSI_CODES.black, ANSI_CLOSE_CODES.fg);
	static red = Ansi.createWrap(ANSI_CODES.red, ANSI_CLOSE_CODES.fg);
	static green = Ansi.createWrap(ANSI_CODES.green, ANSI_CLOSE_CODES.fg);
	static yellow = Ansi.createWrap(ANSI_CODES.yellow, ANSI_CLOSE_CODES.fg);
	static blue = Ansi.createWrap(ANSI_CODES.blue, ANSI_CLOSE_CODES.fg);
	static magenta = Ansi.createWrap(ANSI_CODES.magenta, ANSI_CLOSE_CODES.fg);
	static cyan = Ansi.createWrap(ANSI_CODES.cyan, ANSI_CLOSE_CODES.fg);
	static white = Ansi.createWrap(ANSI_CODES.white, ANSI_CLOSE_CODES.fg);
	static gray = Ansi.createWrap(ANSI_CODES.gray, ANSI_CLOSE_CODES.fg);

	// Bright Color methods
	static brightRed = Ansi.createWrap(ANSI_CODES.brightRed, ANSI_CLOSE_CODES.fg);
	static brightGreen = Ansi.createWrap(ANSI_CODES.brightGreen, ANSI_CLOSE_CODES.fg);
	static brightYellow = Ansi.createWrap(ANSI_CODES.brightYellow, ANSI_CLOSE_CODES.fg);
	static brightBlue = Ansi.createWrap(ANSI_CODES.brightBlue, ANSI_CLOSE_CODES.fg);
	static brightMagenta = Ansi.createWrap(ANSI_CODES.brightMagenta, ANSI_CLOSE_CODES.fg);
	static brightCyan = Ansi.createWrap(ANSI_CODES.brightCyan, ANSI_CLOSE_CODES.fg);
	static brightWhite = Ansi.createWrap(ANSI_CODES.brightWhite, ANSI_CLOSE_CODES.fg);

	// Background methods
	static bgBlack = Ansi.createWrap(ANSI_CODES.bgBlack, ANSI_CLOSE_CODES.bg);
	static bgRed = Ansi.createWrap(ANSI_CODES.bgRed, ANSI_CLOSE_CODES.bg);
	static bgGreen = Ansi.createWrap(ANSI_CODES.bgGreen, ANSI_CLOSE_CODES.bg);
	static bgYellow = Ansi.createWrap(ANSI_CODES.bgYellow, ANSI_CLOSE_CODES.bg);
	static bgBlue = Ansi.createWrap(ANSI_CODES.bgBlue, ANSI_CLOSE_CODES.bg);
	static bgMagenta = Ansi.createWrap(ANSI_CODES.bgMagenta, ANSI_CLOSE_CODES.bg);
	static bgCyan = Ansi.createWrap(ANSI_CODES.bgCyan, ANSI_CLOSE_CODES.bg);
	static bgWhite = Ansi.createWrap(ANSI_CODES.bgWhite, ANSI_CLOSE_CODES.bg);
	static bgGray = Ansi.createWrap(ANSI_CODES.bgGray, ANSI_CLOSE_CODES.bg);

	// Bright Background methods
	static bgBrightRed = Ansi.createWrap(ANSI_CODES.bgBrightRed, ANSI_CLOSE_CODES.bg);
	static bgBrightGreen = Ansi.createWrap(ANSI_CODES.bgBrightGreen, ANSI_CLOSE_CODES.bg);
	static bgBrightYellow = Ansi.createWrap(ANSI_CODES.bgBrightYellow, ANSI_CLOSE_CODES.bg);
	static bgBrightBlue = Ansi.createWrap(ANSI_CODES.bgBrightBlue, ANSI_CLOSE_CODES.bg);
	static bgBrightMagenta = Ansi.createWrap(ANSI_CODES.bgBrightMagenta, ANSI_CLOSE_CODES.bg);
	static bgBrightCyan = Ansi.createWrap(ANSI_CODES.bgBrightCyan, ANSI_CLOSE_CODES.bg);
	static bgBrightWhite = Ansi.createWrap(ANSI_CODES.bgBrightWhite, ANSI_CLOSE_CODES.bg);

	// Text Style methods
	static bold = Ansi.createWrap(ANSI_CODES.bold, ANSI_CLOSE_CODES.bold);
	static dim = Ansi.createWrap(ANSI_CODES.dim, ANSI_CLOSE_CODES.dim);
	static italic = Ansi.createWrap(ANSI_CODES.italic, ANSI_CLOSE_CODES.italic);
	static underline = Ansi.createWrap(ANSI_CODES.underline, ANSI_CLOSE_CODES.underline);
	static blink = Ansi.createWrap(ANSI_CODES.blink, ANSI_CLOSE_CODES.blink);
	static reverse = Ansi.createWrap(ANSI_CODES.reverse, ANSI_CLOSE_CODES.reverse);
	static strikethrough = Ansi.createWrap(ANSI_CODES.strikethrough, ANSI_CLOSE_CODES.strikethrough);
}

export default { Ansi };
