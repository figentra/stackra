/**
 * Stackra file contract:
 * Purpose: `RequestGuard`, the extension point every inbound server request passes before its call runs: a module
 *          contributes a check by binding a subclass (the signed edge-header check of stackra-65, a scope check), and
 *          `ServerApp.handlers.guard(request, container)` runs every contributed guard, lowest `order` first.
 * Boundary: a `Service` subclass, so gen binds a guard like any service; the guards are found with the container's
 *           multi-binding (`getAll(RequestGuard)`), never a list in code or a string token. A guard refuses by
 *           throwing a `Refusal`; it keeps no state and answers no `Response`. `order` is the place a guard holds in
 *           a fixed check sequence (ADR 0437's server-check order), not a business value.
 * Runtime: node
 * Governing contract: ADR 0457 (multi-binding extension points); ADR 0437 (server-check order); ADR 0294 (decision 25).
 */
import { Service } from "@stackra/container";

/**
 * A check every inbound request passes before its call runs.
 *
 * @example
 * export class EdgeSignatureGuard extends RequestGuard {
 *   override get order() { return -100; }
 *   async check(request: Request) {
 *     if (!(await this.verifier.verify(request))) throw EdgeSignatureInvalidError.create();
 *   }
 * }
 */
export abstract class RequestGuard extends Service {
  /** Where the guard runs among the others, lowest first; guards of equal order keep wiring order. */
  get order(): number {
    return 0;
  }

  /**
   * Checks one request; returns to let it through.
   *
   * @throws Refusal to stop the request; the generated adapter answers it with the refusal's status.
   */
  abstract check(request: Request): void | Promise<void>;
}
