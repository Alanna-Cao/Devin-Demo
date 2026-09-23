import type { ReactNode } from "react";
import { ToolGuard } from "@/platform/registry/ToolGuard";

/** Every route under /tools/refund-review is gated by the tool's requiredPermission. */
export default function RefundReviewLayout({ children }: { children: ReactNode }) {
  return <ToolGuard toolId="refund-review">{children}</ToolGuard>;
}
