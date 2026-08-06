import type { InferSchemaType, ValidatorSchema } from '@wppsync/shared';

export interface BullJobSchemaOptions<SData extends ValidatorSchema> {
	name: string;
	data: SData;
}

export class BullJobSchema<SData extends ValidatorSchema> {
	readonly name: string;
	readonly validator: SData;

	declare readonly data: InferSchemaType<SData>;

	constructor(options: BullJobSchemaOptions<SData>) {
		this.name = options.name;
		this.validator = options.data;
	}
}

export type AnyBullJobSchema = BullJobSchema<any>;
export type BullJobData<SJob extends AnyBullJobSchema> = SJob['data'];
