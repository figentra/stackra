#!/bin/sh
# Stackra file contract:
# Purpose: sourced by mise (`mise.toml` `[env] _.source`): the environment that applies on a workstation only:
#          `NODE_ENV=development` and `AWS_PROFILE=bedrock`, the Bedrock profile OpenCode uses (`aws sso login
#          --profile bedrock` refreshes it). In CI (`CI` set) it exports nothing, because jdx/mise-action hands its
#          values to every later step: the aws CLI then looked for a profile CI does not have (STA-1957), and Vitest,
#          which sets `test` only when NODE_ENV is unset, ran React Aria in development mode, where the virtualised
#          list collections stay empty under jsdom (STA-2021); builds also ran as development.
# Boundary: POSIX sh; exports names and profile names only, never a secret value.
# Runtime: sh
# Governing contract: ADR 0027 (mise pins the toolchain); ADR 0173 (no secret values in files).
[ -n "${CI:-}" ] || export NODE_ENV=development AWS_PROFILE=bedrock
