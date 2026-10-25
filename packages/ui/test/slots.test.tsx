import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Badge } from "../src/primitives/badge";
import { Button } from "../src/primitives/button";
import { Card } from "../src/primitives/card";
import { Checkbox } from "../src/primitives/checkbox";
import { Divider } from "../src/primitives/divider";
import { Input, Textarea } from "../src/primitives/input";
import { Label } from "../src/primitives/label";
import { RadioGroup } from "../src/primitives/radio-group";
import { Skeleton } from "../src/primitives/skeleton";
import { Spinner } from "../src/primitives/spinner";
import { Switch } from "../src/primitives/switch";

// The markup contract: every part names itself with `data-slot` and carries
// its `nm-*` class, which is what the stylesheet and app code select on.

const parts: [slot: string, className: string, markup: string][] = [
  ["button", "nm-btn", renderToStaticMarkup(<Button>Go</Button>)],
  ["input", "nm-input", renderToStaticMarkup(<Input aria-label="Name" />)],
  ["textarea", "nm-textarea", renderToStaticMarkup(<Textarea aria-label="Notes" />)],
  ["label", "nm-label", renderToStaticMarkup(<Label>Name</Label>)],
  ["checkbox", "nm-checkbox", renderToStaticMarkup(<Checkbox aria-label="Agree" />)],
  ["switch", "nm-switch", renderToStaticMarkup(<Switch aria-label="On" />)],
  ["radio-group", "nm-radio-group", renderToStaticMarkup(<RadioGroup aria-label="Pick" />)],
  ["card", "nm-card", renderToStaticMarkup(<Card>Body</Card>)],
  ["badge", "nm-badge", renderToStaticMarkup(<Badge>New</Badge>)],
  ["divider", "nm-divider", renderToStaticMarkup(<Divider />)],
  ["spinner", "nm-spinner", renderToStaticMarkup(<Spinner />)],
  ["skeleton", "nm-skeleton", renderToStaticMarkup(<Skeleton />)],
];

describe("primitive markup", () => {
  test.each(parts)(
    "%s is named by data-slot and styled by its nm- class",
    (slot, className, markup) => {
      expect(markup).toContain(`data-slot="${slot}"`);
      expect(markup).toMatch(new RegExp(`class="[^"]*\\b${className}\\b`));
    },
  );

  test("variants and sizes reach the markup as classes and data attributes", () => {
    const html = renderToStaticMarkup(
      <Button variant="danger" size="lg" shape="pill" iconOnly aria-label="Delete" />,
    );
    expect(html).toContain("nm-btn-danger");
    expect(html).toContain("nm-btn-lg");
    expect(html).toContain("nm-btn-pill");
    expect(html).toContain("nm-btn-icon-only");
    expect(html).toContain('data-variant="danger"');
    expect(renderToStaticMarkup(<Badge variant="positive">Ok</Badge>)).toContain(
      "nm-badge-positive",
    );
  });

  test("className is appended after the component classes", () => {
    expect(renderToStaticMarkup(<Card className="mt-4">x</Card>)).toMatch(/class="nm-card mt-4"/);
  });

  test("a spinner is a named status and a skeleton is hidden from assistive tech", () => {
    expect(renderToStaticMarkup(<Spinner aria-label="Saving" />)).toContain('aria-label="Saving"');
    expect(renderToStaticMarkup(<Skeleton />)).toContain('aria-hidden="true"');
  });
});
