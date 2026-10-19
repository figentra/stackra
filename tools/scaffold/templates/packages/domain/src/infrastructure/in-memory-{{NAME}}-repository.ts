import type { {{PASCAL}}Repository } from "#application";
import type { {{PASCAL}}Record } from "#core";

/** A process-local adapter for tests, previews and tooling. Not durable. */
export class InMemory{{PASCAL}}Repository implements {{PASCAL}}Repository {
  readonly #records = new Map<string, {{PASCAL}}Record>();

  async findById(id: string): Promise<{{PASCAL}}Record | undefined> {
    return this.#records.get(id);
  }

  async save(record: {{PASCAL}}Record): Promise<void> {
    this.#records.set(record.id, record);
  }
}
