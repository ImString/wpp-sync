import { FileSystem, Terminal, Validator, type ValidationErrorDetail } from '@wppsync/shared';
import { fileURLToPath } from 'node:url';
import { Server as SocketIOServer, type Socket } from 'socket.io';

import type { Core } from '@/core/Core.js';

import { BaseModule } from '@/modules/Base.js';
import { ServerModule } from '@/modules/fastify/Server.js';
import type { AnySocketEventSchema, SocketEventData } from '@/modules/socket/EventSchema.js';
import {
	getSocketListeners,
	isSocketHandlerClass,
	type SocketListenerHandler,
	type SocketListenerOptions
} from '@/modules/socket/Listener.js';

interface MountedSocketListener {
	event: AnySocketEventSchema;
	handle: SocketListenerHandler;
	options?: SocketListenerOptions;
}

export class SocketEventValidationError extends Error {
	constructor(
		readonly eventName: string,
		readonly errors: ValidationErrorDetail[]
	) {
		super(`Validation failed for socket event ${eventName}: ${JSON.stringify(errors)}`);
		this.name = 'SocketEventValidationError';
	}
}

export class SocketModuleBase extends BaseModule {
	instance?: SocketIOServer;
	readonly listeners: MountedSocketListener[] = [];

	constructor() {
		super({ dependencies: [ServerModule] });
	}

	emit<SEvent extends AnySocketEventSchema>(event: SEvent, data: SocketEventData<SEvent>): boolean {
		return this.instance?.emit(event.name, data) ?? false;
	}

	emitTo<SEvent extends AnySocketEventSchema>(
		room: string | string[],
		event: SEvent,
		data: SocketEventData<SEvent>
	): boolean {
		return this.instance?.to(room).emit(event.name, data) ?? false;
	}

	emitToExcept<SEvent extends AnySocketEventSchema>(
		room: string | string[],
		excludedSocketId: string,
		event: SEvent,
		data: SocketEventData<SEvent>
	): boolean {
		return this.instance?.to(room).except(excludedSocketId).emit(event.name, data) ?? false;
	}

	private async preHandler(event: AnySocketEventSchema, data: unknown): Promise<unknown> {
		const validation = await Validator.validate(event.validator, data);

		if (!validation.success) {
			throw new SocketEventValidationError(event.name, validation.errors);
		}

		return validation.data;
	}

	private handleListenerError(error: unknown, eventName: string, socket: Socket): void {
		const message = error instanceof Error ? error.message : String(error);

		Terminal.error('SOCKET', `Event ${eventName} failed for socket ${socket.id}: ${message}`);

		if (process.env.MODE === 'development' && error instanceof Error) console.error(error);
	}

	private registerListeners(socket: Socket): void {
		for (const listener of this.listeners) {
			const callback = async (data: unknown) => {
				try {
					const parsedData = await this.preHandler(listener.event, data);
					await listener.handle(socket, parsedData);
				} catch (error) {
					this.handleListenerError(error, listener.event.name, socket);
				}
			};

			if (listener.options?.once) socket.once(listener.event.name, callback);
			else socket.on(listener.event.name, callback);
		}
	}

	private initHandlers(): void {
		if (!this.instance) return;

		this.instance.on('connection', socket => this.registerListeners(socket));
	}

	private async loadListeners(core: Core): Promise<void> {
		const files = await FileSystem.loadFolder<Record<string, unknown>>(
			fileURLToPath(new URL('../../handlers/sockets', import.meta.url)),
			{
				recursive: true,
				filter_files: [/\.socket\.(?:[cm]?[jt]s)$/],
				auto_import: true,
				auto_default: false
			}
		);

		for (const file of files) {
			if (!file.content) continue;

			for (const exportedItem of Object.values(file.content)) {
				if (typeof exportedItem !== 'function' || !exportedItem.prototype) continue;

				const listeners = getSocketListeners(exportedItem.prototype);
				if (listeners.length === 0) continue;
				if (!isSocketHandlerClass(exportedItem)) {
					throw new TypeError(
						`The class ${exportedItem.name} is not a valid socket handler. Did you forget the @SocketHandler() decorator?`
					);
				}

				const instance = core.providers.instantiate(exportedItem as new (...args: any[]) => object);
				const instanceMethods = instance as Record<PropertyKey, unknown>;

				for (const listener of listeners) {
					const handler = instanceMethods[listener.methodName];

					if (typeof handler !== 'function') {
						throw new TypeError(
							`Socket handler ${exportedItem.name}.${String(listener.methodName)} is not a function.`
						);
					}

					this.listeners.push({
						event: listener.event,
						handle: handler.bind(instance) as SocketListenerHandler,
						options: listener.options
					});
				}
			}
		}
	}

	async init(core: Core): Promise<void> {
		if (!ServerModule.server) throw new Error('Fastify server is not initialized.');

		this.listeners.length = 0;
		await this.loadListeners(core);

		this.instance = new SocketIOServer(ServerModule.server.server, {
			cors: { origin: '*' }
		});

		this.initHandlers();

		Terminal.success('SOCKET', `Socket.IO initialized with ${this.listeners.length} listener(s).`);
	}
}

export const SocketModule = new SocketModuleBase();
