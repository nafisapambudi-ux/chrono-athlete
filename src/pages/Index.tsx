import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAthletes } from "@/hooks/useAthletes";
import { useTrainingSessions } from "@/hooks/useTrainingSessions";
import { useAthleteReadiness } from "@/hooks/useAthleteReadiness";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, BarChart3, Search, ArrowUpDown, Heart, Upload, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

const Index = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { athletes, isLoading: athletesLoading, createAthlete, updateAthlete, deleteAthlete } = useAthletes();
  const { sessions, isLoading: sessionsLoading, createSession, deleteSession } = useTrainingSessions();
  const { createReadiness } = useAthleteReadiness();
  const { toast } = useToast();

  // Filter and sort states
  const [athleteSearch, setAthleteSearch] = useState("");
  const [athleteSortBy, setAthleteSortBy] = useState<"name" | "created_at">("created_at");
  const [sessionSortBy, setSessionSortBy] = useState<"date" | "rpe" | "duration">("date");
  const [sessionFilterRPE, setSessionFilterRPE] = useState<string>("all");

  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [athleteForm, setAthleteForm] = useState({
    name: "",
    bodyHeight: "",
    mass: "",
    verticalJump: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
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

  // Filtered and sorted athletes
  const filteredAthletes = useMemo(() => {
    let filtered = athletes.filter(athlete =>
      athlete.name.toLowerCase().includes(athleteSearch.toLowerCase())
    );

    return filtered.sort((a, b) => {
      if (athleteSortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [athletes, athleteSearch, athleteSortBy]);

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

  const handleAddAthlete = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let avatarUrl: string | undefined = undefined;
    
    // Upload avatar if file is selected
    if (avatarFile && user) {
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('athlete-avatars')
        .upload(fileName, avatarFile);
      
      if (uploadError) {
        toast({ title: "Gagal mengunggah foto", description: uploadError.message, variant: "destructive" });
        return;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('athlete-avatars')
        .getPublicUrl(fileName);
      
      avatarUrl = publicUrl;
    }
    
    createAthlete({
      name: athleteForm.name,
      body_height: athleteForm.bodyHeight ? Number(athleteForm.bodyHeight) : undefined,
      mass: athleteForm.mass ? Number(athleteForm.mass) : undefined,
      vertical_jump: athleteForm.verticalJump ? Number(athleteForm.verticalJump) : undefined,
      avatar_url: avatarUrl,
    });
    
    setAthleteForm({ name: "", bodyHeight: "", mass: "", verticalJump: "" });
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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
      toast({ title: "Please select an athlete", variant: "destructive" });
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

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-foreground">HIRO Training App</h1>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/dashboard")} variant="outline">
              <BarChart3 className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button onClick={signOut} variant="outline">
              Sign Out
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Athletes Section */}
          <Card>
            <CardHeader>
              <CardTitle>Athletes</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="mb-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search athletes..."
                    value={athleteSearch}
                    onChange={(e) => setAthleteSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                  <Select value={athleteSortBy} onValueChange={(v: any) => setAthleteSortBy(v)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_at">Newest First</SelectItem>
                      <SelectItem value="name">Name (A-Z)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <form onSubmit={handleAddAthlete} className="space-y-4 mb-6">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={athleteForm.name}
                    onChange={(e) => setAthleteForm({ ...athleteForm, name: e.target.value })}
                    required
                  />
                </div>
                
                {/* Avatar Upload */}
                <div>
                  <Label htmlFor="avatar">Profile Photo</Label>
                  <div className="flex items-center gap-4">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Preview" className="w-16 h-16 rounded-full object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <Input
                        id="avatar"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      value={athleteForm.bodyHeight}
                      onChange={(e) => setAthleteForm({ ...athleteForm, bodyHeight: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="mass">Mass (kg)</Label>
                    <Input
                      id="mass"
                      type="number"
                      value={athleteForm.mass}
                      onChange={(e) => setAthleteForm({ ...athleteForm, mass: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="jump">Jump (cm)</Label>
                    <Input
                      id="jump"
                      type="number"
                      value={athleteForm.verticalJump}
                      onChange={(e) => setAthleteForm({ ...athleteForm, verticalJump: e.target.value })}
                    />
                  </div>
                </div>
                <Button type="submit" disabled={athletesLoading}>
                  {athletesLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Athlete
                </Button>
              </form>

              <div className="space-y-2">
                {athletesLoading ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : filteredAthletes.length === 0 ? (
                  <p className="text-muted-foreground text-center p-4">
                    {athleteSearch ? "No athletes found" : "No athletes yet"}
                  </p>
                ) : (
                  filteredAthletes.map((athlete) => (
                    <div
                      key={athlete.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedAthleteId === athlete.id
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => setSelectedAthleteId(athlete.id)}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex items-center gap-3 flex-1">
                          {athlete.avatar_url ? (
                            <img 
                              src={athlete.avatar_url} 
                              alt={athlete.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                              <User className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold">{athlete.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {athlete.body_height && `Height: ${athlete.body_height}cm`}
                              {athlete.mass && ` | Mass: ${athlete.mass}kg`}
                              {athlete.vertical_jump && ` | Jump: ${athlete.vertical_jump}cm`}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAthlete(athlete.id);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Training Sessions Section */}
          <Card>
            <CardHeader>
              <CardTitle>
                Training Sessions
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
                          <SelectItem value="date">Newest First</SelectItem>
                          <SelectItem value="rpe">Highest RPE</SelectItem>
                          <SelectItem value="duration">Longest Duration</SelectItem>
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
                          <SelectItem value="all">All RPE</SelectItem>
                          <SelectItem value="1-3">Low (1-3)</SelectItem>
                          <SelectItem value="4-6">Medium (4-6)</SelectItem>
                          <SelectItem value="7-10">High (7-10)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <form onSubmit={handleAddSession} className="space-y-4 mb-6">
                    <div>
                      <Label htmlFor="date">Session Date</Label>
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
                        <Label htmlFor="duration">Duration (min)</Label>
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
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={sessionForm.notes}
                        onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })}
                      />
                    </div>
                    <Button type="submit" disabled={sessionsLoading}>
                      {sessionsLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Add Session
                    </Button>
                  </form>

                  {/* Athlete Readiness Input */}
                  <Card className="my-6">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Heart className="h-5 w-5" />
                        Input Data Kesiapan Atlet
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                        <div className="flex items-end">
                          <Button onClick={handleAddReadiness} className="w-full">
                            Tambah Data Kesiapan
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-2">
                    {sessionsLoading ? (
                      <div className="flex justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : athleteSessions.length === 0 ? (
                      <p className="text-muted-foreground text-center p-4">No sessions yet</p>
                    ) : (
                      athleteSessions.map((session) => (
                        <div key={session.id} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-semibold">
                                {new Date(session.session_date).toLocaleDateString()}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Duration: {session.duration_minutes}min | RPE: {session.rpe}/10
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
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-center p-8">
                  Select an athlete to view and add training sessions
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
