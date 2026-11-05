/**
 * Stackra file contract:
 * Purpose: `GcpProject`, one project: its id, display name, folder, billing account and labels.
 * Boundary: types only.
 * Runtime: node
 * Governing contract: ADR 0354 (decision 3), ADR 0524 (the GCP organization).
 */

/** One Google Cloud project: its id, name, folder, billing account and labels. */
export interface GcpProject {
  /** The project id, unique across Google Cloud. */
  readonly id: string;
  /** The display name of the project. */
  readonly name: string;
  /** `org`, or a folder path. */
  readonly folder: string;
  /** The billing account id (`010184-560B34-08F936`); omit for none. */
  readonly billingAccount?: string;
  /** Labels on the project, for policies and cost reports. */
  readonly labels?: Readonly<Record<string, string>>;
}
