/**
 * Stackra file contract:
 * Purpose: `PYTHON_HOME`, the one folder Python may live in: tools-stack images behind ports (ADR 0492 decision 7).
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0492 (decision 7); STA-1637.
 */

/** The folder, repository-relative with a trailing slash, every `.py` file must sit under. */
export const PYTHON_HOME = "packages/infrastructure/infra-tools/images/";
