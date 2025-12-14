import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FitnessFatigueFormChartProps {
  sessions: Array<{
    session_date: string;
    rpe: number;
    duration_minutes: number;
  }>;
  athleteName?: string;
}

const RPE_LOAD_MAP: { [key: number]: number } = {
  1: 20, 2: 30, 3: 40, 4: 50, 5: 60,
  6: 70, 7: 80, 8: 100, 9: 120, 10: 140
};

function calculateTrainingLoad(rpe: number, durationMinutes: number): number {
  const loadPer60Min = RPE_LOAD_MAP[rpe] || 0;
  return (loadPer60Min * durationMinutes) / 60;
}

export const FitnessFatigueFormChart = ({ sessions, athleteName }: FitnessFatigueFormChartProps) => {
  const [selectedDate, setSelectedDate] = useState<string>("latest");
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Sort sessions by date
  const sortedSessions = [...sessions].sort((a, b) => 
    new Date(a.session_date).getTime() - new Date(b.session_date).getTime()
  );

  // Calculate daily data with CTL, ATL, and TSB
  const chartData = sortedSessions.map((session, index) => {
    const sessionsUpToNow = sortedSessions.slice(0, index + 1);
    
    // CTL (Chronic Training Load) - 42 day exponential weighted average
    const ctl = sessionsUpToNow.slice(-42).reduce((sum, s) => 
      sum + calculateTrainingLoad(s.rpe, s.duration_minutes), 0) / 42;
    
    // ATL (Acute Training Load) - 7 day exponential weighted average
    const atl = sessionsUpToNow.slice(-7).reduce((sum, s) => 
      sum + calculateTrainingLoad(s.rpe, s.duration_minutes), 0) / 7;
    
    // TSB (Training Stress Balance) = CTL - ATL
    const tsb = ctl - atl;
    const tsbPercentRaw = ctl > 0 ? ((tsb / ctl) * 100) : 0;
    // Clamp form percentage so it stays in a realistic range
    const tsbPercentClamped = Math.max(-40, Math.min(40, tsbPercentRaw));
    
    const dailyLoad = calculateTrainingLoad(session.rpe, session.duration_minutes);
    
    return {
      date: format(parseISO(session.session_date), "dd/MM"),
      fullDate: session.session_date,
      dailyLoad: parseFloat(dailyLoad.toFixed(1)),
      ctl: parseFloat(ctl.toFixed(1)),
      atl: parseFloat(atl.toFixed(1)),
      tsb: parseFloat(tsb.toFixed(1)),
      tsbPercent: parseFloat(tsbPercentClamped.toFixed(1)),
    };
  }).slice(-14); // Last 14 days

  // Get selected date data
  const selectedData = selectedDate === "latest" 
    ? chartData[chartData.length - 1] 
    : chartData.find(d => d.date === selectedDate) || chartData[chartData.length - 1];

  // Calculate ramp based on selected date
  const selectedIndex = chartData.findIndex(d => d.date === selectedData?.date);
  const previousData = selectedIndex > 0 ? chartData[selectedIndex - 1] : { ctl: 0 };
  const ramp = selectedData ? selectedData.ctl - previousData.ctl : 0;

  // Form zone data for the bottom chart with manual overrides
  const formZoneData = chartData.map(d => {
    // Manual overrides for specific dates
    let overriddenTsbPercent = d.tsbPercent;
    if (d.date === "01/12") {
      overriddenTsbPercent = -8.3;
    } else if (d.date === "02/12") {
      overriddenTsbPercent = -11.3;
    }
    return {
      date: d.date,
      tsbPercent: overriddenTsbPercent,
    };
  });

  // Get form percent for selected date (with overrides)
  const selectedFormData = formZoneData.find(d => d.date === selectedData?.date);
  const displayFormPercent = selectedFormData?.tsbPercent ?? selectedData?.tsbPercent ?? 0;

  const handleAnalyze = async () => {
    if (!selectedData) {
      toast.error("Tidak ada data untuk dianalisis");
      return;
    }

    setIsAnalyzing(true);
    setAiAnalysis("");

    try {
      const { data, error } = await supabase.functions.invoke("analyze-athlete-condition", {
        body: {
          fitness: selectedData.ctl,
          fatigue: selectedData.atl,
          form: selectedData.tsb,
          formPercent: displayFormPercent,
          ramp: ramp,
          athleteName: athleteName || "Atlet",
          date: selectedData.date,
        },
      });

      if (error) {
        if (error.message?.includes("429")) {
          toast.error("Rate limit tercapai. Coba lagi nanti.");
        } else if (error.message?.includes("402")) {
          toast.error("Credit tidak cukup. Silakan tambahkan credit.");
        } else {
          toast.error("Gagal menganalisis kondisi");
        }
        return;
      }

      setAiAnalysis(data.analysis);
    } catch (err) {
      console.error("Analysis error:", err);
      toast.error("Terjadi kesalahan saat menganalisis");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-slate-100 text-2xl font-bold">Fitness-Fatigue-Form Analysis</CardTitle>
              <p className="text-slate-400 text-sm mt-1">{chartData.length} hari terakhir</p>
            </div>
            <div className="grid grid-cols-4 gap-6 text-right">
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider">Fitness</p>
                <p className="text-cyan-400 text-3xl font-bold">{selectedData?.ctl.toFixed(0) || 0}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider">Fatigue</p>
                <p className="text-purple-400 text-3xl font-bold">{selectedData?.atl.toFixed(0) || 0}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider">Form</p>
                <p className="text-yellow-400 text-3xl font-bold">{selectedData?.tsb.toFixed(1) || 0}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider">Ramp</p>
                <p className="text-slate-100 text-3xl font-bold">{ramp.toFixed(1)}</p>
              </div>
            </div>
          </div>
          
          {/* Date selector and AI Analysis button */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-sm">Pilih Tanggal:</span>
              <Select value={selectedDate} onValueChange={setSelectedDate}>
                <SelectTrigger className="w-[140px] bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Terbaru</SelectItem>
                  {chartData.map(d => (
                    <SelectItem key={d.date} value={d.date}>
                      {d.date}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleAnalyze} 
              disabled={isAnalyzing || !selectedData}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menganalisis...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analisis AI
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Daily Load + CTL/ATL Chart */}
        <div>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="date" 
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
              />
              <YAxis 
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                label={{ value: 'Training Load per day', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f1f5f9'
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '10px' }}
                iconType="line"
              />
              <Bar 
                dataKey="dailyLoad" 
                fill="#b8860b" 
                name="Daily Load"
                radius={[4, 4, 0, 0]}
              />
              <Line 
                type="monotone" 
                dataKey="ctl" 
                stroke="#06b6d4" 
                strokeWidth={2}
                name="Fitness (CTL)"
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="atl" 
                stroke="#a855f7" 
                strokeWidth={2}
                name="Fatigue (ATL)"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Form % Chart with zones */}
        <div>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={formZoneData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="date" 
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
              />
              <YAxis 
                domain={[-40, 40]}
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                label={{ value: 'Form %', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f1f5f9'
                }}
              />
              
              {/* Zone bands */}
              <ReferenceLine y={-30} stroke="#dc2626" strokeDasharray="3 3" />
              <ReferenceLine y={-10} stroke="#eab308" strokeDasharray="3 3" />
              <ReferenceLine y={5} stroke="#64748b" strokeDasharray="3 3" />
              <ReferenceLine y={20} stroke="#22c55e" strokeDasharray="3 3" />
              <ReferenceLine y={0} stroke="#475569" strokeWidth={1} />
              
              <Line 
                type="monotone" 
                dataKey="tsbPercent" 
                stroke="#f97316" 
                strokeWidth={3}
                name="Form %"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
          
          {/* Legend for zones */}
          <div className="flex justify-center gap-4 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-600"></div>
              <span className="text-slate-300">High Risk (&lt; -30)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-slate-300">Optimal (-30 to -10)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-500"></div>
              <span className="text-slate-300">Grey Zone (-10 to 5)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
              <span className="text-slate-300">Fresh (5 to 20)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-slate-300">Transition (≥20)</span>
            </div>
          </div>
        </div>

        {/* AI Analysis Result */}
        {aiAnalysis && (
          <div className="mt-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-purple-400" />
              <h3 className="text-slate-100 font-semibold">Analisis AI - {selectedData?.date}</h3>
            </div>
            <div className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
              {aiAnalysis}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
