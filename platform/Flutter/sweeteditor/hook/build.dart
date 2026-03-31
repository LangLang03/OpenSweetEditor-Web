import 'dart:io';

import 'package:code_assets/code_assets.dart';
import 'package:hooks/hooks.dart';
import 'package:logging/logging.dart';

void main(List<String> args) async {
  _initLogger();

  await build(args, (input, output) async {
    if (!input.config.buildCodeAssets) {
      return;
    }

    final targetOS = input.config.code.targetOS;
    final targetArchitecture = input.config.code.targetArchitecture;

    late final String relativePath;
    late final String fileName;

    if (targetOS == OS.windows && targetArchitecture == Architecture.x64) {
      relativePath = 'windows/x64/sweeteditor.dll';
      fileName = 'sweeteditor.dll';
    } else if (targetOS == OS.android &&
        targetArchitecture == Architecture.arm64) {
      relativePath = 'android/arm64-v8a/libsweeteditor.so';
      fileName = 'libsweeteditor.so';
    } else if (targetOS == OS.android &&
        targetArchitecture == Architecture.x64) {
      relativePath = 'android/x86_64/libsweeteditor.so';
      fileName = 'libsweeteditor.so';
    } else if (targetOS == OS.linux &&
        targetArchitecture == Architecture.x64) {
      relativePath = 'linux/x86_64/libsweeteditor.so';
      fileName = 'libsweeteditor.so';
    } else if (targetOS == OS.macOS &&
        targetArchitecture == Architecture.arm64) {
      relativePath = 'osx/arm64/libsweeteditor.dylib';
      fileName = 'libsweeteditor.dylib';
    } else if (targetOS == OS.macOS &&
        targetArchitecture == Architecture.x64) {
      relativePath = 'osx/x86_64/libsweeteditor.dylib';
      fileName = 'libsweeteditor.dylib';
    } else if (targetOS == OS.iOS && targetArchitecture == Architecture.arm64) {
      relativePath = 'ios/arm64/sweeteditor.framework';
      fileName = 'sweeteditor.framework';
    } else {
      throw UnsupportedError(
        'Unsupported target: ${targetOS.name} / ${targetArchitecture.name}',
      );
    }

    final sourceUri = input.packageRoot.resolve('native/$relativePath');
    final sourceFile = File(sourceUri.toFilePath());
    if (!sourceFile.existsSync()) {
      throw StateError(
        'Native library not found: ${sourceFile.path}\n'
        'packageRoot: ${input.packageRoot}\n'
        'requested: $relativePath\n'
        'Run `dart tool/sync_native_binaries.dart` in the sweeteditor package '
        'directory to populate native binaries.',
      );
    }

    final outFile = input.outputDirectory.resolve(fileName);
    await sourceFile.copy(outFile.toFilePath());

    output.assets.code.add(
      CodeAsset(
        package: input.packageName,
        name: 'lib/sweeteditor.dart',
        linkMode: DynamicLoadingBundled(),
        file: outFile,
      ),
    );
  });
}

void _initLogger() {
  Logger.root.level = Level.ALL;
  Logger.root.onRecord.listen((record) {
    stdout.writeln('[${record.level.name}] ${record.message}');
  });
}
