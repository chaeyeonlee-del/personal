import { equal } from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { fileURLToPath, URL } from 'node:url';

async function readJson<T>(path: string) {
  return JSON.parse(await readFile(fileURLToPath(new URL(path, import.meta.url)), 'utf8')) as T;
}

test('package metadata identifies this project as hoo', async () => {
  const packageJson = await readJson<{ name?: string }>('./package.json');
  const packageLock = await readJson<{ name?: string; packages?: Record<string, { name?: string }> }>('./package-lock.json');

  equal(packageJson.name, 'hoo');
  equal(packageLock.name, 'hoo');
  equal(packageLock.packages?.['']?.name, 'hoo');
});
