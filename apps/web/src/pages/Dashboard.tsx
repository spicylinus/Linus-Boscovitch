import { useEffect, useState } from "react";

type EmailLog = {
  id: string;
  fromAddress: string;
  subject: string | null;
  status: string;
  receivedAt: string;
  draftBody: string | null;
};

type Stats = {
  sent: number;
  pending: number;
  escalated: number;
  weeklyHandled: number;
  freeCreditsRemaining: number;
};

const STATUS_BADGE: Record<string, string> = {
  sent: "bg-green-100 text-green-800",
  pending_approval: "bg-yellow-100 text-yellow-800",
  draft: "bg-yellow-100 text-yellow-800",
  escalated: "bg-red-100 text-red-800",
  rejected: "bg-gray-100 text-gray-600",
};

export function Dashboard() {
  const [inbox, setInbox] = useState<EmailLog[]>([]);
  const [pending, setPending] = useState<EmailLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selected, setSelected] = useState<EmailLog | null>(null);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    const [inboxRes, pendingRes, statsRes] = await Promise.all([
      fetch("/dashboard/inbox").then(r => r.json()),
      fetch("/dashboard/pending-approvals").then(r => r.json()),
      fetch("/dashboard/stats").then(r => r.json()),
    ]);
    setInbox(inboxRes);
    setPending(pendingRes);
    setStats(statsRes);
  }

  async function approve(emailId: string, action: "approve" | "reject") {
    setApproving(true);
    await fetch(`/approve/${emailId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setApproving(false);
    setSelected(null);
    loadData();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">Linus Inbox</h1>
        <div className="flex gap-3">
          {stats && stats.freeCreditsRemaining > 0 && (
            <span className="text-sm text-gray-500">{stats.freeCreditsRemaining} free emails left</span>
          )}
          <a href="/billing/portal" className="text-sm text-blue-600 hover:underline">Billing</a>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {stats && (
          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Sent this week", value: stats.weeklyHandled, color: "text-green-600" },
              { label: "Pending approval", value: stats.pending, color: "text-yellow-600" },
              { label: "Escalated", value: stats.escalated, color: "text-red-600" },
              { label: "Total handled", value: stats.sent, color: "text-blue-600" },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-sm text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="lg:col-span-2 space-y-4">
          {pending.length > 0 && (
            <div>
              <h2 className="font-semibold mb-3 text-yellow-700">⏳ Needs your approval ({pending.length})</h2>
              <div className="space-y-2">
                {pending.map(email => (
                  <button key={email.id} onClick={() => setSelected(email)}
                    className="w-full text-left bg-yellow-50 border border-yellow-200 rounded-xl p-4 hover:bg-yellow-100 transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-sm">{email.fromAddress}</div>
                        <div className="text-sm text-gray-600 mt-0.5">{email.subject ?? "(no subject)"}</div>
                      </div>
                      <span className="text-xs text-gray-400 ml-4 whitespace-nowrap">
                        {new Date(email.receivedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="font-semibold mb-3 text-gray-700">📬 All emails</h2>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {inbox.length === 0 ? (
                <div className="p-8 text-center text-gray-400">No emails yet. Linus is watching your inbox.</div>
              ) : (
                inbox.map((email, i) => (
                  <button key={email.id} onClick={() => setSelected(email)}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition ${i > 0 ? "border-t" : ""}`}>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{email.fromAddress}</div>
                      <div className="text-sm text-gray-500 truncate">{email.subject ?? "(no subject)"}</div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[email.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {email.status.replace("_", " ")}
                    </span>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {new Date(email.receivedAt).toLocaleDateString()}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {selected ? (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-medium text-sm">{selected.fromAddress}</div>
                  <div className="text-sm text-gray-600">{selected.subject}</div>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
              </div>
              {selected.draftBody && (
                <>
                  <div className="text-xs font-semibold text-gray-500 mb-2">AI DRAFT REPLY</div>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap">{selected.draftBody}</div>
                  {(selected.status === "pending_approval" || selected.status === "draft") && (
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => approve(selected.id, "approve")} disabled={approving}
                        className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
                        ✓ Send
                      </button>
                      <button onClick={() => approve(selected.id, "reject")} disabled={approving}
                        className="flex-1 bg-red-100 text-red-700 py-2 rounded-lg text-sm font-semibold hover:bg-red-200 disabled:opacity-50">
                        ✗ Reject
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-5 text-center text-gray-400 text-sm">
              Select an email to review
            </div>
          )}

          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <h3 className="font-semibold text-blue-800 text-sm mb-1">Reservations add-on</h3>
            <p className="text-blue-700 text-xs mb-3">Auto-confirm bookings and send reminders for just $1.99/mo.</p>
            <button onClick={() => fetch("/billing/addon/reservations", { method: "POST" })}
              className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700">
              Enable — +$1.99/mo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
