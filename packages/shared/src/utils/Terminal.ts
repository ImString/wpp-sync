import cluster from 'cluster';
import process from 'node:process';

import { Ansi, type AnsiColorFunction } from './Ansi.js';

export class Terminal {
	private static dateFormatter = new Intl.DateTimeFormat('pt-BR', {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		month: '2-digit',
		day: '2-digit',
		timeZone: process.env.TIMEZONE || 'America/Sao_Paulo'
	});

	static log(flag: string, flag_color: AnsiColorFunction, content: any[] | any) {
		content = ([] as string[]).concat(content);

		const formattedDate = this.dateFormatter.format(new Date()).replace(',', '');

		const packageName = process.env.npm_package_name?.toUpperCase();
		const prefix = `${formattedDate} |${packageName ? ` ${packageName} |` : ''}${!cluster.isPrimary ? ` ${process.pid} |` : ''} `;

		console.log(Ansi.gray(prefix), flag_color(`[${flag.toUpperCase()}]`), ...content);
	}

	static success(flag: string, content: any[] | any) {
		this.log(flag, Ansi.brightGreen, content);
	}

	static error(flag: string, content: any[] | any) {
		this.log(flag, Ansi.brightRed, content);
	}

	static info(flag: string, content: any[] | any) {
		this.log(flag, Ansi.brightCyan, content);
	}

	static warn(flag: string, content: any[] | any) {
		this.log(flag, Ansi.brightYellow, content);
	}
}

export default { Terminal };
