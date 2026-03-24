import XCTest
@testable import SweetEditorDemoSupport

final class DemoSampleSupportTests: XCTestCase {
    func testDiscoverSampleFilesReadsRegularFilesSortedByName() throws {
        let directory = try makeTemporaryDirectory()
        try "class View {}\n".write(to: directory.appendingPathComponent("View.java"), atomically: true, encoding: .utf8)
        try "print('hello')\n".write(to: directory.appendingPathComponent("example.lua"), atomically: true, encoding: .utf8)
        try FileManager.default.createDirectory(at: directory.appendingPathComponent("nested"), withIntermediateDirectories: true)

        let files = DemoSampleSupport.discoverSampleFiles(in: [directory], bundleSampleTextLoader: { nil })

        XCTAssertEqual(files.map(\.fileName), ["View.java", "example.lua"])
        XCTAssertEqual(files.map(\.text), ["class View {}\n", "print('hello')\n"])
    }

    func testDiscoverSampleFilesFallsBackToBundleLoaderWhenSharedDirectoryIsEmpty() throws {
        let directory = try makeTemporaryDirectory()

        let files = DemoSampleSupport.discoverSampleFiles(
            in: [directory],
            bundleSampleTextLoader: { "// bundled sample\n" }
        )

        XCTAssertEqual(files.count, 1)
        XCTAssertEqual(files.first?.fileName, "sample.cpp")
        XCTAssertEqual(files.first?.text, "// bundled sample\n")
    }

    func testDiscoverSampleFilesFallsBackToEmbeddedTextWhenNoSourcesExist() {
        let missingDirectory = URL(fileURLWithPath: "/tmp/non-existent-demo-samples-\(UUID().uuidString)", isDirectory: true)

        let files = DemoSampleSupport.discoverSampleFiles(
            in: [missingDirectory],
            bundleSampleTextLoader: { nil }
        )

        XCTAssertEqual(files.count, 1)
        XCTAssertEqual(files.first?.fileName, "sample.cpp")
        XCTAssertEqual(files.first?.text, DemoSampleSupport.fallbackText)
    }

    private func makeTemporaryDirectory() throws -> URL {
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
        try FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
        addTeardownBlock {
            try? FileManager.default.removeItem(at: url)
        }
        return url
    }
}
