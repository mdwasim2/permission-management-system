export const routePermissions = {
  "/": "dashboard.view",
  "/dashboard": "dashboard.view",
  "/users": "users.view",
  "/leads": "leads.view",
  "/tasks": "tasks.view",
  "/reports": "reports.view",
  "/audit-log": "audit.view",
  "/customer-portal": "customer-portal.view",
  "/settings": "settings.manage",
} as const;

export const protectedRoutes = Object.keys(routePermissions);
export const authRoutes = ["/login", "/register"] as const;
