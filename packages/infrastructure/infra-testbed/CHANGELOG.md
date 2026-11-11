# @stackra/infra-testbed

## 0.33.1

### Patch Changes

- e885a38: A service whose configuration reads a required `@Secret` at boot starts under a local `stackra dev`. New command:
  `stackra dev secrets init [--rotate] [--from <file>]` writes a random dev value for each required secret the
  workspace's running members declare, and for each name a member's runway lists under `environments.dev.secrets`
  (optional in the configuration or not), to `.stackra/dev-secrets.json` (gitignored, mode 600). It prints names, never a
  value, and lists the names a random value would break (a connection string, the events relay's key pair) as needing
  a value. An existing file only gains its missing names unless `--rotate`; `--from` copies a name shared with another
  repository. `stackra dev` adds the file's values for a member's own declared names to its tool run. The testbed upload
  excludes the file (ADR 0525, amendment of 2026-11-10).
- Updated dependencies [bf2c6ea]
  - @stackra/contracts@0.33.1

## 0.33.0

### Patch Changes

- Updated dependencies [93d63bb]
- Updated dependencies [93d63bb]
  - @stackra/contracts@0.33.0

## 0.32.0

### Patch Changes

- @stackra/contracts@0.32.0

## 0.31.0

### Patch Changes

- @stackra/contracts@0.31.0

## 0.30.0

### Patch Changes

- Updated dependencies [17fafdd]
- Updated dependencies [4ce80a2]
- Updated dependencies [8c17109]
- Updated dependencies [ef49e63]
  - @stackra/contracts@0.30.0

## 0.29.0

### Patch Changes

- @stackra/contracts@0.29.0

## 0.28.0

### Patch Changes

- @stackra/contracts@0.28.0

## 0.27.0

### Patch Changes

- @stackra/contracts@0.27.0

## 0.26.0

### Patch Changes

- @stackra/contracts@0.26.0

## 0.25.0

### Patch Changes

- @stackra/contracts@0.25.0

## 0.24.0

### Patch Changes

- @stackra/contracts@0.24.0

## 0.23.0

### Patch Changes

- @stackra/contracts@0.23.0

## 0.22.0

### Patch Changes

- @stackra/contracts@0.22.0

## 0.21.0

### Patch Changes

- Updated dependencies [a785356]
- Updated dependencies [f184d12]
  - @stackra/contracts@0.21.0

## 0.20.0

### Patch Changes

- @stackra/contracts@0.20.0

## 0.19.0

### Patch Changes

- 5d6448a: `stackra doctor` no longer checks for the Infisical CLI and login (ADR 0525). A workspace whose root scripts run
  `secrets-exec.mjs` is checked for the sops CLI, the Google Application Default Credentials file sops decrypts with
  (its presence only; the credential is never read) and a `figentra/secrets` clone with an `agents` folder. The
  `infisical` doctor need and the `DoctorWorkspace.infisical` field are gone. The testbed's toolchain test no longer
  expects the Infisical CLI in `mise.toml`; the boxes keep their own pin until they read sops.
- Updated dependencies [58e3066]
- Updated dependencies [bac874e]
  - @stackra/contracts@0.19.0

## 0.18.1

### Patch Changes

- @stackra/contracts@0.18.1

## 0.18.0

### Patch Changes

- @stackra/contracts@0.18.0

## 0.17.2

### Patch Changes

- @stackra/contracts@0.17.2

## 0.17.1

### Patch Changes

- @stackra/contracts@0.17.1

## 0.17.0

### Patch Changes

- @stackra/contracts@0.17.0

## 0.16.0

### Patch Changes

- @stackra/contracts@0.16.0

## 0.15.0

### Patch Changes

- @stackra/contracts@0.15.0

## 0.14.4

### Patch Changes

- @stackra/contracts@0.14.4

## 0.14.3

### Patch Changes

- @stackra/contracts@0.14.3

## 0.14.2

### Patch Changes

- @stackra/contracts@0.14.2

## 0.14.1

### Patch Changes

- @stackra/contracts@0.14.1

## 0.14.0

### Patch Changes

- @stackra/contracts@0.14.0

## 0.13.0

### Patch Changes

- @stackra/contracts@0.13.0

## 0.12.0

### Patch Changes

- @stackra/contracts@0.12.0

## 0.11.1

### Patch Changes

- @stackra/contracts@0.11.1

## 0.11.0

### Patch Changes

- @stackra/contracts@0.11.0

## 0.10.0

### Patch Changes

- f5fa82c: `stackra testbed run` no longer uploads a worktree's `.cache` (its pnpm store, about 7.5 GB); the box agent's seed
  refresh leaves it out too.
- ff36aea: The job image's base, `ubuntu:24.04`, is pinned by its index digest.
- ff36aea: Both testbed groups replace any box older than a day and publish their in-service count each minute, for the cost
  alarm.
- ff36aea: `awsTestbed` takes an optional `permissionsBoundary` and sets it on the box's and Image Builder's roles; the Pulumi
  program reads it from the `permissionsBoundary` config key.
- cfb684e: Every project's box job can read the registry: the plan grants `prod` `/ci/registry` of the CI project to every
  project (the `*` key of `grants.json`, which the agent adds to each project's own paths), and the agent gives pnpm the
  token under both names (`FIGENTRA_REGISTRY_TOKEN` first, `STACKRA_REGISTRY_TOKEN` second) with the repository's own
  `.npmrc` as its auth file, since pnpm 12 ignores `${...}` in a project `.npmrc`. The agent is byte for byte
  figentra/testbed's. Changes a hashed image input: the image is rebuilt.
- 04d5dfd: testbed-agent: a job stopped while it cleans up (Ctrl-C, SIGTERM, `job stop`) still removes its workspace and drops
  the box's scale-in protection, byte for byte as figentra/testbed#13. Seen live on 2026-11-05: a cancelled job left
  both. A hashed image input: boxes get it with the next image build.
- ff36aea: The testbed groups use only the default subnets in zones that offer the heavy instance type, so us-east-1e (none of
  the three types) is left out.
- Updated dependencies [e57b9a1]
  - @stackra/contracts@0.10.0

## 0.9.0

### Patch Changes

- b493bde: The image keeps pnpm's metadata cache on `/data/pnpm-cache` beside the store. pnpm 12's release-age check reads each
  package's metadata even for a lockfile install, and the image's Clean step empties `/root/.cache`, so the validate
  phase's offline fetch failed (`ERR_PNPM_NO_OFFLINE_META`, image 1.224117217.0). The box agent's fetch fills the same
  cache, and each job container mounts it and installs with `--prefer-offline`, so a package the store lacks is fetched
  instead of failing the job. The pull-request check now empties the home cache as Clean does and runs a job install in
  the job image against the store mounted read-only.
- 56fecf0: The image warms its pnpm store with `pnpm fetch --ignore-scripts`, and the validate phase's offline check runs the same
  way. Filling the store needs no lifecycle scripts, and the build instance has no job tokens, so a licence-gated
  postinstall (uniwind-pro) failed the build.
  
  The box agent's per-job fetch now works the same way: it fills the store without scripts, from a copy of the lockfile,
  workspace file, pnpmfile and `.npmrc` instead of the job's workspace. Run in the workspace, it left a `node_modules`
  that made the container skip its install, and it loaded the job's `mise.toml` on the host. The job container gets
  `CI=true`, as CI does, so the repository's mise environment no longer sets `NODE_ENV=development` for its tests.
  Each job's own install still runs the scripts, with its tokens.
  
  The job image adds Playwright's Firefox and WebKit beside Chromium, a virtual display (`xvfb-run`) with Electron's
  runtime libraries for desktop end-to-end tests, and ffmpeg. The image's check opens a page in all three browsers and
  starts a headed Chromium on the display.
- Updated dependencies [2e43c48]
  - @stackra/contracts@0.9.0

## 0.8.0

### Patch Changes

- @stackra/contracts@0.8.0

## 0.7.1

### Patch Changes

- @stackra/contracts@0.7.1

## 0.7.0

### Minor Changes

- 214bf6a: The testbed runs a pool in each of four regions, one stack per region (STA-2042). `testbedPlan` takes a `region`
  (eu-west-1, eu-west-2, eu-central-1 or us-east-1) and derives `home`. Only the home stack (eu-west-1) declares the
  global instance and image-builder roles, the build bucket and the image pipeline. Its distribution copies each AMI to
  all four regions and writes each region's AMI parameter. Every stack declares its region's security group, launch
  template and groups. The instance role may act on the testbed groups of all four regions. `AwsTestbed` gains `home`,
  and its home-only outputs become optional.

### Patch Changes

- 829b5e2: The image's pnpm store is warmed with `.pnpmfile.mjs` and `.npmrc` beside the lockfile and `pnpm-workspace.yaml`
  (`pnpm fetch` checks the pnpmfile's checksum and resolves the `@figentra-oss` scope from `.npmrc`; the build failed
  without them). The validate phase now runs an offline `pnpm fetch`
  against the store, so an incomplete store fails the build.
- @stackra/contracts@0.7.0

## 0.6.1

### Patch Changes

- dd1304c: The job image pins `shfmt` (from `mise.toml`, which `pnpm format:check` runs) and the Encore CLI at the products'
  `1.58.8` through mise, instead of the Encore installer's latest release. The image's validate step checks every tool a
  job calls at its pin and launches headless Chromium, and the host's checks the SSM agent.
  
  A job and the seed refresh now upload `.agents`: `pnpm validate` reads its specs, hooks, rules and skills, so a
  `pnpm verify` on the testbed failed without it. A test keeps the agent's list equal to the contract's.
  
  The image's pnpm store is warmed from the lockfile and `pnpm-workspace.yaml` together (`pnpm fetch` refused the
  lockfile alone over its catalogs, so the first build shipped an empty store), and a failed warm-up now fails the build.
  
  `.git` is no longer uploaded; the agent makes a fresh one-commit snapshot of the synced tree before each job, as
  `ci-box` did, so `git ls-files`, oxfmt and knip work from a worktree whose `.git` points at the Mac.
- @stackra/contracts@0.6.1

## 0.6.0

### Minor Changes

- e047d03: The testbed fits the region's EC2 vCPU quotas (ADR 0516): `heavy` and `light` are each 0 to 1 box by default, the plan
  carries `quota` (input, default 8 on-demand and 8 spot vCPUs), and `TESTBED_PLAN_SCHEMA` refuses a plan whose group
  maximum exceeds its purchase option's quota, an instance type with no known vCPU count (`INSTANCE_VCPUS`), or a heavy
  minimum that leaves no room for the image build. The Image Builder pipeline has no schedule: the owner builds by hand
  while `heavy` is at 0. `TESTBED_DEFAULTS.imageSchedule` is gone and `TESTBED_DEFAULTS.quota` is new.

### Patch Changes

- c92bef9: The testbed's Image Builder components and recipe are kept in AWS when new inputs replace them (`retainOnDelete`). The
  provider replaces a fixed-name resource delete-first, and AWS refuses to delete a version an image was built from, so
  `pulumi up` failed with ResourceDependencyException once the inputs changed.
- 0c31740: The testbed's job image installs `zip`: figentra/brand's hub check (`engine/_hub/build.mjs`) zips each kit's bundles.
- 2993840: `stackra testbed` reaches the boxes by SSH through SSM Session Manager: `ssh` and `rsync` connect to
  `ubuntu@<instance-id>` with an `AWS-StartSSHSession` `ProxyCommand`, so the security group needs no inbound rule and
  a changing public IP (Cloudflare WARP) no longer breaks access. `--ssh-direct` (or `STACKRA_TESTBED_SSH_DIRECT=1`)
  keeps the public-IP path with the port-22 allowlist swap. `awsTestbed`'s `allowedCidrs` is optional: absent or empty
  means no ingress. The Session Manager plugin is pinned in `mise.toml`.
- @stackra/contracts@0.6.0

## 0.5.1

### Patch Changes

- @stackra/contracts@0.5.1

## 0.5.0

### Patch Changes

- @stackra/contracts@0.5.0

## 0.4.0

### Patch Changes

- 0c16187: Fix the testbed's first apply. The launch template is now declared only with the groups, because EC2 refuses a template whose AMI parameter does not exist yet. The AMI parameter moves to `/imagebuilder/stackra-testbed/ami`, the only prefix Image Builder's service-linked role may write. Boxes get the `academorix-ci` key pair that `stackra testbed` connects with. The image steps and the box agent now find the host's mise tools in `/opt/mise`. `stackra testbed` now swaps its SSH allowlist entry with `aws ec2 …-security-group-ingress` (the `ec2` was missing, so a changed IP was never allowed).
- Updated dependencies [9c8d108]
- Updated dependencies [f8fe5a5]
- Updated dependencies [1856ee0]
  - @stackra/contracts@0.4.0

## 0.3.0

### Minor Changes

- 47a1f56: Add `@stackra/infra-testbed` (STA-1626, ADR 0484): the testbed, the disposable image-built EC2 test boxes. `testbedPlan`
  returns the zod-validated plan (eu-west-1, `heavy` on-demand c7i.2xlarge 2 to 6, `light` spot 1 to 4, a 40 GB root and a
  200 GB XFS `/data`, the 70/85 disk guard, the 60 minute idle stop, the weekly image schedule, the toolchain pins and the
  Infisical secret grants); `awsTestbed` declares the security group, instance role, launch template, the two Auto Scaling
  groups and the EC2 Image Builder pipeline. The package carries the job image Dockerfile, the host image components and
  `testbed-agent`, the POSIX box agent (slots, health, job run with a container per job, guard, idle), with its tests.

### Patch Changes

- Updated dependencies [d22a5eb]
- Updated dependencies [23e556c]
  - @stackra/contracts@0.3.0
