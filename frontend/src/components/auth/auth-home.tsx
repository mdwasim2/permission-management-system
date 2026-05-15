"use client";

import { AuditLogPanel } from "@/components/dashboard/audit-log-panel";
import { UsersPanel } from "@/components/dashboard/users-panel";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";

const defaultSidebarGroups = [
  {
    title: "Workspace",
    items: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Users", href: "/users" },
      { label: "Leads", href: "/leads" },
      { label: "Tasks", href: "/tasks" },
      { label: "Reports", href: "/reports" },
      { label: "Audit Log", href: "/audit-log" },
    ],
  },
  {
    title: "Users",
    items: [{ label: "Customer Portal", href: "/customer-portal" }],
  },
  {
    title: "Other",
    items: [{ label: "Settings", href: "/settings" }],
  },
] as const;

const sectionDescriptions: Record<string, string> = {
  Dashboard: "Protected overview.",
  Users: "User lifecycle and access control.",
  Leads: "Lead pipeline.",
  Tasks: "Task operations.",
  Reports: "Operational summary.",
  "Audit Log": "Append-only activity.",
  "Customer Portal": "Customer-facing access.",
  Settings: "Workspace settings.",
};

const taskRecords = [
  {
    id: "task-1",
    title: "Call about proposal",
    client: "Bluestone",
    owner: "AR",
    dueDate: "20 Jun",
    status: "Ongoing",
    priority: "Urgent",
  },
  {
    id: "task-2",
    title: "Send onboarding docs",
    client: "Tech Ltd.",
    owner: "JU",
    dueDate: "26 Jun",
    status: "On hold",
    priority: "High",
  },
  {
    id: "task-3",
    title: "Follow up with Mira",
    client: "Omar Rahman",
    owner: "MD",
    dueDate: "05 Jul",
    status: "Done",
    priority: "Low",
  },
  {
    id: "task-4",
    title: "Prepare pitch deck",
    client: "Jabed Ali",
    owner: "LM",
    dueDate: "08 Aug",
    status: "Not started",
    priority: "Medium",
  },
] as const;

const leadRecords = [
  {
    id: "lead-1",
    name: "Nadia Trade Link",
    source: "Referral",
    stage: "Qualified",
    owner: "AR",
  },
  {
    id: "lead-2",
    name: "Greenline Export",
    source: "Website",
    stage: "New",
    owner: "JU",
  },
  {
    id: "lead-3",
    name: "Orbix Services",
    source: "Campaign",
    stage: "Proposal",
    owner: "MD",
  },
] as const;

type MeResponse = {
  user: {
    id: string;
    name: string;
    email: string;
    status: string;
    permissions: string[];
    navigation: Array<{
      label: string;
      href: string;
      permission: string;
      group: string;
    }>;
    role: {
      key: string;
      label: string;
    };
  };
};

type NavigationEntry = MeResponse["user"]["navigation"][number];

type AuthHomeProps = {
  initialSection?: string;
};

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <rect
        x="4"
        y="4"
        width="6"
        height="6"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect
        x="14"
        y="4"
        width="6"
        height="6"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect
        x="4"
        y="14"
        width="6"
        height="6"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect
        x="14"
        y="14"
        width="6"
        height="6"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[1.4rem] border border-[#ece7e2] bg-white/90 p-5 shadow-[0_12px_34px_rgba(236,231,226,0.35)]">
      <p className="text-xs uppercase tracking-[0.18em] text-[#9ca3b4]">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[#353c50]">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ value }: { value: string }) {
  const tone =
    value === "Done"
      ? "bg-[#e3f6e6] text-[#3f9256]"
      : value === "Ongoing"
        ? "bg-[#e5f0ff] text-[#3979d8]"
        : value === "On hold"
          ? "bg-[#fff0df] text-[#b87428]"
          : "bg-[#edf0f5] text-[#5c6678]";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${tone}`}>
      {value}
    </span>
  );
}

function PanelShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.8rem] border border-[#ece7e2] bg-white/88 p-5 shadow-[0_18px_50px_rgba(236,231,226,0.45)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#353c50]">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-[#8b93a6]">{description}</p>
          ) : null}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function AuthHome({ initialSection = "Dashboard" }: AuthHomeProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [user, setUser] = useState<MeResponse["user"] | null>(null);
  const [activeSidebarItem, setActiveSidebarItem] = useState(initialSection);
  const [quickSearch, setQuickSearch] = useState("");
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

  useEffect(() => {
    async function loadSession() {
      const meResponse = await fetch(`${apiBaseUrl}/auth/me`, {
        credentials: "include",
      });

      if (meResponse.ok) {
        const data = (await meResponse.json()) as MeResponse;
        setUser(data.user);
        setIsLoading(false);
        return;
      }

      const refreshResponse = await fetch(`${apiBaseUrl}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (!refreshResponse.ok) {
        router.replace("/login");
        return;
      }

      const refreshedMeResponse = await fetch(`${apiBaseUrl}/auth/me`, {
        credentials: "include",
      });

      if (!refreshedMeResponse.ok) {
        router.replace("/login");
        return;
      }

      const data = (await refreshedMeResponse.json()) as MeResponse;
      setUser(data.user);
      setIsLoading(false);
    }

    loadSession().catch(() => {
      setErrorMessage("Unable to restore your session");
      setIsLoading(false);
    });
  }, [apiBaseUrl, router]);

  useEffect(() => {
    if (!user?.navigation?.length) {
      return;
    }

    const activeItem = user.navigation.find(
      (item) => item.label === initialSection,
    );

    if (!activeItem) {
      router.replace(user.navigation[0].href);
    }
  }, [initialSection, router, user]);

  async function handleLogout() {
    await fetch(`${apiBaseUrl}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });

    router.replace("/login");
    router.refresh();
  }

  const navigationGroups = useMemo(() => {
    if (!user?.navigation?.length) {
      return defaultSidebarGroups;
    }

    return user.navigation.reduce<
      Array<{ title: string; items: NavigationEntry[] }>
    >((groups, item) => {
      const existingGroup = groups.find((group) => group.title === item.group);

      if (existingGroup) {
        existingGroup.items.push(item);
        return groups;
      }

      groups.push({ title: item.group, items: [item] });
      return groups;
    }, []);
  }, [user]);

  const filteredTasks = useMemo(() => {
    const query = quickSearch.toLowerCase().trim();

    return taskRecords.filter((task) => {
      if (!query) {
        return true;
      }

      return `${task.title} ${task.client} ${task.status}`
        .toLowerCase()
        .includes(query);
    });
  }, [quickSearch]);

  const filteredLeads = useMemo(() => {
    const query = quickSearch.toLowerCase().trim();

    return leadRecords.filter((lead) => {
      if (!query) {
        return true;
      }

      return `${lead.name} ${lead.source} ${lead.stage}`
        .toLowerCase()
        .includes(query);
    });
  }, [quickSearch]);

  const scopedContent = useMemo(() => {
    if (!user) {
      return null;
    }

    switch (activeSidebarItem) {
      case "Users":
        return <UsersPanel apiBaseUrl={apiBaseUrl} enabled />;
      case "Audit Log":
        return <AuditLogPanel apiBaseUrl={apiBaseUrl} enabled />;
      case "Tasks":
        return (
          <PanelShell title="Tasks" description="Task list in current scope.">
            <div className="overflow-hidden rounded-[1.4rem] border border-[#ece7e2] bg-[#fffdfa]">
              <table className="w-full border-collapse text-left text-sm text-[#5b6275]">
                <thead>
                  <tr className="border-b border-[#f2eeea] text-xs uppercase tracking-[0.12em] text-[#a2a8b8]">
                    <th className="px-4 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Client</th>
                    <th className="px-4 py-3 font-medium">Owner</th>
                    <th className="px-4 py-3 font-medium">Due</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => (
                    <tr
                      key={task.id}
                      className="border-b border-[#f5f1ed] last:border-b-0"
                    >
                      <td className="px-4 py-4 font-medium text-[#444c5f]">
                        {task.title}
                      </td>
                      <td className="px-4 py-4">{task.client}</td>
                      <td className="px-4 py-4">{task.owner}</td>
                      <td className="px-4 py-4">{task.dueDate}</td>
                      <td className="px-4 py-4">
                        <StatusBadge value={task.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PanelShell>
        );
      case "Leads":
        return (
          <PanelShell
            title="Leads"
            description="Lead records in current scope."
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="rounded-[1.4rem] border border-[#ece7e2] bg-[#fffdfa] p-4"
                >
                  <p className="font-medium text-[#444c5f]">{lead.name}</p>
                  <p className="mt-2 text-sm text-[#8b93a6]">{lead.source}</p>
                  <div className="mt-4 flex items-center justify-between text-sm text-[#6b7284]">
                    <span>{lead.stage}</span>
                    <span>{lead.owner}</span>
                  </div>
                </div>
              ))}
            </div>
          </PanelShell>
        );
      case "Reports":
        return (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Users" value={user.navigation.length} />
            <MetricCard label="Permissions" value={user.permissions.length} />
            <MetricCard
              label="Open tasks"
              value={
                taskRecords.filter((task) => task.status !== "Done").length
              }
            />
            <MetricCard label="Leads" value={leadRecords.length} />
          </div>
        );
      case "Customer Portal":
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <MetricCard label="Portal status" value="Active" />
            <MetricCard
              label="Accessible atoms"
              value={
                user.permissions.filter((permission) =>
                  permission.startsWith("customer-portal"),
                ).length
              }
            />
          </div>
        );
      case "Settings":
        return (
          <div className="grid gap-4 md:grid-cols-2">
            <MetricCard label="Account status" value={user.status} />
            <MetricCard label="Role" value={user.role.label} />
          </div>
        );
      case "Dashboard":
      default:
        return (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Role" value={user.role.label} />
              <MetricCard label="Permissions" value={user.permissions.length} />
              <MetricCard label="Modules" value={user.navigation.length} />
              <MetricCard label="Status" value={user.status} />
            </div>
            <PanelShell title="Available modules">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {user.navigation.map((item) => (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => {
                      setActiveSidebarItem(item.label);
                      router.push(item.href);
                    }}
                    className="rounded-[1.4rem] border border-[#ece7e2] bg-[#fffdfa] px-4 py-4 text-left transition hover:border-[#d9dcff] hover:bg-[#f8f8ff]"
                  >
                    <p className="font-medium text-[#444c5f]">{item.label}</p>
                    <p className="mt-2 text-sm text-[#8b93a6]">
                      {sectionDescriptions[item.label] ?? "Module"}
                    </p>
                  </button>
                ))}
              </div>
            </PanelShell>
          </>
        );
    }
  }, [
    activeSidebarItem,
    apiBaseUrl,
    filteredLeads,
    filteredTasks,
    router,
    user,
  ]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffdfb] px-6 py-10 text-[#202631]">
        <div className="rounded-3xl border border-[#f1e8e1] bg-white px-8 py-6 shadow-[0_18px_50px_rgba(223,214,208,0.22)]">
          Checking your session...
        </div>
      </main>
    );
  }

  if (errorMessage || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffdfb] px-6 py-10 text-[#202631]">
        <div className="rounded-3xl border border-[#ffe0d5] bg-white px-8 py-6 text-[#c94f2d] shadow-[0_18px_50px_rgba(223,214,208,0.22)]">
          {errorMessage || "Session unavailable"}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff7f1_0%,#fffaf6_14%,#fdfdfd_100%)] px-3 py-3 text-[#2d3348] sm:px-4 sm:py-4">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.95)_0%,rgba(255,250,246,0.88)_100%)] shadow-[0_24px_80px_rgba(222,196,176,0.34)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(252,186,159,0.25),rgba(255,255,255,0))]" />
        <div className="flex min-h-screen flex-col xl:flex-row">
          <aside className="border-b border-[#f2e7dd] bg-[linear-gradient(180deg,#fde7dc_0%,#fff3e3_100%)] px-5 py-6 xl:min-h-screen xl:w-[250px] xl:border-b-0 xl:border-r">
            <div className="rounded-2xl border border-white/70 bg-white px-4 py-3 shadow-[0_16px_36px_rgba(226,190,160,0.22)]">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[linear-gradient(180deg,#6d75ff_0%,#5963f4_100%)] text-white shadow-[0_10px_24px_rgba(94,101,247,0.28)]">
                  <GridIcon />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#2d3348]">
                    {user.name}&apos;s workspace
                  </p>
                  <p className="text-xs text-[#8b90a1]">
                    #{user.id.slice(0, 8)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-6">
              {navigationGroups.map((group) => (
                <div key={group.title}>
                  <p className="mb-3 px-2 text-xs font-medium uppercase tracking-[0.2em] text-[#b1917e]">
                    {group.title}
                  </p>
                  <div className="space-y-1.5">
                    {group.items.map((item) => {
                      const isActive = item.label === activeSidebarItem;

                      return (
                        <button
                          key={item.href}
                          type="button"
                          onClick={() => {
                            setActiveSidebarItem(item.label);
                            router.push(item.href);
                          }}
                          className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm transition ${
                            isActive
                              ? "bg-[#e9d5c3]/65 font-medium text-[#4f5567]"
                              : "text-[#6b7184] hover:bg-white/60"
                          }`}
                        >
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <section className="flex-1 px-4 py-4 sm:px-6 sm:py-5 lg:px-7 xl:px-8">
            <header className="rounded-[1.8rem] border border-white/80 bg-white/80 px-4 py-3 shadow-[0_10px_24px_rgba(236,231,226,0.8)] backdrop-blur sm:px-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="grid h-11 w-11 place-items-center rounded-full border border-[#ebe7e3] bg-white text-[#656b7b] shadow-sm"
                  >
                    <span className="text-lg">←</span>
                  </button>
                  <div>
                    <p className="text-[1.35rem] font-semibold tracking-[-0.03em] text-[#31384c]">
                      {activeSidebarItem}
                    </p>
                    <p className="text-sm text-[#8f97aa]">
                      {sectionDescriptions[activeSidebarItem] ??
                        sectionDescriptions.Dashboard}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <label className="flex h-11 min-w-[240px] items-center rounded-full border border-[#efebe7] bg-[#fcfcfc] px-4 text-sm text-[#9198aa] shadow-sm">
                    <span className="mr-2">⌕</span>
                    <input
                      value={quickSearch}
                      onChange={(event) => setQuickSearch(event.target.value)}
                      placeholder="Search current module"
                      className="h-full flex-1 bg-transparent text-[#596073] outline-none placeholder:text-[#9198aa]"
                    />
                  </label>

                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-full bg-[linear-gradient(180deg,#eff1f8_0%,#ffffff_100%)] text-sm font-semibold text-[#4b5568] shadow-sm">
                      {user.name
                        .split(" ")
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="rounded-full bg-[linear-gradient(180deg,#7178ff_0%,#5f68f8_100%)] px-4 py-2.5 text-sm font-medium text-white shadow-[0_10px_24px_rgba(95,104,248,0.28)] transition hover:brightness-105"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </header>

            <div className="mt-5">{scopedContent}</div>
          </section>
        </div>
      </div>
    </main>
  );
}
