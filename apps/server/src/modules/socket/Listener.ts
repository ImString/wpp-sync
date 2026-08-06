import type { Socket } from 'socket.io';

import type { AnySocketEventSchema, SocketEventData } from './EventSchema.js';

export interface SocketListenerOptions {
	once?: boolean;
}

export interface ISocketListener {
	event: AnySocketEventSchema;
	methodName: PropertyKey;
	options?: SocketListenerOptions;
}

export type SocketListenerHandler<SEvent extends AnySocketEventSchema = AnySocketEventSchema> = (
	socket: Socket,
	data: SocketEventData<SEvent>
) => Promise<unknown> | unknown;

const listenersMetadata = new WeakMap<object, ISocketListener[]>();
const socketHandlerClasses = new WeakSet<Function>();

export function SocketHandler(): ClassDecorator {
	return target => {
		socketHandlerClasses.add(target);
	};
}

export function isSocketHandlerClass(target: Function): boolean {
	return socketHandlerClasses.has(target);
}

export function getSocketListeners(target: object): ISocketListener[] {
	return [...(listenersMetadata.get(target) ?? [])];
}

export function SocketListener<SEvent extends AnySocketEventSchema>(event: SEvent, options?: SocketListenerOptions) {
	return <THandler extends SocketListenerHandler<SEvent>>(
		target: object,
		methodName: PropertyKey,
		_descriptor: TypedPropertyDescriptor<THandler>
	) => {
		const listeners = getSocketListeners(target);

		listeners.push({
			event,
			methodName,
			options
		});

		listenersMetadata.set(target, listeners);
	};
}
