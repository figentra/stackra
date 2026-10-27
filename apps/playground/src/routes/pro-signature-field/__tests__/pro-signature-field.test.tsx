/**
 * Stackra file contract:
 * Purpose: proves the Signature field page sits at /pro-signature-field, titles the page and the document, reports a
 *          typed signature and its clearing, and shows the required field's error.
 * Boundary: jsdom with the real `@stackra/ui` TextField and Button inside the field.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); WCAG 2.2 SC 2.1.1; ADR 0022 (test placement).
 */
// HeroUI Pro reads matchMedia as its modules load, which jsdom lacks; the stub runs before them.
import "#src/__tests__/stub-browser-apis";

import { fireEvent, render, screen } from "@testing-library/react";

import { ProSignatureField } from "#src/routes/pro-signature-field/pro-signature-field";
import { ProSignatureFieldRoute } from "#src/routes/pro-signature-field/pro-signature-field.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

describe("ProSignatureField", () => {
  it("sits at /pro-signature-field, and titles the page and the document", () => {
    render(<ProSignatureField />);
    expect(routePath(ProSignatureFieldRoute)).toBe("/pro-signature-field");
    expect(
      screen.getByRole("heading", { level: 1, name: ProSignatureFieldRoute.title }),
    ).toBeTruthy();
    expect(document.title).toBe("Signature field · Stackra Playground");
  });

  it("reports a typed signature, clears it, and shows the required error", () => {
    render(<ProSignatureField />);
    const [typed] = screen.getAllByRole("textbox", { name: /Or type your full name/ });
    if (typed === undefined) throw new Error("no typed-name field");
    fireEvent.change(typed, { target: { value: "Sara Ali" } });
    expect(screen.getByRole("status").textContent).toBe("Signed as Sara Ali");
    const [clear] = screen.getAllByRole("button", { name: "Clear" });
    if (clear === undefined) throw new Error("no clear button");
    fireEvent.click(clear);
    expect(screen.getByRole("status").textContent).toBe("Not signed");
    expect(screen.getByRole("alert").textContent).toBe("Sign before you submit.");
  });
});
