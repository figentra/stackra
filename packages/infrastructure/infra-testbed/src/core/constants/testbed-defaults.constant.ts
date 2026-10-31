/**
 * Stackra file contract:
 * Purpose: `TESTBED_DEFAULTS`, every default of the testbed that `stackra testbed` and `testbed-agent` also know: the
 *          region, AWS profile, SSH user, security group and key names, the group names, the AMI parameter, the tag
 *          keys, the disk, guard and idle numbers, the job label, the rsync excludes, and the reserved exit codes. It
 *          is the TypeScript form of `.agents/specs/sta-1626-testbed/agent-contract.md`.
 * Boundary: data only; pure and Pulumi-free. A change here is a change to the contract, so the CLI follows it.
 * Runtime: isomorphic
 * Governing contract: ADR 0484 (decisions 3, 4, 6, 8, 9); the box agent contract of STA-1626.
 */
/** The fixed names, paths and numbers of the testbed that the plan, the program and the box agent share. */
export const TESTBED_DEFAULTS = {
  region: "eu-west-1",
  awsProfile: "academorix",
  sshUser: "ubuntu",
  securityGroup: "stackra-testbed",
  keyPair: "academorix-ci",
  keyFile: "~/.ssh/academorix-ci.pem",
  /** The SSM parameter the Image Builder distribution writes the newest AMI id to. */
  amiParameter: "/stackra/testbed/ami",
  /** Canonical's public parameter for the Ubuntu 24.04 amd64 AMI the recipe starts from. */
  baseImageParameter:
    "/aws/service/canonical/ubuntu/server/24.04/stable/current/amd64/hvm/ebs-gp3/ami-id",
  /** The weekly image build: Sunday 03:00 UTC. */
  imageSchedule: "cron(0 3 ? * SUN *)",
  groupPrefix: "stackra-testbed",
  /** The instance tag that names the group (`heavy` or `light`); the IAM condition and discovery read it. */
  groupTagKey: "stackra:testbed",
  environmentTag: "ci",
  serviceTag: "testbed",
  jobLabel: "stackra.testbed.job",
  dataMount: "/data",
  idleMinutes: 60,
  jobTimeoutHours: 3,
  /** Raise the desired count after every slot of a kind has been busy for this long (the CLI reads it). */
  scaleUpAfterMinutes: 2,
  guard: {
    cleanupPercent: 70,
    drainPercent: 85,
    rootMinFreeGb: 10,
    turboCacheGb: 20,
    seedMaxAgeDays: 7,
    intervalMinutes: 5,
  },
  exitCodes: { slotBusy: 73, unhealthy: 75, timeout: 124 },
  /** What the Mac's rsync leaves out of a project; the agent's seed refresh leaves out the same. */
  rsyncExcludes: [
    "node_modules",
    ".claude/worktrees",
    ".agents",
    ".env*",
    "*.secrets.local.cue",
    ".mcp.json",
    ".turbo",
    "dist",
    ".next",
  ],
} as const;
