/**
 * Stackra file contract:
 * Purpose: proves the LeadForm is a region named by its heading with a labelled field per `LeadField` (required ones
 *          marked) and an unticked consent box; that a send posts one `LeadSubmission` as JSON to `action` with the
 *          answers, the consent answer and its words, the page's path and the verification slot's inputs; that
 *          success replaces the form in the status region and failure is an alert that keeps the answers.
 * Boundary: unit tier, jsdom, the real @stackra/ui components; `fetch` and matchMedia are stand-ins.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0504; WCAG 2.2 3.3.2 and 4.1.3; STA-2041.
 */
// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "@stackra/testing";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { LeadForm } from "#react/lead-form/lead-form";
import type { LeadFormProps } from "#react/lead-form/lead-form.props";

/** jsdom has no matchMedia; the provider and Motion read the system's scheme and motion from it. */
vi.stubGlobal("matchMedia", () => ({
  matches: false,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
}));

const PROPS: LeadFormProps = {
  title: "Book a demo",
  line: "We answer within a working day.",
  fields: [
    { id: "name", type: "text", label: "Name", isRequired: true },
    { id: "email", type: "email", label: "Work email", isRequired: true },
    { id: "message", type: "textarea", label: "What do you ship?" },
  ],
  consent: { text: "Send me product news", document: "marketing_email", version: "1" },
  submit: "Send",
  success: "Thanks, we'll be in touch.",
  failure: "Not sent. Try again.",
  action: "/api/leads",
};

/** Answers the form's fields and sends it, then lets the post settle. */
const fillAndSend = async () => {
  fireEvent.change(screen.getByLabelText(/Name/), { target: { value: "Sara" } });
  fireEvent.change(screen.getByLabelText(/Work email/), { target: { value: "sara@example.com" } });
  fireEvent.click(screen.getByRole("checkbox", { name: "Send me product news" }));
  await act(async () => {
    fireEvent.submit(screen.getByRole("form", { name: "Book a demo" }));
  });
};

describe("LeadForm", () => {
  // each send stubs its own fetch
  afterEach(cleanup);

  it("is a region named by its heading, every field labelled and the consent box unticked", () => {
    render(<LeadForm {...PROPS} />);
    expect(screen.getByRole("region", { name: "Book a demo" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("Book a demo");
    expect((screen.getByLabelText(/Name/) as HTMLInputElement).required).toBe(true);
    expect((screen.getByLabelText(/Work email/) as HTMLInputElement).type).toBe("email");
    expect(screen.getByLabelText(/What do you ship/).tagName).toBe("TEXTAREA");
    const box = screen.getByRole("checkbox", { name: "Send me product news" }) as HTMLInputElement;
    expect(box.checked).toBe(false);
  });

  it("posts one LeadSubmission and announces success in place of the form", async () => {
    const post = vi.fn(async () => ({ ok: true }));
    vi.stubGlobal("fetch", post);
    render(
      <LeadForm {...PROPS} verification={<input type="hidden" name="challenge" value="tok" />} />,
    );
    await fillAndSend();
    expect(post).toHaveBeenCalledTimes(1);
    const [url, init] = post.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/leads");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toEqual({
      fields: { name: "Sara", email: "sara@example.com", message: "" },
      consent: {
        document: "marketing_email",
        version: "1",
        text: "Send me product news",
        granted: true,
      },
      sourcePage: "/",
      verification: { challenge: "tok" },
    });
    expect(screen.getByRole("status").textContent).toBe("Thanks, we'll be in touch.");
    expect(screen.queryByRole("form")).toBeNull();
  });

  it("alerts on a failed send and keeps the answers", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false })),
    );
    render(<LeadForm {...PROPS} />);
    await fillAndSend();
    expect(screen.getByRole("alert").textContent).toBe("Not sent. Try again.");
    expect((screen.getByLabelText(/Name/) as HTMLInputElement).value).toBe("Sara");
  });

  it("sends no consent without a box, and a network error is a failure", async () => {
    const post = vi.fn(async () => {
      throw new TypeError("offline");
    });
    vi.stubGlobal("fetch", post);
    const { consent: _consent, ...rest } = PROPS;
    render(<LeadForm {...rest} />);
    expect(screen.queryByRole("checkbox")).toBeNull();
    await act(async () => {
      fireEvent.submit(screen.getByRole("form", { name: "Book a demo" }));
    });
    const [, init] = post.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(String(init.body)).consent).toBeNull();
    expect(screen.getByRole("alert").textContent).toBe("Not sent. Try again.");
  });
});
