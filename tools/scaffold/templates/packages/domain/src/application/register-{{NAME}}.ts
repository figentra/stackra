import { {{PASCAL}}Error, create{{PASCAL}}Record, type {{PASCAL}}Record } from "#core";
import type { {{PASCAL}}Repository } from "./{{NAME}}-repository";

export interface Register{{PASCAL}}Command {
  readonly id: string;
  readonly label: string;
}

/**
 * Register a new record through the repository port.
 *
 * @throws {{{PASCAL}}Error} when the id is taken or the domain rejects the input.
 */
export async function register{{PASCAL}}(
  command: Register{{PASCAL}}Command,
  repository: {{PASCAL}}Repository,
): Promise<{{PASCAL}}Record> {
  if (await repository.findById(command.id))
    throw new {{PASCAL}}Error(`A {{NAME}} record with id ${command.id} already exists.`);
  const record = create{{PASCAL}}Record(command);
  await repository.save(record);
  return record;
}
