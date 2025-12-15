import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Activity, Zap, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { format, parseISO } from "date-fns";

interface ReadinessData {
  readiness_date: string;
  readiness_score: number | null;
  vo2max: number | null;
  power: number | null;
}

interface ReadinessStatsCardProps {
  readinessData: ReadinessData[];
  latestReadiness?: ReadinessData;
}

// Thresholds for indicators
const READINESS_THRESHOLDS = { low: 60, high: 80 };
const VO2MAX_THRESHOLDS = { low: 35, high: 50 };
const POWER_THRESHOLDS = { low: 1500, high: 2500 };

function getIndicator(value: number, thresholds: { low: number; high: number }) {
  if (value < thresholds.low) return { level: "Low", color: "text-red-400", bgColor: "bg-red-500/20", borderColor: "border-red-500/50" };
  if (value < thresholds.high) return { level: "Med", color: "text-amber-400", bgColor: "bg-amber-500/20", borderColor: "border-amber-500/50" };
  return { level: "High", color: "text-emerald-400", bgColor: "bg-emerald-500/20", borderColor: "border-emerald-500/50" };
}

function getIndicatorIcon(level: string) {
  if (level === "High") return <TrendingUp className="h-4 w-4" />;
  if (level === "Low") return <TrendingDown className="h-4 w-4" />;
  return <Minus className="h-4 w-4" />;
}

export function ReadinessStatsCard({ readinessData, latestReadiness }: ReadinessStatsCardProps) {
  // Prepare chart data
  const chartData = readinessData
    .sort((a, b) => new Date(a.readiness_date).getTime() - new Date(b.readiness_date).getTime())
    .map(r => ({
      date: format(parseISO(r.readiness_date), "dd/MM"),
      readiness: r.readiness_score || 0,
      vo2max: r.vo2max || 0,
      power: r.power || 0,
    }));

  // Calculate statistics
  const calculateStats = (data: number[]) => {
    if (data.length === 0) return { avg: 0, low: 0, peak: 0 };
    const filtered = data.filter(v => v > 0);
    if (filtered.length === 0) return { avg: 0, low: 0, peak: 0 };
    return {
      avg: filtered.reduce((a, b) => a + b, 0) / filtered.length,
      low: Math.min(...filtered),
      peak: Math.max(...filtered),
    };
  };

  const readinessStats = calculateStats(chartData.map(d => d.readiness));
  const vo2maxStats = calculateStats(chartData.map(d => d.vo2max));
  const powerStats = calculateStats(chartData.map(d => d.power));

  const currentReadiness = latestReadiness?.readiness_score || 0;
  const currentVO2max = latestReadiness?.vo2max || 0;
  const currentPower = latestReadiness?.power || 0;

  const readinessIndicator = getIndicator(currentReadiness, READINESS_THRESHOLDS);
  const vo2maxIndicator = getIndicator(currentVO2max, VO2MAX_THRESHOLDS);
  const powerIndicator = getIndicator(currentPower, POWER_THRESHOLDS);

  return (
    <div className="space-y-6">
      {/* Stats Cards with Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Readiness Score Card */}
        <Card className={`bg-slate-900 border ${readinessIndicator.borderColor}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Readiness Score</CardTitle>
            <Heart className={`h-4 w-4 ${readinessIndicator.color}`} />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-slate-50">{currentReadiness.toFixed(1)}%</div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${readinessIndicator.bgColor} ${readinessIndicator.color}`}>
                {getIndicatorIcon(readinessIndicator.level)}
                <span className="text-xs font-semibold">{readinessIndicator.level}</span>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <p className="text-slate-500">Avg</p>
                <p className="font-semibold text-slate-300">{readinessStats.avg.toFixed(1)}</p>
              </div>
              <div className="text-center">
                <p className="text-slate-500">Low</p>
                <p className="font-semibold text-red-400">{readinessStats.low.toFixed(1)}</p>
              </div>
              <div className="text-center">
                <p className="text-slate-500">Peak</p>
                <p className="font-semibold text-emerald-400">{readinessStats.peak.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* VO2max Card */}
        <Card className={`bg-slate-900 border ${vo2maxIndicator.borderColor}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">VO2max</CardTitle>
            <Activity className={`h-4 w-4 ${vo2maxIndicator.color}`} />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-slate-50">{currentVO2max.toFixed(1)}</div>
                <p className="text-xs text-slate-500">ml/kg/min</p>
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${vo2maxIndicator.bgColor} ${vo2maxIndicator.color}`}>
                {getIndicatorIcon(vo2maxIndicator.level)}
                <span className="text-xs font-semibold">{vo2maxIndicator.level}</span>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <p className="text-slate-500">Avg</p>
                <p className="font-semibold text-slate-300">{vo2maxStats.avg.toFixed(1)}</p>
              </div>
              <div className="text-center">
                <p className="text-slate-500">Low</p>
                <p className="font-semibold text-red-400">{vo2maxStats.low.toFixed(1)}</p>
              </div>
              <div className="text-center">
                <p className="text-slate-500">Peak</p>
                <p className="font-semibold text-emerald-400">{vo2maxStats.peak.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Power Card */}
        <Card className={`bg-slate-900 border ${powerIndicator.borderColor}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Power</CardTitle>
            <Zap className={`h-4 w-4 ${powerIndicator.color}`} />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-slate-50">{currentPower.toFixed(0)}</div>
                <p className="text-xs text-slate-500">watts</p>
              </div>
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${powerIndicator.bgColor} ${powerIndicator.color}`}>
                {getIndicatorIcon(powerIndicator.level)}
                <span className="text-xs font-semibold">{powerIndicator.level}</span>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <p className="text-slate-500">Avg</p>
                <p className="font-semibold text-slate-300">{powerStats.avg.toFixed(0)}</p>
              </div>
              <div className="text-center">
                <p className="text-slate-500">Low</p>
                <p className="font-semibold text-red-400">{powerStats.low.toFixed(0)}</p>
              </div>
              <div className="text-center">
                <p className="text-slate-500">Peak</p>
                <p className="font-semibold text-emerald-400">{powerStats.peak.toFixed(0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Readiness Chart */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg text-slate-200">Readiness Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                  <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
                    labelStyle={{ color: "#94a3b8" }}
                  />
                  <ReferenceLine y={readinessStats.avg} stroke="#8b5cf6" strokeDasharray="5 5" label={{ value: "Avg", fill: "#8b5cf6", fontSize: 10 }} />
                  <ReferenceLine y={READINESS_THRESHOLDS.low} stroke="#ef4444" strokeDasharray="3 3" />
                  <ReferenceLine y={READINESS_THRESHOLDS.high} stroke="#22c55e" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="readiness" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: "#8b5cf6", r: 3 }} name="Readiness %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* VO2max Chart */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg text-slate-200">VO2max Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
                    labelStyle={{ color: "#94a3b8" }}
                  />
                  <ReferenceLine y={vo2maxStats.avg} stroke="#06b6d4" strokeDasharray="5 5" label={{ value: "Avg", fill: "#06b6d4", fontSize: 10 }} />
                  <ReferenceLine y={VO2MAX_THRESHOLDS.low} stroke="#ef4444" strokeDasharray="3 3" />
                  <ReferenceLine y={VO2MAX_THRESHOLDS.high} stroke="#22c55e" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="vo2max" stroke="#06b6d4" strokeWidth={2} dot={{ fill: "#06b6d4", r: 3 }} name="VO2max" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Power Chart */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg text-slate-200">Power Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
                    labelStyle={{ color: "#94a3b8" }}
                  />
                  <ReferenceLine y={powerStats.avg} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: "Avg", fill: "#f59e0b", fontSize: 10 }} />
                  <ReferenceLine y={POWER_THRESHOLDS.low} stroke="#ef4444" strokeDasharray="3 3" />
                  <ReferenceLine y={POWER_THRESHOLDS.high} stroke="#22c55e" strokeDasharray="3 3" />
                  <Line type="monotone" dataKey="power" stroke="#f59e0b" strokeWidth={2} dot={{ fill: "#f59e0b", r: 3 }} name="Power (W)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Export stats calculation for AI analysis
export function getReadinessStatsForAI(readinessData: ReadinessData[]) {
  const calculateStats = (data: number[]) => {
    const filtered = data.filter(v => v > 0);
    if (filtered.length === 0) return { avg: 0, low: 0, peak: 0 };
    return {
      avg: filtered.reduce((a, b) => a + b, 0) / filtered.length,
      low: Math.min(...filtered),
      peak: Math.max(...filtered),
    };
  };

  const readinessValues = readinessData.map(d => d.readiness_score || 0);
  const vo2maxValues = readinessData.map(d => d.vo2max || 0);
  const powerValues = readinessData.map(d => d.power || 0);

  return {
    readiness: calculateStats(readinessValues),
    vo2max: calculateStats(vo2maxValues),
    power: calculateStats(powerValues),
    currentReadiness: readinessData[0]?.readiness_score || 0,
    currentVO2max: readinessData[0]?.vo2max || 0,
    currentPower: readinessData[0]?.power || 0,
  };
}
