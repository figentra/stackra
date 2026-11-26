/**
 * Stackra file contract:
 * Purpose: `OASDIFF_PIN`, the mise tool and version of `oasdiff` that `stackra contract` expects on PATH: the same pin
 *          as `mise.toml` and the Quality Gate, named in the message when the binary is missing.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0182 (decision 4: `oasdiff` contract checks); ADR 0027 (toolchains from mise); STA-2837.
 */

/** The `oasdiff` pin, as `mise install` takes it. */
export const OASDIFF_PIN = "github:oasdiff/oasdiff@1.40.0";
