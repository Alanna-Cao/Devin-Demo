# Internal Tools Platform (POC)

A proof of concept exploring whether a fintech engineering team could use Devin + conventional code to build a growing set of internal tools instead of expanding its Microsoft Power Apps usage.

Rather than recreate Power Apps, I built a small shared foundation and tested whether it could be reused across different business workflows.

The prototype includes:

* **KYC Review Queue** — the first workflow, used to build and test the shared foundation.
* **Refund Review** — added in a second, fresh Devin session to test how easily the foundation could support another tool.

## Shared foundation

Both tools reuse the same:

* tool registry and navigation
* server-side role and resource authorization
* validation and workflow preconditions
* audit logging for mutations
* data-access patterns
* UI components
* Admin, Compliance Manager, and Analyst personas

The goal is for a new tool to plug into these controls rather than reimplement them.

## KYC Review Queue

A searchable/filterable queue for reviewing KYC cases.

Analysts can work assigned cases but cannot make final decisions. Compliance Managers and Admins have broader permissions. Actions are checked server-side and recorded in the case's audit history.

## Refund Review

A second workflow built on the same foundation, with different authorization and workflow rules. For example, Compliance Managers can decide refunds under $5,000, while larger refunds require an Admin.

I added Refund Review in a fresh Devin session after merging the KYC implementation. Devin reused the existing authorization, workflow validation, auditing, data, and UI patterns without requiring changes to the shared foundation beyond registering the new tool.

## Running locally

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

Other useful commands:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

All data is synthetic and stored in memory. The POC has no real authentication, database, or external integrations.

## Demo

**KYC**

1. Start as an Analyst and open a case.
2. Note that the Analyst cannot approve/reject it.
3. Switch to Compliance Manager and make a decision.
4. View the resulting audit event.

**Refunds**

1. As Compliance Manager, approve/reject a refund under $5,000.
2. Open a refund of $5,000 or more and note that the decision is restricted.
3. Switch to Admin and make the decision.
4. View the resulting audit event.

Authorization and workflow rules are enforced server-side, not just by hiding controls in the UI.

## Project structure

```text
src/
  platform/        shared auth, authorization, audit, actions, data, registry, UI
  tools/
    kyc-review/
    refund-review/
  app/             Next.js routes
```

See `docs/ADDING_A_TOOL.md` for how another tool plugs into the platform and `docs/PRODUCTION_NOTES.md` for what would need to change for a production deployment.
