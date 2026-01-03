import { useEffect, useState } from "react";

const initialLeads = [
  { id: 1, name: "John Doe", phone: "555-123-4567", state: "CA" },
  { id: 2, name: "Jane Smith", phone: "555-987-6543", state: "FL" },
  { id: 3, name: "Mike Johnson", phone: "555-222-3333", state: "TX" }
];

export default function App() {
  const [leads, setLeads] = useState(() => {
    const saved = localStorage.getItem("crm_leads");
    if (saved) return JSON.parse(saved);

    return initialLeads.map((lead) => ({
      ...lead,
      quote: false,
      app: false,
      le: false,
      submit: false,
      processor: false,
      ctc: false,
      funded: false
    }));
  });

  useEffect(() => {
  localStorage.setItem("crm_leads", JSON.stringify(leads));
}, [leads]);

  const addClient = () => {
  const name = prompt("Client name:");
  if (!name) return;

  const phone = prompt("Phone number:");
  const state = prompt("State (e.g. CA):");

  setLeads((prev) => [
    {
      id: Date.now(),
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
    },
    ...prev
  ]);
};

const toggleStep = (id, step) => {
  setLeads((prev) =>
    prev.map((lead) =>
      lead.id === id ? { ...lead, [step]: !lead[step] } : lead
    )
  );
};


  return (
  <div
    style={{
      background: "#f5f7fb",
      minHeight: "100vh",
      padding: 40,
      color: "#000000"
    }}
  >
    <h1 style={{ marginBottom: 12, fontSize: 28, color: "#000000" }}>
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
    {(() => {
      const fundedCount = leads.filter((l) => l.funded).length;
      const activeCount = leads.filter((l) => !l.funded).length;
      const applicationsCount = leads.filter((l) => l.app && !l.funded).length;
      const ctcCount = leads.filter((l) => l.ctc && !l.funded).length;

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
          <div style={{ fontSize: 12, opacity: 0.7 }}>{label}</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>{subtitle}</div>
        </div>
      );

      return (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12,
            marginBottom: 24
          }}
        >
          <Metric label="Active Clients" value={activeCount} subtitle="In pipeline" />
          <Metric label="Applications" value={applicationsCount} subtitle="App checked" />
          <Metric label="CTC" value={ctcCount} subtitle="Clear to close" />
          <Metric label="Funded Loans" value={fundedCount} subtitle="Completed" />
        </div>
      );
    })()}

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
        const isFunded = lead.funded;

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
              <h2 style={{ margin: 0 }}>{lead.name}</h2>
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

            <p style={{ marginTop: 8 }}>
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
              <small>
                {completed} / 7 completed
              </small>
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
                  textDecoration: lead[key] ? "line-through" : "none"
                }}
              >
                <input
                  type="checkbox"
                  checked={lead[key]}
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
