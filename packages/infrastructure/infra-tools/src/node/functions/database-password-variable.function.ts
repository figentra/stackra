/**
 * Stackra file contract:
 * Purpose: `databasePasswordVariable(name)`, the shell-safe variable (`DB_PASSWORD_<NAME>`) that carries one tool
 *          database's role password into the database task.
 * Boundary: internal; `databaseScript` reads it and `awsToolsStack` injects it from SSM. A name only, never a value.
 * Runtime: node
 * Governing contract: ADR 0444; ADR 0173.
 */

/**
 * The variable that carries the password of database `name`.
 *
 * @example
 * databasePasswordVariable("chat-woot"); // "DB_PASSWORD_CHAT_WOOT"
 */
export function databasePasswordVariable(name: string): string {
  return `DB_PASSWORD_${name.toUpperCase().replaceAll(/[^A-Z0-9]/g, "_")}`;
}
