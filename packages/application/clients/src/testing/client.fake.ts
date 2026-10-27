/**
 * Stackra file contract:
 * Purpose: `ClientFake`, the fake `fakeClient()` returns: a `ClientTransport` that answers calls by ref
 *          (`fake.on(QuotePriceQuery).returns(...)`) and records them (`called`, `queued`), and also stands in for any
 *          `ServiceClient`: `fake.price.quote.call(input)` reaches the ref whose key ends in `price.quote`.
 * Boundary: never reaches a network. A call with no answer rejects with an error naming the ref; a queued call with no
 *           answer is recorded and accepted. A stubbed call validates its input like the real client. Recorded inputs
 *           are what the transport received (wire form), or the caller's input for an unanswered member call.
 * Runtime: node
 * Governing contract: ADR 0269 (fakes); ADR 0260 (decision 10: tests override the client); ADR 0263.
 */
import { ClientTransport } from "#contracts/ports/client-transport.port";
import type { ClientRequest } from "#contracts/types/client-request.type";
import { clientRequest } from "#core/functions/client-request.function";
import type { ActionRef } from "#core/types/action-ref.type";
import type { CallOptions } from "#core/types/call-options.type";
import type { CallRef } from "#core/types/call-ref.type";
import type { RefInput } from "#core/types/ref-input.type";
import { memberPath } from "#testing/functions/member-path.function";
import type { FakeAnswer } from "#testing/types/fake-answer.type";

/** One way to answer. */
type Answer =
  | { readonly kind: "value"; readonly value: unknown }
  | { readonly kind: "error"; readonly error: unknown }
  | { readonly kind: "pending" };

/** The answers of one ref. */
interface Stub {
  readonly ref: CallRef;
  readonly once: Answer[];
  always?: Answer;
}

/** One recorded call. */
interface Sent {
  readonly key?: string;
  readonly path: string;
  readonly input: unknown;
  readonly mode: "call" | "queue";
}

/** A property name that can be a client resource (`payment`), and none a runtime probes for. */
const RESOURCE = /^[a-z][A-Za-z0-9]*$/;

/** Names that promises, JSON, matchers and printers probe for. */
const PROBED: ReadonlySet<string> = new Set([
  "then",
  "toJSON",
  "asymmetricMatch",
  "nodeType",
  "tagName",
  "inspect",
]);

/**
 * A client that answers from a test's script.
 *
 * @example
 * const pricing = fakeClient((fake) => fake.on(QuotePriceQuery).returns({ currency: "SAR", lines: [] }));
 * expect(pricing.called(QuotePriceQuery)).toHaveLength(1);
 */
export class ClientFake extends ClientTransport {
  private readonly stubs = new Map<string, Stub>();

  private readonly sent: Sent[] = [];

  constructor() {
    super();
    // Any other lowercase property is a resource of the service client this fake stands in for.
    return new Proxy(this, {
      get: (target, property, receiver) =>
        typeof property === "string" &&
        !(property in target) &&
        RESOURCE.test(property) &&
        !PROBED.has(property)
          ? target.resourceOf(property)
          : Reflect.get(target, property, receiver),
    });
  }

  /** How the fake answers calls of `ref`. */
  on<R extends CallRef>(ref: R): FakeAnswer<R> {
    const stub = this.stubs.get(ref.key) ?? { ref, once: [] };
    this.stubs.set(ref.key, stub);
    const answer: FakeAnswer<R> = {
      returns: (value) => {
        stub.always = { kind: "value", value };
        return answer;
      },
      throws: (error) => {
        stub.always = { kind: "error", error };
        return answer;
      },
      throwsOnce: (error) => {
        stub.once.push({ kind: "error", error });
        return answer;
      },
      pending: () => {
        stub.always = { kind: "pending" };
        return answer;
      },
    };
    return answer;
  }

  /** The inputs `ref` was called with, oldest first. */
  called<R extends CallRef>(ref: R): readonly RefInput<R>[] {
    return this.inputsOf(ref, "call") as readonly RefInput<R>[];
  }

  /** The inputs `ref` was queued with, oldest first. */
  queued<A extends ActionRef>(ref: A): readonly RefInput<A>[] {
    return this.inputsOf(ref, "queue") as readonly RefInput<A>[];
  }

  /** Whether the fake answers the ref keyed `key`, so a set of fakes can route a call to the one that does. */
  knows(key: string): boolean {
    return this.stubs.has(key);
  }

  /** Records the call and answers it from the script. */
  send(request: ClientRequest): Promise<unknown> {
    this.sent.push({
      key: request.key,
      path: memberPath(request.key),
      input: request.input,
      mode: "call",
    });
    return this.answer(request);
  }

  /** Records the queued call and accepts it, unless the script rejects it. */
  async queue(request: ClientRequest): Promise<void> {
    this.sent.push({
      key: request.key,
      path: memberPath(request.key),
      input: request.input,
      mode: "queue",
    });
    if (this.stubs.has(request.key)) await this.answer(request);
  }

  /** The recorded inputs of `ref` in `mode`. */
  private inputsOf(ref: CallRef, mode: Sent["mode"]): unknown[] {
    const path = memberPath(ref.key);
    return this.sent
      .filter(
        (sent) =>
          sent.mode === mode &&
          (sent.key === undefined ? sent.path === path : sent.key === ref.key),
      )
      .map((sent) => sent.input);
  }

  /** The scripted answer to `request`. */
  private answer(request: ClientRequest): Promise<unknown> {
    const stub = this.stubs.get(request.key);
    const next = stub?.once.shift() ?? stub?.always;
    if (stub === undefined || next === undefined)
      return Promise.reject(
        new Error(
          `fakeClient has no answer for ${request.key}: add fake.on(<its ref>).returns(...)`,
        ),
      );
    if (next.kind === "pending") return new Promise(() => undefined);
    if (next.kind === "error") return Promise.reject(next.error);
    const value = next.value;
    return Promise.resolve().then(() =>
      typeof value === "function"
        ? (value as (input: unknown) => unknown)(stub.ref.input.parse(request.input))
        : value,
    );
  }

  /** The resource `name` of the service client this fake stands in for. */
  private resourceOf(name: string): object {
    return new Proxy(
      {},
      {
        get: (_, verb) => (typeof verb === "string" ? this.memberOf(`${name}.${verb}`) : undefined),
      },
    );
  }

  /** The member at `path` (`payment.void`), answered by the ref whose key ends in it. */
  private memberOf(path: string): object {
    const stubbed = () =>
      [...this.stubs.values()].find((stub) => memberPath(stub.ref.key) === path);
    return {
      call: async (input: unknown, options?: CallOptions) => {
        const stub = stubbed();
        if (stub !== undefined) return this.send(clientRequest(stub.ref, input, options));
        this.sent.push({ path, input, mode: "call" });
        throw new Error(
          `fakeClient has no answer for ${path}: add fake.on(<its ref>).returns(...)`,
        );
      },
      queue: async (input: unknown, options?: CallOptions) => {
        const stub = stubbed();
        if (stub !== undefined) return this.queue(clientRequest(stub.ref, input, options));
        this.sent.push({ path, input, mode: "queue" });
      },
    };
  }
}
