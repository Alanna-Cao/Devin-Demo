import type { Permission, PolicyModule } from "@/platform/authz/types";

/**
 * Everything the platform needs to know about a tool. Navigation, the landing
 * page, route guards and the permission table are all derived from this, so a
 * new tool is a folder under `src/tools/` plus one entry in the registry.
 */
export interface ToolDefinition {
  id: string;
  title: string;
  description: string;
  /** Route the nav links to; the tool owns everything below it. */
  href: string;
  /** Short glyph used by the sidebar; keeps the POC free of an icon dependency. */
  glyph: string;
  /** Permission required to see the tool in nav and to enter any of its routes. */
  requiredPermission: Permission;
  /** Permissions this tool defines and who holds them. */
  policy: PolicyModule;
}
