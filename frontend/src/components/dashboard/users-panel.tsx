"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type UserRecord = {
  id: string;
  name: string;
  email: string;
  status: string;
  role: {
    key: string;
    label: string;
  };
  directPermissions: Array<{
    key: string;
    allowed: boolean;
  }>;
};

type UsersResponse = {
  users: UserRecord[];
  grantablePermissions: string[];
};

type UsersPanelProps = {
  apiBaseUrl: string;
  enabled: boolean;
};

const roleOptions = ["ADMIN", "MANAGER", "AGENT", "CUSTOMER"];
const quickRoleFilters = ["ALL", "MANAGER", "CUSTOMER"] as const;

export function UsersPanel({ apiBaseUrl, enabled }: UsersPanelProps) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [grantablePermissions, setGrantablePermissions] = useState<string[]>(
    [],
  );
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    password: "",
    roleKey: "CUSTOMER",
  });
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    roleKey: "CUSTOMER",
    status: "ACTIVE",
  });
  const [draftPermissions, setDraftPermissions] = useState<
    Record<string, boolean>
  >({});
  const [searchValue, setSearchValue] = useState("");
  const [roleFilter, setRoleFilter] =
    useState<(typeof quickRoleFilters)[number]>("ALL");

  function buildDraftPermissions(
    permissions: string[],
    selectedUser?: UserRecord | null,
  ) {
    if (!selectedUser) {
      return {};
    }

    return Object.fromEntries(
      permissions.map((permission) => [
        permission,
        selectedUser.directPermissions.some(
          (entry) => entry.key === permission && entry.allowed,
        ),
      ]),
    );
  }

  function selectUser(
    userId: string,
    nextUsers: UserRecord[] = users,
    nextGrantablePermissions: string[] = grantablePermissions,
  ) {
    setSelectedUserId(userId);
    const nextSelectedUser =
      nextUsers.find((user) => user.id === userId) ?? null;
    setEditForm({
      name: nextSelectedUser?.name ?? "",
      email: nextSelectedUser?.email ?? "",
      roleKey: nextSelectedUser?.role.key ?? "CUSTOMER",
      status: nextSelectedUser?.status ?? "ACTIVE",
    });
    setDraftPermissions(
      buildDraftPermissions(nextGrantablePermissions, nextSelectedUser),
    );
  }

  useEffect(() => {
    if (!enabled) {
      return;
    }

    async function loadUsers() {
      setIsLoading(true);
      setErrorMessage("");

      const response = await fetch(`${apiBaseUrl}/users`, {
        credentials: "include",
      });

      if (!response.ok) {
        setErrorMessage("Unable to load user management right now.");
        setIsLoading(false);
        return;
      }

      const data = (await response.json()) as UsersResponse;
      setUsers(data.users);
      setGrantablePermissions(data.grantablePermissions);
      const nextSelectedUserId = data.users[0]?.id || "";
      const nextSelectedUser =
        data.users.find((user) => user.id === nextSelectedUserId) ?? null;
      setSelectedUserId(nextSelectedUserId);
      setEditForm({
        name: nextSelectedUser?.name ?? "",
        email: nextSelectedUser?.email ?? "",
        roleKey: nextSelectedUser?.role.key ?? "CUSTOMER",
        status: nextSelectedUser?.status ?? "ACTIVE",
      });
      setDraftPermissions(
        buildDraftPermissions(data.grantablePermissions, nextSelectedUser),
      );
      setIsLoading(false);
    }

    loadUsers().catch(() => {
      setErrorMessage("Unable to load user management right now.");
      setIsLoading(false);
    });
  }, [apiBaseUrl, enabled]);

  async function refreshUsers(nextSelectedUserId?: string) {
    const response = await fetch(`${apiBaseUrl}/users`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Unable to refresh users");
    }

    const data = (await response.json()) as UsersResponse;
    setUsers(data.users);
    setGrantablePermissions(data.grantablePermissions);
    selectUser(
      nextSelectedUserId ?? data.users[0]?.id ?? "",
      data.users,
      data.grantablePermissions,
    );
  }

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage("");

    try {
      const response = await fetch(`${apiBaseUrl}/users`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formState),
      });

      if (!response.ok) {
        const data = (await response.json()) as { message?: string | string[] };
        setErrorMessage(
          Array.isArray(data.message)
            ? data.message[0]
            : data.message || "Unable to create user",
        );
        setIsSaving(false);
        return;
      }

      setFormState({
        name: "",
        email: "",
        password: "",
        roleKey: "CUSTOMER",
      });
      await refreshUsers();
    } catch {
      setErrorMessage("Unable to create user right now.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStatusAction(userId: string, action: "suspend" | "ban") {
    setIsSaving(true);
    setErrorMessage("");

    try {
      const response = await fetch(`${apiBaseUrl}/users/${userId}/${action}`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const data = (await response.json()) as { message?: string | string[] };
        setErrorMessage(
          Array.isArray(data.message)
            ? data.message[0]
            : data.message || `Unable to ${action} user`,
        );
        setIsSaving(false);
        return;
      }

      await refreshUsers(userId);
    } catch {
      setErrorMessage("Unable to update user status right now.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleActivateUser(userId: string) {
    setIsSaving(true);
    setErrorMessage("");

    try {
      const response = await fetch(`${apiBaseUrl}/users/${userId}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "ACTIVE",
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { message?: string | string[] };
        setErrorMessage(
          Array.isArray(data.message)
            ? data.message[0]
            : data.message || "Unable to activate user",
        );
        setIsSaving(false);
        return;
      }

      await refreshUsers(userId);
    } catch {
      setErrorMessage("Unable to activate user right now.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSavePermissions() {
    if (!selectedUserId) {
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        `${apiBaseUrl}/users/${selectedUserId}/permissions`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            permissions: Object.entries(draftPermissions).map(
              ([permissionKey, allowed]) => ({
                permissionKey,
                allowed,
              }),
            ),
          }),
        },
      );

      if (!response.ok) {
        const data = (await response.json()) as { message?: string | string[] };
        setErrorMessage(
          Array.isArray(data.message)
            ? data.message[0]
            : data.message || "Unable to save permissions",
        );
        setIsSaving(false);
        return;
      }

      await refreshUsers(selectedUserId);
    } catch {
      setErrorMessage("Unable to save permissions right now.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdateUser() {
    if (!selectedUserId) {
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      const response = await fetch(`${apiBaseUrl}/users/${selectedUserId}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        const data = (await response.json()) as { message?: string | string[] };
        setErrorMessage(
          Array.isArray(data.message)
            ? data.message[0]
            : data.message || "Unable to update user",
        );
        setIsSaving(false);
        return;
      }

      await refreshUsers(selectedUserId);
    } catch {
      setErrorMessage("Unable to update user right now.");
    } finally {
      setIsSaving(false);
    }
  }

  const filteredUsers = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    return users.filter((user) => {
      const matchesRole =
        roleFilter === "ALL" ? true : user.role.key === roleFilter;
      const matchesSearch =
        query.length === 0
          ? true
          : `${user.name} ${user.email} ${user.role.label} ${user.status}`
              .toLowerCase()
              .includes(query);

      return matchesRole && matchesSearch;
    });
  }, [roleFilter, searchValue, users]);

  if (!enabled) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="rounded-[1.6rem] border border-[#ece7e2] bg-white/85 px-5 py-8 text-sm text-[#798093]">
        Loading users...
      </div>
    );
  }

  const selectedUser = users.find((user) => user.id === selectedUserId) ?? null;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
      <div className="rounded-[1.8rem] border border-[#ece7e2] bg-white/88 p-5 shadow-[0_18px_50px_rgba(236,231,226,0.45)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[#353c50]">
              User lifecycle
            </h2>
            <p className="mt-1 text-sm text-[#8b93a6]">
              Quickly edit managers and customers, then activate, suspend, or
              ban.
            </p>
          </div>
          <span className="rounded-full border border-[#efe8e1] px-3 py-1 text-xs text-[#8b93a6]">
            {users.length} users
          </span>
        </div>

        {errorMessage ? (
          <p className="mt-4 rounded-2xl bg-[#fff0ea] px-4 py-3 text-sm text-[#c94f2d]">
            {errorMessage}
          </p>
        ) : null}

        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label className="flex h-11 w-full items-center rounded-2xl border border-[#ece7e2] bg-[#fffdfa] px-4 text-sm text-[#8b93a6] lg:max-w-sm">
            <span className="mr-2">⌕</span>
            <input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search manager or customer"
              className="h-full flex-1 bg-transparent text-[#525a6e] outline-none placeholder:text-[#a1a7b5]"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {quickRoleFilters.map((filter) => {
              const isActive = filter === roleFilter;

              return (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setRoleFilter(filter)}
                  className={`rounded-full px-3 py-2 text-xs font-medium transition ${
                    isActive
                      ? "bg-[#eef1ff] text-[#5f68f8]"
                      : "border border-[#efe8e1] bg-[#fffdfa] text-[#7b8396]"
                  }`}
                >
                  {filter === "ALL" ? "All users" : filter.toLowerCase()}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className={`rounded-[1.4rem] border px-4 py-4 transition ${
                selectedUserId === user.id
                  ? "border-[#d8d7ff] bg-[#f8f8ff]"
                  : "border-[#efe8e1] bg-[#fffdfa]"
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <button
                    type="button"
                    onClick={() => selectUser(user.id)}
                    className="text-left"
                  >
                    <p className="font-medium text-[#3f465a]">{user.name}</p>
                    <p className="mt-1 text-sm text-[#8b93a6]">{user.email}</p>
                  </button>
                  <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[#a2a8b8]">
                    Quick actions for {user.role.label.toLowerCase()}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#eef1ff] px-3 py-1 text-xs font-medium text-[#646fe5]">
                    {user.role.label}
                  </span>
                  <span className="rounded-full bg-[#f7f1eb] px-3 py-1 text-xs font-medium text-[#866f61]">
                    {user.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => selectUser(user.id)}
                    className="rounded-full border border-[#dddff8] px-3 py-1 text-xs text-[#5f68f8]"
                  >
                    Edit
                  </button>
                  {user.status !== "ACTIVE" ? (
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => handleActivateUser(user.id)}
                      className="rounded-full border border-[#d7ecdc] px-3 py-1 text-xs text-[#3f9256] disabled:opacity-60"
                    >
                      Activate
                    </button>
                  ) : null}
                  {user.status !== "SUSPENDED" ? (
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => handleStatusAction(user.id, "suspend")}
                      className="rounded-full border border-[#f0dbcf] px-3 py-1 text-xs text-[#a86f56] disabled:opacity-60"
                    >
                      Suspend
                    </button>
                  ) : null}
                  {user.status !== "BANNED" ? (
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => handleStatusAction(user.id, "ban")}
                      className="rounded-full border border-[#f3d0cd] px-3 py-1 text-xs text-[#b55d57] disabled:opacity-60"
                    >
                      Ban
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
          {filteredUsers.length === 0 ? (
            <p className="rounded-[1.4rem] border border-dashed border-[#ece7e2] px-4 py-6 text-sm text-[#8b93a6]">
              No users matched this filter.
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-4">
        <form
          onSubmit={handleCreateUser}
          className="rounded-[1.8rem] border border-[#ece7e2] bg-white/88 p-5 shadow-[0_18px_50px_rgba(236,231,226,0.45)]"
        >
          <h2 className="text-lg font-semibold text-[#353c50]">Create user</h2>
          <div className="mt-4 space-y-3">
            <input
              value={formState.name}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="Full name"
              className="h-11 w-full rounded-2xl border border-[#ece7e2] bg-[#fffdfa] px-4 text-sm outline-none"
            />
            <input
              value={formState.email}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              placeholder="Email"
              className="h-11 w-full rounded-2xl border border-[#ece7e2] bg-[#fffdfa] px-4 text-sm outline-none"
            />
            <input
              value={formState.password}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              placeholder="Password"
              type="password"
              className="h-11 w-full rounded-2xl border border-[#ece7e2] bg-[#fffdfa] px-4 text-sm outline-none"
            />
            <select
              value={formState.roleKey}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  roleKey: event.target.value,
                }))
              }
              className="h-11 w-full rounded-2xl border border-[#ece7e2] bg-[#fffdfa] px-4 text-sm outline-none"
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="mt-4 inline-flex h-11 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#7178ff_0%,#5f68f8_100%)] px-5 text-sm font-medium text-white shadow-[0_10px_24px_rgba(95,104,248,0.24)] disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Create user"}
          </button>
        </form>

        <div className="rounded-[1.8rem] border border-[#ece7e2] bg-white/88 p-5 shadow-[0_18px_50px_rgba(236,231,226,0.45)]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[#353c50]">Edit user</h2>
            <span className="rounded-full border border-[#efe8e1] px-3 py-1 text-xs text-[#8b93a6]">
              {selectedUser ? selectedUser.role.label : "Selected"}
            </span>
          </div>
          <p className="mt-2 text-sm text-[#8b93a6]">
            User select kore tar profile, role, ar status update korun.
          </p>
          <div className="mt-4 space-y-3">
            <select
              value={selectedUserId}
              onChange={(event) => selectUser(event.target.value)}
              className="h-11 w-full rounded-2xl border border-[#d7daf8] bg-[#f8f8ff] px-4 text-sm font-medium text-[#4f5870] outline-none"
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} · {user.role.label} · {user.status}
                </option>
              ))}
            </select>

            {selectedUser ? (
              <div className="rounded-2xl border border-[#efe8e1] bg-[#fffdfa] px-4 py-3 text-sm text-[#6a7285]">
                <p className="font-medium text-[#3f465a]">
                  {selectedUser.name}
                </p>
                <p className="mt-1">{selectedUser.email}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.12em] text-[#9ca3b4]">
                  Current role: {selectedUser.role.label} · Current status:{" "}
                  {selectedUser.status}
                </p>
              </div>
            ) : null}

            <input
              value={editForm.name}
              onChange={(event) =>
                setEditForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="Full name"
              className="h-11 w-full rounded-2xl border border-[#ece7e2] bg-[#fffdfa] px-4 text-sm outline-none"
            />
            <input
              value={editForm.email}
              onChange={(event) =>
                setEditForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              placeholder="Email"
              className="h-11 w-full rounded-2xl border border-[#ece7e2] bg-[#fffdfa] px-4 text-sm outline-none"
            />
            <select
              value={editForm.roleKey}
              onChange={(event) =>
                setEditForm((current) => ({
                  ...current,
                  roleKey: event.target.value,
                }))
              }
              className="h-11 w-full rounded-2xl border border-[#ece7e2] bg-[#fffdfa] px-4 text-sm outline-none"
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <select
              value={editForm.status}
              onChange={(event) =>
                setEditForm((current) => ({
                  ...current,
                  status: event.target.value,
                }))
              }
              className="h-11 w-full rounded-2xl border border-[#ece7e2] bg-[#fffdfa] px-4 text-sm outline-none"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="BANNED">BANNED</option>
            </select>
          </div>
          <button
            type="button"
            disabled={!selectedUser || isSaving}
            onClick={handleUpdateUser}
            className="mt-4 inline-flex h-11 items-center justify-center rounded-2xl border border-[#d7daf8] bg-[#f2f4ff] px-5 text-sm font-medium text-[#5f68f8] disabled:opacity-60"
          >
            {selectedUser ? `Update ${selectedUser.name}` : "Save changes"}
          </button>
        </div>

        <div className="rounded-[1.8rem] border border-[#ece7e2] bg-white/88 p-5 shadow-[0_18px_50px_rgba(236,231,226,0.45)]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[#353c50]">
              Permission editor
            </h2>
            <span className="rounded-full border border-[#efe8e1] px-3 py-1 text-xs text-[#8b93a6]">
              Grant ceiling
            </span>
          </div>
          <p className="mt-2 text-sm text-[#8b93a6]">
            Only permissions the current actor already holds are editable.
          </p>
          <div className="mt-4 space-y-2">
            {selectedUser ? (
              grantablePermissions.map((permission) => (
                <label
                  key={permission}
                  className="flex items-center justify-between rounded-2xl border border-[#efe8e1] bg-[#fffdfa] px-4 py-3 text-sm text-[#525a6e]"
                >
                  <span>{permission}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(draftPermissions[permission])}
                    onChange={(event) =>
                      setDraftPermissions((current) => ({
                        ...current,
                        [permission]: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 accent-[#646fe5]"
                  />
                </label>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-[#efe8e1] px-4 py-5 text-sm text-[#8b93a6]">
                Select a user to edit permissions.
              </p>
            )}
          </div>
          <button
            type="button"
            disabled={!selectedUser || isSaving}
            onClick={handleSavePermissions}
            className="mt-4 inline-flex h-11 items-center justify-center rounded-2xl border border-[#d7daf8] bg-[#f2f4ff] px-5 text-sm font-medium text-[#5f68f8] disabled:opacity-60"
          >
            Save permissions
          </button>
        </div>
      </div>
    </div>
  );
}
