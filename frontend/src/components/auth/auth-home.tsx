"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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

const dashboardSections: Record<string, string> = {
  Dashboard: "Overview of active work across your protected workspace.",
  Users: "Manage users, access changes, and account lifecycle actions.",
  Leads: "Review incoming prospects and move them through the pipeline.",
  Tasks: "Manage the task list, kanban board, and due-date calendar.",
  Reports: "Summarize delivery progress and task completion trends.",
  "Audit Log": "Review append-only operational history across admin actions.",
  "Customer Portal":
    "Expose customer-facing workflow access with scoped permissions.",
  Settings: "Control your workspace preferences and account state.",
};

const calendarColumns = ["18 Jun", "20 Jun", "26 Jun", "05 Jul", "08 Aug"];

const priorityToneMap = {
  Urgent: "bg-[#ff5e57]/12 text-[#ff4d45]",
  High: "bg-[#ffe2de] text-[#f06d5f]",
  Medium: "bg-[#ffedd8] text-[#f29235]",
  Low: "bg-[#e2f6e7] text-[#4aaa68]",
} as const;

const statusToneMap = {
  Ongoing: "bg-[#e5f0ff] text-[#3979d8]",
  "On hold": "bg-[#fff0df] text-[#b87428]",
  Done: "bg-[#e3f6e6] text-[#3f9256]",
  "Not started": "bg-[#edf0f5] text-[#5c6678]",
  Backlog: "bg-[#edf0f5] text-[#5c6678]",
  Review: "bg-[#ece7ff] text-[#7467bf]",
  Completed: "bg-[#e3f6e6] text-[#3f9256]",
  Canceled: "bg-[#ffe2de] text-[#f06d5f]",
} as const;

const tagToneMap = {
  Personal: "bg-[#ece7ff] text-[#7467bf]",
  "Check later": "bg-[#f8ead8] text-[#ac7a41]",
  Compliance: "bg-[#e4f6eb] text-[#438960]",
} as const;

const columnToneMap = {
  Backlog: "bg-[#d6d9df]",
  "In progress": "bg-[#5ba3ff]",
  Review: "bg-[#6e72ff]",
  Completed: "bg-[#37c86c]",
  Canceled: "bg-[#ff5d5d]",
} as const;

const avatarTones = [
  "bg-[#ff8b78] text-white",
  "bg-[#7c8cff] text-white",
  "bg-[#47b567] text-white",
  "bg-[#ffbf65] text-[#5c3815]",
];

const initialTasks = [
  {
    id: "task-1",
    title: "Call about proposal",
    client: "Bluestone",
    priority: "Urgent",
    date: "18th Jun",
    dueDate: "20th Jun",
    dueKey: "20 Jun",
    serviceType: "Visa Processing",
    tag: "Check later",
    assignees: ["AR", "SO", "MD"],
    status: "Ongoing",
    column: "Backlog",
    progress: 0,
    selected: false,
  },
  {
    id: "task-2",
    title: "Send onboarding docs",
    client: "Tech Ltd.",
    priority: "High",
    date: "17th Jun",
    dueDate: "26th Jun",
    dueKey: "26 Jun",
    serviceType: "Legal Advisory",
    tag: "Personal",
    assignees: ["JU", "KA", "LM"],
    status: "On hold",
    column: "In progress",
    progress: 50,
    selected: false,
  },
  {
    id: "task-3",
    title: "Follow up with Mira",
    client: "Omar Rahman",
    priority: "Low",
    date: "17th Jun",
    dueDate: "5th Jul",
    dueKey: "05 Jul",
    serviceType: "Compliance",
    tag: "Check later",
    assignees: ["AR", "MD"],
    status: "Done",
    column: "Review",
    progress: 75,
    selected: true,
  },
  {
    id: "task-4",
    title: "Prepare pitch deck",
    client: "Jabed Ali",
    priority: "Medium",
    date: "14th Jun",
    dueDate: "8th Aug",
    dueKey: "08 Aug",
    serviceType: "Visa Processing",
    tag: "Personal",
    assignees: ["JU", "LM"],
    status: "Not started",
    column: "Completed",
    progress: 25,
    selected: false,
  },
  {
    id: "task-5",
    title: "Check data",
    client: "Travel Pro",
    priority: "Low",
    date: "19th Jun",
    dueDate: "20th Jun",
    dueKey: "20 Jun",
    serviceType: "Data Review",
    tag: "Compliance",
    assignees: ["AR", "LM", "MD"],
    status: "Ongoing",
    column: "Canceled",
    progress: 7,
    selected: false,
  },
  {
    id: "task-6",
    title: "Compliance review",
    client: "Legal Hub",
    priority: "Medium",
    date: "16th Jun",
    dueDate: "18th Jun",
    dueKey: "18 Jun",
    serviceType: "Compliance",
    tag: "Compliance",
    assignees: ["KA", "MD"],
    status: "Review",
    column: "Review",
    progress: 64,
    selected: false,
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

type ViewMode = "List" | "Kanban" | "Calendar";
type SortMode = "dueDate" | "title";
type CategoryFilter = "All" | "Personal" | "Check later" | "Compliance";
type TaskRecord = (typeof initialTasks)[number];
type ColumnName = TaskRecord["column"];
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

function DotIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <circle cx="12" cy="5" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="12" cy="19" r="1.8" />
    </svg>
  );
}

function AvatarStack({ names }: { names: string[] }) {
  return (
    <div className="flex items-center">
      {names.map((name, index) => (
        <div
          key={`${name}-${index}`}
          className={`-ml-1.5 first:ml-0 grid h-7 w-7 place-items-center rounded-full border-2 border-white text-[0.62rem] font-semibold shadow-sm ${avatarTones[index % avatarTones.length]}`}
        >
          {name}
        </div>
      ))}
    </div>
  );
}

function Badge({ label, tone }: { label: string; tone: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}
    >
      {label}
    </span>
  );
}

function normalizeValue(value: string) {
  return value.toLowerCase().trim();
}

function dateWeight(value: string) {
  const monthWeight: Record<string, number> = {
    Jan: 1,
    Feb: 2,
    Mar: 3,
    Apr: 4,
    May: 5,
    Jun: 6,
    Jul: 7,
    Aug: 8,
    Sep: 9,
    Oct: 10,
    Nov: 11,
    Dec: 12,
  };

  const [dayPart, monthPart] = value.replace(/th|st|nd|rd/g, "").split(" ");
  return (monthWeight[monthPart] ?? 0) * 100 + Number(dayPart);
}

function matchesSearch(task: TaskRecord, query: string) {
  if (!query) {
    return true;
  }

  const haystack = [
    task.title,
    task.client,
    task.serviceType,
    task.status,
    task.tag,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalizeValue(query));
}

function filterByCategory(task: TaskRecord, category: CategoryFilter) {
  return category === "All" ? true : task.tag === category;
}

function sortTasks(tasks: TaskRecord[], mode: SortMode) {
  return [...tasks].sort((left, right) => {
    if (mode === "title") {
      return left.title.localeCompare(right.title);
    }

    return dateWeight(left.dueDate) - dateWeight(right.dueDate);
  });
}

export function AuthHome({ initialSection = "Dashboard" }: AuthHomeProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [user, setUser] = useState<MeResponse["user"] | null>(null);
  const [activeSidebarItem, setActiveSidebarItem] = useState(initialSection);
  const [quickSearch, setQuickSearch] = useState("");
  const [tableSearch, setTableSearch] = useState("");
  const [boardSearch, setBoardSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("All");
  const [tableView, setTableView] = useState<ViewMode>("List");
  const [boardView, setBoardView] = useState<ViewMode>("Kanban");
  const [sortMode, setSortMode] = useState<SortMode>("dueDate");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [tasks, setTasks] = useState<TaskRecord[]>([...initialTasks]);
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

      // If the access token has expired but the refresh cookie is still valid, restore the session once.
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

    // Force the client back through middleware after the cookies are cleared.
    router.replace("/login");
    router.refresh();
  }

  function handleAddTask() {
    const totalTasks = tasks.length + 1;

    setTasks((current) => [
      {
        id: `task-${totalTasks}`,
        title: `New follow up ${totalTasks}`,
        client:
          activeSidebarItem === "Contacts" ? "New client" : "Client queue",
        priority: "Medium",
        date: "21st Jun",
        dueDate: "26th Jun",
        dueKey: "26 Jun",
        serviceType:
          activeSidebarItem === "Calendar"
            ? "Scheduled work"
            : "General workflow",
        tag: categoryFilter === "All" ? "Check later" : categoryFilter,
        assignees: ["AR", "MD"],
        status: "Not started",
        column: "Backlog",
        progress: 12,
        selected: false,
      },
      ...current,
    ]);
  }

  function toggleTaskSelection(taskId: string) {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, selected: !task.selected } : task,
      ),
    );
  }

  function clearSelection() {
    setTasks((current) =>
      current.map((task) => ({ ...task, selected: false })),
    );
  }

  const selectedCount = useMemo(
    () => tasks.filter((task) => task.selected).length,
    [tasks],
  );

  const headerTasks = useMemo(() => {
    const filtered = tasks.filter(
      (task) =>
        matchesSearch(task, `${quickSearch} ${tableSearch}`) &&
        filterByCategory(task, categoryFilter) &&
        (statusFilter === "All" || task.status === statusFilter),
    );

    return sortTasks(filtered, sortMode);
  }, [tasks, quickSearch, tableSearch, categoryFilter, statusFilter, sortMode]);

  const boardTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          matchesSearch(task, `${quickSearch} ${boardSearch}`) &&
          filterByCategory(task, categoryFilter),
      ),
    [tasks, quickSearch, boardSearch, categoryFilter],
  );

  const boardColumns = useMemo(
    () =>
      (Object.keys(columnToneMap) as ColumnName[]).map((columnName) => ({
        title: columnName,
        tone: columnToneMap[columnName],
        featured: columnName === "Review",
        items: boardTasks.filter((task) => task.column === columnName),
      })),
    [boardTasks],
  );

  const calendarGroups = useMemo(
    () =>
      calendarColumns.map((dateKey) => ({
        dateKey,
        items: sortTasks(
          tasks.filter(
            (task) =>
              task.dueKey === dateKey &&
              matchesSearch(
                task,
                `${quickSearch} ${tableSearch} ${boardSearch}`,
              ) &&
              filterByCategory(task, categoryFilter),
          ),
          sortMode,
        ),
      })),
    [tasks, quickSearch, tableSearch, boardSearch, categoryFilter, sortMode],
  );

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

  const sectionDescription =
    dashboardSections[activeSidebarItem] ?? dashboardSections.Tasks;

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
                          {item.label === "Messages" ? (
                            <span className="text-xs text-[#9aa1b3]">6</span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 hidden rounded-[1.6rem] border border-white/70 bg-white/75 p-4 text-sm text-[#677086] shadow-[0_10px_30px_rgba(226,190,160,0.18)] xl:block">
              <p className="font-semibold text-[#30364b]">Secure session</p>
              <p className="mt-2 leading-6">
                Home stays protected with access token checks and refresh-token
                session recovery.
              </p>
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
                      {sectionDescription}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <label className="flex h-11 min-w-[240px] items-center rounded-full border border-[#efebe7] bg-[#fcfcfc] px-4 text-sm text-[#9198aa] shadow-sm">
                    <span className="mr-2">⌕</span>
                    <input
                      value={quickSearch}
                      onChange={(event) => setQuickSearch(event.target.value)}
                      placeholder="Search workspace"
                      className="h-full flex-1 bg-transparent text-[#596073] outline-none placeholder:text-[#9198aa]"
                    />
                    <span className="ml-auto rounded-full border border-[#efebe7] px-2 py-0.5 text-[0.7rem] text-[#a4abbb]">
                      ⌘ K
                    </span>
                  </label>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setCategoryFilter((current) => {
                          if (current === "All") return "Personal";
                          if (current === "Personal") return "Check later";
                          if (current === "Check later") return "Compliance";
                          return "All";
                        })
                      }
                      className="rounded-full border border-[#efebe7] bg-white px-3 py-2 text-xs font-medium text-[#868da0] shadow-sm"
                    >
                      {categoryFilter === "All"
                        ? "All categories"
                        : categoryFilter}
                    </button>
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

            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
              <div className="rounded-[1.8rem] border border-[#f1ece7] bg-white/85 p-4 shadow-[0_18px_50px_rgba(236,231,226,0.8)] sm:p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex h-11 items-center rounded-full border border-[#f1ece7] bg-[#fcfcfc] px-4 text-sm text-[#9198aa]">
                      <input
                        value={tableSearch}
                        onChange={(event) => setTableSearch(event.target.value)}
                        placeholder="Search table"
                        className="w-[180px] bg-transparent text-[#596073] outline-none placeholder:text-[#9198aa]"
                      />
                    </label>
                    <div className="flex rounded-full bg-[#f4f5f8] p-1 text-sm">
                      {(["List", "Kanban", "Calendar"] as ViewMode[]).map(
                        (tab) => (
                          <button
                            key={tab}
                            type="button"
                            onClick={() => setTableView(tab)}
                            className={`rounded-full px-4 py-2 ${
                              tableView === tab
                                ? "bg-white font-medium text-[#41485b] shadow-sm"
                                : "text-[#98a0b1]"
                            }`}
                          >
                            {tab}
                          </button>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setSortMode((current) =>
                          current === "dueDate" ? "title" : "dueDate",
                        )
                      }
                      className="rounded-full border border-[#f0ebe6] px-3 py-2 text-xs text-[#9097a8]"
                    >
                      Sort: {sortMode === "dueDate" ? "Due date" : "Title"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setStatusFilter((current) => {
                          if (current === "All") return "Ongoing";
                          if (current === "Ongoing") return "Done";
                          if (current === "Done") return "On hold";
                          return "All";
                        })
                      }
                      className="rounded-full border border-[#f0ebe6] px-3 py-2 text-xs text-[#9097a8]"
                    >
                      Filter: {statusFilter}
                    </button>
                    <button
                      type="button"
                      onClick={handleAddTask}
                      className="inline-flex h-11 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#7178ff_0%,#5f68f8_100%)] px-5 text-sm font-medium text-white shadow-[0_10px_24px_rgba(95,104,248,0.24)]"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {tableView === "List" ? (
                  <div className="mt-5 overflow-hidden rounded-[1.7rem] border border-[#ece7e2] bg-[linear-gradient(180deg,#ffffff_0%,#fffcfa_100%)]">
                    <div className="flex items-center justify-between border-b border-[#f2eeea] px-4 py-4">
                      <div className="flex items-center gap-3">
                        <span className="h-4 w-4 rounded-md bg-[#4f9cff]" />
                        <p className="font-medium text-[#444c5f]">Group 1</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#9097a8]">
                        <span className="rounded-full border border-[#f0ebe6] px-3 py-1.5">
                          {headerTasks.length} tasks
                        </span>
                        <span className="rounded-full border border-[#f0ebe6] px-3 py-1.5">
                          {categoryFilter === "All"
                            ? "All tags"
                            : categoryFilter}
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-[920px] w-full border-collapse text-left text-sm text-[#5b6275]">
                        <thead>
                          <tr className="border-b border-[#f2eeea] text-xs uppercase tracking-[0.12em] text-[#a2a8b8]">
                            <th className="px-4 py-3 font-medium">Title</th>
                            <th className="px-4 py-3 font-medium">
                              Client name
                            </th>
                            <th className="px-4 py-3 font-medium">Priority</th>
                            <th className="px-4 py-3 font-medium">Date</th>
                            <th className="px-4 py-3 font-medium">Due date</th>
                            <th className="px-4 py-3 font-medium">
                              Service type
                            </th>
                            <th className="px-4 py-3 font-medium">Tags</th>
                            <th className="px-4 py-3 font-medium">
                              Assigned to
                            </th>
                            <th className="px-4 py-3 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {headerTasks.map((task) => (
                            <tr
                              key={task.id}
                              className={`border-b border-[#f5f1ed] last:border-b-0 ${task.selected ? "bg-[#faf9f7]" : "bg-transparent"}`}
                            >
                              <td className="px-4 py-4">
                                <button
                                  type="button"
                                  onClick={() => toggleTaskSelection(task.id)}
                                  className="flex items-center gap-3 text-left"
                                >
                                  <span
                                    className={`grid h-4 w-4 place-items-center rounded border text-[0.65rem] ${
                                      task.selected
                                        ? "border-[#b79f4b] bg-[#b79f4b] text-white"
                                        : "border-[#c8ceda] bg-white text-transparent"
                                    }`}
                                  >
                                    ✓
                                  </span>
                                  <span className="font-medium text-[#4a5266]">
                                    {task.title}
                                  </span>
                                </button>
                              </td>
                              <td className="px-4 py-4">{task.client}</td>
                              <td className="px-4 py-4">
                                <Badge
                                  label={task.priority}
                                  tone={priorityToneMap[task.priority]}
                                />
                              </td>
                              <td className="px-4 py-4">{task.date}</td>
                              <td className="px-4 py-4">{task.dueDate}</td>
                              <td className="px-4 py-4">{task.serviceType}</td>
                              <td className="px-4 py-4">
                                <Badge
                                  label={task.tag}
                                  tone={tagToneMap[task.tag]}
                                />
                              </td>
                              <td className="px-4 py-4">
                                <AvatarStack names={task.assignees} />
                              </td>
                              <td className="px-4 py-4">
                                <Badge
                                  label={task.status}
                                  tone={statusToneMap[task.status]}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}

                {tableView === "Kanban" ? (
                  <div className="mt-5 grid gap-4 xl:grid-cols-3">
                    {boardColumns.slice(0, 3).map((column) => (
                      <div
                        key={column.title}
                        className="rounded-[1.5rem] border border-[#ece7e2] bg-[linear-gradient(180deg,#ffffff_0%,#fffcfa_100%)] p-4"
                      >
                        <div className="flex items-center gap-2 text-sm font-medium text-[#4b5266]">
                          <span
                            className={`h-3 w-3 rounded-full ${column.tone}`}
                          />
                          {column.title}
                        </div>
                        <div className="mt-4 space-y-3">
                          {column.items.length > 0 ? (
                            column.items.map((task) => (
                              <div
                                key={task.id}
                                className="rounded-[1.2rem] border border-[#efebe6] bg-white p-3 shadow-[0_8px_20px_rgba(236,231,226,0.3)]"
                              >
                                <p className="font-medium text-[#474f63]">
                                  {task.title}
                                </p>
                                <p className="mt-1 text-xs text-[#9aa1b3]">
                                  {task.client}
                                </p>
                                <div className="mt-3 flex items-center justify-between gap-3">
                                  <Badge
                                    label={task.priority}
                                    tone={priorityToneMap[task.priority]}
                                  />
                                  <Badge
                                    label={task.status}
                                    tone={statusToneMap[task.status]}
                                  />
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="rounded-[1.2rem] border border-dashed border-[#e6dfd8] px-4 py-6 text-sm text-[#9aa1b3]">
                              No items match this view.
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {tableView === "Calendar" ? (
                  <div className="mt-5 grid gap-4 xl:grid-cols-5">
                    {calendarGroups.map((group) => (
                      <div
                        key={group.dateKey}
                        className="rounded-[1.5rem] border border-[#ece7e2] bg-[linear-gradient(180deg,#ffffff_0%,#fffcfa_100%)] p-4"
                      >
                        <p className="text-sm font-semibold text-[#42495d]">
                          {group.dateKey}
                        </p>
                        <div className="mt-4 space-y-3">
                          {group.items.length > 0 ? (
                            group.items.map((task) => (
                              <div
                                key={task.id}
                                className="rounded-[1.1rem] bg-[#fff6ef] p-3 text-sm text-[#555d72]"
                              >
                                <p className="font-medium">{task.title}</p>
                                <p className="mt-1 text-xs text-[#9097a8]">
                                  {task.client}
                                </p>
                                <p className="mt-2 text-xs text-[#9097a8]">
                                  Due {task.dueDate}
                                </p>
                              </div>
                            ))
                          ) : (
                            <div className="rounded-[1.1rem] border border-dashed border-[#e6dfd8] px-3 py-5 text-sm text-[#9aa1b3]">
                              Nothing scheduled.
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {selectedCount > 0 ? (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[1.4rem] border border-[#ece7e2] bg-[#fffdf9] px-4 py-3 text-sm text-[#6c7387]">
                    <span>{selectedCount} item selected</span>
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="rounded-full border border-[#ece7e2] px-3 py-1.5 text-xs text-[#7d8497]"
                    >
                      Clear selection
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="rounded-[1.8rem] border border-[#f1ece7] bg-[linear-gradient(180deg,#fffdfa_0%,#fff8f1_100%)] p-5 shadow-[0_18px_50px_rgba(236,231,226,0.72)]">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#a89383]">
                  Session overview
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[#30364b]">
                  Welcome back, {user.name}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[#7a8295]">
                  Your protected workspace is live. Access is restored
                  automatically while the refresh token stays valid.
                </p>

                <div className="mt-6 space-y-3">
                  {[
                    { label: "Email", value: user.email },
                    { label: "Role", value: user.role.label },
                    { label: "Status", value: user.status },
                    { label: "Active view", value: activeSidebarItem },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-white/80 bg-white/85 px-4 py-3"
                    >
                      <p className="text-xs uppercase tracking-[0.18em] text-[#a0a7b8]">
                        {item.label}
                      </p>
                      <p className="mt-2 text-sm font-medium text-[#454d61]">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-[1.6rem] bg-[linear-gradient(180deg,#6f76ff_0%,#5c65f4_100%)] p-5 text-white shadow-[0_14px_34px_rgba(95,104,248,0.34)]">
                  <p className="text-sm font-medium text-white/75">
                    Secure mode
                  </p>
                  <p className="mt-2 text-xl font-semibold tracking-[-0.03em]">
                    Protected route active
                  </p>
                  <p className="mt-3 text-sm leading-6 text-white/78">
                    Access token grants entry, refresh token restores the
                    session, and logout clears both cookies.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-[1.8rem] border border-[#f1ece7] bg-white/85 p-4 shadow-[0_18px_50px_rgba(236,231,226,0.8)] sm:p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex h-11 items-center rounded-full border border-[#f1ece7] bg-[#fcfcfc] px-4 text-sm text-[#9198aa]">
                    <input
                      value={boardSearch}
                      onChange={(event) => setBoardSearch(event.target.value)}
                      placeholder="Search board"
                      className="w-[180px] bg-transparent text-[#596073] outline-none placeholder:text-[#9198aa]"
                    />
                  </label>
                  <div className="flex rounded-full bg-[#f4f5f8] p-1 text-sm">
                    {(["List", "Kanban", "Calendar"] as ViewMode[]).map(
                      (tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setBoardView(tab)}
                          className={`rounded-full px-4 py-2 ${
                            boardView === tab
                              ? "bg-white font-medium text-[#41485b] shadow-sm"
                              : "text-[#98a0b1]"
                          }`}
                        >
                          {tab}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-full border border-[#f0ebe6] px-3 py-1.5 text-xs text-[#9097a8]">
                    {boardTasks.length} visible
                  </div>
                  <button
                    type="button"
                    onClick={handleAddTask}
                    className="inline-flex h-11 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#7178ff_0%,#5f68f8_100%)] px-5 text-sm font-medium text-white shadow-[0_10px_24px_rgba(95,104,248,0.24)]"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {boardView === "Kanban" ? (
                <div className="mt-5 grid gap-4 xl:grid-cols-5">
                  {boardColumns.map((column) => (
                    <div
                      key={column.title}
                      className={`rounded-[1.6rem] border border-[#efeae5] bg-[linear-gradient(180deg,#fbfbfc_0%,#fefaf6_100%)] p-3 ${
                        column.featured
                          ? "shadow-[0_12px_30px_rgba(95,104,248,0.16)]"
                          : ""
                      }`}
                    >
                      <div className="flex items-center justify-between px-1 pb-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-[#4b5266]">
                          <span
                            className={`h-3 w-3 rounded-full ${column.tone}`}
                          />
                          {column.title}
                        </div>
                        <span className="text-[#afb4c1]">
                          <DotIcon />
                        </span>
                      </div>

                      <div className="space-y-3">
                        {column.items.length > 0 ? (
                          column.items.map((item) => (
                            <div
                              key={`${column.title}-${item.id}`}
                              className={`rounded-[1.25rem] border border-[#efebe6] bg-white p-3 shadow-[0_8px_20px_rgba(236,231,226,0.45)] ${
                                column.featured
                                  ? "translate-y-2 xl:scale-[1.02]"
                                  : ""
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-medium text-[#474f63]">
                                    {item.title}
                                  </p>
                                  <p className="mt-1 text-xs text-[#9aa1b3]">
                                    Client name : {item.client}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => toggleTaskSelection(item.id)}
                                  className="text-[#c0c5d2]"
                                >
                                  <DotIcon />
                                </button>
                              </div>

                              <div className="mt-4 flex items-center justify-between gap-3">
                                <Badge
                                  label={item.priority}
                                  tone={priorityToneMap[item.priority]}
                                />
                                <AvatarStack names={item.assignees} />
                              </div>

                              <div className="mt-5">
                                <div className="flex items-center justify-between text-xs text-[#8d95a8]">
                                  <span>Project completion :</span>
                                  <span>{item.progress}%</span>
                                </div>
                                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#eef1f6]">
                                  <div
                                    className={`h-full rounded-full ${item.progress >= 70 ? "bg-[#47b567]" : item.progress >= 30 ? "bg-[#ffbc61]" : "bg-[#d2d8e4]"}`}
                                    style={{ width: `${item.progress}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-[1.2rem] border border-dashed border-[#e6dfd8] px-4 py-6 text-sm text-[#9aa1b3]">
                            No tasks in this column.
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {boardView === "List" ? (
                <div className="mt-5 space-y-3">
                  {boardTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex flex-col gap-3 rounded-[1.5rem] border border-[#ece7e2] bg-[linear-gradient(180deg,#ffffff_0%,#fffcfa_100%)] p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-[#444c5f]">
                          {task.title}
                        </p>
                        <p className="mt-1 text-sm text-[#8f97aa]">
                          {task.client} • {task.serviceType}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge
                          label={task.column}
                          tone={statusToneMap[task.status]}
                        />
                        <Badge label={task.tag} tone={tagToneMap[task.tag]} />
                        <span className="text-sm text-[#8f97aa]">
                          Due {task.dueDate}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {boardView === "Calendar" ? (
                <div className="mt-5 grid gap-4 xl:grid-cols-5">
                  {calendarGroups.map((group) => (
                    <div
                      key={group.dateKey}
                      className="rounded-[1.5rem] border border-[#ece7e2] bg-[linear-gradient(180deg,#ffffff_0%,#fffcfa_100%)] p-4"
                    >
                      <p className="text-sm font-semibold text-[#42495d]">
                        {group.dateKey}
                      </p>
                      <div className="mt-4 space-y-3">
                        {group.items.length > 0 ? (
                          group.items.map((task) => (
                            <div
                              key={task.id}
                              className="rounded-[1.1rem] bg-[#fff6ef] p-3 text-sm text-[#555d72]"
                            >
                              <p className="font-medium">{task.title}</p>
                              <p className="mt-1 text-xs text-[#9097a8]">
                                {task.client}
                              </p>
                              <p className="mt-2 text-xs text-[#9097a8]">
                                {task.column}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-[1.1rem] border border-dashed border-[#e6dfd8] px-3 py-5 text-sm text-[#9aa1b3]">
                            Nothing scheduled.
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
