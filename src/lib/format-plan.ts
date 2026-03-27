/**
 * Converts DB plan names like "CONCIERGE_FAMILY" to display names like "Concierge Family".
 */
export function formatPlanName(plan: string | null | undefined): string {
  if (!plan) return "No plan";
  return plan
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Returns true if the plan is a family plan (supports 2 patients).
 */
export function isFamilyPlan(plan: string | null | undefined): boolean {
  return !!plan && plan.includes("_FAMILY");
}
