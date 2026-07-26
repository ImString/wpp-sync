import { Controller, Get, HttpResponse } from '@/modules/index.js';

@Controller({
	path: '/ping'
})
export class PingController {
	@Get('/')
	getProducts() {
		return HttpResponse.success({ message: 'pong' });
	}
}
