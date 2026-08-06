import type { InferSchemaType, ValidatorSchema } from '@wppsync/shared';

export interface SocketEventSchemaOptions<SData extends ValidatorSchema> {
	name: string;
	data: SData;
}

export class SocketEventSchema<SData extends ValidatorSchema> {
	readonly name: string;
	readonly validator: SData;

	declare readonly data: InferSchemaType<SData>;

	constructor(options: SocketEventSchemaOptions<SData>) {
		this.name = options.name;
		this.validator = options.data;
	}
}

export type AnySocketEventSchema = SocketEventSchema<any>;
export type SocketEventData<SEvent extends AnySocketEventSchema> = SEvent['data'];
