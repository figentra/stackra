/**
 * Stackra file contract:
 * Purpose: unit tests of `PolicyDecisionPointService`: grants inherit downward and expire, a call without a scope acts
 *          at the root, a wildcard counts only in a system role, module roles come from `registerRoles`, a system
 *          permission is the platform's only, deny overrides allow (by role and scope node audiences), a
 *          conditional deny is tested only against a record and fails closed without a fact source, every link of
 *          the actor chain must hold the permission, visibility answers deny over allow and abstains with no
 *          matching rule, the visible condition of a query joins the rules of the principal's audiences by the deny
 *          rule and reads them closed, and delegation stays at or below a held role's node; a restricted permission
 *          is never self-granted, an open break-glass grant allows past breakable denies only, a dimension value that is
 *          not live fails closed, and the field rules answer hidden and read-only fields.
 * Boundary: test only; the source is `MemoryPolicySourceDriver`, the clock fixed, the conditions real
 *           `@stackra/rules` trees. The registries are cleared before each test.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0208 (decisions 1 to 4; enforcement: deny-overrides-allow and the delegation
 *                     bound); ADR 0132 (decision 5); ADR 0333 (decisions 2, 3 and 7, as amended by ADR 0462: no segment
 *                     audience); ADR 0331 (decisions 6 and 11).
 */
import { Driver } from "@stackra/container";
import {
  type Actor,
  ActorKind,
  Clock,
  type PublicId,
  Realm,
  type ScopeRef,
} from "@stackra/contracts";
import { ConditionInvalidError, Rules } from "@stackra/rules";
import { type FactField, FieldType, Operator } from "@stackra/rules/contracts";
import { beforeEach, describe, expect, it } from "@stackra/testing";

import { Capability, DimensionValues, FieldAccess } from "#contracts/index";
import type { Condition } from "@stackra/rules";
import { Permissions } from "#core/bases/permissions.base";
import { Role } from "#core/bases/role.base";
import { DIMENSION_REGISTRY } from "#core/constants/dimension-registry.constant";
import { PERMISSION_REGISTRY } from "#core/constants/permission-registry.constant";
import { ROLE_REGISTRY } from "#core/constants/role-registry.constant";
import { MemoryPolicySourceDriver } from "#core/drivers/memory-policy-source.driver";
import { AccessReason } from "#core/enums/access-reason.enum";
import { Decision } from "#core/enums/decision.enum";
import { SystemRole } from "#core/enums/system-role.enum";
import { registerDimensions } from "#core/functions/register-dimensions.function";
import { registerPermissions } from "#core/functions/register-permissions.function";
import { registerRoles } from "#core/functions/register-roles.function";
import { PolicyDecisionPointService } from "#core/services/policy-decision-point.service";
import type { MemoryPolicyState } from "#core/types/memory-policy-state.type";
import type { RecordFacts } from "#core/types/record-facts.type";
import { Permission } from "#core/values/permission.value";

const NOW = new Date("2026-10-25T09:00:00Z");

/** Always `NOW`. */
class FixedClockDriver extends Driver(Clock) {
  now(): Date {
    return new Date(NOW);
  }
}

class OrderPermissions extends Permissions {
  static readonly read = Permission.L0;

  static readonly cancel = Permission.L2;

  static readonly expire = Permission.L2.system();
}

class OrderClerkRole extends Role({ grants: [OrderPermissions.read, OrderPermissions.cancel] }) {}

const ROOT: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2r1", path: "platform" };
const ACME: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.acme" };
const ACME_EU: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w2", path: "platform.acme.eu" };
const GLOBEX: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w3", path: "platform.globex" };
/** A business role standing in for a customer group; IAM knows no segments (ADR 0462 decision 1). */
const VIP = { kind: "role", key: "vip" } as const;

const staff: Actor = {
  kind: ActorKind.User,
  id: "usr_01j9z3k4m5n6p7q8r9s0t1v2s1",
  realm: Realm.Staff,
};
const customer: Actor = {
  kind: ActorKind.User,
  id: "usr_01j9z3k4m5n6p7q8r9s0t1v2c1",
  realm: Realm.Customer,
};
const relay: Actor = { kind: ActorKind.Service, id: "svc_notifications" };
const job: Actor = { kind: ActorKind.Job, id: "job_01j9z3k4m5n6p7q8r9s0t1v2j1" };

const ORDER_FACTS = Rules.create({
  key: "orders.order",
  sources: [
    {
      key: "record",
      fields: {
        region: { type: FieldType.String, label: "orders::fields.region" as FactField["label"] },
      },
    },
  ],
});

const IN_EU: Condition = { field: "record.region", operator: Operator.Equals, value: "eu" };

/** An order record in `region`, as the decision point tests it. */
const order = (region: string): RecordFacts => ({
  rules: ORDER_FACTS,
  facts: { record: { region } },
});

/** A decision point over `state`. */
function pdpOver(state: MemoryPolicyState): PolicyDecisionPointService {
  const source = new MemoryPolicySourceDriver();
  source.load(state);
  return new PolicyDecisionPointService(source, new FixedClockDriver());
}

/** Staff holds the manager role at Acme, and the manager role holds read and cancel. */
const MANAGER_AT_ACME: MemoryPolicyState = {
  grants: [{ principal: staff.id, role: SystemRole.Manager, scope: ACME }],
  roles: { [SystemRole.Manager]: ["orders.order.read", "orders.order.cancel"] },
};

describe("PolicyDecisionPointService", () => {
  beforeEach(() => {
    PERMISSION_REGISTRY.clear();
    ROLE_REGISTRY.clear();
    registerPermissions([
      {
        type: OrderPermissions,
        keys: {
          read: "orders.order.read",
          cancel: "orders.order.cancel",
          expire: "orders.order.expire",
        },
      },
    ]);
  });

  describe("check", () => {
    it("applies a grant at its node and below, never beside it or at the root", async () => {
      const pdp = pdpOver(MANAGER_AT_ACME);
      expect(await pdp.check(staff, "orders.order.cancel", { scope: ACME })).toBe(true);
      expect(await pdp.check(staff, OrderPermissions.cancel, { scope: ACME_EU })).toBe(true);
      expect(await pdp.check(staff, "orders.order.cancel", { scope: GLOBEX })).toBe(false);
      expect(await pdp.check(staff, "orders.order.cancel")).toBe(false);
    });

    it("applies a root grant to a call without a scope", async () => {
      const pdp = pdpOver({
        ...MANAGER_AT_ACME,
        grants: [{ role: SystemRole.Manager, scope: ROOT }],
      });
      expect(await pdp.check(staff, "orders.order.read")).toBe(true);
    });

    it("ignores an expired grant", async () => {
      const pdp = pdpOver({
        ...MANAGER_AT_ACME,
        grants: [
          { role: SystemRole.Manager, scope: ACME, expiresAt: new Date("2026-10-25T08:59:59Z") },
        ],
      });
      expect(await pdp.check(staff, "orders.order.read", { scope: ACME })).toBe(false);
    });

    it("counts a wildcard only in a system role", async () => {
      const custom = pdpOver({
        grants: [{ role: "clerk", scope: ROOT }],
        roles: { clerk: ["orders.*"] },
      });
      const owner = pdpOver({
        grants: [{ role: SystemRole.Owner, scope: ROOT }],
        roles: { [SystemRole.Owner]: ["*"] },
      });
      expect(await custom.check(staff, "orders.order.read")).toBe(false);
      expect(await owner.check(staff, "orders.order.read")).toBe(true);
    });

    it("reads a module role from registerRoles, over a snapshot role of the same key", async () => {
      registerRoles([{ type: OrderClerkRole, key: "orders.order_clerk" }]);
      const pdp = pdpOver({
        grants: [{ role: "orders.order_clerk", scope: ROOT }],
        roles: { "orders.order_clerk": [] },
      });
      expect(await pdp.check(staff, "orders.order.cancel")).toBe(true);
    });

    it("holds a system permission for the platform only, never through a role", async () => {
      const pdp = pdpOver({
        grants: [{ role: SystemRole.Owner, scope: ROOT }],
        roles: { owner: ["*"] },
      });
      expect(await pdp.explain(staff, OrderPermissions.expire)).toMatchObject({
        allowed: false,
        reason: AccessReason.SystemOnly,
      });
      expect(await pdp.check(job, OrderPermissions.expire)).toBe(true);
      expect(await pdp.check(relay, OrderPermissions.expire)).toBe(true);
      expect(await pdp.check({ ...relay, onBehalfOf: customer }, OrderPermissions.expire)).toBe(
        false,
      );
    });

    it("lets a deny beat the grant, for a role and a scope node audience", async () => {
      const byRole = pdpOver({
        ...MANAGER_AT_ACME,
        denies: [
          {
            permission: "orders.order.cancel",
            audience: { kind: "role", key: SystemRole.Manager },
          },
        ],
      });
      const byScope = pdpOver({
        ...MANAGER_AT_ACME,
        denies: [{ permission: "orders.*", audience: ACME_EU }],
      });

      expect(await byRole.explain(staff, "orders.order.cancel", { scope: ACME })).toEqual({
        allowed: false,
        reason: AccessReason.Denied,
        principal: staff.id,
        version: 1,
        rule: 0,
      });
      expect(await byScope.check(staff, "orders.order.cancel", { scope: ACME_EU })).toBe(false);
      expect(await byScope.check(staff, "orders.order.cancel", { scope: ACME })).toBe(true);
    });

    it("tests a conditional deny only against a record, and denies when the record has no fact source", async () => {
      const pdp = pdpOver({
        ...MANAGER_AT_ACME,
        denies: [{ permission: "orders.order.cancel", condition: IN_EU }],
      });
      expect(await pdp.check(staff, "orders.order.cancel", { scope: ACME })).toBe(true);
      expect(
        await pdp.check(staff, "orders.order.cancel", { scope: ACME, record: order("eu") }),
      ).toBe(false);
      expect(
        await pdp.check(staff, "orders.order.cancel", { scope: ACME, record: order("us") }),
      ).toBe(true);
      expect(await pdp.check(staff, "orders.order.cancel", { scope: ACME, record: null })).toBe(
        false,
      );
    });

    it("needs every link of the actor chain to hold the permission", async () => {
      const userOnly = pdpOver({
        grants: [{ principal: customer.id, role: "buyer", scope: ROOT }],
        roles: { buyer: ["orders.order.cancel"] },
      });
      const both = pdpOver({
        grants: [{ role: "buyer", scope: ROOT }],
        roles: { buyer: ["orders.order.cancel"] },
      });
      const forCustomer: Actor = { ...relay, onBehalfOf: customer };

      expect(await userOnly.explain(forCustomer, "orders.order.cancel")).toMatchObject({
        allowed: false,
        reason: AccessReason.NotGranted,
        principal: relay.id,
      });
      expect(await both.explain(forCustomer, "orders.order.cancel")).toMatchObject({
        allowed: true,
        reason: AccessReason.Granted,
        principal: customer.id,
        role: "buyer",
      });
    });

    it("lets the platform through without a snapshot", async () => {
      const pdp = pdpOver({});
      expect(await pdp.explain(job, "orders.order.cancel")).toEqual({
        allowed: true,
        reason: AccessReason.Platform,
        principal: job.id,
      });
    });
  });

  describe("visibility", () => {
    const PRIVATE_SALE: MemoryPolicyState = {
      grants: [{ principal: customer.id, role: VIP.key, scope: ROOT }],
      visibility: [
        {
          model: "orders.order",
          audience: VIP,
          capability: Capability.See,
          condition: IN_EU,
        },
        { model: "orders.order", audience: ROOT, capability: Capability.Use, deny: true },
        {
          model: "orders.order",
          audience: VIP,
          capability: Capability.Use,
        },
      ],
    };

    it("allows a matching allow rule and abstains when no rule matches", async () => {
      const pdp = pdpOver(PRIVATE_SALE);
      expect(await pdp.visibility(customer, Capability.See, "orders.order", order("eu"))).toBe(
        Decision.Allow,
      );
      expect(await pdp.visibility(customer, Capability.See, "orders.order", order("us"))).toBe(
        Decision.Abstain,
      );
      expect(await pdp.visibility(customer, Capability.List, "orders.order", order("eu"))).toBe(
        Decision.Abstain,
      );
      expect(await pdp.visibility(staff, Capability.See, "orders.order", order("eu"))).toBe(
        Decision.Abstain,
      );
    });

    it("lets a deny beat an allow, and judges the principal a delegate acts for", async () => {
      const pdp = pdpOver(PRIVATE_SALE);
      const forCustomer: Actor = { ...relay, onBehalfOf: customer };
      expect(
        await pdp.visibility(forCustomer, Capability.Use, "orders.order", order("eu"), {
          scope: ACME,
        }),
      ).toBe(Decision.Deny);
      expect(await pdp.visibility(customer, Capability.Use, "orders.order", order("eu"))).toBe(
        Decision.Allow,
      );
    });

    it("allows the platform", async () => {
      expect(await pdpOver({}).visibility(job, Capability.See, "orders.order", order("eu"))).toBe(
        Decision.Allow,
      );
    });
  });

  describe("visibleCondition", () => {
    const IN_US: Condition = { field: "record.region", operator: Operator.Equals, value: "us" };
    const RULES: MemoryPolicyState = {
      grants: [
        { principal: customer.id, role: VIP.key, scope: ROOT },
        { principal: staff.id, role: SystemRole.Manager, scope: ACME },
      ],
      visibility: [
        {
          model: "orders.order",
          audience: VIP,
          capability: Capability.See,
          condition: IN_EU,
        },
        {
          model: "orders.order",
          audience: { kind: "role", key: SystemRole.Manager },
          capability: Capability.See,
          condition: IN_US,
          deny: true,
        },
        { model: "orders.order", audience: GLOBEX, capability: Capability.See },
        { model: "orders.order", audience: ROOT, capability: Capability.List, deny: true },
        { model: "catalogue.product", audience: ROOT, capability: Capability.See, deny: true },
      ],
    };

    it("joins the allow rules of the principal's audiences, and hides an unmatched record on Deny", async () => {
      const pdp = pdpOver(RULES);
      expect(
        await pdp.visibleCondition(customer, Capability.See, "orders.order", {
          rules: ORDER_FACTS,
          unmatched: Decision.Deny,
        }),
      ).toEqual({ any: [IN_EU] });
      expect(
        await pdp.visibleCondition(customer, Capability.See, "orders.order", {
          rules: ORDER_FACTS,
          unmatched: Decision.Allow,
        }),
      ).toEqual({ all: [] });
    });

    it("lets a deny beat every allow, for the role held where the call acts only", async () => {
      const pdp = pdpOver(RULES);
      const options = { rules: ORDER_FACTS, unmatched: Decision.Allow } as const;
      expect(
        await pdp.visibleCondition(staff, Capability.See, "orders.order", {
          ...options,
          scope: ACME_EU,
        }),
      ).toEqual({ not: { any: [IN_US] } });
      expect(
        await pdp.visibleCondition(staff, Capability.See, "orders.order", {
          ...options,
          scope: GLOBEX,
        }),
      ).toEqual({ all: [] });
      expect(
        await pdp.visibleCondition(staff, Capability.See, "orders.order", {
          ...options,
          unmatched: Decision.Deny,
          scope: ACME,
        }),
      ).toEqual({ all: [{ any: [] }, { not: { any: [IN_US] } }] });
    });

    it("matches every record for an unconditional rule and the platform, none for an unconditional deny", async () => {
      const pdp = pdpOver(RULES);
      expect(
        await pdp.visibleCondition(staff, Capability.See, "orders.order", {
          unmatched: Decision.Deny,
          scope: GLOBEX,
        }),
      ).toEqual({ any: [{ all: [] }] });
      expect(
        await pdp.visibleCondition(customer, Capability.See, "catalogue.product", {
          unmatched: Decision.Allow,
          scope: ACME,
        }),
      ).toEqual({ not: { any: [{ all: [] }] } });
      expect(
        await pdpOver({}).visibleCondition(job, Capability.See, "orders.order", {
          unmatched: Decision.Deny,
        }),
      ).toEqual({ all: [] });
    });

    it("reads a condition closed when the model registers no attributes, and refuses an invalid one", async () => {
      const pdp = pdpOver(RULES);
      expect(
        await pdp.visibleCondition(customer, Capability.See, "orders.order", {
          unmatched: Decision.Deny,
        }),
      ).toEqual({ any: [{ any: [] }] });
      expect(
        await pdp.visibleCondition(staff, Capability.See, "orders.order", {
          unmatched: Decision.Allow,
          scope: ACME,
        }),
      ).toEqual({ not: { any: [{ all: [] }] } });
      const broken = pdpOver({
        visibility: [
          {
            model: "orders.order",
            audience: ROOT,
            capability: Capability.See,
            condition: { field: "record.total", operator: Operator.Equals, value: 1 },
          },
        ],
      });
      await expect(
        broken.visibleCondition(customer, Capability.See, "orders.order", {
          rules: ORDER_FACTS,
          unmatched: Decision.Deny,
          scope: ACME,
        }),
      ).rejects.toThrow(ConditionInvalidError);
    });
  });

  describe("canDelegate", () => {
    it("allows a held role at or below its node only", async () => {
      const pdp = pdpOver(MANAGER_AT_ACME);
      expect(await pdp.canDelegate(staff, { role: SystemRole.Manager, scope: ACME_EU })).toBe(true);
      expect(await pdp.canDelegate(staff, { role: SystemRole.Manager, scope: ACME })).toBe(true);
      expect(await pdp.canDelegate(staff, { role: SystemRole.Manager, scope: GLOBEX })).toBe(false);
      expect(await pdp.canDelegate(staff, { role: SystemRole.Owner, scope: ACME_EU })).toBe(false);
    });

    it("refuses a non-user and an expired role", async () => {
      const expired = pdpOver({
        grants: [
          { role: SystemRole.Manager, scope: ACME, expiresAt: new Date("2026-10-01T00:00:00Z") },
        ],
      });
      expect(
        await pdpOver(MANAGER_AT_ACME).canDelegate(relay, {
          role: SystemRole.Manager,
          scope: ACME,
        }),
      ).toBe(false);
      expect(await expired.canDelegate(staff, { role: SystemRole.Manager, scope: ACME })).toBe(
        false,
      );
    });
  });
});

class RecordPermissions extends Permissions {
  static readonly readMedical = Permission.L3.restricted();
}

const MEDICAL = "academy.record.read_medical";
const ADMIN: PublicId<"usr"> = "usr_01j9z3k4m5n6p7q8r9s0t1v2a9";

/** The order facts with a dimension-typed channel. */
const CHANNEL_FACTS = Rules.create({
  key: "orders.channel_order",
  sources: [
    {
      key: "record",
      fields: {
        channelId: {
          type: FieldType.String,
          label: "orders::fields.channel" as FactField["label"],
        },
      },
    },
  ],
});

/** An order sold on `channel`, naming its model so its dimensions are checked. */
const onChannel = (channel: string): RecordFacts => ({
  rules: CHANNEL_FACTS,
  facts: { record: { channelId: channel } },
  model: "orders.order",
});

const ONLINE: Condition = {
  field: "record.channelId",
  operator: Operator.Equals,
  value: "chn_online",
};

/** The channels the projection holds live. */
class LiveChannelsDriver extends Driver(DimensionValues) {
  isLive(_dimension: string, id: string): boolean {
    return id === "chn_online";
  }

  live(): readonly string[] {
    return ["chn_online"];
  }
}

describe("PolicyDecisionPointService (restricted, break-glass, dimensions, fields)", () => {
  beforeEach(() => {
    PERMISSION_REGISTRY.clear();
    ROLE_REGISTRY.clear();
    DIMENSION_REGISTRY.clear();
    registerPermissions([
      {
        type: OrderPermissions,
        keys: {
          read: "orders.order.read",
          cancel: "orders.order.cancel",
          expire: "orders.order.expire",
        },
      },
      { type: RecordPermissions, keys: { readMedical: MEDICAL } },
    ]);
  });

  it("counts a restricted permission only through a grant someone else made", async () => {
    const roles = { nurse: [MEDICAL] };
    const self = pdpOver({ grants: [{ role: "nurse", scope: ROOT, grantedBy: staff.id }], roles });
    const none = pdpOver({ grants: [{ role: "nurse", scope: ROOT }], roles });
    const other = pdpOver({ grants: [{ role: "nurse", scope: ROOT, grantedBy: ADMIN }], roles });
    expect(await self.check(staff, MEDICAL)).toBe(false);
    expect(await none.check(staff, MEDICAL)).toBe(false);
    expect(await other.check(staff, MEDICAL)).toBe(true);
    expect(await other.canDelegate(staff, { role: "nurse", scope: ROOT }, { to: staff.id })).toBe(
      false,
    );
  });

  it("allows through an open break-glass grant, inside its window and past breakable denies only", async () => {
    const glass = {
      principal: staff.id,
      role: SystemRole.Manager,
      scope: ACME,
      reason: "court deadline",
      openedBy: staff.id,
      startsAt: new Date("2026-10-25T08:00:00Z"),
      expiresAt: new Date("2026-10-25T10:00:00Z"),
    };
    const roles = { [SystemRole.Manager]: ["orders.order.read"] };
    const open = pdpOver({ roles, breakGlass: [glass] });
    expect(await open.explain(staff, "orders.order.read", { scope: ACME })).toMatchObject({
      allowed: true,
      reason: AccessReason.BreakGlass,
      breakGlass: 0,
      role: SystemRole.Manager,
    });
    const walled = pdpOver({ roles, breakGlass: [glass], denies: [{ permission: "orders.*" }] });
    expect(await walled.check(staff, "orders.order.read", { scope: ACME })).toBe(false);
    const breakable = pdpOver({
      roles,
      breakGlass: [glass],
      denies: [{ permission: "orders.*", breakable: true }],
    });
    expect(await breakable.check(staff, "orders.order.read", { scope: ACME })).toBe(true);
    const closed = pdpOver({
      roles,
      breakGlass: [{ ...glass, expiresAt: new Date("2026-10-25T09:00:00Z") }],
    });
    expect(await closed.check(staff, "orders.order.read", { scope: ACME })).toBe(false);
  });

  it("denies on a dimension value that is not live, and pushes the live values into a query", async () => {
    registerDimensions([
      { model: "orders.order", field: "record.channelId", dimension: "sales.channel" },
    ]);
    const source = new MemoryPolicySourceDriver();
    source.load({
      visibility: [
        { model: "orders.order", audience: ROOT, capability: Capability.See, condition: ONLINE },
      ],
    });
    const pdp = new PolicyDecisionPointService(
      source,
      new FixedClockDriver(),
      new LiveChannelsDriver(),
    );
    expect(
      await pdp.visibility(staff, Capability.See, "orders.order", onChannel("chn_online"), {
        scope: ACME,
      }),
    ).toBe(Decision.Allow);
    const blind = new PolicyDecisionPointService(source, new FixedClockDriver());
    expect(
      await blind.visibility(staff, Capability.See, "orders.order", onChannel("chn_online"), {
        scope: ACME,
      }),
    ).toBe(Decision.Abstain);
    const condition = await pdp.visibleCondition(staff, Capability.See, "orders.order", {
      rules: CHANNEL_FACTS,
      unmatched: Decision.Deny,
      scope: ACME,
    });
    expect(JSON.stringify(condition)).toContain('"value":["chn_online"]');
  });

  it("answers the hidden and read-only fields of a record", async () => {
    const pdp = pdpOver({
      ...MANAGER_AT_ACME,
      fields: [
        {
          model: "orders.order",
          fields: ["margin"],
          access: FieldAccess.Hidden,
          audience: { kind: "role", key: SystemRole.Manager },
        },
        { model: "orders.order", fields: ["margin", "total"], access: FieldAccess.ReadOnly },
        { model: "orders.order", fields: ["notes"], access: FieldAccess.Hidden, condition: IN_EU },
      ],
    });
    expect(
      await pdp.fieldAccess(staff, "orders.order", { scope: ACME, record: order("us") }),
    ).toEqual({
      hidden: ["margin"],
      readOnly: ["total"],
    });
    expect((await pdp.fieldAccess(staff, "orders.order", { scope: ACME })).hidden).toEqual([
      "margin",
      "notes",
    ]);
    expect(await pdp.fieldAccess(job, "orders.order")).toEqual({ hidden: [], readOnly: [] });
  });
});
