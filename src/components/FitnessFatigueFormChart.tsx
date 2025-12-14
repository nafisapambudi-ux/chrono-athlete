import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO } from "date-fns";
import { Info } from "lucide-react";

interface FitnessFatigueFormChartProps {
  sessions: Array<{
    session_date: string;
    rpe: number;
    duration_minutes: number;
  }>;
}

const RPE_LOAD_MAP: { [key: number]: number } = {
  1: 20, 2: 30, 3: 40, 4: 50, 5: 60,
  6: 70, 7: 80, 8: 100, 9: 120, 10: 140
};

function calculateTrainingLoad(rpe: number, durationMinutes: number): number {
  const loadPer60Min = RPE_LOAD_MAP[rpe] || 0;
  return (loadPer60Min * durationMinutes) / 60;
}

// Custom tooltip for Form chart with explanation
const FormTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const formValue = payload[0].value;
    let interpretation = "";
    let color = "";
    
    if (formValue < -30) {
      interpretation = "High Risk: Kemungkinan overtraining tinggi, perlu recovery";
      color = "text-red-400";
    } else if (formValue >= -30 && formValue < -10) {
      interpretation = "Optimal: Zona ideal untuk performa puncak";
      color = "text-green-400";
    } else if (formValue >= -10 && formValue < 5) {
      interpretation = "Grey Zone: Kondisi netral, perlu monitoring";
      color = "text-slate-400";
    } else if (formValue >= 5 && formValue < 20) {
      interpretation = "Fresh: Tubuh segar, siap untuk latihan berat";
      color = "text-emerald-400";
    } else {
      interpretation = "Transition: Detraining mungkin terjadi";
      color = "text-yellow-400";
    }
    
    return (
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
        <p className="text-slate-300 font-medium mb-1">Tanggal: {label}</p>
        <p className="text-orange-400 font-bold text-lg">Form: {formValue.toFixed(1)}</p>
        <p className={`text-sm mt-2 ${color}`}>
          <Info className="inline w-4 h-4 mr-1" />
          {interpretation}
        </p>
        <p className="text-slate-500 text-xs mt-2">
          Form = Fatigue (ATL) - Fitness (CTL)
        </p>
      </div>
    );
  }
  return null;
};

export const FitnessFatigueFormChart = ({ sessions }: FitnessFatigueFormChartProps) => {
  // Sort sessions by date
  const sortedSessions = [...sessions].sort((a, b) => 
    new Date(a.session_date).getTime() - new Date(b.session_date).getTime()
  );

  // Calculate daily data with CTL, ATL, and TSB
  const chartData = sortedSessions.map((session, index) => {
    const sessionsUpToNow = sortedSessions.slice(0, index + 1);
    
    // CTL (Chronic Training Load) - average of last 42 sessions (or all if less)
    const ctlSessions = sessionsUpToNow.slice(-42);
    const ctlSum = ctlSessions.reduce((sum, s) => 
      sum + calculateTrainingLoad(s.rpe, s.duration_minutes), 0);
    const ctl = ctlSessions.length > 0 ? ctlSum / ctlSessions.length : 0;
    
    // ATL (Acute Training Load) - average of last 7 sessions (or all if less)
    const atlSessions = sessionsUpToNow.slice(-7);
    const atlSum = atlSessions.reduce((sum, s) => 
      sum + calculateTrainingLoad(s.rpe, s.duration_minutes), 0);
    const atl = atlSessions.length > 0 ? atlSum / atlSessions.length : 0;
    
    // Form = Fatigue - Fitness (ATL - CTL)
    const tsb = atl - ctl;
    
    const dailyLoad = calculateTrainingLoad(session.rpe, session.duration_minutes);
    
    return {
      date: format(parseISO(session.session_date), "dd/MM"),
      fullDate: session.session_date,
      dailyLoad: parseFloat(dailyLoad.toFixed(1)),
      ctl: parseFloat(ctl.toFixed(1)),
      atl: parseFloat(atl.toFixed(1)),
      tsb: parseFloat(tsb.toFixed(1)),
    };
  }).slice(-14); // Last 14 days

  // Calculate current metrics
  const latestData = chartData[chartData.length - 1] || { ctl: 0, atl: 0, tsb: 0 };
  const previousData = chartData[chartData.length - 2] || { ctl: 0 };
  const ramp = latestData.ctl - previousData.ctl;

  // Form zone data for the bottom chart
  const formZoneData = chartData.map(d => ({
    date: d.date,
    tsb: d.tsb,
  }));

  // Get form zone label
  const getFormZone = (value: number) => {
    if (value < -30) return { label: "High Risk", color: "text-red-400" };
    if (value >= -30 && value < -10) return { label: "Optimal", color: "text-green-400" };
    if (value >= -10 && value < 5) return { label: "Grey Zone", color: "text-slate-400" };
    if (value >= 5 && value < 20) return { label: "Fresh", color: "text-emerald-400" };
    return { label: "Transition", color: "text-yellow-400" };
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-slate-100 text-2xl font-bold">Fitness-Fatigue-Form Analysis</CardTitle>
            <p className="text-slate-400 text-sm mt-1">{chartData.length} hari terakhir</p>
          </div>
          <div className="grid grid-cols-4 gap-6 text-right">
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wider">Fitness</p>
              <p className="text-cyan-400 text-3xl font-bold">{latestData.ctl.toFixed(0)}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wider">Fatigue</p>
              <p className="text-purple-400 text-3xl font-bold">{latestData.atl.toFixed(0)}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wider">Form</p>
              <p className="text-yellow-400 text-3xl font-bold">{latestData.tsb.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-wider">Ramp</p>
              <p className="text-slate-100 text-3xl font-bold">{ramp.toFixed(1)}</p>
            </div>
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

        {/* Form Chart with zones and custom tooltip */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-slate-300 font-semibold">Form (Fatigue - Fitness)</h3>
            <div className="group relative">
              <Info className="w-4 h-4 text-slate-500 cursor-help" />
              <div className="absolute left-0 bottom-6 hidden group-hover:block bg-slate-800 border border-slate-600 rounded-lg p-3 w-72 z-10 shadow-lg">
                <p className="text-slate-300 text-xs mb-2 font-semibold">Interpretasi Form:</p>
                <ul className="text-xs space-y-1">
                  <li className="text-red-400">• Negatif besar (&lt;-30): Overtraining, butuh recovery</li>
                  <li className="text-green-400">• Negatif sedang (-30 s/d -10): Zona optimal performa</li>
                  <li className="text-slate-400">• Netral (-10 s/d 5): Grey zone, monitoring</li>
                  <li className="text-emerald-400">• Positif kecil (5 s/d 20): Fresh, siap latihan berat</li>
                  <li className="text-yellow-400">• Positif besar (&gt;20): Detraining risk</li>
                </ul>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={formZoneData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="date" 
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
              />
              <YAxis 
                domain={["dataMin - 5", "dataMax + 5"]}
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                label={{ value: 'Form (Fatigue - Fitness)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }}
              />
              <Tooltip content={<FormTooltip />} />
              
              {/* Zone bands */}
              <ReferenceLine y={-30} stroke="#dc2626" strokeDasharray="3 3" />
              <ReferenceLine y={-10} stroke="#eab308" strokeDasharray="3 3" />
              <ReferenceLine y={5} stroke="#64748b" strokeDasharray="3 3" />
              <ReferenceLine y={20} stroke="#22c55e" strokeDasharray="3 3" />
              <ReferenceLine y={0} stroke="#475569" strokeWidth={1} />
              
              <Line 
                type="monotone" 
                dataKey="tsb" 
                stroke="#f97316" 
                strokeWidth={3}
                name="Form (Fatigue - Fitness)"
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

        {/* Detail Calculation Table */}
        <div>
          <h3 className="text-slate-300 font-semibold mb-3">Detail Perhitungan CTL, ATL, dan Form</h3>
          <div className="rounded-lg border border-slate-700 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700 bg-slate-800">
                  <TableHead className="text-slate-300">Tanggal</TableHead>
                  <TableHead className="text-slate-300 text-right">Daily Load</TableHead>
                  <TableHead className="text-cyan-400 text-right">CTL (Fitness)</TableHead>
                  <TableHead className="text-purple-400 text-right">ATL (Fatigue)</TableHead>
                  <TableHead className="text-orange-400 text-right">Form (ATL-CTL)</TableHead>
                  <TableHead className="text-slate-300 text-center">Zona</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chartData.map((row, index) => {
                  const zone = getFormZone(row.tsb);
                  return (
                    <TableRow key={index} className="border-slate-700 hover:bg-slate-800/50">
                      <TableCell className="text-slate-300 font-medium">{row.date}</TableCell>
                      <TableCell className="text-slate-300 text-right">{row.dailyLoad}</TableCell>
                      <TableCell className="text-cyan-400 text-right font-medium">{row.ctl}</TableCell>
                      <TableCell className="text-purple-400 text-right font-medium">{row.atl}</TableCell>
                      <TableCell className="text-orange-400 text-right font-bold">{row.tsb}</TableCell>
                      <TableCell className={`text-center font-medium ${zone.color}`}>{zone.label}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};