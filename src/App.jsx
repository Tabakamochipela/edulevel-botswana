window.storage = {
  get: async (k) => { const v = localStorage.getItem(k); return v ? { value: v } : null; },
  set: async (k, v) => localStorage.setItem(k, v),
  delete: async (k) => localStorage.removeItem(k),
};
import { useState, useEffect, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from "recharts";

// ─── Data ─────────────────────────────────────────────────────────────────────

const SUBJECTS = [
  { id: "math",        name: "Mathematics",      icon: "ti-calculator",    color: "#185FA5", light: "#E6F1FB", desc: "Algebra, Geometry, Statistics & Probability" },
  { id: "english",     name: "English Language", icon: "ti-book-2",        color: "#534AB7", light: "#EEEDFE", desc: "Grammar, Comprehension, Writing Skills" },
  { id: "science",     name: "Science",          icon: "ti-flask",         color: "#0F6E56", light: "#E1F5EE", desc: "Physics, Chemistry & Biology" },
  { id: "setswana",    name: "Setswana",         icon: "ti-world",         color: "#854F0B", light: "#FAEEDA", desc: "Dipuo, Mabui, Puo ya Setswana" },
  { id: "computer",    name: "Computer Studies", icon: "ti-device-laptop", color: "#3C3489", light: "#EEEDFE", desc: "Programming, Networks & Databases" },
  { id: "agriculture", name: "Agriculture",      icon: "ti-plant-2",       color: "#3B6D11", light: "#EAF3DE", desc: "Crops, Livestock & Soil Science" },
];

const LEVELS = [
  { id: "basic",        name: "Basic",        fullName: "Basic Competency",        desc: "Core foundational concepts and skills",         color: "#3B6D11", light: "#EAF3DE" },
  { id: "intermediate", name: "Intermediate", fullName: "Intermediate Competency", desc: "Standard curriculum depth and application",     color: "#854F0B", light: "#FAEEDA" },
  { id: "advanced",     name: "Advanced",     fullName: "Advanced Competency",     desc: "Exam-ready analytical and critical thinking",   color: "#185FA5", light: "#E6F1FB" },
];

const SCHOOLS = [
  "Gaborone Secondary School", "Maru-a-Pula School", "Legae Academy",
  "Naledi Senior Secondary", "Ramotswa Secondary School",
  "Maruapula Unified School", "Francistown College", "Lobatse Senior Secondary",
  "Selebi-Phikwe Senior Secondary", "Other"
];

const CLASSES = ["Form 1", "Form 2", "Form 3 (JC Year)", "Form 4", "Form 5 (BGCSE Year)"];

const NAV_ITEMS = [
  { id: "dashboard",   icon: "ti-layout-dashboard", label: "Dashboard"       },
  { id: "subjects",    icon: "ti-books",             label: "Take Assessment" },
  { id: "results",     icon: "ti-clipboard-list",    label: "My Results"      },
  { id: "analytics",   icon: "ti-trending-up",       label: "Analytics"       },
  { id: "certificate", icon: "ti-certificate",       label: "Certificates"    },
];

function getCompetency(score) {
  if (score < 40) return { label: "Needs Improvement",       color: "#A32D2D", bg: "#FCEBEB", icon: "ti-alert-triangle", grade: "D", tip: "More practice needed. Review core concepts and try again." };
  if (score < 60) return { label: "Basic Competency",        color: "#3B6D11", bg: "#EAF3DE", icon: "ti-certificate",    grade: "C", tip: "Basic competency reached. Keep studying to move up." };
  if (score < 80) return { label: "Intermediate Competency", color: "#854F0B", bg: "#FAEEDA", icon: "ti-star",           grade: "B", tip: "Good work! Focus on weak topics to reach Advanced." };
  return              { label: "Advanced Competency",        color: "#185FA5", bg: "#E6F1FB", icon: "ti-trophy",         grade: "A", tip: "Excellent! You are exam-ready for this subject." };
}

function fmtDate(ts) {
  return new Date(ts).toLocaleDateString("en-BW", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen]           = useState("loading");
  const [student, setStudent]         = useState(null);
  const [nav, setNav]                 = useState("dashboard");
  const [quizConfig, setQuizConfig]   = useState(null);
  const [results, setResults]         = useState([]);
  const [activeResult, setActiveResult] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const s = await window.storage.get("el_student");
        if (s) { setStudent(JSON.parse(s.value)); setScreen("app"); return; }
      } catch {}
      setScreen("landing");
    })();
    (async () => {
      try {
        const r = await window.storage.get("el_results");
        if (r) setResults(JSON.parse(r.value));
      } catch {}
    })();
  }, []);

  const register = async (data) => {
    setStudent(data); setScreen("app");
    try { await window.storage.set("el_student", JSON.stringify(data)); } catch {}
  };

  const logout = async () => {
    setStudent(null); setScreen("landing"); setNav("dashboard");
    try { await window.storage.delete("el_student"); } catch {}
  };

  const addResult = async (r) => {
    const updated = [r, ...results].slice(0, 50);
    setResults(updated); setActiveResult(r);
    try { await window.storage.set("el_results", JSON.stringify(updated)); } catch {}
  };

  if (screen === "loading") return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 480, fontFamily: "var(--font-sans)", flexDirection: "column", gap: 14 }}>
      <div style={{ width: 36, height: 36, border: "3px solid #E6F1FB", borderTopColor: "#185FA5", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
      <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Loading EduLevel Botswana...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (screen === "landing") return <Landing onStart={() => setScreen("auth")} />;
  if (screen === "auth")    return <Auth onDone={register} onBack={() => setScreen("landing")} />;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-background-tertiary)", fontFamily: "var(--font-sans)" }}>
      <Sidebar nav={nav} onNav={n => setNav(n)} student={student} onLogout={logout} />
      <div style={{ flex: 1, overflow: "auto", padding: "2rem", minWidth: 0 }}>
        {nav === "dashboard"   && <Dashboard student={student} results={results} onNewQuiz={() => setNav("subjects")} onViewResult={r => { setActiveResult(r); setNav("results"); }} />}
        {nav === "subjects"    && <Subjects  onStart={cfg => { setQuizConfig(cfg); setNav("quiz"); }} />}
        {nav === "quiz"        && quizConfig && <Quiz config={quizConfig} student={student} onDone={r => { addResult(r); setNav("results"); }} onCancel={() => setNav("subjects")} />}
        {nav === "results"     && <Results   results={results} active={activeResult} onSelect={r => setActiveResult(r)} onCert={r => { setActiveResult(r); setNav("certificate"); }} />}
        {nav === "certificate" && activeResult && <Certificate result={activeResult} student={student} onBack={() => setNav("results")} />}
        {nav === "analytics"   && <Analytics results={results} />}
      </div>
    </div>
  );
}

// ─── Landing ──────────────────────────────────────────────────────────────────

function Landing({ onStart }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0A2F5A", fontFamily: "var(--font-sans)", display: "flex", flexDirection: "column" }}>
      {/* Hero */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 2rem 3rem", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.08)", borderRadius: 14, padding: "12px 20px", marginBottom: "3rem", border: "0.5px solid rgba(255,255,255,0.1)" }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(123,200,245,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <i className="ti ti-school" style={{ fontSize: 20, color: "#7BC8F5" }} />
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "white", letterSpacing: "-0.3px" }}>EduLevel Botswana</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: 2 }}>STUDENT COMPETENCY EVALUATION SYSTEM</div>
          </div>
        </div>

        <h1 style={{ fontSize: 50, fontWeight: 800, color: "white", margin: "0 0 1.25rem", lineHeight: 1.08, letterSpacing: "-2px", maxWidth: 580 }}>
          Know Your Academic<br />Standing.{" "}
          <span style={{ color: "#7BC8F5" }}>Before the Exam.</span>
        </h1>

        <p style={{ fontSize: 17, color: "rgba(255,255,255,0.58)", margin: "0 0 3rem", maxWidth: 460, lineHeight: 1.75 }}>
          AI-generated assessments aligned to Botswana's BGCSE and Junior Certificate curriculum. Identify gaps, track progress, earn competency certificates.
        </p>

        <button onClick={onStart}
          style={{ background: "white", color: "#0A2F5A", border: "none", borderRadius: 12, padding: "16px 48px", fontSize: 16, fontWeight: 700, cursor: "pointer", letterSpacing: "-0.4px", transition: "opacity 0.15s, transform 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.opacity = "0.92"; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "none"; }}>
          Get Started Free →
        </button>

        <div style={{ display: "flex", gap: "3.5rem", marginTop: "4rem" }}>
          {[["6","Subjects"],["3","Levels"],["AI","Questions"],["∞","Free Attempts"]].map(([n, l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: "white", letterSpacing: "-1px" }}>{n}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1.2, marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderTop: "0.5px solid rgba(255,255,255,0.08)" }}>
        {[
          ["ti-brain",        "AI-Powered Questions",  "Fresh, curriculum-aligned questions every session"],
          ["ti-certificate",  "Earn Certificates",     "Formal competency certificates you can print"],
          ["ti-chart-line",   "Track Progress",        "Analytics dashboard showing your improvement"],
        ].map(([icon, title, desc], i) => (
          <div key={title} style={{ padding: "1.75rem 1.5rem", borderRight: i < 2 ? "0.5px solid rgba(255,255,255,0.07)" : "none" }}>
            <i className={`ti ${icon}`} style={{ fontSize: 22, color: "#7BC8F5", display: "block", marginBottom: "0.75rem" }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: "white", marginBottom: "0.4rem" }}>{title}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", lineHeight: 1.6 }}>{desc}</div>
          </div>
        ))}
      </div>

      {/* Dev credit */}
      <div style={{ padding: "0.75rem 1.5rem", borderTop: "0.5px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>Developed by <strong style={{ color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>Tabaka Mochipela</strong> · MSc Digital Forensics & Information Systems, University of Botswana</span>
      </div>
    </div>
  );
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

function Auth({ onDone, onBack }) {
  const [form, setForm]   = useState({ name: "", school: SCHOOLS[0], form: CLASSES[2], subjects: [] });
  const [error, setError] = useState("");

  const toggle = id => setForm(f => ({
    ...f, subjects: f.subjects.includes(id) ? f.subjects.filter(s => s !== id) : [...f.subjects, id]
  }));

  const submit = () => {
    if (!form.name.trim())         return setError("Please enter your full name.");
    if (form.subjects.length === 0) return setError("Please select at least one subject.");
    onDone({ ...form, id: Date.now(), joined: Date.now() });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F0F4F8", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", fontFamily: "var(--font-sans)" }}>
      <div style={{ background: "white", borderRadius: 20, border: "0.5px solid var(--color-border-tertiary)", padding: "2.5rem", width: "100%", maxWidth: 520, boxSizing: "border-box" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)", marginBottom: "1.5rem", padding: 0, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
          <i className="ti ti-arrow-left" /> Back
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1.75rem" }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: "#E6F1FB", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <i className="ti ti-user-plus" style={{ fontSize: 20, color: "#185FA5" }} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: "-0.4px" }}>Create your profile</h2>
            <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: 12 }}>Set up your student account to begin</p>
          </div>
        </div>

        <div style={{ marginBottom: "1.25rem" }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", display: "block", marginBottom: 6 }}>Full Name</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} onKeyDown={e => e.key === "Enter" && submit()} placeholder="e.g. Kagiso Sithole" style={{ width: "100%", boxSizing: "border-box" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: "1.25rem" }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", display: "block", marginBottom: 6 }}>School</label>
            <select value={form.school} onChange={e => setForm(f => ({ ...f, school: e.target.value }))} style={{ width: "100%" }}>
              {SCHOOLS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", display: "block", marginBottom: 6 }}>Class / Form</label>
            <select value={form.form} onChange={e => setForm(f => ({ ...f, form: e.target.value }))} style={{ width: "100%" }}>
              {CLASSES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", display: "block", marginBottom: 8 }}>Subjects you study</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {SUBJECTS.map(s => {
              const sel = form.subjects.includes(s.id);
              return (
                <div key={s.id} onClick={() => toggle(s.id)} style={{ padding: "10px 12px", borderRadius: 9, border: `1.5px solid ${sel ? s.color : "var(--color-border-tertiary)"}`, background: sel ? s.light : "white", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all 0.12s" }}>
                  <i className={`ti ${s.icon}`} style={{ fontSize: 15, color: sel ? s.color : "var(--color-text-secondary)" }} />
                  <span style={{ fontSize: 12, fontWeight: sel ? 600 : 400, color: sel ? s.color : "var(--color-text-primary)" }}>{s.name}</span>
                  {sel && <i className="ti ti-check" style={{ fontSize: 12, color: s.color, marginLeft: "auto" }} />}
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div style={{ color: "#A32D2D", background: "#FCEBEB", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: "1rem", border: "0.5px solid #F09595", display: "flex", alignItems: "center", gap: 8 }}>
            <i className="ti ti-alert-circle" style={{ fontSize: 14, flexShrink: 0 }} /> {error}
          </div>
        )}

        <button onClick={submit} style={{ width: "100%", background: "#0A2F5A", color: "white", border: "none", borderRadius: 11, padding: "14px", fontSize: 15, fontWeight: 700, cursor: "pointer", letterSpacing: "-0.3px", transition: "opacity 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.88"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
          Start Learning →
        </button>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({ nav, onNav, student, onLogout }) {
  const initials = student?.name?.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "ST";
  return (
    <div style={{ width: 218, background: "#0A2F5A", display: "flex", flexDirection: "column", flexShrink: 0, minHeight: "100vh" }}>
      <div style={{ padding: "1.5rem 1.25rem 1.25rem", borderBottom: "0.5px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(123,200,245,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <i className="ti ti-school" style={{ fontSize: 17, color: "#7BC8F5" }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "white", letterSpacing: "-0.3px" }}>EduLevel BW</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: 1.2 }}>COMPETENCY SYSTEM</div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: "0.75rem" }}>
        {NAV_ITEMS.map(item => {
          const active = nav === item.id || (nav === "quiz" && item.id === "subjects");
          return (
            <div key={item.id} onClick={() => onNav(item.id)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, marginBottom: 2, cursor: "pointer", background: active ? "rgba(255,255,255,0.11)" : "transparent", color: active ? "white" : "rgba(255,255,255,0.45)", transition: "all 0.12s", borderLeft: active ? "2px solid #7BC8F5" : "2px solid transparent" }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.45)"; } }}>
              <i className={`ti ${item.icon}`} style={{ fontSize: 16 }} />
              <span style={{ fontSize: 13, fontWeight: active ? 600 : 400 }}>{item.label}</span>
            </div>
          );
        })}
      </nav>

      <div style={{ padding: "1rem 1.25rem", borderTop: "0.5px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(123,200,245,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#7BC8F5" }}>{initials}</span>
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{student?.name}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{student?.form}</div>
          </div>
        </div>
        <div onClick={onLogout} style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer", color: "rgba(255,255,255,0.35)", fontSize: 12, transition: "color 0.12s", padding: "4px 0" }}
          onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.65)"}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.35)"}>
          <i className="ti ti-logout" style={{ fontSize: 13 }} /> Sign out
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard({ student, results, onNewQuiz, onViewResult }) {
  const avg  = results.length ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : null;
  const best = results.length ? Math.max(...results.map(r => r.score)) : null;
  const comp = avg !== null ? getCompetency(avg) : null;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: "0 0 0.25rem", fontSize: 26, fontWeight: 700, color: "var(--color-text-primary)", letterSpacing: "-0.5px" }}>
          {greeting}, {student?.name?.split(" ")[0]} 👋
        </h1>
        <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: 13 }}>{student?.school} · {student?.form}</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: "1.5rem" }}>
        <StatCard label="Assessments Taken" value={results.length || "—"} icon="ti-clipboard-check" color="#185FA5" />
        <StatCard label="Average Score"      value={avg  !== null ? `${avg}%`  : "—"} icon="ti-chart-line"    color="#0F6E56" />
        <StatCard label="Personal Best"      value={best !== null ? `${best}%` : "—"} icon="ti-trophy"        color="#854F0B" />
      </div>

      {/* Competency band */}
      {comp && (
        <div style={{ background: comp.bg, border: `1px solid ${comp.color}22`, borderRadius: 14, padding: "1.25rem 1.5rem", marginBottom: "1.75rem", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: comp.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <i className={`ti ${comp.icon}`} style={{ fontSize: 22, color: "white" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: comp.color, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>Overall Competency Standing</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: comp.color }}>{comp.label}</div>
            <div style={{ fontSize: 12, color: comp.color, opacity: 0.7, marginTop: 2 }}>{comp.tip}</div>
          </div>
          <button onClick={onNewQuiz} style={{ background: comp.color, color: "white", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0, transition: "opacity 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
            + New Assessment
          </button>
        </div>
      )}

      {/* Empty state */}
      {results.length === 0 ? (
        <div style={{ background: "white", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 18, padding: "3.5rem", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "#E6F1FB", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
            <i className="ti ti-clipboard-text" style={{ fontSize: 30, color: "#185FA5" }} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: "0.5rem" }}>Ready to assess yourself?</div>
          <div style={{ color: "var(--color-text-secondary)", fontSize: 14, marginBottom: "2rem", maxWidth: 320, margin: "0 auto 2rem" }}>
            Take your first AI-powered competency test to discover your academic standing
          </div>
          <button onClick={onNewQuiz} style={{ background: "#0A2F5A", color: "white", border: "none", borderRadius: 10, padding: "13px 32px", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "opacity 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
            Start First Assessment →
          </button>
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.9rem" }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "var(--color-text-primary)" }}>Recent Assessments</h2>
            <button onClick={onNewQuiz} style={{ background: "#0A2F5A", color: "white", border: "none", borderRadius: 8, padding: "7px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ New</button>
          </div>
          <div style={{ background: "white", borderRadius: 14, border: "0.5px solid var(--color-border-tertiary)", overflow: "hidden" }}>
            {results.slice(0, 7).map((r, i, arr) => {
              const c   = getCompetency(r.score);
              const sub = SUBJECTS.find(s => s.id === r.subjectId);
              return (
                <div key={r.id} onClick={() => onViewResult(r)}
                  style={{ display: "flex", alignItems: "center", gap: 14, padding: "0.9rem 1.25rem", borderBottom: i < arr.length - 1 ? "0.5px solid var(--color-border-tertiary)" : "none", cursor: "pointer", transition: "background 0.1s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--color-background-secondary)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <div style={{ width: 38, height: 38, borderRadius: 9, background: sub?.light, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <i className={`ti ${sub?.icon || "ti-book"}`} style={{ fontSize: 17, color: sub?.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{r.subjectName}</div>
                    <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{r.level} · {fmtDate(r.timestamp)}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: c.color }}>{r.score}%</div>
                    <div style={{ fontSize: 10, color: c.color, background: c.bg, borderRadius: 20, padding: "2px 8px", display: "inline-block", marginTop: 2 }}>{c.label}</div>
                  </div>
                  <i className="ti ti-chevron-right" style={{ fontSize: 14, color: "var(--color-text-tertiary)", flexShrink: 0 }} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Subjects enrolled */}
      {student?.subjects?.length > 0 && (
        <div style={{ marginTop: "1.75rem" }}>
          <h2 style={{ margin: "0 0 0.9rem", fontSize: 15, fontWeight: 600 }}>Enrolled Subjects</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {student.subjects.map(id => {
              const s = SUBJECTS.find(x => x.id === id);
              if (!s) return null;
              return (
                <div key={id} style={{ display: "flex", alignItems: "center", gap: 7, background: s.light, borderRadius: 20, padding: "6px 14px", border: `0.5px solid ${s.color}30` }}>
                  <i className={`ti ${s.icon}`} style={{ fontSize: 13, color: s.color }} />
                  <span style={{ fontSize: 12, fontWeight: 500, color: s.color }}>{s.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div style={{ background: "white", borderRadius: 14, border: "0.5px solid var(--color-border-tertiary)", padding: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <span style={{ fontSize: 11, color: "var(--color-text-secondary)", fontWeight: 500, lineHeight: 1.4 }}>{label}</span>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}14`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <i className={`ti ${icon}`} style={{ fontSize: 15, color }} />
        </div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "var(--color-text-primary)", letterSpacing: "-0.5px" }}>{value}</div>
    </div>
  );
}

// ─── Subjects Screen ───────────────────────────────────────────────────────────

function Subjects({ onStart }) {
  const [subject, setSubject] = useState(null);

  if (!subject) return (
    <div>
      <h1 style={{ margin: "0 0 0.5rem", fontSize: 22, fontWeight: 700, letterSpacing: "-0.4px" }}>Choose a Subject</h1>
      <p style={{ margin: "0 0 1.75rem", color: "var(--color-text-secondary)", fontSize: 13 }}>Select the subject you want to assess your competency in</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {SUBJECTS.map(s => (
          <div key={s.id} onClick={() => setSubject(s)}
            style={{ background: "white", borderRadius: 16, border: "0.5px solid var(--color-border-tertiary)", padding: "1.5rem", cursor: "pointer", transition: "all 0.18s", display: "flex", gap: 14 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = s.color; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 6px 20px ${s.color}18`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border-tertiary)"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: s.light, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <i className={`ti ${s.icon}`} style={{ fontSize: 22, color: s.color }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.55 }}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <button onClick={() => setSubject(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)", marginBottom: "1.5rem", padding: 0, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
        <i className="ti ti-arrow-left" /> All subjects
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: "2rem" }}>
        <div style={{ width: 50, height: 50, borderRadius: 13, background: subject.light, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <i className={`ti ${subject.icon}`} style={{ fontSize: 24, color: subject.color }} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 21, fontWeight: 700, letterSpacing: "-0.4px" }}>{subject.name}</h1>
          <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: 13 }}>Choose your assessment level — 10 AI questions each</p>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {LEVELS.map(l => (
          <div key={l.id} onClick={() => onStart({ subject, level: l })}
            style={{ background: "white", borderRadius: 16, border: "0.5px solid var(--color-border-tertiary)", padding: "1.5rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 16, transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = l.color; e.currentTarget.style.background = l.light; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border-tertiary)"; e.currentTarget.style.background = "white"; }}>
            <div style={{ width: 52, height: 52, borderRadius: 13, background: l.light, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1.5px solid ${l.color}35` }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: l.color }}>{l.name[0]}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 3 }}>{l.fullName}</div>
              <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{l.desc}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 11, background: l.light, color: l.color, borderRadius: 20, padding: "4px 12px", fontWeight: 600 }}>10 Questions</div>
              <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 4 }}>~10 min</div>
            </div>
            <i className="ti ti-chevron-right" style={{ color: "var(--color-text-tertiary)", fontSize: 16, flexShrink: 0 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────

function Quiz({ config, student, onDone, onCancel }) {
  const { subject, level } = config;
  const [questions, setQuestions]       = useState(null);
  const [qIdx, setQIdx]                 = useState(0);
  const [answers, setAnswers]           = useState({});
  const answersRef                       = useRef({});
  const questionsRef                     = useRef(null);
  const [selected, setSelected]         = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [timeLeft, setTimeLeft]         = useState(600);
  const [error, setError]               = useState(null);
  const [loading, setLoading]           = useState(true);
  const timerRef                         = useRef(null);
  const doneRef                          = useRef(false);

  const doSubmit = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    clearInterval(timerRef.current);
    const qs = questionsRef.current;
    if (!qs) return;
    const correct = qs.filter((q, i) => answersRef.current[i] === q.correct).length;
    const score   = Math.round((correct / qs.length) * 100);
    onDone({ id: Date.now(), subjectId: subject.id, subjectName: subject.name, level: level.fullName, levelId: level.id, score, correct, total: qs.length, timestamp: Date.now(), answers: { ...answersRef.current }, questions: qs, student: student.name });
  };

  const doSubmitRef = useRef(doSubmit);
  useEffect(() => { doSubmitRef.current = doSubmit; });

  const loadQuestions = async () => {
    setLoading(true); setError(null); doneRef.current = false;
    answersRef.current = {}; setAnswers({}); setQIdx(0);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2500,
          messages: [{
            role: "user",
            content: `Generate exactly 10 multiple-choice questions for ${subject.name} at the ${level.name} level, strictly aligned to Botswana's BGCSE and Junior Certificate curriculum. Use Botswana-specific examples, people, places, and contexts wherever relevant (e.g., reference Botswana geography, economy, wildlife, local industry). Questions should be appropriately challenging for the level. Return ONLY a valid JSON array — no markdown, no preamble, no explanation. Format: [{"question":"...","options":{"A":"...","B":"...","C":"...","D":"..."},"correct":"A","topic":"...","explanation":"brief explanation of why the answer is correct"}]`
          }]
        })
      });
      const data = await res.json();
      const raw  = data.content[0].text.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
      const qs   = JSON.parse(raw);
      setQuestions(qs);
      questionsRef.current = qs;
    } catch { setError("Could not generate questions. Please check your connection and try again."); }
    setLoading(false);
  };

  useEffect(() => { loadQuestions(); }, []);

  useEffect(() => {
    if (!questions) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); doSubmitRef.current(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [questions]);

  const choose = (opt) => {
    if (showFeedback) return;
    setSelected(opt);
    setShowFeedback(true);
    answersRef.current = { ...answersRef.current, [qIdx]: opt };
    setAnswers({ ...answersRef.current });
    setTimeout(() => {
      setShowFeedback(false);
      setSelected(null);
      if (qIdx < questions.length - 1) setQIdx(i => i + 1);
      else doSubmit();
    }, 1500);
  };

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 420, gap: 20 }}>
      <div style={{ width: 52, height: 52, border: `3px solid ${subject.light}`, borderTopColor: subject.color, borderRadius: "50%", animation: "spin 0.75s linear infinite" }} />
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, letterSpacing: "-0.3px" }}>Generating questions…</div>
        <div style={{ color: "var(--color-text-secondary)", fontSize: 13 }}>AI is crafting {level.name} {subject.name} questions for you</div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ textAlign: "center", padding: "3rem" }}>
      <div style={{ width: 56, height: 56, borderRadius: 14, background: "#FCEBEB", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
        <i className="ti ti-wifi-off" style={{ fontSize: 26, color: "#A32D2D" }} />
      </div>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: "0.5rem" }}>Failed to load questions</div>
      <div style={{ color: "var(--color-text-secondary)", fontSize: 13, marginBottom: "1.75rem", maxWidth: 320, margin: "0 auto 1.75rem" }}>{error}</div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button onClick={onCancel} style={{ background: "none", border: "0.5px solid var(--color-border-primary)", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontSize: 13 }}>Cancel</button>
        <button onClick={loadQuestions} style={{ background: "#0A2F5A", color: "white", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Try Again</button>
      </div>
    </div>
  );

  if (!questions) return null;

  const q    = questions[qIdx];
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const pct  = Math.round(((qIdx + 1) / questions.length) * 100);

  return (
    <div style={{ maxWidth: 660, margin: "0 auto" }}>
      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: subject.color }}>{subject.name} · {level.name}</div>
          <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Question {qIdx + 1} of {questions.length}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: timeLeft < 60 ? "#FCEBEB" : "white", border: `0.5px solid ${timeLeft < 60 ? "#F09595" : "var(--color-border-tertiary)"}`, borderRadius: 9, padding: "6px 14px", transition: "all 0.3s" }}>
          <i className="ti ti-clock" style={{ fontSize: 14, color: timeLeft < 60 ? "#A32D2D" : "var(--color-text-secondary)" }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: timeLeft < 60 ? "#A32D2D" : "var(--color-text-primary)", fontVariantNumeric: "tabular-nums" }}>
            {mins}:{secs.toString().padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 5, background: "var(--color-border-tertiary)", borderRadius: 99, marginBottom: "1.75rem", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: subject.color, borderRadius: 99, transition: "width 0.4s ease" }} />
      </div>

      {/* Question card */}
      <div style={{ background: "white", borderRadius: 18, border: "0.5px solid var(--color-border-tertiary)", padding: "2rem 2rem 1.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: "1rem" }}>
          <div style={{ background: subject.light, color: subject.color, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>{q.topic}</div>
        </div>

        <div style={{ fontSize: 17, fontWeight: 500, lineHeight: 1.7, color: "var(--color-text-primary)", marginBottom: "1.75rem" }}>
          {q.question}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {["A","B","C","D"].map(opt => {
            const isCorrect = opt === q.correct;
            const isChosen  = opt === selected;
            let bg = "white", border = "var(--color-border-tertiary)", txtColor = "var(--color-text-primary)";
            if (showFeedback) {
              if (isCorrect)              { bg = "#EAF3DE"; border = "#639922"; txtColor = "#3B6D11"; }
              else if (isChosen)          { bg = "#FCEBEB"; border = "#E24B4A"; txtColor = "#A32D2D"; }
            }
            return (
              <div key={opt} onClick={() => choose(opt)}
                style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "13px 16px", borderRadius: 11, border: `1.5px solid ${border}`, background: bg, cursor: showFeedback ? "default" : "pointer", transition: "all 0.12s" }}
                onMouseEnter={e => { if (!showFeedback) { e.currentTarget.style.borderColor = subject.color; e.currentTarget.style.background = subject.light; } }}
                onMouseLeave={e => { if (!showFeedback) { e.currentTarget.style.borderColor = "var(--color-border-tertiary)"; e.currentTarget.style.background = "white"; } }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, background: showFeedback && isCorrect ? "#639922" : showFeedback && isChosen ? "#E24B4A" : "var(--color-background-secondary)", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                  {showFeedback && isCorrect  ? <i className="ti ti-check" style={{ fontSize: 13, color: "white" }} /> :
                   showFeedback && isChosen   ? <i className="ti ti-x"     style={{ fontSize: 13, color: "white" }} /> :
                   <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-secondary)" }}>{opt}</span>}
                </div>
                <span style={{ fontSize: 14, lineHeight: 1.6, color: txtColor, paddingTop: 3 }}>{q.options[opt]}</span>
              </div>
            );
          })}
        </div>

        {showFeedback && q.explanation && (
          <div style={{ marginTop: "1.25rem", background: "#E6F1FB", border: "0.5px solid #B5D4F4", borderRadius: 9, padding: "12px 16px", fontSize: 13, color: "#185FA5", lineHeight: 1.65, borderLeft: "3px solid #185FA5" }}>
            <strong>Explanation: </strong>{q.explanation}
          </div>
        )}
      </div>

      <div style={{ textAlign: "center", marginTop: "1.25rem" }}>
        <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-tertiary)", fontSize: 12 }}>Cancel assessment</button>
      </div>
    </div>
  );
}

// ─── Results ──────────────────────────────────────────────────────────────────

function Results({ results, active, onSelect, onCert }) {
  const [sel, setSel] = useState(active || results[0] || null);
  useEffect(() => { if (active) setSel(active); }, [active]);

  if (results.length === 0) return (
    <div style={{ textAlign: "center", padding: "4rem", color: "var(--color-text-secondary)" }}>
      <i className="ti ti-clipboard-list" style={{ fontSize: 44, marginBottom: "1rem", display: "block", color: "var(--color-text-tertiary)" }} />
      <div style={{ fontSize: 15, fontWeight: 500 }}>No results yet. Take an assessment first.</div>
    </div>
  );

  const comp = sel ? getCompetency(sel.score) : null;
  const sub  = sel ? SUBJECTS.find(s => s.id === sel.subjectId) : null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "235px 1fr", gap: "1.5rem", alignItems: "start" }}>
      {/* List */}
      <div>
        <h2 style={{ margin: "0 0 0.75rem", fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: 0.8 }}>All Assessments ({results.length})</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {results.map(r => {
            const c = getCompetency(r.score);
            const isActive = sel?.id === r.id;
            return (
              <div key={r.id} onClick={() => { setSel(r); onSelect(r); }}
                style={{ background: isActive ? "#E6F1FB" : "white", borderRadius: 11, border: `1.5px solid ${isActive ? "#185FA5" : "var(--color-border-tertiary)"}`, padding: "10px 12px", cursor: "pointer", transition: "all 0.1s" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.subjectName}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: c.color, flexShrink: 0 }}>{r.score}%</div>
                </div>
                <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>{r.levelId} · {fmtDate(r.timestamp)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail panel */}
      {sel && comp && sub && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Score card */}
          <div style={{ background: "white", borderRadius: 18, border: "0.5px solid var(--color-border-tertiary)", padding: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: "1.75rem" }}>
              <div style={{ width: 54, height: 54, borderRadius: 14, background: sub.light, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className={`ti ${sub.icon}`} style={{ fontSize: 25, color: sub.color }} />
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.4px" }}>{sel.subjectName}</div>
                <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{sel.level} · {fmtDate(sel.timestamp)}</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "2.5rem", alignItems: "flex-start", marginBottom: "1.75rem" }}>
              <div>
                <div style={{ fontSize: 64, fontWeight: 800, color: comp.color, lineHeight: 1, letterSpacing: "-2px" }}>{sel.score}%</div>
                <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 6 }}>{sel.correct} of {sel.total} correct</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ background: comp.bg, border: `1px solid ${comp.color}25`, borderRadius: 12, padding: "1rem 1.25rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <i className={`ti ${comp.icon}`} style={{ fontSize: 20, color: comp.color }} />
                    <div style={{ fontSize: 15, fontWeight: 700, color: comp.color }}>{comp.label}</div>
                  </div>
                  <div style={{ fontSize: 12, color: comp.color, opacity: 0.8, lineHeight: 1.6 }}>{comp.tip}</div>
                </div>
              </div>
            </div>

            {/* Score track */}
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ height: 9, background: "#F0F4F8", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${sel.score}%`, background: comp.color, borderRadius: 99, transition: "width 0.6s ease" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--color-text-tertiary)", marginTop: 5 }}>
                <span>0%</span><span style={{ color: "#3B6D11" }}>40 Basic</span><span style={{ color: "#854F0B" }}>60 Inter.</span><span style={{ color: "#185FA5" }}>80 Advanced</span><span>100%</span>
              </div>
            </div>

            <button onClick={() => onCert(sel)} style={{ background: "#0A2F5A", color: "white", border: "none", borderRadius: 9, padding: "10px 22px", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7, transition: "opacity 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
              onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
              <i className="ti ti-certificate" style={{ fontSize: 15 }} /> View Certificate
            </button>
          </div>

          {/* Question review */}
          {sel.questions && (
            <div style={{ background: "white", borderRadius: 18, border: "0.5px solid var(--color-border-tertiary)", padding: "1.75rem" }}>
              <h3 style={{ margin: "0 0 1.25rem", fontSize: 15, fontWeight: 600 }}>Question Review</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {sel.questions.map((q, i) => {
                  const ua = sel.answers[i];
                  const ok = ua === q.correct;
                  return (
                    <div key={i} style={{ borderRadius: 10, border: `0.5px solid ${ok ? "#C0DD97" : "#F7C1C1"}`, background: ok ? "#F6FAF0" : "#FFF5F5", padding: "11px 14px" }}>
                      <div style={{ display: "flex", gap: 10 }}>
                        <div style={{ width: 22, height: 22, borderRadius: 6, background: ok ? "#639922" : "#E24B4A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                          <i className={`ti ${ok ? "ti-check" : "ti-x"}`} style={{ fontSize: 11, color: "white" }} />
                        </div>
                        <div style={{ flex: 1, fontSize: 12, lineHeight: 1.6 }}>
                          <div style={{ fontWeight: 600, marginBottom: 4 }}>{q.question}</div>
                          {!ok && <div style={{ color: "#A32D2D" }}>Your answer: {ua ? `${ua}. ${q.options[ua]}` : "Not answered"}</div>}
                          <div style={{ color: "#3B6D11" }}>Correct: {q.correct}. {q.options[q.correct]}</div>
                          {q.explanation && <div style={{ color: "#185FA5", marginTop: 3 }}>💡 {q.explanation}</div>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Certificate ──────────────────────────────────────────────────────────────

function Certificate({ result, student, onBack }) {
  const comp   = getCompetency(result.score);
  const certId = `EL-${result.id.toString(36).toUpperCase().slice(-8)}`;
  const sub    = SUBJECTS.find(s => s.id === result.subjectId);

  return (
    <div>
      <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)", marginBottom: "1.5rem", padding: 0, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
        <i className="ti ti-arrow-left" /> Back to results
      </button>

      <div style={{ background: "white", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 22, padding: "3.5rem 3rem 2.5rem", maxWidth: 680, margin: "0 auto", position: "relative", overflow: "hidden" }}>

        {/* Corner decorations */}
        <div style={{ position: "absolute", top: 14, left: 14, width: 30, height: 30, borderTop: `2px solid ${comp.color}30`, borderLeft: `2px solid ${comp.color}30`, borderRadius: "4px 0 0 0" }} />
        <div style={{ position: "absolute", top: 14, right: 14, width: 30, height: 30, borderTop: `2px solid ${comp.color}30`, borderRight: `2px solid ${comp.color}30`, borderRadius: "0 4px 0 0" }} />
        <div style={{ position: "absolute", bottom: 14, left: 14, width: 30, height: 30, borderBottom: `2px solid ${comp.color}30`, borderLeft: `2px solid ${comp.color}30`, borderRadius: "0 0 0 4px" }} />
        <div style={{ position: "absolute", bottom: 14, right: 14, width: 30, height: 30, borderBottom: `2px solid ${comp.color}30`, borderRight: `2px solid ${comp.color}30`, borderRadius: "0 0 4px 0" }} />

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, marginBottom: "1.5rem" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "#E6F1FB", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className="ti ti-school" style={{ fontSize: 22, color: "#0A2F5A" }} />
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#0A2F5A", letterSpacing: "-0.5px" }}>EduLevel Botswana</div>
              <div style={{ fontSize: 9, color: "#bbb", letterSpacing: 2.5 }}>STUDENT COMPETENCY EVALUATION SYSTEM</div>
            </div>
          </div>
          <div style={{ fontSize: 10, letterSpacing: 4, color: "#ccc", textTransform: "uppercase", marginBottom: "1.25rem" }}>
            Certificate of Competency Assessment
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 4 }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ width: i === 2 ? 36 : 8, height: 2, borderRadius: 99, background: i === 2 ? comp.color : `${comp.color}30` }} />
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{ fontSize: 12, color: "#bbb", marginBottom: "0.6rem", letterSpacing: 0.3 }}>This is to certify that</div>
          <div style={{ fontSize: 34, fontWeight: 800, color: "#0A2F5A", letterSpacing: "-1px", marginBottom: "0.3rem" }}>{result.student}</div>
          <div style={{ fontSize: 13, color: "#aaa", marginBottom: "2.5rem" }}>{student?.school} &nbsp;·&nbsp; {student?.form}</div>

          <div style={{ fontSize: 12, color: "#bbb", marginBottom: "0.6rem" }}>has demonstrated</div>
          <div style={{ display: "inline-block", background: comp.bg, border: `2px solid ${comp.color}40`, borderRadius: 14, padding: "14px 40px", marginBottom: "2rem" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: comp.color, letterSpacing: "-0.5px" }}>{comp.label}</div>
          </div>
          <div style={{ fontSize: 12, color: "#bbb", marginBottom: "0.5rem" }}>in the subject of</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: "0.5rem" }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: sub?.light, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <i className={`ti ${sub?.icon}`} style={{ fontSize: 18, color: sub?.color }} />
            </div>
            <span style={{ fontSize: 24, fontWeight: 800, color: "#0A2F5A", letterSpacing: "-0.5px" }}>{result.subjectName}</span>
          </div>
          <div style={{ fontSize: 12, color: "#bbb", marginBottom: "2.5rem" }}>{result.level}</div>

          {/* Metric row */}
          <div style={{ display: "inline-flex", background: "#F8F9FB", borderRadius: 14, overflow: "hidden", border: "0.5px solid #eee", marginBottom: "2rem" }}>
            {[["Score", `${result.score}%`, comp.color], ["Correct", `${result.correct}/${result.total}`, "#0A2F5A"], ["Grade", comp.grade, "#854F0B"]].map(([lbl, val, clr], i, arr) => (
              <div key={lbl} style={{ padding: "1.25rem 2.5rem", borderRight: i < arr.length - 1 ? "0.5px solid #eee" : "none", textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: clr, letterSpacing: "-0.5px" }}>{val}</div>
                <div style={{ fontSize: 10, color: "#bbb", textTransform: "uppercase", letterSpacing: 0.8, marginTop: 4 }}>{lbl}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 12, color: "#ccc" }}>
            Assessment completed on <strong style={{ color: "#aaa" }}>{fmtDate(result.timestamp)}</strong>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: "0.5px solid #f0f0f0", paddingTop: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 10, color: "#ccc", marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.5 }}>Certificate ID</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#999", fontFamily: "var(--font-mono)" }}>{certId}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#ccc", marginBottom: 6 }}>Verify at edulevel.co.bw</div>
            <div style={{ width: 44, height: 44, background: "#F8F9FB", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
              <i className="ti ti-qrcode" style={{ fontSize: 26, color: "#ddd" }} />
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#bbb", marginBottom: 4 }}>Developed by</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#888" }}>Tabaka Mochipela</div>
            <div style={{ fontSize: 10, color: "#ccc" }}>© {new Date().getFullYear()} EduLevel Botswana</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Analytics ────────────────────────────────────────────────────────────────

function Analytics({ results }) {
  if (results.length === 0) return (
    <div style={{ textAlign: "center", padding: "4rem", color: "var(--color-text-secondary)" }}>
      <i className="ti ti-trending-up" style={{ fontSize: 44, marginBottom: "1rem", display: "block", color: "var(--color-text-tertiary)" }} />
      <div style={{ fontSize: 15, fontWeight: 500 }}>No data yet. Complete some assessments to see analytics.</div>
    </div>
  );

  const bySubject = SUBJECTS.map(s => {
    const rs = results.filter(r => r.subjectId === s.id);
    if (!rs.length) return null;
    return { name: s.name.split(" ")[0], avg: Math.round(rs.reduce((a, r) => a + r.score, 0) / rs.length), count: rs.length, color: s.color };
  }).filter(Boolean);

  const timeline = [...results].reverse().slice(-15).map((r, i) => ({
    n: `#${i + 1}`, score: r.score, sub: r.subjectName.split(" ")[0]
  }));

  const dist = [
    { name: "Needs Improvement", v: results.filter(r => r.score < 40).length,                      color: "#A32D2D", bg: "#FCEBEB" },
    { name: "Basic",             v: results.filter(r => r.score >= 40 && r.score < 60).length,     color: "#3B6D11", bg: "#EAF3DE" },
    { name: "Intermediate",      v: results.filter(r => r.score >= 60 && r.score < 80).length,     color: "#854F0B", bg: "#FAEEDA" },
    { name: "Advanced",          v: results.filter(r => r.score >= 80).length,                     color: "#185FA5", bg: "#E6F1FB" },
  ].filter(d => d.v > 0);

  const avg      = Math.round(results.reduce((s, r) => s + r.score, 0) / results.length);
  const best     = Math.max(...results.map(r => r.score));
  const latest   = results[0];
  const topSubId = bySubject.sort((a, b) => b.avg - a.avg)[0];

  return (
    <div>
      <h1 style={{ margin: "0 0 0.5rem", fontSize: 22, fontWeight: 700, letterSpacing: "-0.4px" }}>Performance Analytics</h1>
      <p style={{ margin: "0 0 2rem", color: "var(--color-text-secondary)", fontSize: 13 }}>{results.length} assessment{results.length !== 1 ? "s" : ""} recorded</p>

      {/* Summary row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: "1.5rem" }}>
        <StatCard label="Average Score"  value={`${avg}%`}              icon="ti-chart-dots"  color="#185FA5" />
        <StatCard label="Personal Best"  value={`${best}%`}             icon="ti-trophy"      color="#854F0B" />
        <StatCard label="Last Score"     value={`${latest.score}%`}     icon="ti-clock"       color="#0F6E56" />
        <StatCard label="Best Subject"   value={topSubId?.name || "—"}  icon="ti-award"       color="#534AB7" />
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div style={{ background: "white", borderRadius: 14, border: "0.5px solid var(--color-border-tertiary)", padding: "1.5rem" }}>
          <h3 style={{ margin: "0 0 1.25rem", fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: 0.5 }}>Average by Subject</h3>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={bySubject} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => [`${v}%`, "Avg Score"]} />
              <Bar dataKey="avg" radius={[6, 6, 0, 0]}>
                {bySubject.map((s, i) => <Cell key={i} fill={s.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: "white", borderRadius: 14, border: "0.5px solid var(--color-border-tertiary)", padding: "1.5rem" }}>
          <h3 style={{ margin: "0 0 1.25rem", fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: 0.5 }}>Score Progression</h3>
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={timeline} margin={{ top: 0, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="n" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v, n, p) => [`${v}%`, p.payload.sub]} />
              <Line type="monotone" dataKey="score" stroke="#185FA5" strokeWidth={2.5} dot={{ r: 4, fill: "#185FA5" }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Competency dist */}
      <div style={{ background: "white", borderRadius: 14, border: "0.5px solid var(--color-border-tertiary)", padding: "1.5rem" }}>
        <h3 style={{ margin: "0 0 1.25rem", fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: 0.5 }}>Competency Distribution</h3>
        <div style={{ display: "flex", gap: 10 }}>
          {dist.map(d => (
            <div key={d.name} style={{ flex: 1, textAlign: "center", background: d.bg, borderRadius: 12, padding: "1.25rem 0.75rem", border: `0.5px solid ${d.color}25` }}>
              <div style={{ fontSize: 38, fontWeight: 800, color: d.color, letterSpacing: "-1px" }}>{d.v}</div>
              <div style={{ fontSize: 11, color: d.color, marginTop: 5, fontWeight: 500 }}>{d.name}</div>
              <div style={{ fontSize: 10, color: d.color, opacity: 0.6, marginTop: 2 }}>{Math.round(d.v / results.length * 100)}% of tests</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: "2rem", padding: "1rem", borderTop: "0.5px solid var(--color-border-tertiary)" }}>
        <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
          EduLevel Botswana Analytics · Developed by <strong style={{ fontWeight: 600 }}>Tabaka Mochipela</strong>
        </span>
      </div>
    </div>
  );
}
