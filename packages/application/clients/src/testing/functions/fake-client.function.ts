/**
 * Stackra file contract:
 * Purpose: `fakeClient`, a `ClientFake` scripted by `setup`, for a test that renders against a fake transport
 *          (`render(<X />, { clients: [commerce] })`) or overrides a service's generated client
 *          (`.override(PaymentsClient, fakeClient())`).
 * Boundary: the fake is typed as the client it replaces (`C`) plus the fake's own controls (`on`, `called`, `queued`,
 *           `knows`), because it answers any member path of that client at run time. `C` is inferred where the call
 *           is the override's argument; a fake kept in a variable names it (`fakeClient<PaymentsClient>()`). Without
 *           either it is a `ClientFake`.
 * Runtime: node
 * Governing contract: ADR 0269 (fakes); ADR 0260 (decision 10: tests override the client); ADR 0263.
 */
import { ClientFake } from "#testing/client.fake";

/**
 * A scripted client fake.
 *
 * @example
 * const pricing = fakeClient<PricingClient>((fake) =>
 *   fake.on(QuotePriceQuery).returns(({ lines }) => ({ currency: "SAR", lines })),
 * );
 * createTestingModule(CommerceModule).override(PricingClient, pricing).override(PaymentsClient, fakeClient());
 * expect(pricing.called(QuotePriceQuery)).toHaveLength(1);
 */
export function fakeClient<C extends object = ClientFake>(
  setup?: (fake: ClientFake) => unknown,
): C & Pick<ClientFake, "on" | "called" | "queued" | "knows"> {
  const fake = new ClientFake();
  setup?.(fake);
  // The fake answers every member path of the client it stands in for (see ClientFake).
  return fake as unknown as C & Pick<ClientFake, "on" | "called" | "queued" | "knows">;
}
