import { Controller, Delete, Get, HttpResponse, ServerError } from '@wppsync/backend';

import { InternalAuthenticationMiddleware } from '@/handlers/middlewares/internal-authentication.js';
import { WhatsAppModuleBase } from '@/modules/whatsapp/index.js';

@Controller({
	path: '/instance',
	middlewares: [InternalAuthenticationMiddleware]
})
export class InstanceController {
	constructor(private readonly whatsapp: WhatsAppModuleBase) {}

	@Get('/status')
	async status() {
		return HttpResponse.success({ status: this.whatsapp.status });
	}

	@Get('/qrcode')
	async qrCode() {
		if (!this.whatsapp.qr) {
			throw new ServerError(404, 'QR_CODE_NOT_AVAILABLE', { message: 'QR code is not available.' });
		}

		return HttpResponse.success({ qr: this.whatsapp.qr });
	}

	@Delete('/logout')
	async logout() {
		await this.whatsapp.logout();
		return HttpResponse.success();
	}
}
