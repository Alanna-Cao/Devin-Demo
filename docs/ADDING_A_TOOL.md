# Adding a tool

A new internal tool — a vendor onboarding workflow, a refund approval console, a dispute tracker — touches five files and no platform internals. Use `src/tools/kyc-review/` as the reference implementation.

## 1. `src/tools/<tool>/tool.config.ts` — the manifest

Declare the tool and the permissions it owns. Permissions are namespaced to the tool (`vendors.record.approve`). Grants map a permission to the roles that hold it; `scopes` add per-record rules that run after the grant passes.

```ts
export const vendorOnboardingTool: ToolDefinition = {
  id: "vendor-onboarding",
  title: "Vendor Onboarding",
  description: "Intake and approval for new suppliers.",
  href: "/tools/vendor-onboarding",
  glyph: "◆",
  requiredPermission: "vendors.queue.view",
  policy: {
    grants: {
      "vendors.queue.view": ["admin", "manager", "analyst"],
      "vendors.record.approve": ["admin", "manager"],
    },
    scopes: {
      "vendors.record.read": (actor, resource) => /* per-record rule */ true,
    },
  },
};
```

If the tool needs a role the platform does not have yet, add it to `ROLES` in `src/platform/authz/types.ts` — that is the one platform file role changes touch.

## 2. `src/tools/<tool>/data.ts` — data access

```ts
export const vendorRepository = inMemoryRepository<Vendor>("vendors", seedVendors);
```

Tools depend on `Repository<T>`, never on the storage mechanism. Moving to Postgres is a change to this file only.

## 3. `src/tools/<tool>/queries.ts` — authorized reads

Filter lists through `can(actor, "<tool>.record.read", record)` so visibility is enforced server-side rather than hidden in the UI.

## 4. `src/tools/<tool>/actions.ts` — mutations

Every mutation is a `defineAction()`. Supply `permission`, a Zod `input` schema, the `subject` being acted on, `loadResource` (so resource scopes apply), the `handler`, and a one-line `summary` for the audit trail. Authorization, validation and auditing come from the wrapper — do not re-implement them, and do not mutate a repository outside one.

## 5. `src/app/tools/<tool>/…` — routes

A `layout.tsx` that wraps children in `<ToolGuard toolId="vendor-onboarding">`, plus pages built from the shared UI (`PageHeader`, `FilterBar`, `DataTable`, `Can`, `AuditTrail`).

## Finally: register it

Add the manifest to `TOOLS` in `src/platform/registry/registry.ts`. Navigation, the landing page and the permission table pick it up automatically.

## Checklist

- [ ] Permissions namespaced to the tool, declared in one policy module
- [ ] Every mutation goes through `defineAction()`
- [ ] List and detail reads filtered with `can(...)`
- [ ] Routes wrapped in `ToolGuard`
- [ ] A test asserting the role restriction that matters most for this tool
