/**
 * Stackra file contract:
 * Purpose: proves the form-field page titles the document, and that its live form shows each rule's message on a
 *          failed submit and says so in its status line, clears a message once the field is valid, saves valid values,
 *          shows a simulated server rejection on the email, and resets; and that the states form shows a required, an
 *          invalid (with its message), a disabled and a valid field.
 * Boundary: jsdom inside the DesignSystemProvider with a stubbed matchMedia; the theme CSS is not loaded.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 5); ADR 0303 (decision 7); ADR 0055 (forms); ADR 0022 (test placement).
 */
// @covers sta-350:FR-058 sta-350:FR-059 sta-350:FR-062
import { DesignSystemProvider } from "@stackra/ui/react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import { PlaygroundIcons } from "#src/components/playground-icons";
import { FormField } from "#src/routes/form-field/form-field";
import { FormFieldRoute } from "#src/routes/form-field/form-field.route";
import { routePath } from "#src/components/playground-pages/route-path.function";

function renderPage() {
  render(
    <DesignSystemProvider colorScheme="light" locale="en">
      <PlaygroundIcons>
        <FormField />
      </PlaygroundIcons>
    </DesignSystemProvider>,
  );
}

const section = (name: string) => within(screen.getByRole("region", { name }));

describe("Form field page", () => {
  beforeEach(() => {
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("titles the page and the document, and sits at /form-field under Forms", () => {
    renderPage();
    expect(routePath(FormFieldRoute)).toBe("/form-field");
    expect(FormFieldRoute.category).toBe("Inputs and forms");
    expect(screen.getByRole("heading", { level: 1, name: "Form field" })).toBeTruthy();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe("Form field · Stackra Playground");
  });

  it("shows each rule's message on a failed submit, says so, and clears a message once valid", async () => {
    renderPage();
    const live = section("Try it");
    fireEvent.click(live.getByRole("button", { name: "Save" }));
    expect(await live.findByText("Enter your email address.")).toBeTruthy();
    expect(live.getByText("Accept the terms to continue.")).toBeTruthy();
    expect(live.getByTestId("status").textContent).toBe("Not saved: 2 fields need attention.");
    fireEvent.change(live.getByRole("textbox", { name: /Email/ }), { target: { value: "ada" } });
    expect(await live.findByText("Enter an address such as name@example.com.")).toBeTruthy();
    fireEvent.change(live.getByRole("textbox", { name: /Email/ }), {
      target: { value: "ada@example.com" },
    });
    await waitFor(() =>
      expect(live.queryByText("Enter an address such as name@example.com.")).toBeNull(),
    );
  });

  it("saves valid values", async () => {
    renderPage();
    const live = section("Try it");
    fireEvent.change(live.getByRole("textbox", { name: /Email/ }), {
      target: { value: "ada@example.com" },
    });
    fireEvent.click(live.getByRole("radio", { name: "Team" }));
    fireEvent.click(live.getByRole("checkbox", { name: /I accept the terms/ }));
    fireEvent.click(live.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(live.getByTestId("status").textContent).toBe(
        "Saved ada@example.com on the Team plan.",
      ),
    );
  });

  it("shows a simulated server rejection on the email, and a reset clears it", async () => {
    renderPage();
    const live = section("Try it");
    fireEvent.click(live.getByRole("button", { name: "Simulate a server rejection" }));
    expect(await live.findByText("That email address is already in use.")).toBeTruthy();
    expect(live.getByRole("textbox", { name: /Email/ }).getAttribute("aria-invalid")).toBe("true");
    fireEvent.click(live.getByRole("button", { name: "Reset" }));
    await waitFor(() =>
      expect(live.queryByText("That email address is already in use.")).toBeNull(),
    );
    expect(live.getByTestId("status").textContent).toBe("Nothing saved yet.");
  });

  it("shows a required, an invalid, a disabled and a valid field", async () => {
    renderPage();
    const states = section("States");
    expect(
      states.getByRole("textbox", { name: /Required field/ }).hasAttribute("aria-required"),
    ).toBe(true);
    expect(await states.findByText("Enter a name of at least two letters.")).toBeTruthy();
    expect(
      states.getByRole("textbox", { name: "Invalid field" }).getAttribute("aria-invalid"),
    ).toBe("true");
    expect(states.getByRole("textbox", { name: "Disabled field" }).hasAttribute("disabled")).toBe(
      true,
    );
    expect((states.getByRole("textbox", { name: "Valid field" }) as HTMLInputElement).value).toBe(
      "Ada Lovelace",
    );
  });
});
