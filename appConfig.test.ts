import { deepEqual, equal } from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { fileURLToPath, URL } from 'node:url';

type ExpoAppConfig = {
  expo?: {
    name?: string;
    slug?: string;
    ios?: {
      infoPlist?: {
        NSMicrophoneUsageDescription?: string;
      };
      usesAppleSignIn?: boolean;
    };
    scheme?: string;
  };
};

async function readAppConfig() {
  return JSON.parse(await readFile(fileURLToPath(new URL('./app.json', import.meta.url)), 'utf8')) as ExpoAppConfig;
}

test('app config prepares the production auth redirect scheme', async () => {
  const config = await readAppConfig();

  equal(config.expo?.name, '후우');
  equal(config.expo?.slug, 'hoo');
  equal(config.expo?.scheme, 'hoo');
});

test('app config enables Sign in with Apple capability sync', async () => {
  const config = await readAppConfig();

  deepEqual(config.expo?.ios?.usesAppleSignIn, true);
});

test('app config explains local-only microphone metering for review', async () => {
  const config = await readAppConfig();
  const description = config.expo?.ios?.infoPlist?.NSMicrophoneUsageDescription ?? '';

  equal(description.includes('마이크 볼륨만 기기 안에서 실시간으로 사용'), true);
  equal(description.includes('서버로 전송하지 않습니다'), true);
});

test('apps in toss brand settings match review registration', async () => {
  const graniteSource = await readFile(fileURLToPath(new URL('./granite.config.ts', import.meta.url)), 'utf8');

  equal(graniteSource.includes("appName: 'hoo'"), true);
  equal(graniteSource.includes("displayName: '후우'"), true);
  equal(
    graniteSource.includes(
      "icon: 'https://static.toss.im/appsintoss/46899/56b1bd34-0e94-44aa-a8c3-3c99dc2ac38c.png'"
    ),
    true
  );
});

test('metro config excludes eval-based async runtime fallbacks from review builds', async () => {
  const metroSource = await readFile(fileURLToPath(new URL('./metro.config.js', import.meta.url)), 'utf8');
  const packageSource = JSON.parse(
    await readFile(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf8')
  ) as {
    scripts?: {
      build?: string;
    };
  };
  const noEvalFetchSource = await readFile(
    fileURLToPath(new URL('./src/platform/noEvalFetchThenEvalJs.js', import.meta.url)),
    'utf8'
  );
  const noEvalUuidSource = await readFile(
    fileURLToPath(new URL('./src/platform/noEvalUuid.web.js', import.meta.url)),
    'utf8'
  );

  equal(metroSource.includes('noEvalFetchThenEvalJs.js'), true);
  equal(metroSource.includes('noEvalUuid.web.js'), true);
  equal(packageSource.scripts?.build, 'ait build');
  equal(noEvalFetchSource.includes('eval('), false);
  equal(noEvalUuidSource.includes('eval('), false);
});
