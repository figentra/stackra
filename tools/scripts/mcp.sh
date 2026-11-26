#!/usr/bin/env bash
# =============================================================================
# MCP Server Launcher - Secure Secret Injection for STDIO MCP Servers
# =============================================================================
#
# Purpose:
#   Start an MCP server with only the secrets it needs, from the `agents` scope of figentra/secrets (ADR 0525),
#   without exposing them in .mcp.json, the shell environment or any other process.
#
# Why this script exists:
#   - .mcp.yaml is committed to version control - secrets cannot be stored as literals
#   - Claude Code expands ${VAR} from its own environment; if unset, it silently disables the server
#   - This script takes bare $VAR arguments, which Claude Code passes through, and has
#     tools/scripts/secrets-exec.mjs expand them inside the server's own process
#
# Secret Source:
#   A local clone of figentra/secrets at $STACKRA_SECRETS_DIR (default ~/.stackra/secrets). secrets-exec.mjs
#   decrypts each named agents/<NAME>.enc.yaml with sops, in memory, into the server's environment only. Only the
#   owner's Google login can decrypt the agents scope. There is no .env and no second source: a second source is a
#   second place a token can be stale.
#
# Which secrets:
#   Each $NAME or ${NAME} the arguments reference, plus the names a server reads only from its environment
#   (SERVER_ENV below). A launch that needs none starts unchanged, so playwright and next-devtools never wait on a
#   decrypt.
#
# Usage:
#   In .mcp.yaml:
#     my-server:
#       command: "./tools/scripts/mcp.sh"
#       args: ["npx", "-y", "some-mcp-server", "--token", "$SECRET_TOKEN"]
#
# Owner: Security
# Secrets: Passes through; never prints, logs, or persists
# =============================================================================

set -euo pipefail

# Project root (two directories up from this script)
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

if [ "$#" -eq 0 ]; then
  echo "mcp.sh: no command given" >&2
  echo "Usage: mcp.sh <command> [args...]" >&2
  echo "  Args may contain \$VAR references, expanded from figentra/secrets" >&2
  exit 2
fi

# Names a server reads from its environment rather than its arguments.
case " $* " in
  *" resend-mcp"*) SERVER_ENV="RESEND_API_KEY" ;;
  *"tools/scripts/linear.mjs"*)
    SERVER_ENV="LINEAR_AGENT_TOKEN,LINEAR_AGENT_CLIENT_ID,LINEAR_AGENT_CLIENT_SECRET,LINEAR_API_KEY"
    ;;
  *) SERVER_ENV="" ;;
esac

# Every $NAME / ${NAME} in the arguments, comma-separated.
REFERENCED="$(printf '%s\n' "$@" | grep -oE '\$\{?[A-Z_][A-Z0-9_]*' | tr -d '${' | sort -u | paste -sd, - || true)"
NAMES="${REFERENCED}${REFERENCED:+${SERVER_ENV:+,}}${SERVER_ENV}"

# Nothing in this invocation needs a secret, so launch it unchanged.
if [ -z "$NAMES" ]; then
  exec "$@"
fi

exec node "$ROOT/tools/scripts/secrets-exec.mjs" --names "$NAMES" --expand-args -- "$@"
