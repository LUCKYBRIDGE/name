import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { resolve } from 'node:path';

const [snapshotRoot, ...requestedPaths] = process.argv.slice(2);
if (!snapshotRoot) {
  console.error('Usage: npm run verify:integration -- <snapshot-root> [data/path ...]');
  process.exit(1);
}

const manifestUrl = new URL('../../data/meta/integration-manifest.json', import.meta.url);
const { files } = JSON.parse(fs.readFileSync(manifestUrl, 'utf8'));
const paths = requestedPaths.length ? [...new Set(requestedPaths)] : Object.keys(files);

for (const path of paths) {
  if (!Object.hasOwn(files, path)) {
    console.error(`Path not listed in integration manifest: ${path}`);
    process.exitCode = 1;
    continue;
  }

  try {
    const content = fs.readFileSync(resolve(snapshotRoot, path));
    const expected = files[path];
    const sha256 = createHash('sha256').update(content).digest('hex');
    if (content.length !== expected.bytes || sha256 !== expected.sha256) {
      console.error(`Snapshot file differs: ${path}`);
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(`Cannot read snapshot file: ${path} (${error.code ?? error.message})`);
    process.exitCode = 1;
  }
}

if (!process.exitCode) console.log(`Verified ${paths.length} integration snapshot files.`);
