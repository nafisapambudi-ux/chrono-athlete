import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAthletes } from "@/hooks/useAthletes";
import { useTrainingSessions } from "@/hooks/useTrainingSessions";
import { useAthleteReadiness } from "@/hooks/useAthleteReadiness";
import { useTrainingPrograms, TrainingProgram } from "@/hooks/useTrainingPrograms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, BarChart3, ArrowUpDown, Heart, User, Users, ArrowLeft, Calendar, List } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import TrainingCalendar from "@/components/TrainingCalendar";
import ProgramDialog from "@/components/ProgramDialog";

const TrainingSessions = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { athletes, isLoading: athletesLoading } = useAthletes();
  const { sessions, isLoading: sessionsLoading, createSession, deleteSession } = useTrainingSessions();
  const { createReadiness } = useAthleteReadiness();
  const { toast } = useToast();

  // Filter and sort states
  const [sessionSortBy, setSessionSortBy] = useState<"date" | "rpe" | "duration">("date");
  const [sessionFilterRPE, setSessionFilterRPE] = useState<string>("all");
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("calendar");

  // Program dialog state
  const [programDialogOpen, setProgramDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<TrainingProgram | undefined>();

  // Training programs hook
  const { programs, isLoading: programsLoading, createProgram, updateProgram, completeProgram, deleteProgram } = 
    useTrainingPrograms(selectedAthleteId);

  const [sessionForm, setSessionForm] = useState({
    sessionDate: "",
    durationMinutes: "",
    rpe: "",
    notes: "",
  });
  const [readinessForm, setReadinessForm] = useState({
    readinessDate: format(new Date(), "yyyy-MM-dd"),
    restingHeartRate: "",
    verticalJump: "",
  });

  // Filtered and sorted sessions
  const athleteSessions = useMemo(() => {
    let filtered = sessions.filter((s) => s.athlete_id === selectedAthleteId);

    if (sessionFilterRPE !== "all") {
      const rpeRange = sessionFilterRPE.split("-");
      const minRPE = parseInt(rpeRange[0]);
      const maxRPE = parseInt(rpeRange[1]);
      filtered = filtered.filter(s => s.rpe >= minRPE && s.rpe <= maxRPE);
    }

    return filtered.sort((a, b) => {
      if (sessionSortBy === "date") {
        return new Date(b.session_date).getTime() - new Date(a.session_date).getTime();
      } else if (sessionSortBy === "rpe") {
        return b.rpe - a.rpe;
      } else {
        return b.duration_minutes - a.duration_minutes;
      }
    });
  }, [sessions, selectedAthleteId, sessionFilterRPE, sessionSortBy]);

  const selectedAthlete = athletes.find((a) => a.id === selectedAthleteId);

  if (!user) {
    window.location.href = "/auth";
    return null;
  }

  const handleAddReadiness = () => {
    if (!readinessForm.restingHeartRate || !readinessForm.verticalJump) {
      toast({ title: "Mohon isi semua data kesiapan", variant: "destructive" });
      return;
    }

    if (!selectedAthleteId) {
      toast({ title: "Pilih atlet terlebih dahulu", variant: "destructive" });
      return;
    }

    createReadiness({
      athlete_id: selectedAthleteId,
      readiness_date: readinessForm.readinessDate,
      resting_heart_rate: parseInt(readinessForm.restingHeartRate),
      vertical_jump: parseFloat(readinessForm.verticalJump),
    });

    setReadinessForm({
      readinessDate: format(new Date(), "yyyy-MM-dd"),
      restingHeartRate: "",
      verticalJump: "",
    });
  };

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAthleteId) {
      toast({ title: "Pilih atlet terlebih dahulu", variant: "destructive" });
      return;
    }
    createSession({
      athlete_id: selectedAthleteId,
      session_date: sessionForm.sessionDate,
      duration_minutes: Number(sessionForm.durationMinutes),
      rpe: Number(sessionForm.rpe),
      notes: sessionForm.notes || undefined,
    });
    setSessionForm({ sessionDate: "", durationMinutes: "", rpe: "", notes: "" });
  };

  const handleDayClick = (date: Date, program?: TrainingProgram) => {
    setSelectedDate(date);
    setSelectedProgram(program);
    setProgramDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate("/app")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-4xl font-bold text-foreground">Training Sessions</h1>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/profile")} variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Profil Atlet
            </Button>
            <Button onClick={() => navigate("/dashboard")} variant="outline">
              <BarChart3 className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button onClick={signOut} variant="outline">
              Sign Out
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Athletes Sidebar */}
          <Card>
            <CardHeader>
              <CardTitle>Pilih Atlet</CardTitle>
            </CardHeader>
            <CardContent>
              {athletesLoading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : athletes.length === 0 ? (
                <div className="text-center p-4">
                  <p className="text-muted-foreground mb-4">Belum ada atlet</p>
                  <Button onClick={() => navigate("/profile")} size="sm">
                    Tambah Atlet
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {athletes.map((athlete) => (
                    <div
                      key={athlete.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedAthleteId === athlete.id
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => setSelectedAthleteId(athlete.id)}
                    >
                      <div className="flex items-center gap-3">
                        {athlete.avatar_url ? (
                          <img 
                            src={athlete.avatar_url} 
                            alt={athlete.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <span className="font-medium block">{athlete.name}</span>
                          {athlete.sports_branch && (
                            <span className="text-xs text-muted-foreground">{athlete.sports_branch}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="calendar" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Kalender Program
                </TabsTrigger>
                <TabsTrigger value="sessions" className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  Sesi Latihan
                </TabsTrigger>
                <TabsTrigger value="readiness" className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Kesiapan Atlet
                </TabsTrigger>
              </TabsList>

              {/* Calendar Tab */}
              <TabsContent value="calendar">
                {programsLoading ? (
                  <Card>
                    <CardContent className="flex justify-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </CardContent>
                  </Card>
                ) : (
                  <TrainingCalendar
                    programs={programs}
                    onDayClick={handleDayClick}
                    selectedAthleteId={selectedAthleteId}
                  />
                )}
              </TabsContent>

              {/* Sessions Tab */}
              <TabsContent value="sessions">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Sesi Latihan
                      {selectedAthlete && ` - ${selectedAthlete.name}`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedAthleteId ? (
                      <>
                        {/* Filters */}
                        <div className="mb-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                            <Select value={sessionSortBy} onValueChange={(v: any) => setSessionSortBy(v)}>
                              <SelectTrigger className="w-[180px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="date">Terbaru</SelectItem>
                                <SelectItem value="rpe">RPE Tertinggi</SelectItem>
                                <SelectItem value="duration">Durasi Terpanjang</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-sm">Filter RPE:</Label>
                            <Select value={sessionFilterRPE} onValueChange={setSessionFilterRPE}>
                              <SelectTrigger className="w-[180px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Semua RPE</SelectItem>
                                <SelectItem value="1-3">Rendah (1-3)</SelectItem>
                                <SelectItem value="4-6">Sedang (4-6)</SelectItem>
                                <SelectItem value="7-10">Tinggi (7-10)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Add Session Form */}
                        <form onSubmit={handleAddSession} className="space-y-4 mb-6 p-4 border rounded-lg bg-muted/50">
                          <h3 className="font-semibold">Tambah Sesi Latihan Manual</h3>
                          <div>
                            <Label htmlFor="date">Tanggal Sesi</Label>
                            <Input
                              id="date"
                              type="date"
                              value={sessionForm.sessionDate}
                              onChange={(e) => setSessionForm({ ...sessionForm, sessionDate: e.target.value })}
                              required
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label htmlFor="duration">Durasi (menit)</Label>
                              <Input
                                id="duration"
                                type="number"
                                value={sessionForm.durationMinutes}
                                onChange={(e) => setSessionForm({ ...sessionForm, durationMinutes: e.target.value })}
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="rpe">RPE (1-10)</Label>
                              <Input
                                id="rpe"
                                type="number"
                                min="1"
                                max="10"
                                value={sessionForm.rpe}
                                onChange={(e) => setSessionForm({ ...sessionForm, rpe: e.target.value })}
                                required
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="notes">Catatan</Label>
                            <Textarea
                              id="notes"
                              value={sessionForm.notes}
                              onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })}
                            />
                          </div>
                          <Button type="submit" disabled={sessionsLoading}>
                            {sessionsLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Tambah Sesi
                          </Button>
                        </form>

                        {/* Sessions List */}
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                          {sessionsLoading ? (
                            <div className="flex justify-center p-4">
                              <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                          ) : athleteSessions.length === 0 ? (
                            <p className="text-muted-foreground text-center p-4">Belum ada sesi latihan</p>
                          ) : (
                            athleteSessions.map((session) => (
                              <div key={session.id} className="p-4 border rounded-lg">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <p className="font-semibold">
                                      {new Date(session.session_date).toLocaleDateString('id-ID', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                      })}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      Durasi: {session.duration_minutes} menit | RPE: {session.rpe}/10
                                    </p>
                                    {session.notes && (
                                      <p className="text-sm mt-2">{session.notes}</p>
                                    )}
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => deleteSession(session.id)}
                                  >
                                    Hapus
                                  </Button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-muted-foreground text-center p-8">
                        Pilih atlet untuk melihat dan menambah sesi latihan
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Readiness Tab */}
              <TabsContent value="readiness">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5" />
                      Input Data Kesiapan Atlet
                      {selectedAthlete && ` - ${selectedAthlete.name}`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedAthleteId ? (
                      <div className="max-w-md space-y-4">
                        <div>
                          <Label htmlFor="readiness-date">Tanggal</Label>
                          <Input
                            id="readiness-date"
                            type="date"
                            value={readinessForm.readinessDate}
                            onChange={(e) => setReadinessForm({ ...readinessForm, readinessDate: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="rhr">Resting Heart Rate (bpm)</Label>
                          <Input
                            id="rhr"
                            type="number"
                            placeholder="60"
                            value={readinessForm.restingHeartRate}
                            onChange={(e) => setReadinessForm({ ...readinessForm, restingHeartRate: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="vj">Vertical Jump (cm)</Label>
                          <Input
                            id="vj"
                            type="number"
                            step="0.1"
                            placeholder="50"
                            value={readinessForm.verticalJump}
                            onChange={(e) => setReadinessForm({ ...readinessForm, verticalJump: e.target.value })}
                          />
                        </div>
                        <Button onClick={handleAddReadiness} className="w-full">
                          Tambah Data Kesiapan
                        </Button>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center p-8">
                        Pilih atlet untuk menambah data kesiapan
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Program Dialog */}
      {selectedAthleteId && (
        <ProgramDialog
          open={programDialogOpen}
          onOpenChange={setProgramDialogOpen}
          selectedDate={selectedDate}
          existingProgram={selectedProgram}
          athleteId={selectedAthleteId}
          onSave={createProgram}
          onUpdate={updateProgram}
          onComplete={completeProgram}
          onDelete={deleteProgram}
        />
      )}
    </div>
  );
};

export default TrainingSessions;
