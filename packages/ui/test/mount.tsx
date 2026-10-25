import { act, type ReactElement } from "react";
import { createRoot } from "react-dom/client";

/** Renders into the document and returns the host plus an unmount. */
export async function mount(ui: ReactElement) {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  await act(async () => root.render(ui));
  // Base UI measures layout after mount; let those updates land inside act.
  await act(async () => void (await new Promise((resolve) => setTimeout(resolve, 0))));
  return {
    host,
    unmount: () => act(async () => root.unmount()).then(() => host.remove()),
  };
}

export const press = (target: Element, key: string) =>
  act(async () => {
    for (const type of ["keydown", "keyup"]) {
      target.dispatchEvent(new KeyboardEvent(type, { key, bubbles: true, cancelable: true }));
    }
  });

export const click = (target: Element) =>
  act(async () => {
    (target as HTMLElement).click();
  });
