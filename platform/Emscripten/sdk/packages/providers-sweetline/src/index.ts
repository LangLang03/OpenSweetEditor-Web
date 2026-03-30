import { SweetLineIncrementalDecorationProvider, toDisposable, type IDisposable } from "@opensweeteditor/core";

export type ISweetLineProvider = InstanceType<typeof SweetLineIncrementalDecorationProvider>;

export function createSweetLineDecorationProvider(options: Record<string, unknown> = {}): ISweetLineProvider {
  return new SweetLineIncrementalDecorationProvider(options);
}

export interface IDecorationRegistrationTarget {
  registerDecorationProvider(provider: unknown): IDisposable;
}

export function registerSweetLineDecorationProvider(
  editor: IDecorationRegistrationTarget,
  options: Record<string, unknown> = {},
): { provider: ISweetLineProvider; disposable: IDisposable } {
  const provider = createSweetLineDecorationProvider(options);
  const registration = editor.registerDecorationProvider(provider);
  return {
    provider,
    disposable: toDisposable(() => {
      registration.dispose();
      if (typeof (provider as { dispose?: () => void }).dispose === "function") {
        (provider as { dispose: () => void }).dispose();
      }
    }),
  };
}
