/**
 * Stackra file contract:
 * Purpose: `OrganizationPageProps`, what a host hands the web OrganizationPage: which sections show, the legal entities
 *          and domains to list, what to do after a save, and every word.
 * Boundary: an interface in its own file beside the component (ADR 0305). The profile is read and saved through the
 *           container's `TenantProfile` port, never props; the legal entities and domains come through props until
 *           their panel resources land; the words are the host's (ADR 0504 decision 4).
 * Runtime: browser
 * Governing contract: ADR 0504 (module UI kits); ADR 0260 (client ports); ADR 0305; the UI build list (2026-11-02).
 */
import type { TenantProfileView } from "#contracts/types/tenant-profile-view.type";

/**
 * The page's sections, data, handler and words.
 *
 * @example
 * <OrganizationPage legalEntities={entities} domains={domains} onSaved={() => toast.show(saved)} labels={labels} />
 */
export interface OrganizationPageProps {
  /**
   * The sections shown, in this order. Defaults to all three; `legal-entities` and `domains` show only when their
   * data is given.
   */
  readonly sections?: readonly ("profile" | "legal-entities" | "domains")[] | undefined;
  /** The tenant's legal entities, each with its tax number when it has one. */
  readonly legalEntities?:
    | readonly {
        readonly id: string;
        readonly name: string;
        readonly taxNumber: string | null;
      }[]
    | undefined;
  /** The tenant's domains and whether each is verified. */
  readonly domains?:
    | readonly {
        readonly id: string;
        readonly host: string;
        readonly isVerified: boolean;
      }[]
    | undefined;
  /** Called with the profile after a save succeeds. */
  readonly onSaved?: ((profile: TenantProfileView) => void) | undefined;
  /** The page's words; the host writes them. */
  readonly labels: {
    /** The page title, for example "Organisation". */
    readonly title: string;
    /** The line under the title. */
    readonly description?: string | undefined;
    /** The spoken name of the page while the profile loads, for example "Loading organisation". */
    readonly loading: string;
    /** Shown when the profile cannot be read, for example "The organisation could not be loaded." */
    readonly loadFailed: string;
    /** The retry button after a failed read, for example "Try again". */
    readonly retry: string;
    /** The profile section's title, for example "Profile". */
    readonly profile: string;
    /** The name field, for example "Name". */
    readonly name: string;
    /** The legal name field, for example "Legal name". */
    readonly legalName: string;
    /** The default language field, for example "Default language". */
    readonly defaultLocale: string;
    /** The time zone field, for example "Time zone". */
    readonly timeZone: string;
    /** The handle row, for example "Handle". */
    readonly handle: string;
    /** The market row, for example "Market". */
    readonly market: string;
    /** The save button, for example "Save changes". */
    readonly save: string;
    /** Announced after a save, for example "Changes saved". */
    readonly saved: string;
    /** Shown when a save fails, for example "The changes could not be saved." */
    readonly saveFailed: string;
    /** The legal entities section's title, for example "Legal entities". */
    readonly legalEntities: string;
    /** Shown for a legal entity without a tax number, for example "No tax number". */
    readonly noTaxNumber: string;
    /** The domains section's title, for example "Domains". */
    readonly domains: string;
    /** A verified domain's badge, for example "Verified". */
    readonly verified: string;
    /** An unverified domain's badge, for example "Not verified". */
    readonly unverified: string;
  };
}
