import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { Terminal } from './Terminal.js';

export interface FileSystemFile<T> {
	name: string;
	path: string;
	content: T | null;
}

export type FileSystemCallbackAll<T> = (files: FileSystemFile<T>[]) => Promise<void> | void;
export type FileSystemCallbackSingle<T> = (file: FileSystemFile<T>) => Promise<void> | void;

export interface FileSystemLoadFolderOptions {
	recursive?: boolean;
	auto_import?: boolean;
	auto_default?: boolean;
	filter_files?: (string | RegExp)[];
	filter_folders?: (string | RegExp)[];
	ignore_files?: (string | RegExp)[];
	ignore_folders?: (string | RegExp)[];
}

export class FileSystem {
	static shouldIncludeFile(name: string, filterList: (string | RegExp)[] = []): boolean {
		if (filterList.length === 0) return true;

		return filterList.some(filterItem =>
			typeof filterItem === 'string' ? filterItem === name : filterItem.test(name)
		);
	}

	static shouldIgnoreFile(name: string, ignoreList: (string | RegExp)[] = []): boolean {
		for (const ignoreItem of ignoreList) {
			if (typeof ignoreItem === 'string') {
				if (ignoreItem === name) return true;
			} else if (ignoreItem instanceof RegExp) {
				if (ignoreItem.test(name)) return true;
			}
		}

		return false;
	}

	static async loadFolder<FileContent>(
		dir: string,
		options: FileSystemLoadFolderOptions = {},
		callback?: FileSystemCallbackAll<FileContent>,
		callbackSingle?: FileSystemCallbackSingle<FileContent>
	): Promise<FileSystemFile<FileContent>[]> {
		options = {
			recursive: true,
			auto_import: true,
			auto_default: true,
			...options
		};

		const loadedFiles: FileSystemFile<FileContent>[] = [];

		const folderPath = path.resolve(dir);
		const folderStats = await fs.lstat(folderPath).catch(() => null);

		if (!folderStats) {
			if (callback) await callback(loadedFiles);
			return loadedFiles;
		}

		const folderFiles = await fs.readdir(folderPath);
		for (const folderFile of folderFiles) {
			const filePath = path.join(folderPath, folderFile);
			const fileStats = await fs.lstat(filePath).catch(() => null);

			if (!fileStats) continue;

			if (fileStats.isDirectory()) {
				if (!options.recursive) continue;
				if (FileSystem.shouldIgnoreFile(folderFile, options.ignore_folders)) continue;
				if (!FileSystem.shouldIncludeFile(folderFile, options.filter_folders)) continue;

				await FileSystem.loadFolder<FileContent>(filePath, options, undefined, async nestedFile => {
					loadedFiles.push(nestedFile);
					if (callbackSingle) await callbackSingle(nestedFile);
				});
			} else {
				if (FileSystem.shouldIgnoreFile(folderFile, options.ignore_files)) continue;
				if (!FileSystem.shouldIncludeFile(folderFile, options.filter_files)) continue;

				let content: any = null;

				if (options.auto_import) {
					try {
						const fileUrl = pathToFileURL(filePath).href;
						content = await import(fileUrl);
					} catch (error) {
						Terminal.error('FileSystem', `Failed to import file: ${filePath}\n${error}`);
					}
				}

				if (options.auto_default && content?.default) content = content.default;

				const fileData: FileSystemFile<FileContent> = {
					name: folderFile,
					path: filePath,
					content: content as FileContent
				};

				loadedFiles.push(fileData);
				if (callbackSingle) await callbackSingle(fileData);
			}
		}

		if (callback) await callback(loadedFiles);

		return loadedFiles;
	}
}
