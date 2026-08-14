import type { MultipartFile } from '@fastify/multipart';
import { type InferSchemaType, Validator, type ValidatorSchema } from '@wppsync/shared';
import type { FastifyRequest } from 'fastify';

import { ServerError } from '@/modules/fastify/models/Error.js';

export interface RouteSchemaMeta {
	tags?: string[];
	summary?: string;
	description?: string;
}

export interface RouteSchemaFormOptions<SFields extends ValidatorSchema = ValidatorSchema> {
	fields: SFields;
	options?: Parameters<FastifyRequest['parts']>[0];
}

export interface RouteSchemaFormData<SFields extends ValidatorSchema = ValidatorSchema> {
	fields: InferSchemaType<SFields>;
	files: MultipartFile[];
}

export interface RouteSchemaOptions<
	SBody extends ValidatorSchema = ValidatorSchema,
	SQuery extends ValidatorSchema = ValidatorSchema,
	SParams extends ValidatorSchema = ValidatorSchema,
	SForm extends ValidatorSchema = ValidatorSchema
> {
	body?: SBody;
	query?: SQuery;
	params?: SParams;
	form?: RouteSchemaFormOptions<SForm>;

	meta?: RouteSchemaMeta;
}

export interface RouterGlobalInputs {}

export type RouterGlobalRequest = RouterGlobalInputs extends { request: infer R } ? R : any;
export type RouterGlobalResponse = RouterGlobalInputs extends { response: infer R } ? R : any;
export type RouterGlobalState = RouterGlobalInputs extends { state: infer D } ? D : any;

export interface RouterSchemaInputs {
	request: RouterGlobalRequest;
	response: RouterGlobalResponse;

	state: RouterGlobalState;
}

export type RouterSchemaRequest = RouterSchemaInputs['request'];
export type RouterSchemaResponse = RouterSchemaInputs['response'];
export type RouterSchemaState = RouterSchemaInputs['state'];

export interface RouteSchemaContext<
	SRequest = RouterSchemaRequest,
	SResponse = RouterSchemaResponse,
	SState = RouterSchemaState,
	SBody extends ValidatorSchema = ValidatorSchema,
	SQuery extends ValidatorSchema = ValidatorSchema,
	SParams extends ValidatorSchema = ValidatorSchema
> {
	request: SRequest;
	response: SResponse;
	state: SState;

	body: SBody extends ValidatorSchema ? InferSchemaType<SBody> : undefined;
	query: SQuery extends ValidatorSchema ? InferSchemaType<SQuery> : undefined;
	params: SParams extends ValidatorSchema ? InferSchemaType<SParams> : undefined;
}

export class RouteSchema<
	SRequest = RouterSchemaRequest,
	SResponse = RouterSchemaResponse,
	SState = RouterSchemaState,
	SBody extends ValidatorSchema = ValidatorSchema,
	SQuery extends ValidatorSchema = ValidatorSchema,
	SParams extends ValidatorSchema = ValidatorSchema,
	SForm extends ValidatorSchema = ValidatorSchema
> {
	validators: {
		body?: SBody;
		query?: SQuery;
		params?: SParams;
	} = {};

	meta: RouteSchemaMeta = {};
	form?: RouteSchemaFormOptions<SForm>;

	context: RouteSchemaContext<SRequest, SResponse, SState, SBody, SQuery, SParams> = {} as RouteSchemaContext<
		SRequest,
		SResponse,
		SState,
		SBody,
		SQuery,
		SParams
	>;

	constructor(options: RouteSchemaOptions<SBody, SQuery, SParams, SForm> = {}) {
		if (options.body) this.validators.body = options.body;
		if (options.query) this.validators.query = options.query;
		if (options.params) this.validators.params = options.params;
		if (options.form) this.form = options.form;

		if (options.meta) this.meta = options.meta;
	}

	async toForm(options: { request: SRequest }): Promise<RouteSchemaFormData<SForm>> {
		if (!this.form) throw new Error('Form is not configured for this route schema.');

		const request = options.request as FastifyRequest;
		const fields: Record<string, unknown> = {};
		const files: MultipartFile[] = [];

		try {
			for await (const part of request.parts(this.form.options)) {
				if (part.type === 'file') {
					files.push(part);
					await part.toBuffer();
					continue;
				}

				if (typeof part.value !== 'string') {
					fields[part.fieldname] = part.value;
					continue;
				}

				try {
					fields[part.fieldname] = JSON.parse(part.value);
				} catch {
					fields[part.fieldname] = part.value;
				}
			}
		} catch (error) {
			const multipartError = error as { code?: string; message?: string; statusCode?: number };

			if (multipartError.code?.startsWith('FST_')) {
				throw new ServerError(multipartError.statusCode ?? 400, multipartError.code, {
					message: multipartError.message
				});
			}

			throw error;
		}

		const validation = await Validator.validate(this.form.fields, fields);

		if (!validation.success) {
			throw new ServerError(400, 'VALIDATION_ERROR', {
				source: 'form',
				errors: validation.errors
			});
		}

		return {
			fields: validation.data,
			files
		};
	}

	static createBase<
		SRequest = RouterSchemaRequest,
		SResponse = RouterSchemaResponse,
		SState = RouterSchemaState,
		SBody extends ValidatorSchema = ValidatorSchema,
		SQuery extends ValidatorSchema = ValidatorSchema,
		SParams extends ValidatorSchema = ValidatorSchema,
		SForm extends ValidatorSchema = ValidatorSchema
	>(options: RouteSchemaOptions<SBody, SQuery, SParams, SForm> = {}) {
		return class Base<
			IBody extends ValidatorSchema = ValidatorSchema,
			IQuery extends ValidatorSchema = ValidatorSchema,
			IParams extends ValidatorSchema = ValidatorSchema,
			IForm extends ValidatorSchema = ValidatorSchema
		> extends RouteSchema<
			SRequest,
			SResponse,
			SState,
			SBody & IBody,
			SQuery & IQuery,
			SParams & IParams,
			SForm & IForm
		> {
			constructor(input: RouteSchemaOptions<IBody, IQuery, IParams, IForm> = {}) {
				super({
					...((input.body || options.body) && {
						body: {
							...options.body,
							...input.body
						} as SBody & IBody
					}),

					...((input.query || options.query) && {
						query: {
							...options.query,
							...input.query
						} as SQuery & IQuery
					}),

					...((input.params || options.params) && {
						params: {
							...options.params,
							...input.params
						} as SParams & IParams
					}),

					...((input.form || options.form) && {
						form: (input.form || options.form) as RouteSchemaFormOptions<SForm & IForm>
					}),

					...((input.meta || options.meta) && {
						meta: {
							...options.meta,
							...input.meta
						}
					})
				});
			}
		};
	}
}

export type AnyRouteSchema = RouteSchema<any, any, any, any, any, any, any>;

export default { RouteSchema };
