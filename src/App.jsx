import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabaseClient";

export default function App() {
  // Load leads from Supabase on page load
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase load error:", error);
        alert("Supabase load error: " + error.message);
        return;
      }

      setLeads(data ?? []);
    };

    load();
  }, []);

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

    const phone = prompt("Phone number:") || "";
    const state = prompt("State (e.g. CA):") || "";

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
      console.error("Supabase insert error:", error);
      alert("Failed to add client: " + error.message);
      return;
    }

    setLeads((prev) => [data, ...prev]);
  };

  const toggleStep = async (id, stepKey) => {
    // Find current value
    const current = leads.find((l) => l.id === id);
    if (!current) return;

    const nextValue = !current[stepKey];

    // Optimistic UI update
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [stepKey]: nextValue } : l))
    );

    // Persist to Supabase
    const { error } = await supabase
      .from("leads")
      .update({ [stepKey]: nextValue })
      .eq("id", id);

    if (error) {
      console.error("Supabase update error:", error);
      alert("Failed to save: " + error.message);

      // rollback UI on error
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

  return (
    <div
      style={{
        background: "#f5f7fb",
        minHeight: "100vh",
        padding: 40,
        color: "#111827"
      }}
    >
      <h1 style={{ marginBottom: 12, fontSize: 28, color: "#111827" }}>
        Pipeline
      </h1>

      <button
        onClick={addClient}
        style={{
          marginBottom: 24,
          padding: "10px 16px",
          background: "#111827",
          color: "white",
          borderRadius: 8,
          border: "none",
          cursor: "pointer"
        }}
      >
        + Add Client
      </button>

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

      {/* Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 16
        }}
      >
        {leads.map((lead) => {
          const steps = [
            lead.quote,
            lead.app,
            lead.le,
            lead.submit,
            lead.processor,
            lead.ctc,
            lead.funded
          ];
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
