/**
 * Stackra file contract:
 * Purpose: the kinds of environment-specific detail that `findEnvironmentDetails` refuses in a public runbook
 *          (ADR 0185 decision 4): an AWS account id, a host IPv4 address, a phone number and a reachable e-mail address.
 * Boundary: an `Enum.of` value plus the type of the same name. Codes only.
 * Runtime: node
 * Governing contract: ADR 0185 (decision 4); ADR 0231 (snake_case codes); STA-27.
 */
import { Enum } from "@stackra/contracts";

/** What ties a runbook line to one environment. */
export const EnvironmentDetailKind = Enum.of({
  /** A twelve-digit AWS account id, alone or inside an ARN. */
  AwsAccountId: "aws_account_id",
  /** An IPv4 address that is not unspecified, loopback, broadcast or an RFC 5737 documentation address. */
  Ipv4Address: "ipv4_address",
  /** An international phone number (`+` and at least eight digits). */
  PhoneNumber: "phone_number",
  /** An e-mail address outside the reserved example and no-reply domains. */
  EmailAddress: "email_address",
});

/** One of the codes above. */
export type EnvironmentDetailKind = Enum.Value<typeof EnvironmentDetailKind>;
