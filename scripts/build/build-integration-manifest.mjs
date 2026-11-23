import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkOrWrite } from './lib/csv.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const targetPath = 'data/meta/integration-manifest.json';
const dataDirectories = [
  'data/hanja/enriched',
  'data/hanja/normalized',
  'data/hanja/semantics',
  'data/legal',
  'data/meta',
  'data/methods',
  'data/myeongri',
  'data/rules',
  'data/surnames',
  'data/time',
  'data/trends',
];
const excludedPaths = new Set([
  targetPath,
  'data/hanja/semantics/naming-curation-backlog.csv',
  'data/hanja/semantics/selection-examples.json',
]);
const paths = dataDirectories.flatMap(directory =>
  fs.readdirSync(join(root, directory), { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile() && /\.(csv|json)$/.test(entry.name))
    .map(entry => relative(root, join(entry.parentPath, entry.name)).split(sep).join('/')),
).filter(path => !excludedPaths.has(path)).sort();

const schema = JSON.parse(fs.readFileSync(join(root, 'data/meta/schema-version.json'), 'utf8'));
const files = Object.fromEntries(paths.map(path => {
  const content = fs.readFileSync(join(root, path));
  return [path, {
    bytes: content.length,
    sha256: createHash('sha256').update(content).digest('hex'),
  }];
}));
const manifest = {
  manifest_version: 1,
  schema_version: schema.schema_version,
  files,
};
checkOrWrite(fs, new URL(`../../${targetPath}`, import.meta.url), `${JSON.stringify(manifest, null, 2)}\n`, process.argv.includes('--check'));
