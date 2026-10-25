import { describe, expect, test } from "bun:test";
import { contrast, type Mode, modeVars, parse, resolve, role, type Rgb } from "./css";

// Judges the roles as they resolve in each mode, against the surface each sits
// on. A role is only as legible as the scale step it points at, so this is
// the check that keeps a palette or role change honest.

const modes: Mode[] = ["light", "dark"];
const intents = ["brand", "positive", "warning", "danger", "info"] as const;

describe("role contrast", () => {
  for (const mode of modes) {
    const vars = modeVars(mode);
    const page = parse(resolve(vars["--color-page"]!, vars)).slice(0, 3) as Rgb;
    const on = (name: string, backdrop: Rgb = page) => role(name, vars, backdrop);

    test(`${mode}: primary, secondary and tertiary text clear AA on the page`, () => {
      for (const name of ["primary-foreground", "secondary-foreground", "tertiary-foreground"]) {
        expect({ name, ratio: contrast(on(name), page) >= 4.5 }).toEqual({ name, ratio: true });
      }
    });

    test(`${mode}: text clears AA on cards, components and the container`, () => {
      for (const surface of ["card", "component", "component-on-container-strong", "container"]) {
        const bg = on(surface);
        for (const name of ["primary-foreground", "secondary-foreground"]) {
          expect({ surface, name, ok: contrast(on(name, bg), bg) >= 4.5 }).toEqual({
            surface,
            name,
            ok: true,
          });
        }
      }
    });

    for (const intent of intents) {
      test(`${mode}: ${intent} foreground clears AA on the page`, () => {
        expect(contrast(on(`${intent}-foreground`), page)).toBeGreaterThanOrEqual(4.5);
      });

      test(`${mode}: ${intent} text clears AA on its own subtle fill`, () => {
        const subtle = on(`${intent}-subtle`);
        expect(
          contrast(on(`on-${intent}-subtle-foreground`, subtle), subtle),
        ).toBeGreaterThanOrEqual(4.5);
      });
    }

    for (const intent of intents.filter((name) => name !== "info")) {
      test(`${mode}: text on the ${intent} solid clears AA`, () => {
        const solid = on(`${intent}-solid`);
        expect(contrast(on(`on-${intent}-solid-foreground`, solid), solid)).toBeGreaterThanOrEqual(
          4.5,
        );
      });
    }

    test(`${mode}: text on the primary (inverted) button clears AA`, () => {
      const solid = on("inverted-solid");
      expect(contrast(on("on-inverted-foreground", solid), solid)).toBeGreaterThanOrEqual(4.5);
    });

    test(`${mode}: the focus ring is visible (3:1) on the page`, () => {
      expect(contrast(on("brand-border-focus"), page)).toBeGreaterThanOrEqual(3);
    });
  }

  // The check must be able to fail: disabled text is exempt from AA by design.
  test("the checker tells a failing pair from a passing one", () => {
    const vars = modeVars("light");
    const page: Rgb = [1, 1, 1];
    expect(contrast(role("disabled-foreground", vars, page), page)).toBeLessThan(4.5);
  });
});
