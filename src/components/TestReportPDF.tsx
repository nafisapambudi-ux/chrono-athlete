import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  testCategories,
  TestCategory,
  getNormLevel,
  normLevelLabels,
  getAgeGroup,
  calculateAge,
  Gender,
} from "@/lib/testNorms";
import type { AthleteTest } from "@/hooks/useAthleteTests";

interface TestReportPDFProps {
  athleteName: string;
  athleteGender: Gender | null;
  athleteBirthDate: Date | null;
  athleteMass: number | null;
  athleteHeight: number | null;
  sportsBranch: string | null;
  tests: AthleteTest[];
  testsByCategory: Record<TestCategory, AthleteTest[]>;
  latestTests: Record<string, AthleteTest>;
}

export function TestReportPDF({
  athleteName,
  athleteGender,
  athleteBirthDate,
  athleteMass,
  athleteHeight,
  sportsBranch,
  tests,
  testsByCategory,
  latestTests,
}: TestReportPDFProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const age = athleteBirthDate ? calculateAge(athleteBirthDate) : null;
      const ageGroup = age ? getAgeGroup(age) : "dewasa_muda";

      // Title
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("LAPORAN HASIL TES BIOMOTOR", pageWidth / 2, 20, { align: "center" });

      // Date generated
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Dicetak: ${format(new Date(), "d MMMM yyyy, HH:mm", { locale: id })}`, pageWidth / 2, 28, { align: "center" });

      // Athlete info box
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("INFORMASI ATLET", 14, 40);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      const athleteInfo = [
        ["Nama", athleteName],
        ["Jenis Kelamin", athleteGender === "male" ? "Laki-laki" : athleteGender === "female" ? "Perempuan" : "-"],
        ["Usia", age ? `${age} tahun` : "-"],
        ["Tanggal Lahir", athleteBirthDate ? format(athleteBirthDate, "d MMMM yyyy", { locale: id }) : "-"],
        ["Berat Badan", athleteMass ? `${athleteMass} kg` : "-"],
        ["Tinggi Badan", athleteHeight ? `${athleteHeight} cm` : "-"],
        ["Cabang Olahraga", sportsBranch || "-"],
      ];

      autoTable(doc, {
        startY: 45,
        head: [],
        body: athleteInfo,
        theme: "plain",
        styles: { fontSize: 10, cellPadding: 2 },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 40 },
          1: { cellWidth: 60 },
        },
        margin: { left: 14 },
      });

      let currentY = (doc as any).lastAutoTable.finalY + 15;

      // Summary by category
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("RINGKASAN HASIL TES PER KATEGORI", 14, currentY);
      currentY += 8;

      // Process each category
      (Object.keys(testCategories) as TestCategory[]).forEach((category) => {
        const categoryTests = testsByCategory[category] || [];
        if (categoryTests.length === 0) return;

        const uniqueTests = [...new Set(categoryTests.map(t => t.test_name))];
        
        // Check if we need a new page
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(testCategories[category].name.toUpperCase(), 14, currentY);
        currentY += 2;

        const tableData = uniqueTests.map(testName => {
          const key = `${category}_${testName}`;
          const latestTest = latestTests[key];
          if (!latestTest) return null;

          const testInfo = testCategories[category].tests.find(t => t.id === testName);
          if (!testInfo) return null;

          let displayValue = latestTest.result_value;
          let valueStr = `${latestTest.result_value} ${testInfo.unit}`;

          if (testInfo.isRelativeToBodyWeight && latestTest.body_weight_at_test) {
            displayValue = latestTest.result_value / latestTest.body_weight_at_test;
            valueStr = `${latestTest.result_value}kg (${displayValue.toFixed(2)}x BW)`;
          }

          let normLabel = "-";
          if (athleteGender) {
            const normLevel = getNormLevel(
              testName,
              displayValue,
              athleteGender,
              ageGroup,
              testInfo.higherIsBetter
            );
            normLabel = normLevelLabels[normLevel];
          }

          return [
            testInfo.name,
            valueStr,
            format(new Date(latestTest.test_date), "d MMM yyyy", { locale: id }),
            normLabel,
          ];
        }).filter(Boolean) as string[][];

        if (tableData.length > 0) {
          autoTable(doc, {
            startY: currentY,
            head: [["Nama Tes", "Hasil", "Tanggal", "Kategori"]],
            body: tableData,
            theme: "striped",
            headStyles: {
              fillColor: [59, 130, 246],
              textColor: 255,
              fontStyle: "bold",
              fontSize: 9,
            },
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: {
              0: { cellWidth: 60 },
              1: { cellWidth: 45 },
              2: { cellWidth: 35 },
              3: { cellWidth: 35 },
            },
            margin: { left: 14, right: 14 },
          });

          currentY = (doc as any).lastAutoTable.finalY + 10;
        }
      });

      // Test history section (last 20 tests)
      if (tests.length > 0) {
        if (currentY > 200) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("RIWAYAT TES TERBARU", 14, currentY);
        currentY += 5;

        const historyData = tests.slice(0, 20).map(test => {
          const testInfo = testCategories[test.test_category as TestCategory]?.tests.find(t => t.id === test.test_name);
          return [
            format(new Date(test.test_date), "d MMM yy", { locale: id }),
            testCategories[test.test_category as TestCategory]?.name || test.test_category,
            testInfo?.name || test.test_name,
            `${test.result_value} ${test.result_unit}`,
          ];
        });

        autoTable(doc, {
          startY: currentY,
          head: [["Tanggal", "Kategori", "Tes", "Hasil"]],
          body: historyData,
          theme: "striped",
          headStyles: {
            fillColor: [100, 116, 139],
            textColor: 255,
            fontStyle: "bold",
            fontSize: 9,
          },
          styles: { fontSize: 8, cellPadding: 2 },
          margin: { left: 14, right: 14 },
        });
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(
          `Halaman ${i} dari ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
        doc.text(
          "Dibuat dengan HIRO - Sistem Monitoring Atlet",
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 5,
          { align: "center" }
        );
      }

      // Save PDF
      const fileName = `Laporan_Tes_${athleteName.replace(/\s+/g, "_")}_${format(new Date(), "yyyy-MM-dd")}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (tests.length === 0) {
    return null;
  }

  return (
    <Button onClick={generatePDF} disabled={isGenerating} variant="outline">
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Membuat PDF...
        </>
      ) : (
        <>
          <FileDown className="h-4 w-4 mr-2" />
          Unduh Laporan PDF
        </>
      )}
    </Button>
  );
}
