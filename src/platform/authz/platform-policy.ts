import type { PolicyModule } from "@/platform/authz/types";

/** Permissions owned by the platform itself rather than by any one tool. */
export const platformPolicy: PolicyModule = {
  grants: {
    "platform.audit.read": ["admin", "manager"],
  },
};
