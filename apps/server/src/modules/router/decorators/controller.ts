import { Terminal } from '@wppsync/shared';

import {
	ROUTER_CONTROLLER_METADATA_KEY,
	ROUTER_CONTROLLER_ROLE,
	ROUTER_LOAD_ERROR_METADATA_KEY,
	ROUTER_ROLE_METADATA_KEY
} from '@/modules/router/constants/router.js';
import { defineMetadata } from '@/modules/router/metadata.js';
import type {
	ControllerClass,
	MiddlewareVariant,
	MountedController,
	MountedMiddleware
} from '@/modules/router/types/index.js';
import { MiddlewareUtils } from '@/modules/router/utils/index.js';

export interface ControllerOptions {
	path?: string;
	middlewares?: MiddlewareVariant[];
}

export function Controller(options: ControllerOptions | string = {}): ClassDecorator {
	return target => {
		const ControllerConstructor = target as unknown as ControllerClass;

		defineMetadata(ROUTER_ROLE_METADATA_KEY, ROUTER_CONTROLLER_ROLE, ControllerConstructor);

		const path = typeof options === 'string' ? options : options.path || '/';

		const controllerMiddlewares = typeof options === 'string' ? [] : options.middlewares || [];
		const mountedControllerMiddlewares: MountedMiddleware[] = [];

		for (const controllerMiddleware of controllerMiddlewares) {
			try {
				const mountedMiddleware = MiddlewareUtils.processMiddlewareVariant(controllerMiddleware);

				mountedControllerMiddlewares.push({ ...mountedMiddleware, isPrimary: true });
			} catch (error: unknown) {
				defineMetadata(ROUTER_LOAD_ERROR_METADATA_KEY, true, ControllerConstructor);

				if (error instanceof Error) Terminal.error('ROUTER', error.message);
				else
					Terminal.error(
						'ROUTER',
						`An unknown error occurred while applying middleware. (${ControllerConstructor.name} - ${controllerMiddleware})`
					);
			}
		}

		const mountedController: MountedController = {
			path: path,
			middlewares: mountedControllerMiddlewares,
			constructor: ControllerConstructor
		};

		defineMetadata(ROUTER_CONTROLLER_METADATA_KEY, mountedController, ControllerConstructor);
	};
}
