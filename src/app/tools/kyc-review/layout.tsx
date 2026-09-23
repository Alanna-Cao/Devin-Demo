import type { ReactNode } from "react";
import { ToolGuard } from "@/platform/registry/ToolGuard";

/** Every route under /tools/kyc-review is gated by the tool's requiredPermission. */
export default function KycReviewLayout({ children }: { children: ReactNode }) {
  return <ToolGuard toolId="kyc-review">{children}</ToolGuard>;
}
