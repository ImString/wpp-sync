import { HttpStatusCodes } from '@/modules/router/constants/index.js';

export interface HttpResponseOptions {
	success: boolean;
	status?: number | keyof typeof HttpStatusCodes;
	code?: string;
	data?: any;
}

export class HttpResponse {
	success: HttpResponseOptions['success'];
	status: number;
	code?: HttpResponseOptions['code'];
	data?: HttpResponseOptions['data'];

	constructor(options: HttpResponseOptions) {
		this.success = options.success;

		if (typeof options.status === 'string') {
			this.status = HttpStatusCodes[options.status] || 200;
		} else {
			this.status = options.status || 200;
		}

		this.code = options.code;
		this.data = options.data;
	}

	static success(data?: HttpResponseOptions['data']) {
		return new HttpResponse({ success: true, status: 200, data });
	}

	static created(data?: HttpResponseOptions['data']) {
		return new HttpResponse({ success: true, status: 201, data });
	}

	static error(
		status: HttpResponseOptions['status'],
		code: HttpResponseOptions['code'],
		data?: HttpResponseOptions['data']
	) {
		return new HttpResponse({
			success: false,
			status,
			code,
			data
		});
	}

	toObject() {
		return {
			success: this.success,
			status: this.status,
			code: this.code,
			data: this.data
		};
	}
}

export default { HttpResponse };
