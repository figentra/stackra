/**
 * Stackra file contract:
 * Purpose: proves the FakeConfirmationProvider answers `useConfirmation()`'s questions with its answer, reports each
 *          question, and lets code under it run without a dialog.
 * Boundary: jsdom; the real `useConfirmation` reads the fake's context.
 * Runtime: browser
 * Governing contract: ADR 0312; ADR 0022 (test placement).
 */
// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import { useEffect, useState } from "react";

import { useConfirmation } from "#react/confirmation/use-confirmation";
import { FakeConfirmationProvider } from "#testing/fakes/fake-confirmation-provider";

/** The question the asker puts. */
const QUESTION = {
  title: "Cancel the order?",
  confirmLabel: "Cancel order",
  cancelLabel: "Keep order",
} as const;

/** Asks once and shows the answer. */
function Asker() {
  const confirm = useConfirmation();
  const [answer, setAnswer] = useState<string>("pending");
  useEffect(() => {
    void confirm(QUESTION).then((yes) => setAnswer(String(yes)));
  }, [confirm]);
  return <output>{answer}</output>;
}

describe("FakeConfirmationProvider", () => {
  it("answers yes and reports the question", async () => {
    const onAsk = vi.fn();
    render(
      <FakeConfirmationProvider answer onAsk={onAsk}>
        <Asker />
      </FakeConfirmationProvider>,
    );
    await waitFor(() => expect(screen.getByText("true")).toBeTruthy());
    expect(onAsk).toHaveBeenCalledWith(QUESTION);
  });

  it("answers no", async () => {
    render(
      <FakeConfirmationProvider answer={false}>
        <Asker />
      </FakeConfirmationProvider>,
    );
    await waitFor(() => expect(screen.getByText("false")).toBeTruthy());
  });
});
