import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAthletes } from "@/hooks/useAthletes";
import { useTrainingSessions } from "@/hooks/useTrainingSessions";
import { useAthleteReadiness } from "@/hooks/useAthleteReadiness";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ArrowLeft, TrendingUp, Calendar, Clock, Activity, Heart, Zap } from "lucide-react";
import { FitnessFatigueFormChart } from "@/components/FitnessFatigueFormChart";
import { ReadinessStatsCard, getReadinessStatsForAI } from "@/components/ReadinessStatsCard";
import { useNavigate } from "react-router-dom";
import { format, parseISO, subDays } from "date-fns";
import { toast } from "sonner";

// RPE Load multipliers per 60 minutes
const RPE_LOAD_MAP: { [key: number]: number } = {
  1: 20, 2: 30, 3: 40, 4: 50, 5: 60,
  6: 70, 7: 80, 8: 100, 9: 120, 10: 140
};

// Calculate training load based on RPE and duration
function calculateTrainingLoad(rpe: number, durationMinutes: number): number {
  const loadPer60Min = RPE_LOAD_MAP[rpe] || 0;
  return (loadPer60Min * durationMinutes) / 60;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { athletes } = useAthletes();
  const { sessions } = useTrainingSessions();
  const { readinessData } = useAthleteReadiness();
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>("all");

  if (!user) {
    window.location.href = "/auth";
    return null;
  }

  const filteredSessions = selectedAthleteId === "all" 
    ? sessions 
    : sessions.filter(s => s.athlete_id === selectedAthleteId);

  const filteredReadiness = selectedAthleteId === "all"
    ? readinessData
    : readinessData.filter(r => r.athlete_id === selectedAthleteId);

  // Calculate fitness, fatigue, and form using the same logic as FitnessFatigueFormChart
  const calculateFitnessFatigue = () => {
    if (filteredSessions.length === 0) {
      return { fitness: 0, fatigue: 0, form: 0 };
    }

    const sortedSessions = [...filteredSessions].sort(
      (a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime()
    );

    const last42Sessions = sortedSessions.slice(-42);
    const last7Sessions = sortedSessions.slice(-7);

    const fitness =
      last42Sessions.reduce(
        (sum, session) => sum + calculateTrainingLoad(session.rpe, session.duration_minutes),
        0
      ) / 42;

    const fatigue =
      last7Sessions.reduce(
        (sum, session) => sum + calculateTrainingLoad(session.rpe, session.duration_minutes),
        0
      ) / 7;

    const form = fitness - fatigue;

    return { fitness, fatigue, form };
  };

  const { fitness, fatigue, form } = calculateFitnessFatigue();

  // RPE Trend Data
  const rpeData = filteredSessions
    .sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime())
    .map(session => ({
      date: format(parseISO(session.session_date), "MMM dd"),
      rpe: session.rpe,
      duration: session.duration_minutes,
    }));

  // Training Load with new calculation
  const trainingLoadData = filteredSessions
    .sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime())
    .map(session => ({
      date: format(parseISO(session.session_date), "MMM dd"),
      load: calculateTrainingLoad(session.rpe, session.duration_minutes),
    }));

  // Fitness/Fatigue/Form trend
  const fitnessTrendData = filteredSessions
    .sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime())
    .slice(-14)
    .map((_, index, arr) => {
      const sessionsUpToDate = filteredSessions.slice(0, filteredSessions.indexOf(arr[index]) + 1);
      const date = arr[index].session_date;
      
      const fitnessCTL = sessionsUpToDate.slice(-42).reduce((sum, s) => 
        sum + calculateTrainingLoad(s.rpe, s.duration_minutes), 0) / 42;
      const fatigueATL = sessionsUpToDate.slice(-7).reduce((sum, s) => 
        sum + calculateTrainingLoad(s.rpe, s.duration_minutes), 0) / 7;
      
      return {
        date: format(parseISO(date), "MMM dd"),
        fitness: parseFloat(fitnessCTL.toFixed(1)),
        fatigue: parseFloat(fatigueATL.toFixed(1)),
        form: parseFloat((fitnessCTL - fatigueATL).toFixed(1)),
      };
    });

  // Readiness trend data
  const readinessTrendData = filteredReadiness
    .sort((a, b) => new Date(a.readiness_date).getTime() - new Date(b.readiness_date).getTime())
    .map(r => ({
      date: format(parseISO(r.readiness_date), "MMM dd"),
      readiness: r.readiness_score || 0,
      vo2max: r.vo2max || 0,
      power: r.power || 0,
    }));

  // Sessions per Athlete
  const sessionsPerAthlete = athletes.map(athlete => ({
    name: athlete.name,
    sessions: sessions.filter(s => s.athlete_id === athlete.id).length,
  }));

  // Statistics
  const totalSessions = filteredSessions.length;
  const avgRPE = filteredSessions.length > 0
    ? (filteredSessions.reduce((sum, s) => sum + s.rpe, 0) / filteredSessions.length).toFixed(1)
    : 0;
  const totalDuration = filteredSessions.reduce((sum, s) => sum + s.duration_minutes, 0);
  const avgDuration = filteredSessions.length > 0
    ? Math.round(totalDuration / filteredSessions.length)
    : 0;

  const latestReadiness = filteredReadiness[0];
  const readinessStatsForAI = selectedAthleteId !== "all" && filteredReadiness.length > 0 
    ? getReadinessStatsForAI(filteredReadiness) 
    : undefined;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-4xl font-bold text-foreground">Analytics Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => navigate("/comparison")} variant="outline">
              Compare Athletes
            </Button>
            <Button onClick={signOut} variant="outline">
              Sign Out
            </Button>
          </div>
        </header>

        {/* Filter */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Filter by Athlete:</label>
              <Select value={selectedAthleteId} onValueChange={setSelectedAthleteId}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Athletes</SelectItem>
                  {athletes.map(athlete => (
                    <SelectItem key={athlete.id} value={athlete.id}>
                      {athlete.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>


        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
                Total Sessions
              </CardTitle>
              <Calendar className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-slate-50">{totalSessions}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
                Average RPE
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-slate-50">{avgRPE}/10</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
                Total Duration
              </CardTitle>
              <Clock className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-slate-50">{totalDuration} min</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
                Avg Duration
              </CardTitle>
              <Clock className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-slate-50">{avgDuration} min</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
                Fitness (CTL)
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-cyan-400">{fitness.toFixed(1)}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
                Fatigue (ATL)
              </CardTitle>
              <Activity className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-purple-400">{fatigue.toFixed(1)}</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
                Form (Fitness - Fatigue)
              </CardTitle>
              <Zap className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-3xl font-bold tracking-tight ${
                  form >= 0 ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {form.toFixed(1)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Readiness Stats with Indicators and Charts */}
        {selectedAthleteId !== "all" && filteredReadiness.length > 0 && (
          <div className="mb-6">
            <ReadinessStatsCard 
              readinessData={filteredReadiness} 
              latestReadiness={latestReadiness} 
            />
          </div>
        )}

        {/* Fitness-Fatigue-Form Analysis */}
        <div className="mb-6">
          <FitnessFatigueFormChart 
            sessions={filteredSessions} 
            athleteName={selectedAthleteId !== "all" ? athletes.find(a => a.id === selectedAthleteId)?.name : undefined}
            readinessStats={readinessStatsForAI}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* RPE Trend */}
          <Card>
            <CardHeader>
              <CardTitle>RPE Trend Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {rpeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={rpeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="rpe" stroke="hsl(var(--primary))" strokeWidth={2} name="RPE" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-8">No data available</p>
              )}
            </CardContent>
          </Card>

          {/* Training Load */}
          <Card>
            <CardHeader>
              <CardTitle>Training Load</CardTitle>
            </CardHeader>
            <CardContent>
              {trainingLoadData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trainingLoadData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="load" fill="hsl(var(--primary))" name="Training Load" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-8">No data available</p>
              )}
            </CardContent>
          </Card>

          {/* Sessions per Athlete */}
          <Card>
            <CardHeader>
              <CardTitle>Sessions per Athlete</CardTitle>
            </CardHeader>
            <CardContent>
              {sessionsPerAthlete.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sessionsPerAthlete}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="sessions" fill="hsl(var(--secondary))" name="Sessions" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-8">No athletes yet</p>
              )}
            </CardContent>
          </Card>

          {/* Duration Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Session Duration Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {rpeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={rpeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="duration" stroke="hsl(var(--secondary))" strokeWidth={2} name="Duration (min)" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-8">No data available</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
