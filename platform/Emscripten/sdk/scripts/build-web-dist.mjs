import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import fs from "fs-extra";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sdkRoot = path.resolve(__dirname, "..");
const emscriptenRoot = path.resolve(sdkRoot, "..");
const repoRoot = path.resolve(emscriptenRoot, "..", "..");
const webRoot = path.resolve(emscriptenRoot, "web");

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(" ")}`);
  }
}

function parseArg(name) {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : null;
}

function resolveWasmPath(explicitPath, fallbackName) {
  if (explicitPath) {
    return path.resolve(explicitPath);
  }
  return path.resolve(repoRoot, "build", "wasm", "bin", fallbackName);
}

async function main() {
  run("pnpm", ["run", "build:packages"], sdkRoot);
  run("pnpm", ["--filter", "@opensweeteditor/demo", "run", "build"], sdkRoot);

  const wasmJs = resolveWasmPath(parseArg("wasm-js"), "sweeteditor.js");
  const wasmWasm = resolveWasmPath(parseArg("wasm-wasm"), "sweeteditor.wasm");
  if (!(await fs.pathExists(wasmJs))) {
    throw new Error(`WASM JS not found: ${wasmJs}`);
  }
  if (!(await fs.pathExists(wasmWasm))) {
    throw new Error(`WASM binary not found: ${wasmWasm}`);
  }

  const demoDist = path.resolve(sdkRoot, "apps", "demo", "dist");
  if (!(await fs.pathExists(demoDist))) {
    throw new Error(`Demo dist not found: ${demoDist}`);
  }

  await fs.emptyDir(webRoot);
  await fs.copy(demoDist, webRoot);

  const runtimeRoot = path.resolve(webRoot, "runtime");
  await fs.ensureDir(runtimeRoot);
  await fs.copy(wasmJs, path.resolve(runtimeRoot, "sweeteditor.js"));
  await fs.copy(wasmWasm, path.resolve(runtimeRoot, "sweeteditor.wasm"));

  await fs.copy(
    path.resolve(sdkRoot, "assets", "sweetline"),
    path.resolve(runtimeRoot, "libs", "sweetline"),
  );
  await fs.copy(
    path.resolve(sdkRoot, "assets", "demo-syntaxes"),
    path.resolve(runtimeRoot, "syntaxes"),
  );
  await fs.copy(
    path.resolve(sdkRoot, "assets", "demo-files"),
    path.resolve(runtimeRoot, "files"),
  );

  console.log(`[sdk] web dist generated at ${webRoot}`);
}

main().catch((error) => {
  console.error("[sdk] build:web-dist failed");
  console.error(error);
  process.exitCode = 1;
});
