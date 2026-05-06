import { useState, useEffect } from "react";

const STEPS = ["Business Info", "Connect Gmail", "Your Voice", "Test Email"] as const;
const STEP_KEYS = ["business_info", "gmail_connect", "voice_setup", "test_email"] as const;

const BUSINESS_TYPES = ["Restaurant", "Salon / Spa", "Plumber / Trades", "Consultant", "Retail Shop", "Other"];

export function Onboard() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ businessName: "", businessType: "", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
  const [voice, setVoice] = useState("");
  const [loading, setLoading] = useState(true);
  const [showUpsell, setShowUpsell] = useState(false);

  // On mount: check URL param (set by Gmail OAuth callback) and fetch server state
  useEffect(() => {
    async function syncStep() {
      const params = new URLSearchParams(window.location.search);
      const urlStep = params.get("step");

      const res = await fetch("/onboard/status");
      const state = res.ok ? await res.json() : null;

      if (state?.completedAt) {
        setShowUpsell(true);
      } else if (urlStep) {
        const idx = STEP_KEYS.indexOf(urlStep as typeof STEP_KEYS[number]);
        setStep(idx >= 0 ? idx : 0);
      } else if (state?.step) {
        const idx = STEP_KEYS.indexOf(state.step as typeof STEP_KEYS[number]);
        setStep(idx >= 0 ? idx : 0);
      }

      if (state?.businessName) setForm(f => ({ ...f, businessName: state.businessName }));
      if (state?.voiceDescription) setVoice(state.voiceDescription);
      setLoading(false);
    }
    syncStep();
  }, []);

  async function submitBusinessInfo() {
    setLoading(true);
    await fetch("/onboard/business-info", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    setStep(1);
  }

  async function submitVoice() {
    setLoading(true);
    await fetch("/onboard/voice-setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voiceDescription: voice }),
    });
    setLoading(false);
    setStep(3);
  }

  async function sendTestEmail() {
    setLoading(true);
    await fetch("/onboard/test-email", { method: "POST" });
    setLoading(false);
    setShowUpsell(true);
  }

  async function enableReservations() {
    await fetch("/billing/addon/reservations", { method: "POST" });
    window.location.href = "/dashboard";
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 animate-pulse">Loading…</div>
      </div>
    );
  }

  if (showUpsell) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">📅</div>
          <h2 className="text-2xl font-bold mb-2">Do you take reservations?</h2>
          <p className="text-gray-600 mb-6">Add automatic booking confirmations and reminders for just <strong>$1.99/month</strong>.</p>
          <button onClick={enableReservations} className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold mb-3 hover:bg-blue-700">
            Yes, enable reservations — +$1.99/mo
          </button>
          <button onClick={() => window.location.href = "/dashboard"} className="text-gray-500 text-sm hover:underline">
            No thanks, continue to dashboard →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full">
        <div className="flex gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className={`flex-1 h-1.5 rounded-full ${i <= step ? "bg-blue-600" : "bg-gray-200"}`} />
          ))}
        </div>
        <h1 className="text-xl font-bold mb-1">{STEPS[step]}</h1>

        {step === 0 && (
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">Business name</label>
              <input value={form.businessName} onChange={e => setForm({ ...form, businessName: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Joe's Plumbing" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Business type</label>
              <select value={form.businessType} onChange={e => setForm({ ...form, businessType: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select a type…</option>
                {BUSINESS_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <button onClick={submitBusinessInfo} disabled={!form.businessName || !form.businessType || loading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50">
              {loading ? "Saving…" : "Continue →"}
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="mt-4 space-y-4">
            <p className="text-gray-600">Connect your Gmail so Linus can read and reply to customer emails on your behalf.</p>
            <a href="/onboard/gmail/connect"
              className="block w-full bg-red-500 text-white py-3 rounded-xl font-semibold text-center hover:bg-red-600">
              Connect Gmail Account
            </a>
            <p className="text-xs text-gray-400 text-center">We only read inbox messages. We never store email passwords.</p>
          </div>
        )}

        {step === 2 && (
          <div className="mt-4 space-y-4">
            <p className="text-gray-600">Describe how your business communicates with customers. Linus will match your tone.</p>
            <textarea value={voice} onChange={e => setVoice(e.target.value)} rows={4}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Warm and friendly but professional. We use first names. We're a family business and want customers to feel welcome." />
            <button onClick={submitVoice} disabled={voice.length < 10 || loading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50">
              {loading ? "Saving…" : "Continue →"}
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="mt-4 space-y-4">
            <p className="text-gray-600">We'll send a test customer email to your inbox so you can see Linus in action.</p>
            <button onClick={sendTestEmail} disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50">
              {loading ? "Sending test…" : "Send test email"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
