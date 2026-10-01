import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';

// https://vitejs.dev/config/
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';

// @ts-expect-error does not like import.meta
const dirname: string = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

/*
 * Reference screenshot paths for the browser project. Same as the Vitest default, with three changes:
 * - Slashes in test names (for example in URLs) do not make nested folders.
 * - Long names are cut and get a hash, so that file names stay below the 255 character limit.
 * - Two tests whose names differ only in case fail, because macOS and Windows would give them the same file.
 */
const MAX_SCREENSHOT_NAME_LENGTH = 180;
const screenshotOwners = new Map<string, string>();

function resolveScreenshotPath({
  root,
  testFileDirectory,
  testFileName,
  testName,
  arg,
  browserName,
  platform,
  ext,
}: {
  root: string;
  testFileDirectory: string;
  testFileName: string;
  testName: string;
  arg: string;
  browserName: string;
  platform: string;
  ext: string;
}): string {
  let name = arg.replaceAll('/', '-');
  if (name.length > MAX_SCREENSHOT_NAME_LENGTH) {
    const hash = createHash('sha1').update(name).digest('hex').slice(0, 8);
    name = `${name.slice(0, MAX_SCREENSHOT_NAME_LENGTH - hash.length - 1)}-${hash}`;
  }
  const screenshotPath = `${root}/${testFileDirectory}/__screenshots__/${testFileName}/${name}-${browserName}-${platform}${ext}`;
  const key = screenshotPath.toLowerCase();
  const owner = `${testFileName} > ${testName}`;
  const existingOwner = screenshotOwners.get(key);
  if (existingOwner != null && existingOwner !== owner) {
    throw new Error(
      `"${owner}" and "${existingOwner}" use the same reference screenshot on case-insensitive file systems. Rename one of the tests.`,
    );
  }
  screenshotOwners.set(key, owner);
  return screenshotPath;
}

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      recharts: path.resolve(dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    exclude: [
      ...configDefaults.exclude,
      '**/dist/**',
      '**/.idea/**',
      '**/.cache/**',
      '**/build/**',
      '**/scripts/**',
      '**/.stryker-tmp/**',
      '**/www/docs/**',
    ],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}', 'test/**/*.{ts,tsx}', 'www/src/**/*.{ts,tsx}'],
    },
    restoreMocks: true,
    unstubGlobals: true,
    projects: [
      {
        extends: true,
        test: {
          name: 'unit:lib',
          setupFiles: [
            'test/vitest.setup.ts',
            'test/helper/toBeRechartsScale.ts',
            'test/helper/expectStackGroups.ts',
            './test/helper/expectFunctionReturning.ts',
          ],
          include: ['test/**/*.spec.ts?(x)'],
          exclude: ['test/component/**'],
        },
      },
      {
        extends: true,
        test: {
          name: 'browser',
          setupFiles: [
            'test/vitest.setup.ts',
            'vitest-browser-react',
            'test/helper/browser/locators.ts',
            'test/helper/browser/resetPointer.ts',
            'test/helper/toBeRechartsScale.ts',
            'test/helper/expectStackGroups.ts',
            './test/helper/expectFunctionReturning.ts',
          ],
          include: ['test/component/**/*.spec.ts?(x)'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({
              // The browser ignores process.env.TZ, so set the time zone on the browser context
              contextOptions: {
                timezoneId: 'UTC',
                // Browser Mode scales the test iframe down to fit the window, which would shrink every screenshot.
                // A window as large as the iframe viewport (below) keeps screenshots at 1:1 scale.
                viewport: { width: 1280, height: 1024 },
              },
            }),
            instances: [{ browser: 'chromium' }],
            // Screenshots clip at the viewport, so make it larger than the largest chart in the tests
            viewport: { width: 1280, height: 1024 },
            // Keep failure screenshots out of __screenshots__, which holds the committed reference screenshots
            screenshotDirectory: '.vitest-attachments/failures',
            expect: {
              toMatchScreenshot: {
                resolveScreenshotPath,
              },
            },
          },
        },
      },
      {
        extends: true,
        test: {
          name: 'unit:website',
          include: ['test/**/*.spec.ts?(x)'],
          root: 'www',
          setupFiles: ['test/vitest.setup.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'unit:omnidoc',
          include: ['omnidoc/**/*.spec.ts', 'omnidoc/**/*.spec.tsx'],
        },
      },
      {
        test: {
          name: 'build-output',
          include: ['scripts/**/buildOutput.test.ts', 'scripts/**/verify-exports.test.ts'],
          environment: 'node',
          globals: false,
        },
      },
      {
        test: {
          name: 'treeshaking',
          include: ['scripts/treeshaking.test.ts', 'scripts/generate-bundle-data.test.ts'],
          environment: 'node',
          globals: false,
        },
      },
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(dirname, 'storybook'),
          }),
        ],
        test: {
          exclude: ['**/test/**'],
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [
              {
                browser: 'firefox',
              },
            ],
          },
        },
      },
    ],
  },
});
