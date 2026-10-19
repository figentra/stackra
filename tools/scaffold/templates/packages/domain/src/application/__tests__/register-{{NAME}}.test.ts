import { {{PASCAL}}Error, type {{PASCAL}}Record } from "#core";
import type { {{PASCAL}}Repository } from "../{{NAME}}-repository";
import { register{{PASCAL}} } from "../register-{{NAME}}";

/** In-memory fake of the port — application tests never import infrastructure. */
function fakeRepository(): {{PASCAL}}Repository & { saved: {{PASCAL}}Record[] } {
  const saved: {{PASCAL}}Record[] = [];
  return {
    saved,
    findById: async (id) => saved.find((record) => record.id === id),
    save: async (record) => {
      saved.push(record);
    },
  };
}

describe("register{{PASCAL}}", () => {
  it("saves the record through the port", async () => {
    const repository = fakeRepository();

    await expect(register{{PASCAL}}({ id: "r1", label: "First" }, repository)).resolves.toEqual({
      id: "r1",
      label: "First",
    });
    expect(repository.saved).toHaveLength(1);
  });

  it("rejects a duplicate id without saving", async () => {
    const repository = fakeRepository();
    await register{{PASCAL}}({ id: "r1", label: "First" }, repository);

    await expect(register{{PASCAL}}({ id: "r1", label: "Again" }, repository)).rejects.toThrow(
      {{PASCAL}}Error,
    );
    expect(repository.saved).toHaveLength(1);
  });

  it("propagates the domain invariant", async () => {
    await expect(register{{PASCAL}}({ id: "r1", label: "" }, fakeRepository())).rejects.toThrow(
      {{PASCAL}}Error,
    );
  });
});
