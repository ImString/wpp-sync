import { Ansi, FileSystem, Terminal } from '@wppsync/shared';

import type { Core } from '@/core/Core.js';

import { BaseModule } from '@/modules/Base.js';
import {
	ROUTER_CONTROLLER_METADATA_KEY,
	ROUTER_CONTROLLER_ROLE,
	ROUTER_CONTROLLERS_STORAGE_KEY,
	ROUTER_LOAD_ERROR_METADATA_KEY,
	ROUTER_ROLE_METADATA_KEY,
	ROUTER_ROUTES_METADATA_KEY
} from '@/modules/router/constants/router.js';
import { getOwnMetadata } from '@/modules/router/metadata.js';
import type { ControllerClass, DefinedController, MountedController } from '@/modules/router/types/controller.js';
import type { MountedRoute } from '@/modules/router/types/route.js';

export interface RouterModuleLoaderOptions {
	path: string;
	pattern?: RegExp;
}

export interface RouterModuleOptions {
	loader?: RouterModuleLoaderOptions;
	controllers?: ControllerClass[];
}

export class RouterModule extends BaseModule {
	readonly controllers: DefinedController[] = [];

	private readonly loadedControllers = new Set<ControllerClass>();
	private readonly options: RouterModuleOptions;

	constructor(options: RouterModuleOptions = {}) {
		super();
		this.options = options;
	}

	private handleLoadController(controller: ControllerClass): boolean {
		if (this.loadedControllers.has(controller)) return false;

		const controllerRole = getOwnMetadata<string>(ROUTER_ROLE_METADATA_KEY, controller);

		if (controllerRole !== ROUTER_CONTROLLER_ROLE) {
			Terminal.error(
				'ROUTER',
				`The class ${Ansi.yellow(
					controller.name
				)} is not a valid controller. Did you forget the ${Ansi.cyan('@Controller()')} decorator?`
			);
			return false;
		}

		if (getOwnMetadata<boolean>(ROUTER_LOAD_ERROR_METADATA_KEY, controller)) {
			Terminal.error('ROUTER', `The controller ${Ansi.yellow(controller.name)} has invalid router metadata.`);
			return false;
		}

		const controllerMetadata = getOwnMetadata<MountedController>(ROUTER_CONTROLLER_METADATA_KEY, controller);

		if (!controllerMetadata) {
			Terminal.error('ROUTER', `Metadata for controller ${Ansi.yellow(controller.name)} was not found.`);
			return false;
		}

		const controllerRoutes = getOwnMetadata<MountedRoute[]>(ROUTER_ROUTES_METADATA_KEY, controller) ?? [];
		const definedController: DefinedController = {
			data: {
				...controllerMetadata,
				middlewares: controllerMetadata.middlewares.map(middleware => ({ ...middleware }))
			},
			routes: controllerRoutes.map(route => ({
				...route,
				middlewares: route.middlewares?.map(middleware => ({ ...middleware }))
			}))
		};

		this.loadedControllers.add(controller);
		this.controllers.push(definedController);

		return true;
	}

	private handleLoadControllers(controllers: ControllerClass[]): number {
		let loadedControllersCount = 0;

		for (const controller of controllers) {
			if (this.handleLoadController(controller)) loadedControllersCount++;
		}

		if (loadedControllersCount) {
			Terminal.info('ROUTER', `Successfully loaded ${Ansi.green(loadedControllersCount)} controllers.`);
		}

		return loadedControllersCount;
	}

	private async handleLoadControllersFromLoader(loaderData: RouterModuleLoaderOptions): Promise<number> {
		let loadedControllersCount = 0;

		await FileSystem.loadFolder<Record<string, unknown>>(
			loaderData.path,
			{
				recursive: true,
				filter_files: [loaderData.pattern ?? /^(?!.*\.d\.ts$).*\.(?:[cm]?[jt]s)$/],
				auto_import: true,
				auto_default: false
			},
			undefined,
			async file => {
				if (!file.content) return;

				for (const exportedItem of Object.values(file.content)) {
					if (typeof exportedItem !== 'function') continue;

					const controllerRole = getOwnMetadata<string>(ROUTER_ROLE_METADATA_KEY, exportedItem);
					if (controllerRole !== ROUTER_CONTROLLER_ROLE) continue;

					if (this.handleLoadController(exportedItem as ControllerClass)) loadedControllersCount++;
				}
			}
		);

		if (loadedControllersCount) {
			Terminal.info(
				'ROUTER',
				`Successfully loaded ${Ansi.green(loadedControllersCount)} controllers from loader.`
			);
		}

		return loadedControllersCount;
	}

	async load(): Promise<DefinedController[]> {
		this.controllers.length = 0;
		this.loadedControllers.clear();

		this.handleLoadControllers(this.options.controllers ?? []);

		if (this.options.loader) {
			await this.handleLoadControllersFromLoader(this.options.loader);
		}

		return this.controllers;
	}

	async init(core: Core): Promise<void> {
		await this.load();

		const storedControllers = core.storage.get(ROUTER_CONTROLLERS_STORAGE_KEY);
		const existingControllers = Array.isArray(storedControllers) ? (storedControllers as DefinedController[]) : [];
		const loadedControllerClasses = new Set(this.controllers.map(controller => controller.data.constructor));
		const controllersFromOtherModules = existingControllers.filter(
			controller => !loadedControllerClasses.has(controller.data.constructor)
		);

		core.storage.set(ROUTER_CONTROLLERS_STORAGE_KEY, [...controllersFromOtherModules, ...this.controllers]);
	}
}

export default { RouterModule };
