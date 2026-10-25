/**
 * Stackra file contract:
 * Purpose: `ADMINISTRATOR_ACCESS`, the ARN of AWS's managed AdministratorAccess policy, which the environment's infra
 *          role (it applies the Pulumi program) and the Encore Cloud role (Encore's default connection) carry.
 * Boundary: internal; both roles live in one environment account, whose boundary limits them (ADR 0172).
 * Runtime: node
 * Governing contract: ADR 0172 (decision 1: a credential is scoped by the account), ADR 0171.
 */

/** AWS's AdministratorAccess managed policy. */
export const ADMINISTRATOR_ACCESS = "arn:aws:iam::aws:policy/AdministratorAccess";
