# Internal Tools Platform (POC)

A proof of concept for replacing a Power Apps internal tools estate with conventional code. The point of this repo is the **foundation**, not the first tool: authentication, authorization, auditing, data access and navigation are platform concerns, and a tool is a folder that plugs into them.

The included tool — **KYC Review Queue** — exists to prove the foundation carries a real workflow.

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # policy engine + action pipeline tests
npm run typecheck
npm run lint
```

## Stack

Next.js (App Router) + TypeScript + Tailwind. Mocked in-memory data behind repository interfaces. Zod for input validation, Vitest for tests. No database, no external services, no real auth — see [docs/PRODUCTION_NOTES.md](docs/PRODUCTION_NOTES.md) for where each of those plugs in.

## Layout

```
src/platform/      the reusable foundation — shared by every tool
  auth/            session boundary (getCurrentActor) + demo personas
  authz/           roles, policy modules, can() / requirePermission()
  audit/           append-only audit events
  actions/         defineAction(): the only sanctioned way to mutate state
  data/            Repository<T> + in-memory adapter
  registry/        tool registry + route guard
  ui/              AppShell, DataTable, FilterBar, Can, AuditTrail, StatusBadge
src/tools/         one folder per tool
  kyc-review/      tool.config.ts, domain, data, queries, actions, components
src/app/           thin Next.js routing that mounts registered tools
```

## The three ideas worth reviewing

**1. A tool is a manifest plus a folder.** `src/tools/<tool>/tool.config.ts` declares the tool's id, nav entry, required permission and its permission grants. The registry (`src/platform/registry/registry.ts`) is the single list of tools; navigation, the landing page, the effective permission table and route guards are all derived from it. Nothing in `src/platform` knows what KYC is.

**2. Authorization is server-enforced and centralized.** `can(actor, permission, resource?)` is the only authorization primitive. Role grants come from policy modules; per-record rules (an analyst sees only their own or unclaimed cases) are `scopes` on the same permission, so list queries, page guards, server actions and the `<Can>` UI component all apply the identical rule. Hiding a button never *is* the enforcement — it is a reflection of it.

**3. Auditing is not opt-in.** Every mutation goes through `defineAction()`, which runs one pipeline: resolve actor → validate input (Zod) → authorize (role grant + resource scope) → execute → write an audit event. Denied and failed attempts are audited too, so a tool author cannot ship an unaudited or unauthorized write without deliberately bypassing the platform.

## Personas

Switch personas from the header dropdown — the session stub reads a cookie, so role behaviour is demonstrable live.

| Persona | Sees | Can |
| --- | --- | --- |
| Dana Okafor — Admin | all cases | everything, including reassignment |
| Priya Raman — Compliance Manager | all cases | approve / reject / escalate / assign |
| Sam Ellis — KYC Analyst | own + unclaimed cases | claim, note, escalate — **not** decide |

Demo path: as the analyst, open a case and note there is no approve control and an explicit "your role cannot approve" message; switch to the manager, approve it with a reason; the case's audit trail shows the manager's approval alongside any denied analyst attempt.

## Adding the next tool

See [docs/ADDING_A_TOOL.md](docs/ADDING_A_TOOL.md) — five files, none of them in `src/platform`.
