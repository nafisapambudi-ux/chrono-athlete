import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Activity, BarChart3, Users, Heart, TrendingUp, CheckCircle, ArrowRight, Dumbbell } from "lucide-react";
export default function Landing() {
  const navigate = useNavigate();
  const features = [{
    icon: Users,
    title: "Manajemen Atlet",
    description: "Kelola data atlet termasuk nama, tinggi badan, berat badan, dan foto profil dengan mudah."
  }, {
    icon: Activity,
    title: "Training Sessions",
    description: "Catat sesi latihan dengan durasi, RPE (Rate of Perceived Exertion), dan catatan latihan."
  }, {
    icon: Heart,
    title: "Athlete Readiness",
    description: "Pantau kesiapan atlet melalui detak jantung istirahat dan vertical jump harian."
  }, {
    icon: TrendingUp,
    title: "Fitness, Fatigue & Form",
    description: "Visualisasi grafik Fitness, Fatigue, dan Form berdasarkan data training load."
  }, {
    icon: BarChart3,
    title: "Dashboard Analytics",
    description: "Lihat statistik lengkap dan perbandingan performa antar atlet."
  }, {
    icon: Dumbbell,
    title: "AI Analysis",
    description: "Dapatkan rekomendasi latihan berdasarkan analisis kondisi atlet menggunakan AI."
  }];
  const steps = [{
    step: 1,
    title: "Daftar atau Masuk",
    description: "Buat akun baru atau masuk dengan akun yang sudah ada."
  }, {
    step: 2,
    title: "Tambah Atlet",
    description: "Masukkan data atlet yang ingin Anda pantau."
  }, {
    step: 3,
    title: "Catat Sesi Latihan",
    description: "Input data training session setiap kali atlet berlatih (durasi & RPE)."
  }, {
    step: 4,
    title: "Input Readiness Harian",
    description: "Catat detak jantung istirahat dan vertical jump atlet setiap hari."
  }, {
    step: 5,
    title: "Analisis Data",
    description: "Lihat grafik Fitness/Fatigue/Form dan gunakan AI untuk rekomendasi."
  }];
  return <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
              <img src="/hiro-logo.png" alt="HIROCROSS Logo" className="w-9 h-9 object-contain" />
            </div>
            <h1 className="text-xl font-bold text-foreground">HIROCROSS</h1>
          </div>
          <Button onClick={() => navigate("/auth")} className="bg-primary hover:bg-primary/90">
            Masuk / Daftar
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">HIROCROSS Training App</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Aplikasi monitoring performa atlet profesional. Pantau Fitness, Fatigue, dan Form 
            untuk mengoptimalkan program latihan Anda.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")} className="bg-primary hover:bg-primary/90">
              Mulai Sekarang
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => document.getElementById('features')?.scrollIntoView({
            behavior: 'smooth'
          })}>
              Pelajari Lebih Lanjut
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-4">
            Fitur Utama
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Semua yang Anda butuhkan untuk memantau dan mengoptimalkan performa atlet Anda.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => <Card key={index} className="bg-card border-border/50 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* How to Use Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-4">
            Cara Menggunakan
          </h2>
          <p className="text-muted-foreground text-center mb-12">
            Ikuti langkah-langkah berikut untuk mulai menggunakan aplikasi.
          </p>
          <div className="space-y-6">
            {steps.map(item => <div key={item.step} className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shrink-0">
                  {item.step}
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                </div>
                <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-2" />
              </div>)}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Siap Memulai?
          </h2>
          <p className="text-muted-foreground mb-8">
            Daftar sekarang dan mulai pantau performa atlet Anda dengan lebih efektif.
          </p>
          <Button size="lg" onClick={() => navigate("/auth")} className="bg-primary hover:bg-primary/90">
            Daftar Gratis
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center text-muted-foreground text-sm">
          <p>© 2026 HIROCROSS. All rights reserved.</p>
        </div>
      </footer>
    </div>;
}