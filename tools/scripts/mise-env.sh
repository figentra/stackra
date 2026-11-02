#!/bin/sh
# Stackra file contract:
# Purpose: sourced by mise (`mise.toml` `[env] _.source`): the environment that applies on a workstation only. Today
#          `AWS_PROFILE=bedrock`, the Bedrock profile OpenCode uses (`aws sso login --profile bedrock` refreshes it).
#          In CI (`CI` set) it exports nothing, so jdx/mise-action never hands a job a profile that does not exist
#          there and the aws CLI keeps the job's OIDC credentials (STA-1957).
# Boundary: POSIX sh; exports names and profile names only, never a secret value.
# Runtime: sh
# Governing contract: ADR 0027 (mise pins the toolchain); ADR 0173 (no secret values in files).
[ -n "${CI:-}" ] || export AWS_PROFILE=bedrock
