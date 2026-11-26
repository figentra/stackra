/**
 * Stackra file contract:
 * Purpose: `memberCommand(command)`, a member's console command as a top-level `stackra` command, so `stackra db:status
 *          --json` runs what `stackra console orders db:status -- --json` runs. It is listed under a heading per
 *          member (its `group`), keeps the member's free aliases, and on a run passes every token on as typed (the
 *          first lone `--` dropped, as `stackra console` drops it), in the one member that declares it, the member
 *          the working directory sits in, or the member the person picks when several declare it; with no terminal to
 *          ask, it exits 2 naming the members and the command that picks one. It runs in the member's folder,
 *          or in the folder the person stands in when that is inside the member (`runMemberConsole`).
 * Boundary: a passthrough by design, as `stackra runway` is (ADR 0529 decision 4): the member's console parses its own
 *           line, so the CLI parses nothing but `--help`. Only `runMemberConsole` runs the member.
 * Runtime: node
 * Governing contract: ADR 0506 (decision 6); ADR 0500 (decision 1); STA-1731 spec FR-009; STA-2888.
 */
import { Command, UsageError, type CommandClass, type CommandIo } from "@stackra/console";

import { hostAround } from "#node/functions/host-around.function";
import { runMemberConsole } from "#node/functions/run-member-console.function";
import type { MemberCommand } from "#node/types/member-command.type";
import type { MemberCommandHost } from "#node/types/member-command-host.type";

/** The tokens a member's console gets: as typed, less the first lone `--`. */
const forwarded = (rest: readonly string[]): readonly string[] => {
  const dash = rest.indexOf("--");
  return dash === -1 ? rest : [...rest.slice(0, dash), ...rest.slice(dash + 1)];
};

/** Where a command comes from, for its list line. */
const sourceOf = (host: MemberCommandHost): string =>
  host.from === undefined ? host.label : `${host.label}, from ${host.from}`;

/**
 * The console command class that runs `command` in its member.
 *
 * @param command - the member command, as `readMemberCommands` reads it.
 * @example
 * createConsole({ name: "stackra", version, commands: [...builtins, ...members.map(memberCommand)] });
 */
export function memberCommand(command: MemberCommand): CommandClass {
  const { name, hosts } = command;
  const [first] = hosts;
  const labels = hosts.map((host) => host.label).join(", ");
  return class TopLevelMemberCommand extends Command({
    name,
    description:
      hosts.length === 1 && first !== undefined
        ? `Member command (${sourceOf(first)})`
        : `Member command of ${labels} (runs in the member you are in, else asks which)`,
    aliases: command.aliases,
    hidden: command.hidden,
    group: labels,
    examples: [
      `stackra ${name} [arguments] [--options]`,
      `stackra ${name} -- --help   (its own arguments and options)`,
      `stackra console ${first?.label ?? "<member>"} ${name}   (one member by name)`,
    ],
    passthrough: true,
  }) {
    /** Runs the command in its member; the exit code is the command's own. */
    async handle(io: CommandIo): Promise<number> {
      let host = hostAround(hosts, io.cwd);
      if (host === undefined) {
        if (!io.interactive)
          throw new UsageError(
            `"${name}" is a command of more than one member: ${labels}`,
            `Run it inside the member's folder, or name the member: stackra console ${first?.label ?? "<member>"} ${name}`,
          );
        const picked = await io.prompt.select({
          message: `Which member runs ${name}?`,
          choices: hosts.map((each) => ({
            value: each.label,
            ...(each.from === undefined ? {} : { hint: `from ${each.from}` }),
          })),
        });
        host = hosts.find((each) => each.label === picked);
        if (host === undefined) throw new UsageError(`No member ${picked} declares "${name}"`);
      }
      return runMemberConsole(
        host.root,
        host.label,
        [name, ...forwarded(io.rest)],
        (text) => io.stderr.write(text),
        io.cwd,
      );
    }
  };
}
