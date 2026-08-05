import { readdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const generatedDirectory = fileURLToPath(new URL('../src/generated/prisma', import.meta.url));

async function getTypeScriptFiles(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = await Promise.all(
		entries.map(entry => {
			const path = join(directory, entry.name);

			return entry.isDirectory() ? getTypeScriptFiles(path) : path;
		})
	);

	return files.flat().filter(file => extname(file) === '.ts');
}

for (const file of await getTypeScriptFiles(generatedDirectory)) {
	const source = await readFile(file, 'utf8');
	const corrected = source
		.replaceAll("from '../pjtg'", "from '../pjtg.js'")
		.replaceAll("from './internal/prismaNamespace'", "from './internal/prismaNamespace.js'");

	if (corrected !== source) await writeFile(file, corrected);
}
