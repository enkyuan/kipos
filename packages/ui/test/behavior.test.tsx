import { afterEach, describe, expect, test } from "bun:test";
import { Button } from "../src/primitives/button";
import { Checkbox } from "../src/primitives/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "../src/primitives/dialog";
import { Radio, RadioGroup } from "../src/primitives/radio-group";
import { Switch } from "../src/primitives/switch";
import { Tab, Tabs, TabsList, TabsPanel } from "../src/primitives/tabs";
import { ToastProvider, useToast } from "../src/primitives/toast";
import { click, mount, press } from "./mount";

// What a person does with the keyboard and pointer, not how it is built.

let cleanup: (() => Promise<void>) | undefined;
afterEach(async () => {
  await cleanup?.();
  cleanup = undefined;
});

async function render(ui: Parameters<typeof mount>[0]) {
  const view = await mount(ui);
  cleanup = view.unmount;
  return view.host;
}

describe("button", () => {
  test("a pending button ignores clicks but keeps focus", async () => {
    let clicks = 0;
    const host = await render(
      <Button pending onClick={() => clicks++}>
        Save
      </Button>,
    );
    const button = host.querySelector("button")!;
    button.focus();
    await click(button);
    expect({
      clicks,
      busy: button.getAttribute("aria-busy"),
      focused: document.activeElement === button,
    }).toEqual({
      clicks: 0,
      busy: "true",
      focused: true,
    });
  });
});

describe("checkbox and switch", () => {
  test("a checkbox toggles on click and on Space", async () => {
    const host = await render(<Checkbox aria-label="Agree" />);
    const box = host.querySelector("[role=checkbox]")!;
    expect(box.getAttribute("aria-checked")).toBe("false");
    await click(box);
    expect(box.getAttribute("aria-checked")).toBe("true");
    (box as HTMLElement).focus();
    await press(box, " ");
    expect(box.getAttribute("aria-checked")).toBe("false");
  });

  test("a switch toggles on click and reports its state", async () => {
    const host = await render(<Switch aria-label="Notifications" />);
    const toggle = host.querySelector("[role=switch]")!;
    await click(toggle);
    expect(toggle.getAttribute("aria-checked")).toBe("true");
    expect(toggle.hasAttribute("data-checked")).toBe(true);
  });
});

describe("tabs and radio group", () => {
  test("Arrow keys move between tabs and the panel follows the selection", async () => {
    const host = await render(
      <Tabs defaultValue="a">
        <TabsList>
          <Tab value="a">One</Tab>
          <Tab value="b">Two</Tab>
        </TabsList>
        <TabsPanel value="a">First panel</TabsPanel>
        <TabsPanel value="b">Second panel</TabsPanel>
      </Tabs>,
    );
    const [one, two] = [...host.querySelectorAll("[role=tab]")] as HTMLElement[];
    one!.focus();
    await press(one!, "ArrowRight");
    expect(document.activeElement).toBe(two!);
    await click(two!);
    expect({
      active: two!.hasAttribute("data-active"),
      panel: host.textContent?.includes("Second panel"),
    }).toEqual({
      active: true,
      panel: true,
    });
  });

  test("a radio group selects one option at a time", async () => {
    const host = await render(
      <RadioGroup defaultValue="x" aria-label="Pick">
        <Radio value="x" aria-label="X" />
        <Radio value="y" aria-label="Y" />
      </RadioGroup>,
    );
    const [x, y] = [...host.querySelectorAll("[role=radio]")] as HTMLElement[];
    await click(y!);
    expect([x!.getAttribute("aria-checked"), y!.getAttribute("aria-checked")]).toEqual([
      "false",
      "true",
    ]);
  });
});

describe("overlays", () => {
  test("a dialog opens from its trigger, names itself, and closes on Escape", async () => {
    await render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Delete note</DialogTitle>
          <DialogDescription>This cannot be undone.</DialogDescription>
        </DialogContent>
      </Dialog>,
    );
    expect(document.querySelector("[data-slot=dialog]")).toBeNull();
    await click(document.querySelector("button")!);
    const dialog = document.querySelector("[data-slot=dialog]")!;
    expect(dialog.getAttribute("role")).toBe("dialog");
    expect(dialog.textContent).toContain("Delete note");
    await press(dialog, "Escape");
    expect(document.querySelector("[data-slot=dialog]")).toBeNull();
  });

  test("a toast appears in the viewport with its title", async () => {
    function Trigger() {
      const toast = useToast();
      return (
        <button onClick={() => toast.add({ title: "Saved", description: "All changes stored." })}>
          Add
        </button>
      );
    }
    const host = await render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    await click(host.querySelector("button")!);
    expect(document.querySelector("[data-slot=toast-viewport]")?.textContent).toContain("Saved");
  });
});
