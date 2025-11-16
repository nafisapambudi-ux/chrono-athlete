import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAthletes } from "@/hooks/useAthletes";
import { useTrainingSessions } from "@/hooks/useTrainingSessions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ArrowLeft, TrendingUp, Calendar, Clock, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { athletes } = useAthletes();
  const { sessions } = useTrainingSessions();
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>("all");

  if (!user) {
    window.location.href = "/auth";
    return null;
  }

  const filteredSessions = selectedAthleteId === "all" 
    ? sessions 
    : sessions.filter(s => s.athlete_id === selectedAthleteId);

  // RPE Trend Data
  const rpeData = filteredSessions
    .sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime())
    .map(session => ({
      date: format(parseISO(session.session_date), "MMM dd"),
      rpe: session.rpe,
      duration: session.duration_minutes,
    }));

  // Training Load (RPE × Duration)
  const trainingLoadData = filteredSessions
    .sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime())
    .map(session => ({
      date: format(parseISO(session.session_date), "MMM dd"),
      load: session.rpe * session.duration_minutes,
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
          <Button onClick={signOut} variant="outline">
            Sign Out
          </Button>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSessions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average RPE</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgRPE}/10</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDuration} min</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgDuration} min</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
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
              <CardTitle>Training Load (RPE × Duration)</CardTitle>
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
