/**
 * Stackra file contract:
 * Purpose: unit tests of `ResourceFormPage`: Create draws the input's own fields (no tree) and submits the values
 *          through the action runner, then opens the new record's View page; a refusal puts the server's field errors
 *          on the form; Edit reads the record first and starts the form from it with the id under the input's id key;
 *          the recorded fields draw by input type; one recorded form shows each mode only the fields its action takes.
 * Boundary: unit tier, jsdom; `useQuery`, the action runner, navigation and the schema form are spies, the web kit is
 *           DOM stand-ins, translation returns the key.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0307; ADR 0055.
 */
// @vitest-environment jsdom
import { actionRef, queryRef } from "@stackra/clients";
import { ApiArea } from "@stackra/contracts";
import { afterEach, describe, expect, it } from "@stackra/testing";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { z } from "zod";

import { registerResources } from "#core/functions/register-resources.function";
import { resource } from "#core/functions/resource.function";
import { ResourceFormPage } from "#react/resource-pages/resource-form-page";

const spies = vi.hoisted(() => ({
  useQuery: vi.fn(),
  run: vi.fn(),
  navigate: vi.fn(),
  useSchemaForm: vi.fn(),
  values: {} as Record<string, unknown>,
}));

vi.mock("@stackra/clients/react", () => ({ useQuery: spies.useQuery }));
vi.mock("#react/action-runner/use-action-runner", () => ({ useActionRunner: () => spies.run }));
vi.mock("@stackra/navigation/react", () => ({ useNavigate: () => spies.navigate }));
vi.mock("@stackra/i18n/react", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

vi.mock("@stackra/ui/react", async () => {
  const { createElement } = await import("react");
  // oxlint-disable-next-line typescript/no-explicit-any -- reason: the DOM stand-ins read the kit's props loosely
  type Props = Record<string, any>;
  const field = (kind: string) => (props: Props) =>
    createElement("label", { "data-kind": kind }, `${kind}:${props.name}`);
  return {
    useSchemaForm: (type: unknown, options: unknown) => {
      spies.useSchemaForm(type, options);
      return { formState: { isSubmitting: false } };
    },
    Form: (props: Props) =>
      createElement(
        "form",
        null,
        props.children,
        createElement(
          "button",
          { type: "button", onClick: () => props.submit(spies.values) },
          "submit",
        ),
      ),
    Field: {
      Text: field("text"),
      Number: field("number"),
      Switch: field("switch"),
      Select: field("select"),
      ComboBox: field("combo"),
    },
    FormSection: (props: Props) => createElement("fieldset", null, props.children),
    Button: (props: Props) => createElement("span", null, props.children),
    PageHeader: (props: Props) => createElement("header", null, props.title, props.description),
    PageSkeleton: () => createElement("p", null, "loading"),
    ErrorState: (props: Props) => createElement("p", null, props.title),
  };
});

const GetAccountQuery = queryRef("loyalty_kit.loyalty_account.get@1", {
  input: z.object({ accountId: z.string() }),
  output: z.object({ id: z.string() }),
});
const EnrollMemberAction = actionRef("loyalty_kit.loyalty_account.enroll@1", {
  input: z.object({
    principalId: z.string(),
    tier: z.enum(["bronze", "gold"]),
    points: z.number().optional(),
    isFrozen: z.boolean().default(false),
  }),
  output: z.object({ id: z.string() }),
});
const RenameAccountAction = actionRef("loyalty_kit.loyalty_account.update@1", {
  input: z.object({ accountId: z.string(), nickname: z.string() }),
  output: z.object({ id: z.string() }),
});

const Accounts = resource("loyalty_kit.loyalty_account", {
  base: "/loyalty/accounts",
  view: GetAccountQuery,
  create: EnrollMemberAction,
  update: RenameAccountAction,
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  spies.values = {};
});

describe("ResourceFormPage", () => {
  it("creates from the input's own fields and opens the new record", async () => {
    spies.run.mockResolvedValue({ status: "done", data: { id: "acc_9" } });
    spies.values = { principalId: "prn_1", tier: "gold" };
    render(<ResourceFormPage resource={Accounts} mode="create" />);
    expect(screen.getByText("text:principalId")).toBeTruthy();
    expect(screen.getByText("select:tier")).toBeTruthy();
    expect(screen.getByText("number:points")).toBeTruthy();
    expect(screen.getByText("switch:isFrozen")).toBeTruthy();
    await act(async () => fireEvent.click(screen.getByText("submit")));
    expect(spies.run).toHaveBeenCalledWith(EnrollMemberAction, {
      principalId: "prn_1",
      tier: "gold",
    });
    expect(spies.navigate).toHaveBeenCalledWith(Accounts.view, { id: "acc_9" });
  });

  it("puts the server's field errors on the form after a refusal", async () => {
    spies.run.mockResolvedValue({
      status: "refused",
      error: { fieldErrors: { principalId: "already_enrolled" } },
    });
    render(<ResourceFormPage resource={Accounts} mode="create" />);
    await act(async () => fireEvent.click(screen.getByText("submit")));
    expect(spies.useSchemaForm.mock.calls.at(-1)?.[1]).toMatchObject({
      serverErrors: { principalId: "already_enrolled" },
    });
    expect(spies.navigate).not.toHaveBeenCalled();
  });

  it("edits the record read first, the id under the input's key, with the recorded fields", async () => {
    const dispose = registerResources({
      "loyalty_kit.loyalty_account": {
        options: { area: ApiArea.Admin, operations: { get: true, update: true } },
        form: { fields: [{ kind: "value", key: "nickname" }] },
      },
    });
    spies.useQuery.mockReturnValue({
      data: { id: "acc_1", nickname: "Ada" },
      error: null,
      isPending: false,
      refetch: vi.fn(),
    });
    spies.run.mockResolvedValue({ status: "done", data: {} });
    render(<ResourceFormPage resource={Accounts} mode="edit" id="acc_1" />);
    expect(spies.useQuery).toHaveBeenCalledWith(GetAccountQuery, { accountId: "acc_1" });
    expect(spies.useSchemaForm.mock.calls[0]?.[1]).toMatchObject({
      defaultValues: { id: "acc_1", nickname: "Ada", accountId: "acc_1" },
    });
    expect(screen.getByText("text:nickname")).toBeTruthy();
    expect(screen.queryByText("text:accountId")).toBeNull();
    await act(async () => fireEvent.click(screen.getByText("submit")));
    expect(spies.navigate).toHaveBeenCalledWith(Accounts.view, { id: "acc_1" });
    dispose();
  });

  it("draws one recorded form per mode, each with only the fields its action takes", () => {
    const dispose = registerResources({
      "loyalty_kit.loyalty_account": {
        options: { area: ApiArea.Admin, operations: { get: true, create: true, update: true } },
        form: {
          fields: [
            { kind: "value", key: "principalId" },
            { kind: "value", key: "nickname" },
          ],
        },
      },
    });
    render(<ResourceFormPage resource={Accounts} mode="create" />);
    expect(screen.getByText("text:principalId")).toBeTruthy();
    expect(screen.queryByText("text:nickname")).toBeNull();
    cleanup();

    spies.useQuery.mockReturnValue({
      data: { id: "acc_1", nickname: "Ada" },
      error: null,
      isPending: false,
      refetch: vi.fn(),
    });
    render(<ResourceFormPage resource={Accounts} mode="edit" id="acc_1" />);
    expect(screen.getByText("text:nickname")).toBeTruthy();
    expect(screen.queryByText("text:principalId")).toBeNull();
    dispose();
  });
});
