import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { gzipSync } from 'node:zlib';

/** Small, explicit gzip budgets; thresholds can be revised after real RUM data. */
const maxGzipBytes = {
  '.js': 100 * 1024,
  '.css': 80 * 1024,
  '.html': 50 * 1024,
};

const root = resolve('dist');
let checked = 0;
let errors = 0;

async function audit(folder) {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const path = resolve(folder, entry.name);

    if (entry.isDirectory()) {
      await audit(path);
      continue;
    }

    const extension = entry.name.match(/\.[a-z]+$/)?.[0];
    if (!Object.hasOwn(maxGzipBytes, extension)) {
      continue;
    }

    const data = await readFile(path);
    const size = gzipSync(data).byteLength;
    const limit = maxGzipBytes[extension];
    const passed = size <= limit;
    console.log(`${passed ? 'PASS' : 'FAIL'} ${relative(root, path)} — ${(size / 1024).toFixed(1)} KiB gzip`);
    checked += 1;
    if (!passed) {
      errors += 1;
    }
  }
}

try {
  await stat(root);
  await audit(root);
  console.log(`Audited ${checked} files; ${errors} exceeded size budgets.`);
  process.exitCode = errors ? 1 : 0;
} catch {
  console.error('dist/ is missing. Run npm run build first.');
  process.exitCode = 1;
}
