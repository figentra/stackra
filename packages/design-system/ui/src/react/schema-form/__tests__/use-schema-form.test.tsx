/**
 * Stackra file contract:
 * Purpose: proves the web `useSchemaForm`, in the template contact form's shape: `field(name)` spread onto a TextField
 *          binds it, `handleNativeSubmit()` stops an invalid post and shows the schema's message on the field, and lets
 *          a valid one post.
 * Boundary: jsdom with real HeroUI and React Aria; the schema is registered for the class the way gen does.
 * Runtime: browser
 * Governing contract: ADR 0055; ADR 0165 (decision 2); ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { registerSchemas } from "@stackra/validation";
import { fireEvent, render, screen } from "@testing-library/react";
import { z } from "zod";

import { TextField } from "#react/text-field/text-field";
import { useSchemaForm } from "#react/schema-form/use-schema-form";

/** The contact form's one field that matters here. */
class ContactInput {
  email!: string;
}

registerSchemas([[ContactInput, z.object({ email: z.string().email("enter_email") })]]);

/** A natively posted form over `ContactInput`. */
function ContactForm() {
  const form = useSchemaForm(ContactInput, { defaultValues: { email: "" } });
  return (
    <form aria-label="Contact" onSubmit={form.handleNativeSubmit()}>
      <TextField {...form.field("email")} label="Email" />
    </form>
  );
}

describe("useSchemaForm (web)", () => {
  it("stops an invalid post and shows the message on the field", async () => {
    render(<ContactForm />);
    const posted = fireEvent.submit(screen.getByRole("form", { name: "Contact" }));
    expect(posted).toBe(false);
    expect(await screen.findByText("enter_email")).toBeTruthy();
  });

  it("lets a valid form post", () => {
    render(<ContactForm />);
    fireEvent.change(screen.getByRole("textbox", { name: "Email" }), {
      target: { value: "ada@example.com" },
    });
    expect(fireEvent.submit(screen.getByRole("form", { name: "Contact" }))).toBe(true);
  });
});
