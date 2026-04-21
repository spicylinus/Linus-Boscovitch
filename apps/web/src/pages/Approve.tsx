import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

type EmailLog = {
  id: string;
  fromAddress: string;
  subject: string | null;
  draftBody: string | null;
  status: string;
};

export function Approve() {
  const { token } = useParams<{ token: string }>();
  const [email, setEmail] = useState<EmailLog | null>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState<"approved" | "rejected" | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/approve/magic/${token}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(setEmail)
      .catch(() => setError("This approval link has expired or is invalid."));
  }, [token]);

  async function decide(action: "approve" | "reject") {
    setLoading(true);
    const res = await fetch(`/approve/magic/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setLoading(false);
    if (res.ok) setDone(action);
    else setError("Something went wrong. Please try again.");
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow p-8 max-w-sm w-full text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow p-8 max-w-sm w-full text-center">
          <div className="text-5xl mb-4">{done === "approved" ? "✅" : "✗"}</div>
          <h2 className="text-xl font-bold mb-2">{done === "approved" ? "Reply sent!" : "Email rejected"}</h2>
          <p className="text-gray-500 text-sm">{done === "approved" ? "The customer has been replied to." : "The draft has been discarded."}</p>
        </div>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 animate-pulse">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-lg w-full overflow-hidden">
        <div className="bg-blue-600 px-6 py-4 text-white">
          <div className="text-xs font-medium uppercase tracking-wide opacity-75 mb-1">Email from customer</div>
          <div className="font-semibold">{email.fromAddress}</div>
          <div className="text-sm opacity-80">{email.subject}</div>
        </div>
        <div className="p-6">
          <div className="text-xs font-semibold text-gray-500 mb-2">AI DRAFT REPLY</div>
          <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {email.draftBody ?? "No draft available."}
          </div>
          {email.status !== "sent" && email.status !== "rejected" && (
            <div className="flex gap-3 mt-6">
              <button onClick={() => decide("approve")} disabled={loading}
                className="flex-1 bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 active:scale-95 transition disabled:opacity-50">
                ✓ Send Reply
              </button>
              <button onClick={() => decide("reject")} disabled={loading}
                className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-bold text-lg hover:bg-gray-200 active:scale-95 transition disabled:opacity-50">
                ✗ Reject
              </button>
            </div>
          )}
          {(email.status === "sent" || email.status === "rejected") && (
            <div className="mt-4 text-center text-gray-500 text-sm">This email has already been {email.status}.</div>
          )}
        </div>
      </div>
    </div>
  );
}
