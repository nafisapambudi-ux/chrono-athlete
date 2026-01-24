import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAthletes } from "@/hooks/useAthletes";
import { useTrainingSessions } from "@/hooks/useTrainingSessions";
import { useAthleteReadiness } from "@/hooks/useAthleteReadiness";
import { useMultipleAthleteTests } from "@/hooks/useMultipleAthleteTests";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ArrowLeft, Activity, ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, parseISO, subDays } from "date-fns";
import { TestComparisonChart } from "@/components/TestComparisonChart";
import type { Gender } from "@/lib/testNorms";

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

const AthleteComparison = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { athletes } = useAthletes();
  const { sessions } = useTrainingSessions();
  const { readinessData } = useAthleteReadiness();
  
  const [athlete1Id, setAthlete1Id] = useState<string>("");
  const [athlete2Id, setAthlete2Id] = useState<string>("");
  const [selectedTestAthleteIds, setSelectedTestAthleteIds] = useState<string[]>([]);

  // Fetch tests for all athletes when on test comparison tab
  const allAthleteIds = athletes.map(a => a.id);
  const { athleteTests } = useMultipleAthleteTests(allAthleteIds);

  // Prepare athlete info for test comparison
  const athleteInfoList = athletes.map(a => ({
    id: a.id,
    name: a.name,
    gender: a.gender as Gender | null,
    birthDate: a.birth_date ? new Date(a.birth_date) : null,
    mass: a.mass,
  }));

  if (!user) {
    window.location.href = "/auth";
    return null;
  }

  // Calculate fitness for an athlete
  const calculateFitness = (athleteId: string) => {
    const today = new Date();
    const last42Days = subDays(today, 42);
    
    const athleteSessions = sessions.filter(s => s.athlete_id === athleteId);
    const recentSessions = athleteSessions.filter(
      s => new Date(s.session_date) >= last42Days
    );

    return recentSessions.slice(-14).map((_, index, arr) => {
      const sessionsUpToDate = athleteSessions.slice(0, athleteSessions.indexOf(arr[index]) + 1);
      const date = arr[index].session_date;
      
      const fitnessCTL = sessionsUpToDate.slice(-42).reduce((sum, s) => 
        sum + calculateTrainingLoad(s.rpe, s.duration_minutes), 0) / 42;
      
      return {
        date: format(parseISO(date), "MMM dd"),
        fitness: parseFloat(fitnessCTL.toFixed(1)),
      };
    });
  };

  // Calculate readiness trend for an athlete
  const calculateReadinessTrend = (athleteId: string) => {
    return readinessData
      .filter(r => r.athlete_id === athleteId)
      .sort((a, b) => new Date(a.readiness_date).getTime() - new Date(b.readiness_date).getTime())
      .map(r => ({
        date: format(parseISO(r.readiness_date), "MMM dd"),
        readiness: r.readiness_score || 0,
      }));
  };

  // Calculate RPE trend for an athlete
  const calculateRPETrend = (athleteId: string) => {
    return sessions
      .filter(s => s.athlete_id === athleteId)
      .sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime())
      .map(s => ({
        date: format(parseISO(s.session_date), "MMM dd"),
        rpe: s.rpe,
      }));
  };

  const athlete1 = athletes.find(a => a.id === athlete1Id);
  const athlete2 = athletes.find(a => a.id === athlete2Id);

  const athlete1Fitness = athlete1Id ? calculateFitness(athlete1Id) : [];
  const athlete2Fitness = athlete2Id ? calculateFitness(athlete2Id) : [];

  const athlete1Readiness = athlete1Id ? calculateReadinessTrend(athlete1Id) : [];
  const athlete2Readiness = athlete2Id ? calculateReadinessTrend(athlete2Id) : [];

  const athlete1RPE = athlete1Id ? calculateRPETrend(athlete1Id) : [];
  const athlete2RPE = athlete2Id ? calculateRPETrend(athlete2Id) : [];

  // Merge data for side-by-side comparison
  const mergeData = (data1: any[], data2: any[], key: string) => {
    const allDates = Array.from(new Set([...data1.map(d => d.date), ...data2.map(d => d.date)]));
    return allDates.map(date => {
      const d1 = data1.find(d => d.date === date);
      const d2 = data2.find(d => d.date === date);
      return {
        date,
        [key + '1']: d1?.[key] || null,
        [key + '2']: d2?.[key] || null,
      };
    });
  };

  const fitnessComparisonData = mergeData(athlete1Fitness, athlete2Fitness, 'fitness');
  const readinessComparisonData = mergeData(athlete1Readiness, athlete2Readiness, 'readiness');
  const rpeComparisonData = mergeData(athlete1RPE, athlete2RPE, 'rpe');

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl md:text-4xl font-bold text-foreground">Perbandingan Atlet</h1>
          </div>
          <Button onClick={signOut} variant="outline">
            Sign Out
          </Button>
        </header>

        <Tabs defaultValue="training" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="training" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Training Load
            </TabsTrigger>
            <TabsTrigger value="tests" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Tes Biomotor
            </TabsTrigger>
          </TabsList>

          <TabsContent value="training" className="space-y-6">
            {/* Athlete Selection for Training Comparison */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Atlet 1:</label>
                    <Select value={athlete1Id} onValueChange={setAthlete1Id}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih atlet pertama" />
                      </SelectTrigger>
                      <SelectContent>
                        {athletes.map(athlete => (
                          <SelectItem key={athlete.id} value={athlete.id}>
                            {athlete.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Atlet 2:</label>
                    <Select value={athlete2Id} onValueChange={setAthlete2Id}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih atlet kedua" />
                      </SelectTrigger>
                      <SelectContent>
                        {athletes.map(athlete => (
                          <SelectItem key={athlete.id} value={athlete.id}>
                            {athlete.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {athlete1Id && athlete2Id && (
              <div className="space-y-6">
                {/* Fitness Comparison */}
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Perbandingan Fitness: {athlete1?.name} vs {athlete2?.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {fitnessComparisonData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={fitnessComparisonData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="fitness1" 
                            stroke="hsl(var(--chart-1))" 
                            strokeWidth={2}
                            name={athlete1?.name}
                            connectNulls
                          />
                          <Line 
                            type="monotone" 
                            dataKey="fitness2" 
                            stroke="hsl(var(--chart-2))" 
                            strokeWidth={2}
                            name={athlete2?.name}
                            connectNulls
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">Tidak ada data fitness</p>
                    )}
                  </CardContent>
                </Card>

                {/* Readiness Comparison */}
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Perbandingan Readiness: {athlete1?.name} vs {athlete2?.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {readinessComparisonData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={readinessComparisonData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="readiness1" 
                            stroke="hsl(var(--chart-3))" 
                            strokeWidth={2}
                            name={athlete1?.name}
                            connectNulls
                          />
                          <Line 
                            type="monotone" 
                            dataKey="readiness2" 
                            stroke="hsl(var(--chart-4))" 
                            strokeWidth={2}
                            name={athlete2?.name}
                            connectNulls
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">Tidak ada data readiness</p>
                    )}
                  </CardContent>
                </Card>

                {/* RPE Comparison */}
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Perbandingan RPE: {athlete1?.name} vs {athlete2?.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {rpeComparisonData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={rpeComparisonData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="date" />
                          <YAxis domain={[0, 10]} />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="rpe1" 
                            stroke="hsl(var(--chart-5))" 
                            strokeWidth={2}
                            name={athlete1?.name}
                            connectNulls
                          />
                          <Line 
                            type="monotone" 
                            dataKey="rpe2" 
                            stroke="hsl(220, 70%, 50%)" 
                            strokeWidth={2}
                            name={athlete2?.name}
                            connectNulls
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">Tidak ada data RPE</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {(!athlete1Id || !athlete2Id) && (
              <Card>
                <CardContent className="py-12">
                  <p className="text-center text-muted-foreground">
                    Pilih dua atlet untuk membandingkan performa training load
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="tests">
            <TestComparisonChart
              athletes={athleteInfoList}
              athleteTests={athleteTests}
              selectedAthleteIds={selectedTestAthleteIds}
              onAthleteSelect={setSelectedTestAthleteIds}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AthleteComparison;
