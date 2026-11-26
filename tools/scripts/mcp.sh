#!/usr/bin/env bash
# =============================================================================
# MCP Server Launcher - Secret Injection for STDIO MCP Servers, through the environment only
# =============================================================================
#
# Purpose:
#   Start an MCP server with only the secrets it needs, from the `agents` scope of figentra/secrets (ADR 0525),
#   without exposing them in .mcp.json, the shell environment, any other process or any process's argv.
#
# Why this script exists:
#   - .mcp.yaml is committed to version control - secrets cannot be stored as literals
#   - Claude Code expands ${VAR} from its own environment; if unset, it silently disables the server
#   - A value on a command line shows in every process listing (`ps`), so a secret reaches the server only through
#     its environment (STA-1617): the server reads it there (context7, stripe, resend), or expands a `${NAME}`
#     placeholder in a committed file it reads itself (mcp-remote's --header-file).
#
# Secret Source:
#   A local clone of figentra/secrets at $STACKRA_SECRETS_DIR (default ~/.stackra/secrets). secrets-exec.mjs
#   decrypts each named agents/<NAME>.enc.yaml with sops, in memory, into the server's environment only. Only the
#   owner's Google login can decrypt the agents scope. There is no .env and no second source: a second source is a
#   second place a token can be stale.
#
# Which secrets:
#   The names after --env, plus the names a known server reads from its environment (SERVER_ENV below, for the
#   session's Linear digest). A launch that needs none starts unchanged, so playwright and next-devtools never wait on
#   a decrypt. A `$NAME` or `${NAME}` reference left in the arguments is refused: it would either reach the server as
#   literal text or, expanded, sit on its argv.
#
# Usage:
#   mcp.sh [--env NAME[,NAME...]] [--] <command> [args...]
#   In .mcp.yaml:
#     my-server:
#       command: "./tools/scripts/mcp.sh"
#       args: ["--env", "SECRET_TOKEN", "--", "npx", "-y", "some-mcp-server@1.2.3"]
#
# Owner: Security
# Secrets: Passes names only; never prints, logs, persists or puts a value on any argv
# =============================================================================

set -euo pipefail

# Project root (two directories up from this script)
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

usage() {
  echo "Usage: mcp.sh [--env NAME[,NAME...]] [--] <command> [args...]" >&2
  echo "  Each named secret reaches the server through its environment, never its arguments" >&2
  exit 2
}

DECLARED=""
if [ "${1:-}" = "--env" ]; then
  [ "$#" -ge 2 ] || usage
  DECLARED="$2"
  shift 2
  printf '%s\n' "$DECLARED" | grep -qE '^[A-Z_][A-Z0-9_]*(,[A-Z_][A-Z0-9_]*)*$' || usage
fi
if [ "${1:-}" = "--" ]; then
  shift
fi

if [ "$#" -eq 0 ]; then
  echo "mcp.sh: no command given" >&2
  usage
fi

# A secret reference in the arguments would put the value on argv once expanded (STA-1617); refuse it by name.
REFERENCED="$(printf '%s\n' "$@" | grep -oE '\$\{?[A-Z_][A-Z0-9_]*' | tr -d '${' | sort -u | paste -sd, - || true)"
if [ -n "$REFERENCED" ]; then
  echo "mcp.sh: ${REFERENCED} in the server's arguments would show in every process listing; pass it with --env NAME and let the server read its environment (STA-1617)" >&2
  exit 2
fi

# Names a server reads from its environment without declaring them (the session's Linear digest).
case " $* " in
  *"tools/scripts/linear.mjs"*)
    SERVER_ENV="LINEAR_AGENT_TOKEN,LINEAR_AGENT_CLIENT_ID,LINEAR_AGENT_CLIENT_SECRET,LINEAR_API_KEY"
    ;;
  *) SERVER_ENV="" ;;
esac

NAMES="${DECLARED}${DECLARED:+${SERVER_ENV:+,}}${SERVER_ENV}"

# Relative paths in the arguments (a --header-file) resolve from the repository root, wherever the client started.
cd "$ROOT"

# Nothing in this invocation needs a secret, so launch it unchanged.
if [ -z "$NAMES" ]; then
  exec "$@"
fi

exec node "$ROOT/tools/scripts/secrets-exec.mjs" --names "$NAMES" -- "$@"
