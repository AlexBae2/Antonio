#!/usr/bin/env node
/**
 * Сборка для GitHub Pages (output: export).
 * Route handlers (app/api) несовместимы со статическим экспортом,
 * поэтому на время сборки папка api переносится в сторону.
 */
import { execSync } from 'node:child_process';
import { existsSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const apiDir = join(root, 'app', 'api');
const apiTmp = join(root, '.api-excluded');

const hasApi = existsSync(apiDir);

try {
  if (hasApi) renameSync(apiDir, apiTmp);
  execSync('next build', {
    stdio: 'inherit',
    env: { ...process.env, DEPLOY_TARGET: 'github' },
  });
  // .nojekyll: без него Pages/Jekyll режет _next/*
  writeFileSync(join(root, 'out', '.nojekyll'), '');
} finally {
  if (hasApi && existsSync(apiTmp)) renameSync(apiTmp, apiDir);
}
