#!/usr/bin/env bash
# =============================================================================
# MCP Server Launcher - Secure Secret Injection for STDIO MCP Servers
# =============================================================================
#
# Purpose:
#   Inject secrets from the Infisical vault into MCP server
#   processes without exposing them in .mcp.json, the shell environment, or
#   the process table.
#
# Why this script exists:
#   - .mcp.json is typically committed to version control - secrets cannot be
#     stored as literals
#   - Claude Code expands ${VAR} from its own environment; if unset, it silently
#     disables the server
#   - This script uses bare $VAR syntax which Claude Code passes through, then
#     expands them inside a vault-injected subprocess
#
# Secret Source:
#   Infisical vault at /agents path (developer/MCP tokens, env: dev).
#
#   There is no .env fallback. It existed, and was removed when the repository
#   moved to Infisical for every developer token — `.env.example`, which was the
#   fallback's schema, went with it. A second source would also be a second place
#   a token could be stale, and the failure it produces is the quiet kind: a
#   server that launches with an empty environment and fails later, somewhere else.
#
# Argument Expansion:
#   .mcp.json args may contain $VAR references (e.g., "x-token:$API_KEY").
#   This script expands them AFTER secrets are injected, so values only exist
#   inside the launched process tree.
#
# Usage:
#   In .mcp.json:
#     "mcpServers": {
#       "my-server": {
#         "command": "./tools/scripts/mcp.sh",
#         "args": ["npx", "-y", "some-mcp-server", "--token", "$SECRET_TOKEN"]
#       }
#     }
#
# Owner: Security
# Secrets: Passes through; never prints, logs, or persists
# =============================================================================

set -euo pipefail

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------

# Project root (two directories up from this script)
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Infisical secrets path for developer/MCP tokens
# See .infisical.json for folder layout:
#   /agents  -> developer + MCP tokens, env: dev (read-only via machine identity)
#   /ci      -> CI-only credentials, env: staging|prod (OIDC only)
#   /services/<name> -> per-service runtime secrets
INFISICAL_SECRET_PATH="/agents"

# -----------------------------------------------------------------------------
# Validation
# -----------------------------------------------------------------------------

if [ "$#" -eq 0 ]; then
  echo "mcp.sh: no command given" >&2
  echo "Usage: mcp.sh <command> [args...]" >&2
  echo "  Args may contain \$VAR references which will be expanded from secrets" >&2
  exit 2
fi

# -----------------------------------------------------------------------------
# Infisical Helper Functions
# -----------------------------------------------------------------------------

# Check if Infisical CLI is available and project is configured
infisical_ready() {
  command -v infisical >/dev/null 2>&1 || return 1
  [ -f "$ROOT/.infisical.json" ] || return 1
  # Fail gracefully if workspaceId is still a placeholder
  ! grep -q '"workspaceId": *"TODO' "$ROOT/.infisical.json"
}

# Verify the vault is reachable before committing to it.
# `exec infisical run` replaces this process, so probing first lets this script
# report a useful error instead of the server dying with the vault's.
vault_reachable() {
  infisical secrets --path="$INFISICAL_SECRET_PATH" --silent >/dev/null 2>&1
}

# -----------------------------------------------------------------------------
# Main Execution - Infisical Path
# -----------------------------------------------------------------------------

if infisical_ready && vault_reachable; then
  # Inject secrets from Infisical and expand $VAR references in args
  #
  # Flow:
  #   1. infisical run -- injects secrets into subprocess environment
  #   2. bash -c loop expands each $VAR in args using eval
  #   3. exec launches the MCP server with expanded arguments
  #
  # Security: eval is safe here because:
  #   - We only expand environment variables injected by Infisical
  #   - The $VAR references come from .mcp.json, not arbitrary user input
  #   - Secrets only exist inside this process tree
  exec infisical run --path="$INFISICAL_SECRET_PATH" --silent -- \
    bash -c 'args=(); for arg in "$@"; do eval "args+=(\"$arg\")"; done; exec "${args[@]}"' _ "$@"
fi

# -----------------------------------------------------------------------------
# No vault - fail, but only when a secret was actually required
# -----------------------------------------------------------------------------
#
# Not every server launched through this script needs a token: next-devtools and
# playwright take none, while heroui-pro and stripe do. Hard-failing for all of
# them would break the ones that never needed a secret; exec-ing all of them with
# an empty environment — which is what this script used to do — breaks the ones
# that did, silently, at a distance from the cause.
#
# So the test is whether THIS invocation references a variable. `.mcp.json` passes
# secrets as bare $VAR in args, so if no argument contains one, there is nothing to
# inject and the server is launched unchanged. If one does, the token cannot be
# supplied and failing here — naming the variable and the server — is the only
# outcome that says what went wrong while the cause is still visible.

requires_secret=false
for arg in "$@"; do
  case "$arg" in
    *'$'[A-Z_]*) requires_secret=true; break ;;
  esac
done

if [ "$requires_secret" = true ]; then
  echo "mcp.sh: cannot launch '${1:-?}' — it references a secret and the vault is unavailable." >&2
  echo "" >&2
  echo "  Arguments referencing a variable:" >&2
  for arg in "$@"; do
    case "$arg" in
      *'$'[A-Z_]*) echo "    $arg" >&2 ;;
    esac
  done
  echo "" >&2
  if ! command -v infisical >/dev/null 2>&1; then
    echo "  The infisical CLI is not installed:" >&2
    echo "    https://infisical.com/docs/cli/installation" >&2
  elif [ ! -f "$ROOT/.infisical.json" ]; then
    echo "  .infisical.json is missing — run: infisical init" >&2
  else
    echo "  The vault at $INFISICAL_SECRET_PATH is unreachable. Check: infisical login" >&2
  fi
  exit 1
fi

# Nothing in this invocation needs a secret, so launch it unchanged.
exec "$@"
