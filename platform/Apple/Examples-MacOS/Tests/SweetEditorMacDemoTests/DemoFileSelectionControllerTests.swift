import XCTest
import SweetEditorDemoSupport
@testable import SweetEditorMacDemo

final class DemoFileSelectionControllerTests: XCTestCase {
    func testInitializerReturnsNilWhenNoFilesExist() {
        XCTAssertNil(DemoFileSelectionController(sampleFiles: []))
    }

    func testInitializerSelectsFirstFileAndExposesTitles() throws {
        let files = [
            DemoSampleSupport.DemoSampleFile(fileName: "View.java", text: "class View {}\n"),
            DemoSampleSupport.DemoSampleFile(fileName: "example.kt", text: "fun main() {}\n"),
        ]

        let controller = try XCTUnwrap(DemoFileSelectionController(sampleFiles: files))

        XCTAssertEqual(controller.fileTitles, ["View.java", "example.kt"])
        XCTAssertEqual(controller.selectedFile.fileName, "View.java")
        XCTAssertEqual(controller.statusText, "Loaded View.java")
    }

    func testSelectFileUpdatesSelectedFileAndStatus() throws {
        let files = [
            DemoSampleSupport.DemoSampleFile(fileName: "View.java", text: "class View {}\n"),
            DemoSampleSupport.DemoSampleFile(fileName: "example.kt", text: "fun main() {}\n"),
        ]
        var controller = try XCTUnwrap(DemoFileSelectionController(sampleFiles: files))

        let selected = controller.selectFile(named: "example.kt")

        XCTAssertEqual(selected.fileName, "example.kt")
        XCTAssertEqual(controller.selectedFile.fileName, "example.kt")
        XCTAssertEqual(controller.statusText, "Loaded example.kt")
    }

    func testSelectFileKeepsCurrentSelectionWhenNameIsUnknown() throws {
        let files = [
            DemoSampleSupport.DemoSampleFile(fileName: "View.java", text: "class View {}\n"),
            DemoSampleSupport.DemoSampleFile(fileName: "example.kt", text: "fun main() {}\n"),
        ]
        var controller = try XCTUnwrap(DemoFileSelectionController(sampleFiles: files))

        let selected = controller.selectFile(named: "missing.cpp")

        XCTAssertEqual(selected.fileName, "View.java")
        XCTAssertEqual(controller.selectedFile.fileName, "View.java")
        XCTAssertEqual(controller.statusText, "Loaded View.java")
    }

    func testCurrentMetadataUsesSelectedFileName() throws {
        let files = [
            DemoSampleSupport.DemoSampleFile(fileName: "View.java", text: "class View {}\n"),
            DemoSampleSupport.DemoSampleFile(fileName: "example.kt", text: "fun main() {}\n"),
        ]
        var controller = try XCTUnwrap(DemoFileSelectionController(sampleFiles: files))

        XCTAssertEqual(controller.currentMetadata.fileName, "View.java")

        _ = controller.selectFile(named: "example.kt")

        XCTAssertEqual(controller.currentMetadata.fileName, "example.kt")
    }
}
