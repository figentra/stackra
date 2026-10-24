/**
 * Stackra file contract:
 * Purpose: `CatalogueDiagnosticCode`, the closed set of codes `validateCatalogue` reports, one per kind of problem a
 *          registry service refuses a published manifest for.
 * Boundary: an `Enum.of` value plus the type of the same name; codes are snake_case machine codes and travel as they
 *           are in a CI log or an API refusal.
 * Runtime: isomorphic
 * Governing contract: ADR 0231 (snake_case machine codes); ADR 0294 (decision 20 and the gen check
 *                     `identity_collision`); ADR 0214 (decision 3: dependencies resolve).
 */
import { Enum } from "@stackra/contracts";

/** What is wrong with a manifest or with the catalogue it joins. */
export const CatalogueDiagnosticCode = Enum.of({
  /** The manifest breaks the `CatalogueManifest` shape. */
  ManifestInvalid: "manifest_invalid",
  /** Another manifest already has this member key. */
  DuplicateMember: "duplicate_member",
  /** A module key, action key, event name or permission key is declared twice. */
  IdentityCollision: "identity_collision",
  /** An action or event names a module its member does not declare. */
  UnknownModule: "unknown_module",
  /** An action key, event name or permission key is outside its module's namespace. */
  ForeignNamespace: "foreign_namespace",
  /** A module depends on a module no manifest declares. */
  UnknownDependency: "unknown_dependency",
  /** Modules depend on each other in a loop. */
  DependencyCycle: "dependency_cycle",
});

/** One of the codes above. */
export type CatalogueDiagnosticCode = Enum.Value<typeof CatalogueDiagnosticCode>;
