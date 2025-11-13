import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";

/**
 * HIROCROSS – AI Sport Performance Analyzer
 * ---------------------------------------------------------------
 * Features:
 * - Multi-athlete management (select, add, save profiles per athlete)
 * - Athlete profile: Vertical Jump (cm) → Peak Power (W) (Sayers formula)
 * - Training Load based on sRPE (1-10 mapping for 60 min baseline)
 *   Training Load = multiplier[RPE] × (duration / 60)
 * - Fitness (CTL, τ=42), Fatigue (ATL, τ=7), Form (TSB = CTL − ATL)
 * - ACWR (Acute 7 days / Chronic 28 days) with rolling average
 * - Traffic light for Form & ACWR (red/yellow/green)
 * - Session input: Date, Duration, RPE (1–10) + Notes
 * - Import/Export CSV for active athlete sessions
 * - Export PDF: window.print()
 * - AI Panel (placeholder insights)
 */

// RPE multipliers for 60-minute baseline
const RPE_MAP: Record<number, { label: string; multiplier: number }> = {
  1: { label: "😄", multiplier: 20 },
  2: { label: "😊", multiplier: 30 },
  3: { label: "😌", multiplier: 40 },
  4: { label: "😔", multiplier: 50 },
  5: { label: "😐", multiplier: 60 },
  6: { label: "😬", multiplier: 70 },
  7: { label: "😧", multiplier: 80 },
  8: { label: "🥴", multiplier: 100 },
  9: { label: "😵‍💫", multiplier: 120 },
  10: { label: "🤮", multiplier: 140 },
};

interface Session {
  date: string;
  duration: number;
  rpe: number;
  notes: string;
}

interface Athlete {
  id: string;
  name: string;
  mass?: number;
  bodyHeight?: number;
  vj?: number;
  sessions: Session[];
}

interface TimelineRow {
  date: string;
  load: number;
  CTL: number;
  ATL: number;
  FORM: number;
  ACUTE: number;
  CHRONIC: number;
  ACWR: number;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

// Exponential moving average (EWMA) with time constant tau (days)
function emaSeries(values: number[], tau: number): number[] {
  const alpha = 1 - Math.exp(-1 / tau);
  const out: number[] = [];
  let prev = 0;
  for (let i = 0; i < values.length; i++) {
    prev = prev + alpha * (values[i] - prev);
    out.push(prev);
  }
  return out;
}

// Rolling average for ACWR (window in days)
function rollingAverage(values: number[], window: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1);
    const sum = slice.reduce((a, b) => a + b, 0);
    out.push(sum / slice.length);
  }
  return out;
}

// Calculate Training Load per session with duration (baseline 60 min)
function sessionLoad(rpe: number, durationMin: number): number {
  const mult = RPE_MAP[rpe].multiplier;
  return mult * (durationMin / 60);
}

// Helper – simple id generation
function genId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// Helper status Form (TSB)
function getFormStatus(value: number) {
  if (!isFinite(value)) {
    return {
      label: "No data",
      color: "bg-slate-100 text-slate-600",
      text: "Form not yet readable.",
    };
  }
  if (value < -10) {
    return {
      label: "Too Fatigued",
      color: "bg-red-100 text-red-700",
      text: "TSB very negative, high fatigue risk.",
    };
  }
  if (value > 10) {
    return {
      label: "Ready to Perform",
      color: "bg-emerald-100 text-emerald-700",
      text: "TSB positive, good window for key session/race.",
    };
  }
  return {
    label: "Neutral",
    color: "bg-amber-100 text-amber-700",
    text: "Moderate form, can continue progressive load.",
  };
}

// Helper status ACWR
function getAcwrStatus(value: number) {
  if (!isFinite(value) || value === 0) {
    return {
      label: "No data",
      color: "bg-slate-100 text-slate-600",
      text: "Need at least several weeks of history.",
    };
  }
  if (value > 1.5) {
    return {
      label: "> 1.5 (High)",
      color: "bg-red-100 text-red-700",
      text: "Overload risk increased, reduce load for a few days.",
    };
  }
  if (value < 0.8) {
    return {
      label: "< 0.8 (Low)",
      color: "bg-amber-100 text-amber-700",
      text: "Load may be insufficient for maximum adaptation.",
    };
  }
  return {
    label: "0.8–1.3 (Safe)",
    color: "bg-emerald-100 text-emerald-700",
    text: "Moderate zone, good stress-recovery balance.",
  };
}

const Index = () => {
  // ==== MULTI-ATHLETE CORE STATE ====
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [activeAthleteId, setActiveAthleteId] = useState<string | null>(null);

  // ==== FORM PROFILE (for active athlete / new) ====
  const [name, setName] = useState("");
  const [mass, setMass] = useState<number | "">("");
  const [bodyHeight, setBodyHeight] = useState<number | "">("");
  const [vj, setVj] = useState<number | "">("");

  // ==== SESSIONS (for active athlete / new) ====
  const [sessions, setSessions] = useState<Session[]>([]);

  // Form to add session
  const [newDate, setNewDate] = useState(formatDate(new Date()));
  const [newDur, setNewDur] = useState<number | "">(60);
  const [newRpe, setNewRpe] = useState(5);
  const [notes, setNotes] = useState("");

  // When switching active athlete, load data to form
  useEffect(() => {
    if (!activeAthleteId) return;
    const a = athletes.find((x) => x.id === activeAthleteId);
    if (!a) return;
    setName(a.name || "");
    setMass(a.mass ?? "");
    setBodyHeight(a.bodyHeight ?? "");
    setVj(a.vj ?? "");
    setSessions(a.sessions || []);
  }, [activeAthleteId, athletes]);

  // Peak Power (Sayers)
  const peakPower = useMemo(() => {
    if (vj === "" || mass === "") return 0;
    const P = 60.7 * Number(vj) + 45.3 * Number(mass) - 2055;
    return Math.max(0, Math.round(P));
  }, [vj, mass]);

  // Continuous daily timeline + load accumulation per day
  const timeline = useMemo(() => {
    if (sessions.length === 0) return [];
    const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
    const start = new Date(sorted[0].date);
    const end = new Date(sorted[sorted.length - 1].date);
    const totalDays = daysBetween(start, end) + 1;

    const dayMap: Record<string, number> = {};
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dayMap[formatDate(d)] = 0;
    }
    for (const s of sorted) {
      const load = sessionLoad(s.rpe, s.duration);
      dayMap[s.date] = (dayMap[s.date] || 0) + load;
    }
    return Object.entries(dayMap).map(([date, load]) => ({
      date,
      load,
    }));
  }, [sessions]);

  // CTL, ATL, FORM, ACWR
  const ctlAtlForm = useMemo(() => {
    if (timeline.length === 0) {
      return {
        rows: [] as TimelineRow[],
        lastCTL: 0,
        lastATL: 0,
        lastTSB: 0,
        lastACWR: 0,
        lastAcute: 0,
        lastChronic: 0,
      };
    }

    const loads = timeline.map((d) => d.load);

    const CTL = emaSeries(loads, 42);
    const ATL = emaSeries(loads, 7);
    const FORM = CTL.map((c, i) => c - ATL[i]);

    const ACUTE = rollingAverage(loads, 7);
    const CHRONIC = rollingAverage(loads, 28);
    const ACWR = ACUTE.map((a, i) => (CHRONIC[i] > 0 ? a / CHRONIC[i] : 0));

    const rows: TimelineRow[] = timeline.map((d, i) => ({
      date: d.date,
      load: d.load,
      CTL: CTL[i],
      ATL: ATL[i],
      FORM: FORM[i],
      ACUTE: ACUTE[i],
      CHRONIC: CHRONIC[i],
      ACWR: ACWR[i],
    }));

    const last = rows[rows.length - 1];

    return {
      rows,
      lastCTL: last.CTL,
      lastATL: last.ATL,
      lastTSB: last.FORM,
      lastACWR: last.ACWR,
      lastAcute: last.ACUTE,
      lastChronic: last.CHRONIC,
    };
  }, [timeline]);

  const formStatus = getFormStatus(ctlAtlForm.lastTSB);
  const acwrStatus = getAcwrStatus(ctlAtlForm.lastACWR);

  // Save athlete profile (new or update)
  function saveAthlete() {
    if (!name) return;
    const athleteData: Athlete = {
      id: activeAthleteId || genId(),
      name,
      mass: mass === "" ? undefined : Number(mass),
      bodyHeight: bodyHeight === "" ? undefined : Number(bodyHeight),
      vj: vj === "" ? undefined : Number(vj),
      sessions,
    };

    setAthletes((prev) => {
      const exists = prev.find((a) => a.id === athleteData.id);
      if (exists) {
        return prev.map((a) => (a.id === athleteData.id ? athleteData : a));
      }
      return [...prev, athleteData];
    });

    if (!activeAthleteId) {
      setActiveAthleteId(athleteData.id);
    }
  }

  // Add session
  function addSession() {
    if (!newDate || newDur === "" || !newRpe) return;
    const newSession: Session = {
      date: newDate,
      duration: Number(newDur),
      rpe: Number(newRpe),
      notes,
    };

    setSessions((prev) => {
      const updated = [...prev, newSession];

      if (activeAthleteId) {
        setAthletes((prevAth) =>
          prevAth.map((a) =>
            a.id === activeAthleteId ? { ...a, sessions: updated } : a
          )
        );
      }

      return updated;
    });

    setNotes("");
  }

  // Remove session
  function removeSession(idx: number) {
    setSessions((prev) => {
      const updated = prev.filter((_, i) => i !== idx);

      if (activeAthleteId) {
        setAthletes((prevAth) =>
          prevAth.map((a) =>
            a.id === activeAthleteId ? { ...a, sessions: updated } : a
          )
        );
      }

      return updated;
    });
  }

  // Import CSV (sessions) – for active athlete
  function importCSV(text: string) {
    const lines = text.trim().split(/\r?\n/);
    const out: Session[] = [];
    for (const line of lines.slice(1)) {
      const [d, dur, r, n] = line.split(",");
      if (!d) continue;
      out.push({
        date: d.trim(),
        duration: Number(dur),
        rpe: Number(r),
        notes: (n || "").trim(),
      });
    }

    setSessions((prev) => {
      const updated = [...prev, ...out];

      if (activeAthleteId) {
        setAthletes((prevAth) =>
          prevAth.map((a) =>
            a.id === activeAthleteId ? { ...a, sessions: updated } : a
          )
        );
      }

      return updated;
    });
  }

  // Export CSV (active athlete sessions)
  function exportCSV() {
    const header = "date,duration_min,rpe,notes";
    const rows = sessions.map((s) => `${s.date},${s.duration},${s.rpe},${s.notes || ""}`);
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (name || "athlete") + "_sessions.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // Export PDF → use print
  function exportPDF() {
    window.print();
  }

  const summaryCards = [
    {
      title: "Peak Power (VJ)",
      value: peakPower ? `${peakPower} W` : "—",
      hint: "Sayers: 60.7×VJ(cm) + 45.3×mass(kg) − 2055",
    },
    {
      title: "Fitness (CTL)",
      value: ctlAtlForm.rows.length ? ctlAtlForm.lastCTL.toFixed(1) : "—",
      hint: "EWMA τ = 42 days",
    },
    {
      title: "Fatigue (ATL)",
      value: ctlAtlForm.rows.length ? ctlAtlForm.lastATL.toFixed(1) : "—",
      hint: "EWMA τ = 7 days",
    },
    {
      title: "Form (TSB)",
      value: ctlAtlForm.rows.length ? ctlAtlForm.lastTSB.toFixed(1) : "—",
      hint: "CTL − ATL",
    },
    {
      title: "ACWR (7/28 days)",
      value: ctlAtlForm.rows.length ? ctlAtlForm.lastACWR.toFixed(2) : "—",
      hint: "Acute / Chronic Load",
    },
  ];

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
      {/* HEADER */}
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur border-b border-border print:relative print:border-none">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span className="text-xl">🧠</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                HIROCROSS – AI Sport Performance Analyzer
              </h1>
              <p className="text-xs text-muted-foreground">
                Multi-athlete • sRPE Load • CTL/ATL/TSB • ACWR • VJ→Power
              </p>
            </div>
          </div>

          <button
            onClick={exportPDF}
            className="hidden print:hidden md:inline-flex px-3 py-1.5 rounded-xl border border-border text-xs font-medium bg-card hover:bg-muted"
          >
            Export PDF
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 grid gap-6">
        {/* SELECT ATHLETE + NEW ATHLETE */}
        <section className="bg-card rounded-2xl border border-border shadow-sm p-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Select Athlete</label>
              <select
                className="border border-border rounded-lg px-2 py-1 text-sm min-w-[180px] bg-card"
                value={activeAthleteId || ""}
                onChange={(e) => {
                  const v = e.target.value || null;
                  setActiveAthleteId(v);
                }}
              >
                <option value="">— None (New Athlete) —</option>
                {athletes.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name || "Unnamed"}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveAthleteId(null);
                  setName("");
                  setMass("");
                  setBodyHeight("");
                  setVj("");
                  setSessions([]);
                }}
                className="px-3 py-1.5 rounded-xl border border-border text-xs bg-card hover:bg-muted"
              >
                + New Athlete
              </button>

              <button
                type="button"
                onClick={saveAthlete}
                className="px-3 py-1.5 rounded-xl text-xs bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Save Athlete Profile
              </button>
            </div>
          </div>
        </section>

        {/* ATHLETE PROFILE */}
        <section className="bg-card rounded-2xl border border-border shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-success/10 flex items-center justify-center">
              <span>📊</span>
            </div>
            <h2 className="text-lg font-semibold">Athlete Profile & Vertical Jump</h2>
            <span className="text-xs text-muted-foreground">(VJ converted to Peak Power)</span>
          </div>
          <div className="grid md:grid-cols-5 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Name</label>
              <input
                className="w-full border border-border rounded-lg px-2 py-1.5 text-sm bg-card"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Athlete name"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Body Mass (kg)</label>
              <input
                type="number"
                className="w-full border border-border rounded-lg px-2 py-1.5 text-sm bg-card"
                value={mass}
                onChange={(e) => setMass(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="70"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Height (cm)</label>
              <input
                type="number"
                className="w-full border border-border rounded-lg px-2 py-1.5 text-sm bg-card"
                value={bodyHeight}
                onChange={(e) => setBodyHeight(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="170"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Vertical Jump (cm)</label>
              <input
                type="number"
                className="w-full border border-border rounded-lg px-2 py-1.5 text-sm bg-card"
                value={vj}
                onChange={(e) => setVj(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="45"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Peak Power (W)</label>
              <input
                readOnly
                className="w-full border border-border rounded-lg px-2 py-1.5 text-sm bg-muted"
                value={peakPower ? String(peakPower) : "—"}
              />
            </div>
          </div>
        </section>

        {/* TRAINING SESSIONS */}
        <section className="bg-card rounded-2xl border border-border shadow-sm p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <span>➕</span>
            </div>
            <h2 className="text-lg font-semibold">Log Training Session (sRPE)</h2>
          </div>

          <div className="grid md:grid-cols-6 gap-3 items-end mb-4">
            <div className="md:col-span-2">
              <label className="text-xs text-muted-foreground">Date</label>
              <input
                type="date"
                className="w-full border border-border rounded-lg px-2 py-1.5 text-sm bg-card"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Duration (min)</label>
              <input
                type="number"
                className="w-full border border-border rounded-lg px-2 py-1.5 text-sm bg-card"
                value={newDur}
                onChange={(e) => setNewDur(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="60"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">RPE (1–10)</label>
              <select
                className="w-full border border-border rounded-lg px-2 py-1.5 text-sm bg-card"
                value={String(newRpe)}
                onChange={(e) => setNewRpe(Number(e.target.value))}
              >
                {Object.entries(RPE_MAP).map(([k, v]) => (
                  <option key={k} value={k}>
                    {k} {v.label} (×{v.multiplier} @60')
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-muted-foreground">Notes</label>
              <input
                className="w-full border border-border rounded-lg px-2 py-1.5 text-sm bg-card"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Brief session notes (optional)"
              />
            </div>
            <div>
              <button
                type="button"
                onClick={addSession}
                className="w-full px-3 py-2 rounded-xl text-sm bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Add
              </button>
            </div>
          </div>

          {/* RPE mapping info */}
          <div className="text-xs text-muted-foreground mb-4">
            <p className="mb-1 font-medium">Load conversion based on duration (60-minute baseline):</p>
            <div className="grid grid-cols-5 md:grid-cols-10 gap-1 mb-1">
              {Object.entries(RPE_MAP).map(([k, v]) => (
                <div key={k} className="px-2 py-1 rounded-xl bg-muted border border-border text-center">
                  <div className="font-semibold text-xs">{k}</div>
                  <div>{v.label}</div>
                  <div className="text-[11px]">{v.multiplier} @60'</div>
                </div>
              ))}
            </div>
            <p>
              Formula: <span className="font-semibold">Training Load = multiplier[RPE] × (duration / 60)</span>. Example:
              RPE 1, 60' → 20; 30' → 10.
            </p>
          </div>

          {/* Session table – WITHOUT load display */}
          {sessions.length > 0 && (
            <div className="overflow-auto border border-border rounded-xl bg-muted mb-4">
              <table className="min-w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2">Date</th>
                    <th className="text-right p-2">Duration (min)</th>
                    <th className="text-right p-2">RPE</th>
                    <th className="p-2 text-left">Notes</th>
                    <th className="p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {sessions
                    .slice()
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map((s, idx) => (
                      <tr key={idx} className="border-t border-border last:border-b">
                        <td className="p-2">{s.date}</td>
                        <td className="p-2 text-right">{s.duration}</td>
                        <td className="p-2 text-right">
                          {s.rpe} {RPE_MAP[s.rpe]?.label}
                        </td>
                        <td className="p-2">{s.notes}</td>
                        <td className="p-2 text-right">
                          <button
                            type="button"
                            onClick={() => removeSession(idx)}
                            className="text-xs text-destructive hover:underline"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Import / Export CSV */}
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-card cursor-pointer text-xs hover:bg-muted">
              <span>⬆️ Import CSV</span>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const text = await file.text();
                  importCSV(text);
                }}
              />
            </label>
            <button
              type="button"
              onClick={exportCSV}
              className="px-3 py-2 rounded-xl border border-border bg-card text-xs hover:bg-muted"
            >
              ⬇️ Export CSV
            </button>
          </div>
        </section>

        {/* DASHBOARD */}
        <section className="bg-card rounded-2xl border border-border shadow-sm p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <span>📈</span>
            </div>
            <h2 className="text-lg font-semibold">Dashboard • Fitness / Fatigue / Form / ACWR</h2>
            <div className="ml-auto md:hidden">
              <button
                onClick={exportPDF}
                className="px-3 py-1.5 rounded-xl border border-border text-xs bg-card hover:bg-muted"
              >
                Export PDF
              </button>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid md:grid-cols-5 gap-3 mb-3">
            {summaryCards.map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04 * i }}
              >
                <div className="p-3 rounded-2xl border border-border bg-muted">
                  <div className="text-xs text-muted-foreground">{c.title}</div>
                  <div className="text-xl font-semibold mt-1">{c.value}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">{c.hint}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Traffic light status */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className={`px-3 py-2 rounded-2xl text-xs font-medium flex flex-col gap-1 ${formStatus.color}`}>
              <span>Form (TSB): {formStatus.label}</span>
              <span className="text-[11px] opacity-80">{formStatus.text}</span>
            </div>
            <div className={`px-3 py-2 rounded-2xl text-xs font-medium flex flex-col gap-1 ${acwrStatus.color}`}>
              <span>ACWR: {acwrStatus.label}</span>
              <span className="text-[11px] opacity-80">{acwrStatus.text}</span>
            </div>
          </div>

          {/* Charts */}
          {ctlAtlForm.rows.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="h-72 p-3 rounded-2xl border border-border bg-muted">
                <div className="text-sm font-medium mb-2">Daily Training Load</div>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ctlAtlForm.rows}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                    <Legend />
                    <Bar dataKey="load" name="Load" fill="hsl(var(--chart-1))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="h-72 p-3 rounded-2xl border border-border bg-muted">
                <div className="text-sm font-medium mb-2">CTL / ATL / FORM</div>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ctlAtlForm.rows}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                    <Legend />
                    <Line type="monotone" dataKey="CTL" dot={false} strokeWidth={2} stroke="hsl(var(--chart-1))" />
                    <Line type="monotone" dataKey="ATL" dot={false} strokeWidth={2} stroke="hsl(var(--chart-2))" />
                    <Line type="monotone" dataKey="FORM" dot={false} strokeWidth={2} stroke="hsl(var(--chart-3))" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="h-72 p-3 rounded-2xl border border-border bg-muted md:col-span-2">
                <div className="text-sm font-medium mb-2">ACWR (Acute / Chronic)</div>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ctlAtlForm.rows}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} domain={[0, 3]} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                    <Legend />
                    <Line type="monotone" dataKey="ACWR" dot={false} strokeWidth={2} stroke="hsl(var(--chart-4))" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No session data yet. Add training sessions to see charts.</div>
          )}
        </section>

        {/* AI INSIGHTS PANEL */}
        <section className="bg-card rounded-2xl border border-border shadow-sm p-4 mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <span>🤖</span>
            </div>
            <h2 className="text-lg font-semibold">AI Insights (Preview)</h2>
          </div>
          <InsightsPanel rows={ctlAtlForm.rows} name={name} />
        </section>
      </main>
    </div>
  );
};

interface InsightsPanelProps {
  rows: TimelineRow[];
  name: string;
}

function InsightsPanel({ rows, name }: InsightsPanelProps) {
  if (!rows || rows.length < 7) {
    return (
      <div className="text-sm text-muted-foreground">
        Add at least 7 days of data for more meaningful insights.
      </div>
    );
  }

  const last = rows[rows.length - 1];
  const prev = rows[rows.length - 2];
  const trend = last.CTL > prev.CTL ? "increasing" : last.CTL < prev.CTL ? "decreasing" : "stable";

  let formNote = "";
  if (last.FORM < -10) {
    formNote = "Low form (negative TSB). Consider recovery 1–2 days.";
  } else if (last.FORM > 10) {
    formNote = "Positive form—good for key session/test.";
  } else {
    formNote = "Neutral form. Continue gradual progression (≤5–8%/week).";
  }

  let acwrNote = "";
  if (last.ACWR > 1.5) {
    acwrNote = "High ACWR (>1.5) – watch for fatigue/injury risk, reduce load for a few days.";
  } else if (last.ACWR < 0.8) {
    acwrNote = "Low ACWR (<0.8) – load may be too low for maximum adaptation.";
  } else {
    acwrNote = "ACWR in moderate zone (≈0.8–1.3) – load balance is good.";
  }

  const lastName = name || "Athlete";

  const avg7 = rows.slice(-7).reduce((a, b) => a + b.load, 0) / 7;
  const avg21 = rows.slice(-21).reduce((a, b) => a + (b?.load || 0), 0) / Math.min(21, rows.length);

  return (
    <div className="grid md:grid-cols-3 gap-3 text-sm">
      <div className="p-4 rounded-2xl border border-border bg-muted">
        <div className="text-xs text-muted-foreground">AI Summary</div>
        <div className="mt-1">
          <span className="font-semibold">{lastName}</span> shows fitness trend <span className="font-semibold">{trend}</span>{" "}
          compared to previous day.
        </div>
        <div className="mt-1">{formNote}</div>
      </div>
      <div className="p-4 rounded-2xl border border-border bg-muted">
        <div className="text-xs text-muted-foreground">Average Load</div>
        <div className="mt-1">
          7 days: <span className="font-semibold">{avg7.toFixed(2)}</span>
        </div>
        <div>
          ~21 days: <span className="font-semibold">{avg21.toFixed(2)}</span>
        </div>
        <div className="text-[11px] text-muted-foreground mt-2">
          Load scale follows sRPE @60' mapping and scaled by duration.
        </div>
      </div>
      <div className="p-4 rounded-2xl border border-border bg-muted">
        <div className="text-xs text-muted-foreground">AI Recommendations (Mock)</div>
        <div className="mt-1">
          Latest ACWR: <span className="font-semibold">{last.ACWR.toFixed(2)}</span>.
        </div>
        <div className="mt-1">{acwrNote}</div>
        <ul className="list-disc pl-5 mt-2 space-y-1 text-[13px]">
          <li>Schedule 2–3 easy days/week to manage ATL.</li>
          <li>Avoid extreme weekly load spikes (jumps &gt;30%).</li>
          <li>Pre-race: target FORM ≥ 5 & ACWR moderate zone.</li>
        </ul>
        <div className="text-[11px] text-muted-foreground mt-2">
          *Integration with AI: send row data to AI endpoint for truly dynamic insights.
        </div>
      </div>
    </div>
  );
}

export default Index;
