import type { ValidationError } from 'class-validator';
import type { z } from 'zod';

export interface ZodLikeSchema {
	safeParseAsync(input: unknown): Promise<any> | any;
}

type ClassConstructor<T = any> = { new (...args: any[]): T };

export type ValidatorSchema = ZodLikeSchema | ClassConstructor;

export type InferSchemaType<T> = T extends z.ZodType
	? z.output<T>
	: T extends ClassConstructor<infer U>
		? U
		: never;

export interface ValidationErrorDetail {
	path: string;
	message: string;
	type?: string;
}

export type ValidationResult<T> =
	| { success: true; data: T; errors?: never }
	| { success: false; errors: ValidationErrorDetail[]; data?: never };

export class Validator {
	static async validate<S>(schema: S, input: unknown): Promise<ValidationResult<InferSchemaType<S>>> {
		if (this.isZodSchema(schema)) {
			const result = await (schema as any).safeParseAsync(input);

			if (result.success) {
				return { success: true, data: result.data };
			}

			const zodIssues = result.error?.issues || result.error?.errors || [];

			const errors: ValidationErrorDetail[] = zodIssues.map((e: any) => ({
				path: e.path.join('.'),
				message: e.message,
				type: e.code
			}));

			if (errors.length === 0 && result.error) {
				errors.push({
					path: '',
					message: result.error.message || 'Zod validation error',
					type: 'unknown'
				});
			}

			return { success: false, errors };
		}

		if (this.isClassConstructor(schema)) {
			try {
				const { validateSync } = await import('class-validator');
				const { plainToInstance } = await import('class-transformer');

				const instance = plainToInstance(schema as any, input);
				const validationErrors: ValidationError[] = validateSync(instance as object);

				if (validationErrors.length === 0) {
					return { success: true, data: instance as InferSchemaType<S> };
				}

				const formatClassErrors = (errorList: ValidationError[], parentPath = ''): ValidationErrorDetail[] => {
					let list: ValidationErrorDetail[] = [];

					for (const error of errorList) {
						const currentPath = parentPath ? `${parentPath}.${error.property}` : error.property;

						if (error.constraints) {
							Object.entries(error.constraints).forEach(([type, message]) => {
								list.push({
									path: currentPath,
									message: message as string,
									type: type
								});
							});
						}

						if (error.children && error.children.length > 0) {
							list = list.concat(formatClassErrors(error.children, currentPath));
						}
					}
					return list;
				};

				return { success: false, errors: formatClassErrors(validationErrors) };
			} catch (e: any) {
				return {
					success: false,
					errors: [
						{
							path: '',
							message: `Error processing Class-Validator: ${e.message || 'Missing dependencies?'}`,
							type: 'internal_error'
						}
					]
				};
			}
		}

		throw new Error('Schema validator não suportado ou inválido.');
	}

	private static isZodSchema(schema: any): boolean {
		return schema && typeof schema === 'object' && typeof schema.safeParseAsync === 'function';
	}

	private static isClassConstructor(schema: any): boolean {
		return typeof schema === 'function' && /^\s*class\s+/.test(schema.toString());
	}
}

export default { Validator };
