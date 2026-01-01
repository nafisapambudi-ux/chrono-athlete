import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";

interface TrainingSession {
  id: string;
  athlete_id: string;
  session_date: string;
  duration_minutes: number;
  rpe: number;
  notes: string | null;
}

interface Athlete {
  id: string;
  name: string;
}

interface ExportDataButtonProps {
  sessions: TrainingSession[];
  athletes: Athlete[];
  selectedAthleteId?: string | null;
}

export function ExportDataButton({ sessions, athletes, selectedAthleteId }: ExportDataButtonProps) {
  const getAthleteNameById = (id: string) => {
    return athletes.find((a) => a.id === id)?.name || "Unknown";
  };

  const filteredSessions = selectedAthleteId
    ? sessions.filter((s) => s.athlete_id === selectedAthleteId)
    : sessions;

  const exportToCSV = () => {
    if (filteredSessions.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    const headers = ["Tanggal", "Atlet", "Durasi (menit)", "RPE", "Catatan"];
    const rows = filteredSessions.map((session) => [
      format(parseISO(session.session_date), "dd/MM/yyyy"),
      getAthleteNameById(session.athlete_id),
      session.duration_minutes.toString(),
      session.rpe.toString(),
      session.notes || "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `training-sessions-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();

    toast.success("Data berhasil diekspor ke CSV");
  };

  const exportToPDF = () => {
    if (filteredSessions.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    const doc = new jsPDF();
    const selectedAthlete = selectedAthleteId
      ? athletes.find((a) => a.id === selectedAthleteId)
      : null;

    // Title
    doc.setFontSize(18);
    doc.text("Laporan Sesi Latihan", 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Tanggal: ${format(new Date(), "dd MMMM yyyy", { locale: id })}`, 14, 30);
    if (selectedAthlete) {
      doc.text(`Atlet: ${selectedAthlete.name}`, 14, 36);
    }

    // Table data
    const tableData = filteredSessions.map((session) => [
      format(parseISO(session.session_date), "dd/MM/yyyy"),
      getAthleteNameById(session.athlete_id),
      `${session.duration_minutes} menit`,
      `${session.rpe}/10`,
      session.notes || "-",
    ]);

    autoTable(doc, {
      head: [["Tanggal", "Atlet", "Durasi", "RPE", "Catatan"]],
      body: tableData,
      startY: selectedAthlete ? 42 : 36,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    // Summary
    const totalSessions = filteredSessions.length;
    const avgRPE = (
      filteredSessions.reduce((sum, s) => sum + s.rpe, 0) / totalSessions
    ).toFixed(1);
    const totalDuration = filteredSessions.reduce((sum, s) => sum + s.duration_minutes, 0);

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.text("Ringkasan:", 14, finalY);
    doc.setFontSize(10);
    doc.text(`Total Sesi: ${totalSessions}`, 14, finalY + 6);
    doc.text(`Rata-rata RPE: ${avgRPE}/10`, 14, finalY + 12);
    doc.text(`Total Durasi: ${totalDuration} menit`, 14, finalY + 18);

    doc.save(`training-sessions-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast.success("Data berhasil diekspor ke PDF");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Ekspor Data
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={exportToCSV}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Ekspor CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF}>
          <FileText className="mr-2 h-4 w-4" />
          Ekspor PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
