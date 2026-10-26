/**
 * Stackra file contract:
 * Purpose: `emitBoot`, a service's `#stackra/boot` (`.stackra/gen/boot.ts`): one `boot(container, { url, signal })`
 *          that connects what needs the booted container, in order: the bound `HoldRegistry` and `SequenceTimeZone`
 *          drivers (or none), `PostgresDatabaseDriver.connect` with the legal-hold subscriber and the outbox writer
 *          among its subscribers, `segments.connect(container)`, then `relay.connect(container)` and the relay's
 *          `work` loop until the signal aborts.
 * Boundary: pure. Each step is written only when the service runs its package (`@stackra/database` or a model,
 *           `@stackra/outbox`, `@stackra/segments`); nothing to connect means no file. The connection string is the
 *           runtime's (the generated Encore app's database), never read here; `@stackra/app/server` calls `boot` once
 *           it hands the entry its container.
 * Runtime: isomorphic
 * Governing contract: ADR 0014 (decision 5: the runtime provides the connection); ADR 0078 (the outbox relay); ADR
 *                     0332 (segments); ADR 0295 (decision 8: boot order belongs to the runtime); ADR 0134 (2026-10-24
 *                     amendment: every disposal path asks the connected `HoldRegistry`); ADR 0394 (decision 1).
 */
import { generatedHeader } from "#core/functions/generated-header.function";
import type { MemberIR } from "#core/types/member-ir.type";

/**
 * The boot file of a service, or undefined when it has nothing to connect.
 *
 * @example
 * emitBoot(serviceIr); // "...export async function boot(container: Container, options: ...): Promise<void> {..."
 */
export function emitBoot(ir: MemberIR): string | undefined {
  if (ir.layout !== "service") return undefined;
  const uses = (name: string): boolean =>
    (ir.packages ?? []).includes(name) ||
    ir.dependencies.some((dependency) => dependency.package === name);
  const database =
    uses("@stackra/database") ||
    ir.classes.some((declared) => declared.kind === "model") ||
    ir.dependencies.some(({ manifest }) => (manifest.models ?? []).length > 0);
  const outbox = uses("@stackra/outbox");
  const segments = uses("@stackra/segments");
  if (!database && !outbox && !segments) return undefined;

  const imports = ['import type { Container } from "@stackra/container";'];
  const steps: string[] = [];
  if (database) {
    imports.push(
      'import { HoldRegistry, SequenceTimeZone } from "@stackra/database/contracts";',
      'import { connectHoldRegistry, connectSequenceTimeZone, HoldSubscriber } from "@stackra/database";',
      'import { PostgresDatabaseDriver } from "@stackra/database/node";',
    );
    steps.push(
      "  connectHoldRegistry(container.has(HoldRegistry) ? container.get(HoldRegistry) : undefined);",
      "  connectSequenceTimeZone(",
      "    container.has(SequenceTimeZone) ? container.get(SequenceTimeZone) : undefined,",
      "  );",
      `  await PostgresDatabaseDriver.connect({ url: options.url, subscribers: [new HoldSubscriber()${outbox ? ", container.get(OutboxWriterService)" : ""}] });`,
    );
  }
  if (outbox)
    imports.push('import { OutboxRelayService, OutboxWriterService } from "@stackra/outbox/node";');
  if (segments) {
    imports.push('import { SegmentService } from "@stackra/segments/node";');
    steps.push("  container.get(SegmentService).connect(container);");
  }
  if (outbox)
    steps.push(
      "  const relay = container.get(OutboxRelayService);",
      "  relay.connect(container);",
      "  void relay.work({ signal: options.signal });",
    );

  const header = generatedHeader({
    from: "package.json and the models under src/",
    purpose: `the boot of ${ir.package}: connects what needs the booted container, in order.`,
    boundary:
      "the runtime passes the connection string and the shutdown signal; the relay's loop runs until the signal " +
      "aborts, and `boot` resolves once everything is connected.",
    runtime: "node",
  });
  return [
    header,
    ...imports.sort(),
    "",
    "/** Connects the legal holds and the database, then the services that resolve classes from the container, then the relay. */",
    "export async function boot(",
    "  container: Container,",
    "  options: { readonly url: string; readonly signal: AbortSignal },",
    "): Promise<void> {",
    ...steps,
    "}",
    "",
  ].join("\n");
}
