/**
 * Stackra file contract:
 * Purpose: `DOCTOR_HOSTS`, the hosts `stackra doctor` probes on port 443, grouped by the need that depends on them;
 *          `base` is probed for every workspace. Seeded from the owner's net-probe list (2026-11-02).
 * Boundary: data only; no address, since the network check resolves each name through the system resolver.
 * Runtime: node
 * Governing contract: STA-1952 spec FR-016.
 */
import type { DoctorNeed } from "#node/doctor/types/doctor-need.type";

/** Need to the hosts it depends on. */
export const DOCTOR_HOSTS: Readonly<Partial<Record<DoctorNeed | "base", readonly string[]>>> = {
  base: [
    "npm.stackra.figentra.com",
    "registry.npmjs.org",
    "github.com",
    "api.github.com",
    "codeload.github.com",
    "objects.githubusercontent.com",
    "raw.githubusercontent.com",
    "github-releases.githubusercontent.com",
    "nodejs.org",
    "mise.jdx.dev",
  ],
  services: [
    "app.encore.cloud",
    "ghcr.io",
    "pkg-containers.githubusercontent.com",
    "registry-1.docker.io",
  ],
  infra: [
    "sts.amazonaws.com",
    "ec2.eu-west-1.amazonaws.com",
    "s3.eu-west-1.amazonaws.com",
    "api.cloudflare.com",
  ],
  agents: [
    "api.anthropic.com",
    "claude.ai",
    "api.linear.app",
    "cloudkms.googleapis.com",
    "oauth2.googleapis.com",
  ],
  mobile: ["api.expo.dev", "expo.dev"],
};
