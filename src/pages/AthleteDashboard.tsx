import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLinkedAthlete } from "@/hooks/useLinkedAthlete";
import { useAthleteReadiness } from "@/hooks/useAthleteReadiness";
import { useTrainingPrograms } from "@/hooks/useTrainingPrograms";
import { useTrainingSessions } from "@/hooks/useTrainingSessions";
import { useTrainingStats } from "@/hooks/useTrainingStats";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrainingStatsCards } from "@/components/TrainingStatsCards";
import { ReadinessStatsCard } from "@/components/ReadinessStatsCard";
import { ReadinessHistoryTable } from "@/components/ReadinessHistoryTable";
import { FitnessFatigueFormChart } from "@/components/FitnessFatigueFormChart";
import { AthleteReadinessForm } from "@/components/AthleteReadinessForm";
import TrainingCalendar from "@/components/TrainingCalendar";
import { 
  ArrowLeft, 
  Dumbbell, 
  Activity, 
  Calendar, 
  TrendingUp,
  CheckCircle2,
  Clock,
  Target,
  Heart,
  Zap
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function AthleteDashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: athlete, isLoading: athleteLoading } = useLinkedAthlete();
  const { readinessData, isLoading: readinessLoading, createReadiness, isCreating } = useAthleteReadiness(athlete?.id);
  const { programs, isLoading: programsLoading } = useTrainingPrograms(athlete?.id);
  const { sessions, isLoading: sessionsLoading } = useTrainingSessions(athlete?.id);
  const { data: stats, isLoading: statsLoading } = useTrainingStats(athlete?.id);
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Calculate readiness stats for the chart
  const readinessStats = useMemo(() => {
    if (!readinessData || readinessData.length === 0) return undefined;
    
    const readinessScores = readinessData.map(r => r.readiness_score).filter((s): s is number => s !== null);
    const vo2maxValues = readinessData.map(r => r.vo2max).filter((v): v is number => v !== null);
    const powerValues = readinessData.map(r => r.power).filter((p): p is number => p !== null);
    
    return {
      readiness: {
        avg: readinessScores.length ? readinessScores.reduce((a, b) => a + b, 0) / readinessScores.length : 0,
        low: readinessScores.length ? Math.min(...readinessScores) : 0,
        peak: readinessScores.length ? Math.max(...readinessScores) : 0,
      },
      vo2max: {
        avg: vo2maxValues.length ? vo2maxValues.reduce((a, b) => a + b, 0) / vo2maxValues.length : 0,
        low: vo2maxValues.length ? Math.min(...vo2maxValues) : 0,
        peak: vo2maxValues.length ? Math.max(...vo2maxValues) : 0,
      },
      power: {
        avg: powerValues.length ? powerValues.reduce((a, b) => a + b, 0) / powerValues.length : 0,
        low: powerValues.length ? Math.min(...powerValues) : 0,
        peak: powerValues.length ? Math.max(...powerValues) : 0,
      },
      currentReadiness: readinessData[0]?.readiness_score || 0,
      currentVO2max: readinessData[0]?.vo2max || 0,
      currentPower: readinessData[0]?.power || 0,
    };
  }, [readinessData]);

  if (!user) {
    navigate("/auth");
    return null;
  }

  if (athleteLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (!athlete) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-2xl mx-auto text-center">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2">
                <Target className="h-8 w-8 text-muted-foreground" />
                Profil Belum Terhubung
              </CardTitle>
              <CardDescription>
                Akun Anda belum terhubung ke profil atlet. Hubungi pelatih Anda untuk menghubungkan akun.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Email akun Anda: <span className="font-medium text-foreground">{user.email}</span>
              </p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => navigate("/app")}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Kembali
                </Button>
                <Button variant="outline" onClick={signOut}>
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Calculate stats
  const todayPrograms = programs?.filter(p => 
    format(new Date(p.program_date), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
  ) || [];
  
  const completedPrograms = programs?.filter(p => p.is_completed) || [];
  const pendingPrograms = programs?.filter(p => !p.is_completed) || [];
  
  const completionRate = programs?.length 
    ? Math.round((completedPrograms.length / programs.length) * 100) 
    : 0;

  const latestReadiness = readinessData?.[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/app")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Dashboard Atlet</h1>
                <p className="text-sm text-muted-foreground">
                  Selamat datang, {athlete.name}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                {athlete.avatar_url ? (
                  <img 
                    src={athlete.avatar_url} 
                    alt={athlete.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-primary/20"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-4 border-primary/20">
                    <span className="text-3xl font-bold text-primary">
                      {athlete.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <h2 className="mt-4 text-xl font-bold">{athlete.name}</h2>
                {athlete.sports_branch && (
                  <Badge variant="secondary" className="mt-2">
                    {athlete.sports_branch}
                  </Badge>
                )}
                <div className="grid grid-cols-3 gap-4 mt-6 w-full text-center">
                  <div>
                    <p className="text-2xl font-bold">{athlete.body_height || "-"}</p>
                    <p className="text-xs text-muted-foreground">Tinggi (cm)</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{athlete.mass || "-"}</p>
                    <p className="text-xs text-muted-foreground">Berat (kg)</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{athlete.vertical_jump || "-"}</p>
                    <p className="text-xs text-muted-foreground">VJ (cm)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Ringkasan Performa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-muted rounded-lg text-center">
                  <Dumbbell className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{programs?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Total Program</p>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold">{completedPrograms.length}</p>
                  <p className="text-xs text-muted-foreground">Selesai</p>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <Clock className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                  <p className="text-2xl font-bold">{pendingPrograms.length}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
                <div className="p-4 bg-muted rounded-lg text-center">
                  <Activity className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold">{sessions?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Sesi Latihan</p>
                </div>
              </div>
              
              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Tingkat Penyelesaian</span>
                  <span className="text-sm font-bold">{completionRate}%</span>
                </div>
                <Progress value={completionRate} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Latest Readiness */}
        {latestReadiness && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Kesiapan Terbaru
              </CardTitle>
              <CardDescription>
                {format(new Date(latestReadiness.readiness_date), "EEEE, d MMMM yyyy", { locale: id })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-3xl font-bold text-primary">
                    {latestReadiness.readiness_score?.toFixed(0) || "-"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Skor Kesiapan</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{latestReadiness.resting_heart_rate}</p>
                  <p className="text-xs text-muted-foreground mt-1">HR Istirahat</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{latestReadiness.vertical_jump}</p>
                  <p className="text-xs text-muted-foreground mt-1">Vertical Jump</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{latestReadiness.vo2max?.toFixed(1) || "-"}</p>
                  <p className="text-xs text-muted-foreground mt-1">VO2max</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{latestReadiness.power?.toFixed(0) || "-"}</p>
                  <p className="text-xs text-muted-foreground mt-1">Power (W)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs Content */}
        <Tabs defaultValue="programs" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="programs" className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4" />
              <span className="hidden sm:inline">Program</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Kalender</span>
            </TabsTrigger>
            <TabsTrigger value="readiness" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Kesiapan</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Performa</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="programs" className="mt-6 space-y-4">
            {/* Today's Programs */}
            {todayPrograms.length > 0 && (
              <Card className="border-primary/50">
                <CardHeader>
                  <CardTitle className="text-lg">Program Hari Ini</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {todayPrograms.map((program) => (
                    <div 
                      key={program.id}
                      className={`p-4 rounded-lg border ${
                        program.is_completed 
                          ? "bg-green-500/10 border-green-500/20" 
                          : "bg-orange-500/10 border-orange-500/20"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {program.is_completed ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <Clock className="h-5 w-5 text-orange-500" />
                          )}
                          <span className="font-medium capitalize">{program.program_type}</span>
                        </div>
                        <Badge variant={program.is_completed ? "default" : "secondary"}>
                          {program.is_completed ? "Selesai" : "Belum Selesai"}
                        </Badge>
                      </div>
                      {program.notes && (
                        <p className="mt-2 text-sm text-muted-foreground">{program.notes}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* All Programs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Semua Program Latihan</CardTitle>
              </CardHeader>
              <CardContent>
                {programsLoading ? (
                  <p className="text-muted-foreground text-center py-8">Memuat...</p>
                ) : programs?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Belum ada program latihan yang ditambahkan oleh pelatih.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {programs?.sort((a, b) => 
                      new Date(b.program_date).getTime() - new Date(a.program_date).getTime()
                    ).map((program) => (
                      <div 
                        key={program.id}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {program.is_completed ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div>
                            <p className="font-medium capitalize">{program.program_type}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(program.program_date), "d MMM yyyy", { locale: id })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {program.completed_rpe && (
                            <Badge variant="outline">RPE: {program.completed_rpe}</Badge>
                          )}
                          <Badge variant={program.is_completed ? "default" : "secondary"}>
                            {program.is_completed ? "Selesai" : "Pending"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="mt-6">
            <TrainingCalendar 
              programs={programs || []}
              selectedAthleteId={athlete.id}
              onDayClick={(date, program) => {
                // Just view mode for athletes
                console.log("Selected date:", date, program);
              }}
            />
          </TabsContent>

          <TabsContent value="readiness" className="mt-6 space-y-6">
            <AthleteReadinessForm 
              athleteId={athlete.id}
              onSubmit={createReadiness}
              isSubmitting={isCreating}
            />
            <ReadinessStatsCard readinessData={readinessData || []} />
            <ReadinessHistoryTable 
              readinessData={readinessData || []} 
            />
          </TabsContent>

          <TabsContent value="performance" className="mt-6 space-y-6">
            <TrainingStatsCards stats={stats} isLoading={statsLoading} />
            <FitnessFatigueFormChart 
              sessions={sessions || []}
              athleteName={athlete.name}
              readinessStats={readinessStats}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
