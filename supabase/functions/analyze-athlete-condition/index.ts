import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fitness, fatigue, form, formPercent, ramp, athleteName, date, readinessStats } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Anda adalah seorang ahli performance coach dan sport scientist yang berpengalaman. Tugas Anda adalah menganalisis kondisi atlet berdasarkan metrik performa berikut:

## Metrik Training Load:
- Fitness (CTL): Chronic Training Load - menunjukkan kebugaran jangka panjang (rata-rata 42 hari)
- Fatigue (ATL): Acute Training Load - menunjukkan kelelahan jangka pendek (rata-rata 7 hari)  
- Form (TSB): Training Stress Balance = Fitness - Fatigue. Nilai negatif = atlet sedang dalam fase pelatihan berat. Nilai positif = atlet segar dan siap berkompetisi.
- Form %: Persentase form relatif terhadap fitness
- Ramp: Perubahan fitness dari hari sebelumnya

## Zona Form:
- < -30%: High Risk (risiko overtraining/cedera tinggi)
- -30% s/d -10%: Optimal Training (zona latihan produktif)
- -10% s/d 5%: Grey Zone (transisi)
- 5% s/d 20%: Fresh (siap untuk kompetisi)
- >= 20%: Transition/Detraining (mulai kehilangan kebugaran)

## Metrik Readiness:
- Readiness Score (%): Skor kesiapan atlet berdasarkan Vertical Jump dan Resting Heart Rate
  - < 60%: Low (kondisi tidak optimal, perlu recovery)
  - 60-80%: Medium (kondisi cukup baik)
  - > 80%: High (kondisi prima, siap latihan berat)

- VO2max (ml/kg/min): Kapasitas aerobik atlet
  - < 35: Low (kebugaran kardiovaskular rendah)
  - 35-50: Medium (kebugaran kardiovaskular sedang)
  - > 50: High (kebugaran kardiovaskular tinggi)

- Power (watts): Daya ledak otot
  - < 1500W: Low (daya rendah)
  - 1500-2500W: Medium (daya sedang)
  - > 2500W: High (daya tinggi)

Berikan analisis yang:
1. Singkat dan mudah dipahami (4-5 paragraf)
2. Menjelaskan kondisi training load atlet
3. Menganalisis kondisi readiness (readiness score, VO2max, power) dengan membandingkan nilai saat ini vs rata-rata
4. Memberikan rekomendasi latihan yang spesifik berdasarkan kombinasi training load dan readiness
5. Dalam bahasa Indonesia yang profesional`;

    const userPrompt = `Analisis kondisi atlet berikut:

${athleteName ? `Nama Atlet: ${athleteName}` : 'Atlet'}
Tanggal: ${date}

## Metrik Training Load:
- Fitness (CTL): ${fitness}
- Fatigue (ATL): ${fatigue}
- Form (TSB): ${form}
- Form %: ${formPercent}%
- Ramp: ${ramp}

## Metrik Readiness:
${readinessStats ? `
### Readiness Score:
- Saat ini: ${readinessStats.currentReadiness?.toFixed(1) || 0}%
- Rata-rata: ${readinessStats.readiness?.avg?.toFixed(1) || 0}%
- Terendah: ${readinessStats.readiness?.low?.toFixed(1) || 0}%
- Tertinggi: ${readinessStats.readiness?.peak?.toFixed(1) || 0}%

### VO2max:
- Saat ini: ${readinessStats.currentVO2max?.toFixed(1) || 0} ml/kg/min
- Rata-rata: ${readinessStats.vo2max?.avg?.toFixed(1) || 0} ml/kg/min
- Terendah: ${readinessStats.vo2max?.low?.toFixed(1) || 0} ml/kg/min
- Tertinggi: ${readinessStats.vo2max?.peak?.toFixed(1) || 0} ml/kg/min

### Power:
- Saat ini: ${readinessStats.currentPower?.toFixed(0) || 0} watts
- Rata-rata: ${readinessStats.power?.avg?.toFixed(0) || 0} watts
- Terendah: ${readinessStats.power?.low?.toFixed(0) || 0} watts
- Tertinggi: ${readinessStats.power?.peak?.toFixed(0) || 0} watts
` : 'Data readiness tidak tersedia'}

Berikan analisis kondisi atlet dan rekomendasi latihan yang tepat berdasarkan kombinasi training load dan readiness.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to analyze condition" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || "Unable to generate analysis";

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
