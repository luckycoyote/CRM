import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";

export default function App() {
  console.log("APP RENDERING");

  // Auth state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // App data
  const [leads, setLeads] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(false);

  // Attach supabase + track session
  useEffect(() => {
    // Optional: helpful for devtools
    window.supabase = supabase;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setAuthLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // Load leads whenever logged in
  useEffect(() => {
    if (!session) return;

    const load = async () => {
      setLeadsLoading(true);

      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase load error:", error);
        alert("Load failed: " + error.message);
      } else {
        setLeads(data ?? []);
      }

      setLeadsLoading(false);
    };

    load();
  }, [session]);

  const counts = useMemo(() => {
    const fundedCount = leads.filter((l) => l.funded).length;
    const activeCount = leads.filter((l) => !l.funded).length;
    const applicationsCount = leads.filter((l) => l.app && !l.funded).length;
    const ctcCount = leads.filter((l) => l.ctc && !l.funded).length;
    return { fundedCount, activeCount, applicationsCount, ctcCount };
  }, [leads]);

  const addClient = async () => {
    const name = prompt("Client name:");
    if (!name) return;

    const phone = prompt("Phone number:");
    const state = prompt("State (e.g. CA):");

    const { data, error } = await supabase
      .from("leads")
      .insert([
        {
          name,
          phone,
          state,
          quote: false,
          app: false,
          le: false,
          submit: false,
          processor: false,
          ctc: false,
          funded: false
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Insert error:", error);
      alert(error.message);
      return;
    }

    setLeads((prev) => [data, ...prev]);
  };

  const toggleStep = async (id, stepKey) => {
    const current = leads.find((l) => l.id === id);
    if (!current) return;

    const nextValue = !current[stepKey];

    // Optimistic update
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [stepKey]: nextValue } : l))
    );

    const { error } = await supabase
      .from("leads")
      .update({ [stepKey]: nextValue })
      .eq("id", id);

    if (error) {
      console.error("Update error:", error);
      alert("Failed to save: " + error.message);

      // rollback
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? { ...l, [stepKey]: !nextValue } : l))
      );
    }
  };

  const Metric = ({ label, value, subtitle }) => (
    <div
      style={{
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: 16,
        boxShadow: "0 4px 10px rgba(0,0,0,0.04)"
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.7, color: "#111827" }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: "#111827" }}>{value}</div>
      <div style={{ fontSize: 12, opacity: 0.6, color: "#111827" }}>{subtitle}</div>
    </div>
  );

  // ---------- UI (only AFTER hooks) ----------
  if (authLoading) return <div style={{ padding: 40 }}>Loading…</div>;

  if (!session) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f7fb", padding: 40, color: "#111" }}>
        <h1 style={{ fontSize: 28, marginBottom: 16 }}>Sign in</h1>

        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 14, padding: 20, maxWidth: 420 }}>
          <div style={{ display: "grid", gap: 10 }}>
            <input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
            />
            <input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ padding: 10, borderRadius: 10, border: "1px solid #e5e7eb" }}
            />

            <button
              onClick={async () => {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) alert(error.message);
              }}
              style={{ padding: "10px 16px", background: "#111827", color: "white", borderRadius: 10, border: "none", cursor: "pointer" }}
            >
              Sign In
            </button>

            <button
              onClick={async () => {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) alert(error.message);
                else alert("Check your email to confirm (if enabled).");
              }}
              style={{ padding: "10px 16px", background: "white", color: "#111827", borderRadius: 10, border: "1px solid #e5e7eb", cursor: "pointer" }}
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#f5f7fb", minHeight: "100vh", padding: 40, color: "#111827" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ marginBottom: 12, fontSize: 28 }}>Pipeline</h1>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={addClient}
            style={{ padding: "10px 16px", background: "#111827", color: "white", borderRadius: 10, border: "none", cursor: "pointer" }}
          >
            + Add Client
          </button>

          <button
            onClick={() => supabase.auth.signOut()}
            style={{ padding: "10px 16px", background: "white", color: "#111827", borderRadius: 10, border: "1px solid #e5e7eb", cursor: "pointer" }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
          marginBottom: 24
        }}
      >
        <Metric label="Active Clients" value={counts.activeCount} subtitle="In pipeline" />
        <Metric label="Applications" value={counts.applicationsCount} subtitle="App checked" />
        <Metric label="CTC" value={counts.ctcCount} subtitle="Clear to close" />
        <Metric label="Funded Loans" value={counts.fundedCount} subtitle="Completed" />
      </div>

      {leadsLoading && <div style={{ marginBottom: 12 }}>Loading leads…</div>}

      {/* Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 16
        }}
      >
        {leads.map((lead) => {
          const steps = [lead.quote, lead.app, lead.le, lead.submit, lead.processor, lead.ctc, lead.funded];
          const completed = steps.filter(Boolean).length;
          const progress = (completed / 7) * 100;
          const isFunded = !!lead.funded;

          const progressColor =
            completed === 7 ? "#16a34a" : completed >= 4 ? "#2563eb" : "#f59e0b";

          return (
            <div
              key={lead.id}
              style={{
                background: isFunded ? "#ecfdf5" : "white",
                borderRadius: 14,
                padding: 20,
                border: isFunded ? "2px solid #16a34a" : "1px solid #e5e7eb",
                boxShadow: "0 4px 10px rgba(0,0,0,0.04)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <h2 style={{ margin: 0, color: "#111827" }}>{lead.name}</h2>
                {isFunded && (
                  <span
                    style={{
                      background: "#16a34a",
                      color: "white",
                      padding: "4px 10px",
                      borderRadius: 999,
                      fontSize: 12
                    }}
                  >
                    Funded
                  </span>
                )}
              </div>

              <p style={{ marginTop: 8, color: "#111827" }}>
                📞 {lead.phone} · 📍 {lead.state}
              </p>

              <div style={{ margin: "16px 0" }}>
                <div
                  style={{
                    height: 8,
                    background: "#e5e7eb",
                    borderRadius: 4,
                    overflow: "hidden"
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${progress}%`,
                      background: progressColor,
                      transition: "width 0.3s ease"
                    }}
                  />
                </div>
                <small style={{ color: "#111827" }}>{completed} / 7 completed</small>
              </div>

              {[
                ["quote", "Quote"],
                ["app", "App"],
                ["le", "LE"],
                ["submit", "Submit"],
                ["processor", "Processor"],
                ["ctc", "CTC"],
                ["funded", "Funded"]
              ].map(([key, label]) => (
                <label
                  key={key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 6,
                    color: "#111827",
                    textDecoration: lead[key] ? "line-through" : "none"
                  }}
                >
                  <input
                    type="checkbox"
                    checked={!!lead[key]}
                    onChange={() => toggleStep(lead.id, key)}
                  />
                  {label}
                </label>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
