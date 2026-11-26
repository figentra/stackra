/**
 * Stackra file contract:
 * Purpose: `DoctorNeed`, one thing a workspace needs from the machine; `doctorNeeds` derives them and each
 *          `stackra doctor` check beyond the base ones serves exactly one, so a web-only app is never asked for Xcode.
 * Boundary: type only.
 * Runtime: node
 * Governing contract: STA-1952 spec FR-015; ADR 0515.
 */

/**
 * `agents`: the agent tooling (claude, opencode, agents:check, the AWS `bedrock` profile, and sops with a Google login
 * for the `agents` scope of figentra/secrets); `services`: Docker, Encore and their ports; `infra`: Pulumi; `mobile`:
 * Xcode and a simulator; `stackra` and `figentra`: reading that scope from the Stackra registry.
 */
export type DoctorNeed = "agents" | "services" | "infra" | "mobile" | "stackra" | "figentra";
