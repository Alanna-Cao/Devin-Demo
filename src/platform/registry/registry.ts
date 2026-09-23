import type { ToolDefinition } from "@/platform/registry/types";
import { kycReviewTool } from "@/tools/kyc-review/tool.config";

/**
 * The tool registry. Add a tool here and it appears in navigation, gets its
 * permissions added to the policy table, and its routes become guardable.
 * Nothing else in `src/platform` needs to change.
 */
const TOOLS: ToolDefinition[] = [kycReviewTool];

export function getRegisteredTools(): ToolDefinition[] {
  return TOOLS;
}

export function getTool(id: string): ToolDefinition {
  const tool = TOOLS.find((candidate) => candidate.id === id);
  if (!tool) throw new Error(`Unknown tool: ${id}`);
  return tool;
}
