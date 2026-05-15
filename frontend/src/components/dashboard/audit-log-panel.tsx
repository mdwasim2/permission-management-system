"use client";

import { useEffect, useState } from "react";

type AuditLog = {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  createdAt: string;
  actor: {
    name: string;
    email: string;
    role: {
      label: string;
    };
  } | null;
  targetUser: {
    name: string;
    email: string;
  } | null;
};

type AuditLogPanelProps = {
  apiBaseUrl: string;
  enabled: boolean;
};

export function AuditLogPanel({ apiBaseUrl, enabled }: AuditLogPanelProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!enabled) {
      return;
    }

    async function loadLogs() {
      setIsLoading(true);
      setErrorMessage("");

      const response = await fetch(`${apiBaseUrl}/audit-logs`, {
        credentials: "include",
      });

      if (!response.ok) {
        setErrorMessage("Unable to load audit activity right now.");
        setIsLoading(false);
        return;
      }

      const data = (await response.json()) as { logs: AuditLog[] };
      setLogs(data.logs);
      setIsLoading(false);
    }

    loadLogs().catch(() => {
      setErrorMessage("Unable to load audit activity right now.");
      setIsLoading(false);
    });
  }, [apiBaseUrl, enabled]);

  if (!enabled) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="rounded-[1.6rem] border border-[#ece7e2] bg-white/85 px-5 py-8 text-sm text-[#798093]">
        Loading audit log...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="rounded-[1.6rem] border border-[#ffe0d5] bg-white px-5 py-8 text-sm text-[#c94f2d]">
        {errorMessage}
      </div>
    );
  }

  return (
    <div className="rounded-[1.8rem] border border-[#ece7e2] bg-white/88 p-5 shadow-[0_18px_50px_rgba(236,231,226,0.45)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#353c50]">Audit trail</h2>
          <p className="mt-1 text-sm text-[#8b93a6]">
            Append-only record of admin and manager actions.
          </p>
        </div>
        <span className="rounded-full border border-[#efe8e1] px-3 py-1 text-xs text-[#8b93a6]">
          {logs.length} events
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {logs.map((log) => (
          <div
            key={log.id}
            className="rounded-[1.4rem] border border-[#efe8e1] bg-[#fffdfa] px-4 py-4"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-[#3f465a]">{log.action}</p>
                <p className="mt-1 text-sm text-[#8b93a6]">
                  {log.actor?.name ?? "System"} •{" "}
                  {new Date(log.createdAt).toLocaleString()}
                </p>
              </div>
              <span className="rounded-full bg-[#eef1ff] px-3 py-1 text-xs font-medium text-[#646fe5]">
                {log.targetType}
              </span>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-[#f8f9fc] px-4 py-3 text-sm text-[#5a6275]">
                <p className="text-xs uppercase tracking-[0.14em] text-[#9ca3b4]">
                  Actor
                </p>
                <p className="mt-2">{log.actor?.email ?? "System"}</p>
              </div>
              <div className="rounded-2xl bg-[#f8f9fc] px-4 py-3 text-sm text-[#5a6275]">
                <p className="text-xs uppercase tracking-[0.14em] text-[#9ca3b4]">
                  Target
                </p>
                <p className="mt-2">
                  {log.targetUser?.email ?? log.targetId ?? "N/A"}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
