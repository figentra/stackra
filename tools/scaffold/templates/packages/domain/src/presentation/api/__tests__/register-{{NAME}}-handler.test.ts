import type { {{PASCAL}}Repository } from "#application";
import { createRegister{{PASCAL}}Handler } from "../register-{{NAME}}-handler";

describe("createRegister{{PASCAL}}Handler", () => {
  it("maps the request to the command and the record to the response", async () => {
    const save = vi.fn<{{PASCAL}}Repository["save"]>(async () => undefined);
    const handle = createRegister{{PASCAL}}Handler({ findById: async () => undefined, save });

    await expect(handle({ id: "r1", label: " First " })).resolves.toEqual({
      id: "r1",
      label: "First",
    });
    expect(save).toHaveBeenCalledOnce();
  });
});
