#!/usr/bin/env bash
set -euo pipefail

BUILD_TYPE="${1:-Release}"
BUILD_DIR="${2:-build/wasm}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

if command -v emcmake >/dev/null 2>&1; then
  EMCMAKE="emcmake"
else
  echo "emcmake not found. Please activate emsdk first." >&2
  exit 1
fi

cmake -E make_directory "$REPO_ROOT/$BUILD_DIR"
$EMCMAKE cmake -S "$REPO_ROOT" -B "$REPO_ROOT/$BUILD_DIR" -G Ninja -DCMAKE_BUILD_TYPE="$BUILD_TYPE"
cmake --build "$REPO_ROOT/$BUILD_DIR"

WASM_JS="$REPO_ROOT/$BUILD_DIR/bin/sweeteditor.js"
WASM_WASM="$REPO_ROOT/$BUILD_DIR/bin/sweeteditor.wasm"
WEB_DIR="$REPO_ROOT/platform/Emscripten/web"

if [[ ! -f "$WASM_JS" ]]; then
  echo "Wasm JS output not found: $WASM_JS" >&2
  exit 1
fi
if [[ ! -f "$WASM_WASM" ]]; then
  echo "Wasm binary output not found: $WASM_WASM" >&2
  exit 1
fi

cp -f "$WASM_JS" "$WEB_DIR/sweeteditor.js"
cp -f "$WASM_WASM" "$WEB_DIR/sweeteditor.wasm"

echo "Wasm build done: $WASM_JS"
echo "Synced wasm artifacts to web directory, ready to package: $WEB_DIR"

SDK_DIR="$REPO_ROOT/platform/Emscripten/sdk"
if [[ -f "$SDK_DIR/package.json" ]]; then
  if ! command -v pnpm >/dev/null 2>&1; then
    echo "pnpm not found. Please install pnpm to build web sdk distribution." >&2
    exit 1
  fi

  pushd "$SDK_DIR" >/dev/null
  echo "Installing/updating pnpm workspace dependencies..."
  pnpm install --no-frozen-lockfile
  echo "Building Web SDK distribution to platform/Emscripten/web ..."
  pnpm build:web-dist "--wasm-js=$WASM_JS" "--wasm-wasm=$WASM_WASM"
  popd >/dev/null
fi
