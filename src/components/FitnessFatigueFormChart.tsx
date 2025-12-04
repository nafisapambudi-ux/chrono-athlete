import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area } from "recharts";
import { format, parseISO } from "date-fns";

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

export const FitnessFatigueFormChart = ({ sessions }: FitnessFatigueFormChartProps) => {
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
      dailyLoad: parseFloat(dailyLoad.toFixed(1)),
      ctl: parseFloat(ctl.toFixed(1)),
      atl: parseFloat(atl.toFixed(1)),
      tsb: parseFloat(tsb.toFixed(1)),
      tsbPercent: parseFloat(tsbPercentClamped.toFixed(1)),
    };
  }).slice(-14); // Last 14 days

  // Calculate current metrics
  const latestData = chartData[chartData.length - 1] || { ctl: 0, atl: 0, tsb: 0, tsbPercent: 0 };
  const previousData = chartData[chartData.length - 2] || { ctl: 0 };
  const ramp = latestData.ctl - previousData.ctl;

  // Form zone data for the bottom chart
  const formZoneData = chartData.map(d => ({
    date: d.date,
    tsb: d.tsb,
  }));

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-slate-100 text-2xl font-bold">Fitness-Fatigue-Form Analysis</CardTitle>
            <p className="text-slate-400 text-sm mt-1">{chartData.length} weeks {chartData.length > 0 ? Math.floor(chartData.length / 7) : 0} days</p>
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
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                label={{ value: 'Form (Fitness - Fatigue)', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f1f5f9'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="tsb" 
                stroke="#f97316" 
                strokeWidth={3}
                name="Form (Fitness - Fatigue)"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
