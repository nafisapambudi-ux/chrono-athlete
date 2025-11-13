import React, { useState, useMemo, useEffect } from "react";
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
 * HIROCROSS – Sport Performance Analyzer (Dark Theme + Logo)
 * Single File • 3 Halaman:
 * 1) Home
 * 2) Input Data (Multi-atlet + VJ → Power + sRPE & durasi)
 * 3) Analisis Performa (CTL, ATL, TSB, ACWR + AI Insight + Export PDF)
 *
 * NOTE LOGO:
 * - Simpan logo kamu di folder public, misalnya: public/hiro-logo.png
 * - Lalu sesuaikan path di <img src="/hiro-logo.png" ... />
 */

// RPE multipliers untuk baseline 60 menit
const RPE_MAP = {
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

function formatDate(d) {
  return d.toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

// Exponential moving average (EWMA) dengan time constant tau (hari)
function emaSeries(values, tau) {
  const alpha = 1 - Math.exp(-1 / tau);
  const out = [];
  let prev = 0;
  for (let i = 0; i < values.length; i++) {
    prev = prev + alpha * (values[i] - prev);
    out.push(prev);
  }
  return out;
}

// Rolling average untuk ACWR (window dalam hari)
function rollingAverage(values, window) {
  const out = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1);
    const sum = slice.reduce((a, b) => a + b, 0);
    out.push(sum / slice.length);
  }
  return out;
}

// Hitung Training Load per sesi dengan durasi (baseline 60 menit)
function sessionLoad(rpe, durationMin) {
  const mult = RPE_MAP[rpe].multiplier;
  return mult * (durationMin / 60);
}

// Helper – id simple
function genId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// Helper status Form (TSB)
function getFormStatus(value) {
  if (!isFinite(value)) {
    return {
      label: "Tidak ada data",
      color: "bg-slate-800 text-slate-300",
      text: "Form belum terbaca.",
    };
  }
  if (value < -10) {
    return {
      label: "Terlalu Lelah",
      color: "bg-red-900/60 text-red-200",
      text: "TSB sangat negatif, risiko fatigue tinggi.",
    };
  }
  if (value > 10) {
    return {
      label: "Siap Perform",
      color: "bg-emerald-900/60 text-emerald-200",
      text: "TSB positif, window bagus untuk sesi kunci / lomba.",
    };
  }
  return {
    label: "Netral",
    color: "bg-amber-900/60 text-amber-200",
    text: "Form moderat, boleh lanjut progres beban.",
  };
}

// Helper status ACWR
function getAcwrStatus(value) {
  if (!isFinite(value) || value === 0) {
    return {
      label: "Tidak ada data",
      color: "bg-slate-800 text-slate-300",
      text: "Butuh histori minimal beberapa minggu.",
    };
  }
  if (value > 1.5) {
    return {
      label: "> 1.5 (Tinggi)",
      color: "bg-red-900/60 text-red-200",
      text: "Risiko overload meningkat, turunkan beban beberapa hari.",
    };
  }
  if (value < 0.8) {
    return {
      label: "< 0.8 (Rendah)",
      color: "bg-amber-900/60 text-amber-200",
      text: "Beban mungkin kurang untuk adaptasi maksimal.",
    };
  }
  return {
    label: "0.8–1.3 (Aman)",
    color: "bg-emerald-900/60 text-emerald-200",
    text: "Zona moderat, keseimbangan stress–recovery cukup baik.",
  };
}

function App() {
  // Halaman: "home" | "input" | "analysis"
  const [currentPage, setCurrentPage] = useState("home");

  // ==== MULTI-ATLET CORE STATE ====
  const [athletes, setAthletes] = useState([]);
  const [activeAthleteId, setActiveAthleteId] = useState(null);

  // ==== FORM PROFIL (untuk atlet aktif / baru) ====
  const [name, setName] = useState("");
  const [mass, setMass] = useState(""); // kg
  const [bodyHeight, setBodyHeight] = useState(""); // cm
  const [vj, setVj] = useState(""); // vertical jump (cm)

  // ==== SESSIONS (untuk atlet aktif / baru) ====
  const [sessions, setSessions] = useState([]);

  // Form tambah sesi
  const [newDate, setNewDate] = useState(formatDate(new Date()));
  const [newDur, setNewDur] = useState(60);
  const [newRpe, setNewRpe] = useState(5);
  const [notes, setNotes] = useState("");

  // Saat ganti atlet aktif, load data ke form
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

  // Timeline harian kontinu + akumulasi load per hari
  const timeline = useMemo(() => {
    if (sessions.length === 0) return [];
    const sorted = [...sessions].sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    const start = new Date(sorted[0].date);
    const end = new Date(sorted[sorted.length - 1].date);
    const totalDays = daysBetween(start, end) + 1;

    const dayMap = {};
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
        rows: [],
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
    const ACWR = ACUTE.map((a, i) =>
      CHRONIC[i] > 0 ? a / CHRONIC[i] : 0
    );

    const rows = timeline.map((d, i) => ({
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

  // Simpan profil atlet (baru atau update)
  function saveAthlete() {
    if (!name) return;
    const athleteData = {
      id: activeAthleteId || genId(),
      name,
      mass: typeof mass === "number" ? mass : undefined,
      bodyHeight: typeof bodyHeight === "number" ? bodyHeight : undefined,
      vj: typeof vj === "number" ? vj : undefined,
      sessions,
    };

    setAthletes((prev) => {
      const exists = prev.find((a) => a.id === athleteData.id);
      if (exists) {
        return prev.map((a) =>
          a.id === athleteData.id ? athleteData : a
        );
      }
      return [...prev, athleteData];
    });

    if (!activeAthleteId) {
      setActiveAthleteId(athleteData.id);
    }
  }

  // Tambah sesi
  function addSession() {
    if (!newDate || typeof newDur !== "number" || !newRpe) return;
    const newSession = {
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
            a.id === activeAthleteId
              ? { ...a, sessions: updated }
              : a
          )
        );
      }

      return updated;
    });

    setNotes("");
  }

  // Hapus sesi
  function removeSession(idx) {
    setSessions((prev) => {
      const updated = prev.filter((_, i) => i !== idx);

      if (activeAthleteId) {
        setAthletes((prevAth) =>
          prevAth.map((a) =>
            a.id === activeAthleteId
              ? { ...a, sessions: updated }
              : a
          )
        );
      }

      return updated;
    });
  }

  // Import CSV (sesi) – untuk atlet aktif
  function importCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    const out = [];
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
            a.id === activeAthleteId
              ? { ...a, sessions: updated }
              : a
          )
        );
      }

      return updated;
    });
  }

  // Export CSV (sesi atlet aktif)
  function exportCSV() {
    const header = "date,duration_min,rpe,notes";
    const rows = sessions.map(
      (s) =>
        `${s.date},${s.duration},${s.rpe},${s.notes || ""}`
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (name || "athlete") + "_sessions.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // Export PDF → pakai print
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
      value: ctlAtlForm.rows.length
        ? ctlAtlForm.lastCTL.toFixed(1)
        : "—",
      hint: "EWMA τ = 42 hari",
    },
    {
      title: "Fatigue (ATL)",
      value: ctlAtlForm.rows.length
        ? ctlAtlForm.lastATL.toFixed(1)
        : "—",
      hint: "EWMA τ = 7 hari",
    },
    {
      title: "Form (TSB)",
      value: ctlAtlForm.rows.length
        ? ctlAtlForm.lastTSB.toFixed(1)
        : "—",
      hint: "CTL − ATL",
    },
    {
      title: "ACWR (7/28 hari)",
      value: ctlAtlForm.rows.length
        ? ctlAtlForm.lastACWR.toFixed(2)
        : "—",
      hint: "Acute / Chronic Load",
    },
  ];

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100">
      {/* NAVBAR / HEADER */}
      <header className="sticky top-0 z-10 bg-slate-900/90 backdrop-blur border-b border-slate-800 print:relative print:border-none">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/10 flex items-center justify-center overflow-hidden">
              {/* Ganti src dengan path logo kamu */}
              <img
                src="/hiro-logo.png"
                alt="HIROCROSS Logo"
                className="w-9 h-9 object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                HIROCROSS – Sport Performance Analyzer
              </h1>
              <p className="text-xs text-slate-400">
                Home • Input Data • Analisis Performa
              </p>
            </div>
          </div>

          {/* MENU HALAMAN */}
          <nav className="flex gap-2 text-xs font-medium">
            <button
              onClick={() => setCurrentPage("home")}
              className={
                "px-3 py-1.5 rounded-xl " +
                (currentPage === "home"
                  ? "bg-red-600 text-white"
                  : "bg-slate-800 text-slate-200 hover:bg-slate-700")
              }
            >
              Home
            </button>
            <button
              onClick={() => setCurrentPage("input")}
              className={
                "px-3 py-1.5 rounded-xl " +
                (currentPage === "input"
                  ? "bg-red-600 text-white"
                  : "bg-slate-800 text-slate-200 hover:bg-slate-700")
              }
            >
              Input Data
            </button>
            <button
              onClick={() => setCurrentPage("analysis")}
              className={
                "px-3 py-1.5 rounded-xl " +
                (currentPage === "analysis"
                  ? "bg-red-600 text-white"
                  : "bg-slate-800 text-slate-200 hover:bg-slate-700")
              }
            >
              Analisis
            </button>
          </nav>
        </div>
      </header>

      {/* KONTEN */}
      <main className="max-w-6xl mx-auto px-4 py-6 grid gap-6">
        {currentPage === "home" && <HomeSection />}

        {currentPage === "input" && (
          <InputSection
            athletes={athletes}
            activeAthleteId={activeAthleteId}
            setActiveAthleteId={setActiveAthleteId}
            name={name}
            setName={setName}
            mass={mass}
            setMass={setMass}
            bodyHeight={bodyHeight}
            setBodyHeight={setBodyHeight}
            vj={vj}
            setVj={setVj}
            sessions={sessions}
            setSessions={setSessions}
            newDate={newDate}
            setNewDate={setNewDate}
            newDur={newDur}
            setNewDur={setNewDur}
            newRpe={newRpe}
            setNewRpe={setNewRpe}
            notes={notes}
            setNotes={setNotes}
            saveAthlete={saveAthlete}
            addSession={addSession}
            removeSession={removeSession}
            importCSV={importCSV}
            exportCSV={exportCSV}
          />
        )}

        {currentPage === "analysis" && (
          <AnalysisSection
            name={name}
            ctlAtlForm={ctlAtlForm}
            formStatus={formStatus}
            acwrStatus={acwrStatus}
            summaryCards={summaryCards}
            exportPDF={exportPDF}
          />
        )}
      </main>
    </div>
  );
}

/* ====================== HOME ====================== */

function HomeSection() {
  return (
    <section className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm p-6 space-y-4">
      <h2 className="text-2xl font-bold">
        Selamat Datang di HIROCROSS Sport Performance Analyzer
      </h2>
      <p className="text-slate-300 text-sm">
        Platform ini dirancang untuk membantu pelatih dan atlet
        memonitor dan menganalisis performa latihan secara ilmiah
        dan praktis.
      </p>
      <ul className="list-disc pl-5 text-sm text-slate-200 space-y-1">
        <li>Mencatat sesi latihan dengan skala sRPE (1–10).</li>
        <li>
          Mengkonversi beban latihan menjadi Training Load harian
          (duration-scaled).
        </li>
        <li>
          Menghitung{" "}
          <span className="font-semibold">Fitness (CTL)</span>,{" "}
          <span className="font-semibold">Fatigue (ATL)</span>, dan{" "}
          <span className="font-semibold">Form (TSB)</span>.
        </li>
        <li>
          Memantau{" "}
          <span className="font-semibold">
            ACWR (Acute:Chronic Workload Ratio)
          </span>{" "}
          untuk manajemen risiko kelelahan.
        </li>
        <li>
          Menghubungkan data fisik dengan{" "}
          <span className="font-semibold">
            Vertical Jump → Peak Power
          </span>.
        </li>
      </ul>
      <div className="text-sm text-slate-400">
        Mulai dengan membuka menu{" "}
        <span className="font-semibold text-red-400">
          Input Data
        </span>{" "}
        untuk memasukkan latihan, kemudian lihat hasilnya di menu{" "}
        <span className="font-semibold text-red-400">
          Analisis
        </span>
        .
      </div>
    </section>
  );
}

/* ====================== INPUT DATA ====================== */

function InputSection(props) {
  const {
    athletes,
    activeAthleteId,
    setActiveAthleteId,
    name,
    setName,
    mass,
    setMass,
    bodyHeight,
    setBodyHeight,
    vj,
    setVj,
    sessions,
    setSessions,
    newDate,
    setNewDate,
    newDur,
    setNewDur,
    newRpe,
    setNewRpe,
    notes,
    setNotes,
    saveAthlete,
    addSession,
    removeSession,
    importCSV,
    exportCSV,
  } = props;

  const peakPowerDisplay =
    vj === "" || mass === ""
      ? "—"
      : Math.max(
          0,
          Math.round(
            60.7 * Number(vj) + 45.3 * Number(mass) - 2055
          )
        );

  return (
    <>
      {/* PILIH ATLET & SIMPAN */}
      <section className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-300">
              Pilih Atlet
            </label>
            <select
              className="border border-slate-700 bg-slate-800 rounded-lg px-2 py-1 text-sm min-w-[180px] text-slate-100"
              value={activeAthleteId || ""}
              onChange={(e) => {
                const v = e.target.value || null;
                setActiveAthleteId(v);
              }}
            >
              <option value="">
                — Tidak ada (Atlet Baru) —
              </option>
              {athletes.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name || "Tanpa nama"}
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
              className="px-3 py-1.5 rounded-xl border border-slate-700 text-xs bg-slate-800 text-slate-100 hover:bg-slate-700"
            >
              + Atlet Baru
            </button>

            <button
              type="button"
              onClick={saveAthlete}
              className="px-3 py-1.5 rounded-xl text-xs bg-red-600 text-white hover:bg-red-700"
            >
              Simpan Profil Atlet
            </button>
          </div>
        </div>
      </section>

      {/* PROFIL ATLET */}
      <section className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-red-600/20 flex items-center justify-center">
            <span>📊</span>
          </div>
          <h2 className="text-lg font-semibold">
            Profil Atlet & Vertical Jump
          </h2>
          <span className="text-xs text-slate-400">
            (VJ dikonversi ke Peak Power)
          </span>
        </div>
        <div className="grid md:grid-cols-5 gap-3">
          <div>
            <label className="text-xs text-slate-300">
              Nama
            </label>
            <input
              className="w-full border border-slate-700 bg-slate-800 rounded-lg px-2 py-1.5 text-sm text-slate-100"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama atlet"
            />
          </div>
          <div>
            <label className="text-xs text-slate-300">
              Berat Badan (kg)
            </label>
            <input
              type="number"
              className="w-full border border-slate-700 bg-slate-800 rounded-lg px-2 py-1.5 text-sm text-slate-100"
              value={mass}
              onChange={(e) =>
                setMass(
                  e.target.value === ""
                    ? ""
                    : Number(e.target.value)
                )
              }
              placeholder="70"
            />
          </div>
          <div>
            <label className="text-xs text-slate-300">
              Tinggi Badan (cm)
            </label>
            <input
              type="number"
              className="w-full border border-slate-700 bg-slate-800 rounded-lg px-2 py-1.5 text-sm text-slate-100"
              value={bodyHeight}
              onChange={(e) =>
                setBodyHeight(
                  e.target.value === ""
                    ? ""
                    : Number(e.target.value)
                )
              }
              placeholder="170"
            />
          </div>
          <div>
            <label className="text-xs text-slate-300">
              Vertical Jump (cm)
            </label>
            <input
              type="number"
              className="w-full border border-slate-700 bg-slate-800 rounded-lg px-2 py-1.5 text-sm text-slate-100"
              value={vj}
              onChange={(e) =>
                setVj(
                  e.target.value === ""
                    ? ""
                    : Number(e.target.value)
                )
              }
              placeholder="45"
            />
          </div>
          <div>
            <label className="text-xs text-slate-300">
              Peak Power (W)
            </label>
            <input
              readOnly
              className="w-full border border-slate-700 bg-slate-800 rounded-lg px-2 py-1.5 text-sm text-slate-200"
              value={peakPowerDisplay}
            />
          </div>
        </div>
      </section>

      {/* SESI LATIHAN */}
      <section className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <span>➕</span>
          </div>
          <h2 className="text-lg font-semibold">
            Catat Sesi Latihan (sRPE)
          </h2>
        </div>

        <div className="grid md:grid-cols-6 gap-3 items-end mb-4">
          <div className="md:col-span-2">
            <label className="text-xs text-slate-300">
              Tanggal
            </label>
            <input
              type="date"
              className="w-full border border-slate-700 bg-slate-800 rounded-lg px-2 py-1.5 text-sm text-slate-100"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-slate-300">
              Durasi (menit)
            </label>
            <input
              type="number"
              className="w-full border border-slate-700 bg-slate-800 rounded-lg px-2 py-1.5 text-sm text-slate-100"
              value={newDur}
              onChange={(e) =>
                setNewDur(
                  e.target.value === ""
                    ? ""
                    : Number(e.target.value)
                )
              }
              placeholder="60"
            />
          </div>
          <div>
            <label className="text-xs text-slate-300">
              RPE (1–10)
            </label>
            <select
              className="w-full border border-slate-700 bg-slate-800 rounded-lg px-2 py-1.5 text-sm text-slate-100"
              value={String(newRpe)}
              onChange={(e) =>
                setNewRpe(Number(e.target.value))
              }
            >
              {Object.entries(RPE_MAP).map(([k, v]) => (
                <option key={k} value={k}>
                  {k} {v.label}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-slate-300">
              Catatan
            </label>
            <input
              className="w-full border border-slate-700 bg-slate-800 rounded-lg px-2 py-1.5 text-sm text-slate-100"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Isi singkat sesi (opsional)"
            />
          </div>
          <div>
            <button
              type="button"
              onClick={addSession}
              className="w-full px-3 py-2 rounded-xl text-sm bg-blue-600 text-white hover:bg-blue-700"
            >
              Tambah
            </button>
          </div>
        </div>

        {/* Tabel sesi */}
        {sessions.length > 0 && (
          <div className="overflow-auto border border-slate-800 rounded-xl bg-slate-900 mb-4">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-800">
                <tr>
                  <th className="text-left p-2">Tanggal</th>
                  <th className="text-right p-2">
                    Durasi (min)
                  </th>
                  <th className="text-right p-2">RPE</th>
                  <th className="p-2 text-left">Catatan</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {sessions
                  .slice()
                  .sort((a, b) =>
                    a.date.localeCompare(b.date)
                  )
                  .map((s, idx) => (
                    <tr
                      key={idx}
                      className="border-t border-slate-800 last:border-b bg-slate-900"
                    >
                      <td className="p-2">{s.date}</td>
                      <td className="p-2 text-right">
                        {s.duration}
                      </td>
                      <td className="p-2 text-right">
                        {s.rpe} {RPE_MAP[s.rpe]?.label}
                      </td>
                      <td className="p-2">{s.notes}</td>
                      <td className="p-2 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            removeSession(idx)
                          }
                          className="text-xs text-red-400 hover:underline"
                        >
                          Hapus
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
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 cursor-pointer text-xs text-slate-100 hover:bg-slate-700">
            <span>⬆️ Impor CSV</span>
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
            className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-800 text-xs text-slate-100 hover:bg-slate-700"
          >
            ⬇️ Ekspor CSV
          </button>
        </div>
      </section>
    </>
  );
}

/* ====================== ANALISIS ====================== */

function AnalysisSection({
  name,
  ctlAtlForm,
  formStatus,
  acwrStatus,
  summaryCards,
  exportPDF,
}) {
  return (
    <>
      <section className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 flex items-center justify-center">
            <span>📈</span>
          </div>
          <h2 className="text-lg font-semibold">
            Dashboard • Fitness / Fatigue / Form / ACWR
          </h2>
          <div className="ml-auto">
            <button
              onClick={exportPDF}
              className="px-3 py-1.5 rounded-xl border border-slate-700 text-xs bg-slate-800 text-slate-100 hover:bg-slate-700"
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
              <div className="p-3 rounded-2xl border border-slate-700 bg-slate-800">
                <div className="text-xs text-slate-300">
                  {c.title}
                </div>
                <div className="text-xl font-semibold mt-1 text-slate-50">
                  {c.value}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {c.hint}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Traffic light status */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div
            className={`px-3 py-2 rounded-2xl text-xs font-medium flex flex-col gap-1 ${formStatus.color}`}
          >
            <span>Form (TSB): {formStatus.label}</span>
            <span className="text-[11px] opacity-80">
              {formStatus.text}
            </span>
          </div>
          <div
            className={`px-3 py-2 rounded-2xl text-xs font-medium flex flex-col gap-1 ${acwrStatus.color}`}
          >
            <span>ACWR: {acwrStatus.label}</span>
            <span className="text-[11px] opacity-80">
              {acwrStatus.text}
            </span>
          </div>
        </div>

        {/* Charts */}
        {ctlAtlForm.rows.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="h-72 p-3 rounded-2xl border border-slate-700 bg-slate-900">
              <div className="text-sm font-medium mb-2 text-slate-100">
                Training Load Harian
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ctlAtlForm.rows}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "#e5e7eb" }}
                  />
                  <YAxis tick={{ fontSize: 10, fill: "#e5e7eb" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#020617",
                      borderColor: "#1f2937",
                      color: "#e5e7eb",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="load" name="Load" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="h-72 p-3 rounded-2xl border border-slate-700 bg-slate-900">
              <div className="text-sm font-medium mb-2 text-slate-100">
                CTL / ATL / FORM
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ctlAtlForm.rows}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "#e5e7eb" }}
                  />
                  <YAxis tick={{ fontSize: 10, fill: "#e5e7eb" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#020617",
                      borderColor: "#1f2937",
                      color: "#e5e7eb",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="CTL"
                    stroke="#10b981"
                    dot={false}
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="ATL"
                    stroke="#ef4444"
                    dot={false}
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="FORM"
                    stroke="#f59e0b"
                    dot={false}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="h-72 p-3 rounded-2xl border border-slate-700 bg-slate-900 md:col-span-2">
              <div className="text-sm font-medium mb-2 text-slate-100">
                ACWR (Acute / Chronic)
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ctlAtlForm.rows}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "#e5e7eb" }}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#e5e7eb" }}
                    domain={[0, 3]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#020617",
                      borderColor: "#1f2937",
                      color: "#e5e7eb",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="ACWR"
                    stroke="#8b5cf6"
                    dot={false}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-300">
            Belum ada data sesi. Tambahkan latihan di menu{" "}
            <span className="font-semibold text-red-300">
              Input Data
            </span>{" "}
            untuk melihat grafik.
          </div>
        )}
      </section>

      {/* AI INSIGHTS */}
      <section className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm p-4 mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-xl bg-fuchsia-500/20 flex items-center justify-center">
            <span>🤖</span>
          </div>
          <h2 className="text-lg font-semibold">
            AI Insights (Lovalabs • Preview)
          </h2>
        </div>
        <InsightsPanel rows={ctlAtlForm.rows} name={name} />
      </section>
    </>
  );
}

function InsightsPanel({ rows, name }) {
  if (!rows || rows.length < 7) {
    return (
      <div className="text-sm text-slate-300">
        Tambahkan minimal 7 hari data untuk insight yang lebih
        bermakna.
      </div>
    );
  }

  const last = rows[rows.length - 1];
  const prev = rows[rows.length - 2];
  const trend =
    last.CTL > prev.CTL
      ? "naik"
      : last.CTL < prev.CTL
      ? "turun"
      : "stabil";

  let formNote = "";
  if (last.FORM < -10) {
    formNote =
      "Form rendah (TSB negatif). Pertimbangkan recovery 1–2 hari.";
  } else if (last.FORM > 10) {
    formNote =
      "Form positif—cocok untuk sesi kunci / test.";
  } else {
    formNote =
      "Form netral. Lanjutkan progres bertahap (≤5–8%/minggu).";
  }

  let acwrNote = "";
  if (last.ACWR > 1.5) {
    acwrNote =
      "ACWR tinggi (>1.5) – waspadai risiko kelelahan / cedera, kurangi load beberapa hari.";
  } else if (last.ACWR < 0.8) {
    acwrNote =
      "ACWR rendah (<0.8) – beban mungkin terlalu sedikit untuk adaptasi maksimal.";
  } else {
    acwrNote =
      "ACWR dalam zona moderat (≈0.8–1.3) – keseimbangan beban cukup baik.";
  }

  const lastName = name || "Atlet";

  const avg7 =
    rows.slice(-7).reduce((a, b) => a + b.load, 0) / 7;
  const avg21 =
    rows
      .slice(-21)
      .reduce((a, b) => a + (b?.load || 0), 0) /
    Math.min(21, rows.length);

  return (
    <div className="grid md:grid-cols-3 gap-3 text-sm">
      <div className="p-4 rounded-2xl border border-slate-700 bg-slate-800">
        <div className="text-xs text-slate-300">
          Ringkasan AI
        </div>
        <div className="mt-1 text-slate-100">
          <span className="font-semibold">{lastName}</span>{" "}
          menunjukkan tren fitness{" "}
          <span className="font-semibold">{trend}</span>{" "}
          dibanding hari sebelumnya.
        </div>
        <div className="mt-1 text-slate-200">
          {formNote}
        </div>
      </div>
      <div className="p-4 rounded-2xl border border-slate-700 bg-slate-800">
        <div className="text-xs text-slate-300">
          Beban Rata-rata
        </div>
        <div className="mt-1 text-slate-100">
          7 hari:{" "}
          <span className="font-semibold">
            {avg7.toFixed(2)}
          </span>
        </div>
        <div className="text-slate-100">
          ~21 hari:{" "}
          <span className="font-semibold">
            {avg21.toFixed(2)}
          </span>
        </div>
        <div className="text-[11px] text-slate-400 mt-2">
          Skala load mengikuti mapping sRPE @60' dan
          diskalakan oleh durasi.
        </div>
      </div>
      <div className="p-4 rounded-2xl border border-slate-700 bg-slate-800">
        <div className="text-xs text-slate-300">
          Rekomendasi AI (Mock)
        </div>
        <div className="mt-1 text-slate-100">
          ACWR terakhir:{" "}
          <span className="font-semibold">
            {last.ACWR.toFixed(2)}
          </span>
          .
        </div>
        <div className="mt-1 text-slate-200">
          {acwrNote}
        </div>
        <ul className="list-disc pl-5 mt-2 space-y-1 text-[13px] text-slate-200">
          <li>
            Atur 2–3 hari mudah/minggu untuk kelola ATL.
          </li>
          <li>
            Hindari lonjakan beban mingguan ekstrem
            (lonjakan &gt;30%).
          </li>
          <li>
            Menjelang lomba: target FORM ≥ 5 & ACWR zona
            moderat.
          </li>
        </ul>
        <div className="text-[11px] text-slate-500 mt-2">
          *Integrasi ke Lovalabs: kirim data rows ke endpoint
          AI untuk insight yang benar-benar dinamis.
        </div>
      </div>
    </div>
  );
}

export default App;