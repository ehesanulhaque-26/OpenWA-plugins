import { build } from 'esbuild';
import { readFile, writeFile, rm, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const plugin = process.argv[2];
if (!plugin) {
  console.error('Usage: node package.mjs <plugin-dir>');
  process.exit(1);
}

const root = process.cwd();
const dir = join(root, plugin);
const manifest = JSON.parse(await readFile(join(dir, 'manifest.json'), 'utf8'));

await mkdir(join(dir, 'dist'), { recursive: true });
// Write a package.json into dist/ so Node.js treats the CJS bundle as CommonJS
// even when the repo root has "type": "module".
await writeFile(join(dir, 'dist', 'package.json'), JSON.stringify({ type: 'commonjs' }));
await build({
  entryPoints: [join(dir, 'index.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node22',
  outfile: join(dir, 'dist', 'index.js'),
  // Bake the manifest version into the bundle (single source of truth = manifest.json) so the plugin
  // can report its own version at runtime — the sandbox does not pass `manifest` into ctx.
  define: { __PLUGIN_VERSION__: JSON.stringify(manifest.version) },
});

const zipName = `${plugin}.zip`;
await rm(join(root, zipName), { force: true });
const result = spawnSync('zip', ['-r', join(root, zipName), 'manifest.json', 'dist/index.js', 'dist/package.json'], {
  cwd: dir,
  stdio: 'inherit',
});
if (result.status !== 0) {
  console.error('zip failed (is the `zip` CLI installed?)');
  process.exit(result.status ?? 1);
}
console.log(`Packaged ${plugin} v${manifest.version} -> ${zipName}`);
