#!/usr/bin/env node
/**
 * Сборка для GitHub Pages (output: export).
 * Route handlers (app/api) несовместимы со статическим экспортом,
 * поэтому на время сборки папка api переносится в сторону.
 */
import { execSync } from 'node:child_process';
import { existsSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

// Server-only части (route handlers, server actions, sqlite) несовместимы
// со статическим экспортом - на время сборки уводим их из app/
const EXCLUDED = [
  { dir: join(root, 'app', 'api'), tmp: join(root, '.excluded-api') },
  { dir: join(root, 'app', 'admin'), tmp: join(root, '.excluded-admin') },
];

const moved = [];

try {
  // .next нельзя переиспользовать между output: export и standalone
  rmSync(join(root, '.next'), { recursive: true, force: true });
  for (const { dir, tmp } of EXCLUDED) {
    if (existsSync(dir)) {
      renameSync(dir, tmp);
      moved.push({ dir, tmp });
    }
  }
  execSync('next build', {
    stdio: 'inherit',
    env: { ...process.env, DEPLOY_TARGET: 'github' },
  });
  // .nojekyll: без него Pages/Jekyll режет _next/*
  writeFileSync(join(root, 'out', '.nojekyll'), '');
} finally {
  for (const { dir, tmp } of moved) {
    if (existsSync(tmp)) renameSync(tmp, dir);
  }
}
