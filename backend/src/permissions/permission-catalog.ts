export const permissionCatalog = {
  dashboard: ['dashboard.view'],
  users: ['users.view', 'users.create', 'users.edit', 'users.suspend', 'users.ban'],
  leads: ['leads.view', 'leads.create', 'leads.edit'],
  tasks: ['tasks.view', 'tasks.create', 'tasks.assign'],
  reports: ['reports.view'],
  audit: ['audit.view'],
  customerPortal: ['customer-portal.view'],
  settings: ['settings.manage'],
} as const;

export const permissionGroups = Object.entries(permissionCatalog).map(
  ([module, permissions]) => ({
    module,
    permissions,
  }),
);