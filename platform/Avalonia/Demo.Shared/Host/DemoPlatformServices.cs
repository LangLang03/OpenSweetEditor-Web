using Avalonia;
using Avalonia.Controls;

namespace SweetEditor.Avalonia.Demo.Host;

public interface IDemoPlatformServices
{
    bool IsAndroid { get; }
    bool TryGetImeTopInEditorHostDip(Visual visual, Control editorHost, out double imeTopInHostDip);
}

public static class DemoPlatformServices
{
    public static IDemoPlatformServices? Current { get; set; }
}
