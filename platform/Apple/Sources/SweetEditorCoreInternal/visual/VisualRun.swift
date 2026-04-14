import Foundation

enum VisualRunType: String, Codable {
    case TEXT
    case WHITESPACE
    case NEWLINE
    case INLAY_HINT
    case PHANTOM_TEXT
    case FOLD_PLACEHOLDER
    case TAB
    case CODELENS
    case LINK
}

struct InlineStyle: Codable {
    let font_style: Int32
    let color: Int32
    let background_color: Int32

    init(font_style: Int32, color: Int32, background_color: Int32) {
        self.font_style = font_style
        self.color = color
        self.background_color = background_color
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        font_style = try container.decode(Int32.self, forKey: .font_style)
        color = try container.decode(Int32.self, forKey: .color)
        background_color = try container.decodeIfPresent(Int32.self, forKey: .background_color) ?? 0
    }
}

struct VisualRun: Codable {
    let type: VisualRunType
    let x: Float
    let y: Float
    let text: String
    let style: InlineStyle
    let icon_id: Int32
    let color_value: Int32
    let width: Float
    let padding: Float
    let margin: Float
    let active: Bool

    init(type: VisualRunType, x: Float, y: Float, text: String, style: InlineStyle, icon_id: Int32, color_value: Int32, width: Float, padding: Float, margin: Float, active: Bool = false) {
        self.type = type
        self.x = x
        self.y = y
        self.text = text
        self.style = style
        self.icon_id = icon_id
        self.color_value = color_value
        self.width = width
        self.padding = padding
        self.margin = margin
        self.active = active
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        type = try container.decode(VisualRunType.self, forKey: .type)
        x = try container.decode(Float.self, forKey: .x)
        y = try container.decode(Float.self, forKey: .y)
        text = try container.decode(String.self, forKey: .text)
        style = try container.decode(InlineStyle.self, forKey: .style)
        icon_id = try container.decode(Int32.self, forKey: .icon_id)
        color_value = try container.decodeIfPresent(Int32.self, forKey: .color_value) ?? 0
        width = try container.decode(Float.self, forKey: .width)
        padding = try container.decode(Float.self, forKey: .padding)
        margin = try container.decode(Float.self, forKey: .margin)
        active = try container.decodeIfPresent(Bool.self, forKey: .active) ?? false
    }
}
