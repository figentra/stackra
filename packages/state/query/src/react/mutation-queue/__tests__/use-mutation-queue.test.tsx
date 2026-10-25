/**
 * Stackra file contract:
 * Purpose: unit and type tests of `useMutationQueue()`: it returns the `MutationQueue` the nearest container binds (a
 *          fake bound in its place too), the banner's counts read from it, and it throws outside a provider or when
 *          nothing binds the queue.
 * Boundary: test only; renders with react-dom/server (no DOM needed), so it reads the queue as the render finds it.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0252; ADR 0295 (decision 10).
 */
import { Container } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";
import { renderToString } from "react-dom/server";

import { MutationQueue } from "#core/index";
import { useMutationQueue } from "#react/mutation-queue/use-mutation-queue";
import { fakeQueue } from "#testing/functions/fake-queue.function";

/** Renders the banner's line: waiting calls and conflicts. */
function QueueLine() {
  const queue = useMutationQueue();
  return <span>{`${queue.pending} waiting, ${queue.conflicts.length} to resolve`}</span>;
}

/** Renders `<QueueLine />` in a container that binds `queue` as the `MutationQueue`. */
async function renderWith(queue: MutationQueue): Promise<string> {
  const container = await Container.create([], { overrides: new Map([[MutationQueue, queue]]) });
  return renderToString(
    <ContainerProvider container={container}>
      <QueueLine />
    </ContainerProvider>,
  );
}

describe("useMutationQueue", () => {
  it("reads the bound queue, a fake included", async () => {
    expect(await renderWith(fakeQueue({ pending: 2, conflicts: 1 }))).toBe(
      "<span>2 waiting, 1 to resolve</span>",
    );
    expect(await renderWith(fakeQueue())).toBe("<span>0 waiting, 0 to resolve</span>");
    expectTypeOf(useMutationQueue).returns.toEqualTypeOf<MutationQueue>();
  });

  it("throws outside a ContainerProvider", () => {
    expect(() => renderToString(<QueueLine />)).toThrow(/ContainerProvider/);
  });

  it("throws when the container does not bind MutationQueue", async () => {
    const container = await Container.create([]);
    expect(() =>
      renderToString(
        <ContainerProvider container={container}>
          <QueueLine />
        </ContainerProvider>,
      ),
    ).toThrow(/MutationQueue/);
  });
});
