# Leaving Power Apps: what we take on

Power Apps supplies more than UI. This POC stubs those responsibilities deliberately, and each stub is isolated behind a seam so it can be replaced without touching tool code.

| Responsibility | POC | Where it plugs in | Rough effort |
| --- | --- | --- | --- |
| Identity / SSO | persona cookie | `src/platform/auth/session.ts` — `getCurrentActor()` is the only authentication boundary. Replace the body with an Auth.js OIDC session against the corporate IdP; the `Actor` shape stays. | small |
| Role assignment | roles on seeded personas | Same file: map IdP groups to `Role` at session creation. Keep role names in `src/platform/authz/types.ts`. | small |
| Authorization | implemented | Already the real design: policy modules + `can()`. Production adds tests, not architecture. | done |
| Auditing | in-memory append-only sink | `src/platform/audit/audit-log.ts` — keep the event shape, write to Postgres and ship to the existing log pipeline. `defineAction()` callers are unaffected. | small |
| Data management | in-memory repositories | `src/platform/data/repository.ts` + each tool's `data.ts`. Add a Prisma (or service-client) adapter implementing `Repository<T>`. | medium |
| Integrations | none | New `src/platform/integrations/` with typed clients; secrets from the existing secret manager, never from tool code. | medium, per integration |
| Deployment | none | Containerize the Next.js app and run it on existing CI/CD. Environment config belongs in one `platform/config` module. | medium, one-time |
| Monitoring | none | Instrument `defineAction()` once — it already wraps every mutation — plus a request-level OpenTelemetry exporter. | small |
| Governance / change control | code review | CODEOWNERS on `src/platform/`, permission-table tests in CI, PR review as the approval record. This is stronger than Power Apps' maker-level governance, but it is now the engineering team's job. | ongoing |
| Non-engineer changes | not possible | The real trade-off of leaving Power Apps: every change becomes a PR. Worth naming explicitly in the decision. | ongoing |

## Deliberate non-goals for the POC

Real authentication, any PII, external service calls, background jobs, notifications, file storage, pagination at scale, and per-tool databases. None of them are blocked by the current structure; all of them were left out to keep the foundation legible.
