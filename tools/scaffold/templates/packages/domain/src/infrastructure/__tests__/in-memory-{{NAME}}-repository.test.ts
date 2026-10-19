import { register{{PASCAL}} } from "#application";
import { InMemory{{PASCAL}}Repository } from "../in-memory-{{NAME}}-repository";

describe("InMemory{{PASCAL}}Repository", () => {
  it("returns undefined for an unknown id", async () => {
    await expect(new InMemory{{PASCAL}}Repository().findById("missing")).resolves.toBeUndefined();
  });

  it("satisfies the port the use case depends on", async () => {
    const repository = new InMemory{{PASCAL}}Repository();
    await register{{PASCAL}}({ id: "r1", label: "First" }, repository);

    await expect(repository.findById("r1")).resolves.toEqual({ id: "r1", label: "First" });
  });
});
