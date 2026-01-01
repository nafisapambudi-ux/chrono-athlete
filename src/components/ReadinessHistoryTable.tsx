import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History } from "lucide-react";

interface ReadinessRecord {
  id: string;
  athlete_id: string;
  readiness_date: string;
  resting_heart_rate: number;
  vertical_jump: number;
  readiness_score: number | null;
  vo2max: number | null;
  power: number | null;
}

interface ReadinessHistoryTableProps {
  readinessData: ReadinessRecord[];
  athleteName?: string;
}

export function ReadinessHistoryTable({ readinessData, athleteName }: ReadinessHistoryTableProps) {
  const sortedData = [...readinessData].sort(
    (a, b) => new Date(b.readiness_date).getTime() - new Date(a.readiness_date).getTime()
  );

  const getScoreBadge = (score: number | null) => {
    if (score === null) return <Badge variant="secondary">N/A</Badge>;
    if (score >= 80) return <Badge className="bg-emerald-500">Excellent</Badge>;
    if (score >= 60) return <Badge className="bg-cyan-500">Good</Badge>;
    if (score >= 40) return <Badge className="bg-amber-500">Fair</Badge>;
    return <Badge variant="destructive">Low</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Histori Kesiapan {athleteName && `- ${athleteName}`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedData.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Belum ada data kesiapan
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-center">RHR (bpm)</TableHead>
                  <TableHead className="text-center">Vertical Jump (cm)</TableHead>
                  <TableHead className="text-center">VO2Max</TableHead>
                  <TableHead className="text-center">Power (W)</TableHead>
                  <TableHead className="text-center">Skor Kesiapan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {format(parseISO(record.readiness_date), "dd MMM yyyy", { locale: id })}
                    </TableCell>
                    <TableCell className="text-center">{record.resting_heart_rate}</TableCell>
                    <TableCell className="text-center">{record.vertical_jump}</TableCell>
                    <TableCell className="text-center">
                      {record.vo2max?.toFixed(1) || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {record.power?.toFixed(0) || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {getScoreBadge(record.readiness_score)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
