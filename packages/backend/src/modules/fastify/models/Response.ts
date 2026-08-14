export interface ServerResponseOptions {
	success: boolean;
	status?: number;
	code?: string;
	data?: Record<string, any>;
}

export class ServerResponse {
	success: ServerResponseOptions['success'];
	status: NonNullable<ServerResponseOptions['status']>;
	code?: ServerResponseOptions['code'];
	data?: ServerResponseOptions['data'];

	constructor(options: ServerResponseOptions) {
		this.success = options.success;
		this.status = options.status || 200;
		this.code = options.code;
		this.data = options.data;
	}

	static success(data?: ServerResponseOptions['data']) {
		return new ServerResponse({ success: true, status: 200, data });
	}

	static created(data?: ServerResponseOptions['data']) {
		return new ServerResponse({ success: true, status: 201, data });
	}

	static error(
		status: ServerResponseOptions['status'],
		code: ServerResponseOptions['code'],
		data?: ServerResponseOptions['data']
	) {
		return new ServerResponse({
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
