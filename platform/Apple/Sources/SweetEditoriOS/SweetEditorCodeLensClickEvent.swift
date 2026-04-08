#if os(iOS)
import CoreGraphics

public struct SweetEditorCodeLensClickEvent {
    public let line: Int
    public let commandId: Int32
    public let locationInView: CGPoint

    public init(line: Int, commandId: Int32, locationInView: CGPoint) {
        self.line = line
        self.commandId = commandId
        self.locationInView = locationInView
    }
}
#endif
