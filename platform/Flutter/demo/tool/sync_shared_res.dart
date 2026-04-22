import 'dart:io';

void main() {
  final scriptFile = File(Platform.script.toFilePath());
  final demoDir = scriptFile.parent.parent;
  final flutterDir = demoDir.parent;
  final platformDir = flutterDir.parent;
  final sourceDir = Directory(_join(platformDir.path, '_res'));
  final targetDir = Directory(_join(demoDir.path, 'assets', 'demo_shared'));

  if (!sourceDir.existsSync()) {
    stderr.writeln('Shared resource directory not found: ${sourceDir.path}');
    exitCode = 1;
    return;
  }

  if (targetDir.existsSync()) {
    targetDir.deleteSync(recursive: true);
  }
  targetDir.createSync(recursive: true);

  _copyDirectory(
    Directory(_join(sourceDir.path, 'files')),
    Directory(_join(targetDir.path, 'files')),
  );
  _copyDirectory(
    Directory(_join(sourceDir.path, 'syntaxes')),
    Directory(_join(targetDir.path, 'syntaxes')),
  );

  stdout.writeln('Synced shared resources to ${targetDir.path}');
}

void _copyDirectory(Directory source, Directory target) {
  if (!source.existsSync()) {
    return;
  }
  target.createSync(recursive: true);
  for (final entity in source.listSync(recursive: false)) {
    final name = entity.uri.pathSegments.last;
    final targetPath = _join(target.path, name);
    if (entity is Directory) {
      _copyDirectory(entity, Directory(targetPath));
    } else if (entity is File) {
      entity.copySync(targetPath);
    }
  }
}

String _join(String first, String second, [String? third, String? fourth]) {
  final parts = <String>[first, second];
  if (third != null) {
    parts.add(third);
  }
  if (fourth != null) {
    parts.add(fourth);
  }
  return parts.join(Platform.pathSeparator);
}
