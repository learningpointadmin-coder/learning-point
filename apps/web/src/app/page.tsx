import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/* ============================================================================
   HOME PAGE — Learning Point landing page (Emerald Edge)
   Server Component (no client JS). Uses the LP design-system components.
   ============================================================================ */

const categories = [
  { icon: "🌾", name: "Agriculture", exams: "UPSSSC, ICAR", color: "#22c55e" },
  { icon: "🔢", name: "Quant", exams: "Aptitude", color: "#3b82f6" },
  { icon: "🧩", name: "Reasoning", exams: "Logical", color: "#a855f7" },
  { icon: "📚", name: "GK / History", exams: "UP Special", color: "#f59e0b" },
  { icon: "💻", name: "Computer", exams: "Awareness", color: "#06b6d4" },
  { icon: "📖", name: "Language", exams: "Hindi / English", color: "#f43f5e" },
] as const;

const courses = [
  {
    category: "agriculture" as const,
    title: "UPSSSC Agriculture Full Mock",
    desc: "Complete syllabus coverage with PYQ-pattern questions and detailed step-by-step explanations.",
    badges: ["100 Questions"],
    meta: ["⏱ 120 min", "📊 Ranked", "🔁 5 reattempts"],
    price: "₹299",
    oldPrice: "₹499",
    cta: "Enroll",
    ctaVariant: "primary" as const,
    accentColor: "#22c55e",
  },
  {
    category: "quant" as const,
    title: "Quantitative Aptitude Booster",
    desc: "50 topic-wise tests covering arithmetic, algebra & data interpretation with shortcut tricks.",
    badges: ["Free"],
    meta: ["⏱ 60 min", "📊 Ranked", "🔁 5 reattempts"],
    price: "Free",
    oldPrice: null,
    cta: "Start Now",
    ctaVariant: "cta" as const,
    accentColor: "#3b82f6",
  },
  {
    category: "agriculture" as const,
    title: "Complete Test Series Bundle",
    desc: "All exams · 500+ tests · Lifetime access · Real-time rank & leaderboard scoring.",
    badges: ["Bundle"],
    meta: ["⏱ All", "📊 Ranked", "♾️ Lifetime"],
    price: "₹1,999",
    oldPrice: null,
    cta: "Buy Bundle",
    ctaVariant: "primary" as const,
    accentColor: "#22c55e",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* ===== NAV ===== */}
      <header className="border-b border-border-subtle sticky top-0 backdrop-blur-md bg-base/80 z-50">
        <nav className="max-w-container mx-auto flex items-center justify-between h-header px-4 md:px-6">
          <div className="flex items-center gap-2.5 font-extrabold text-lg">
            <span
              className="w-9 h-9 rounded-lg flex items-center justify-center text-base font-black"
              style={{
                background: "linear-gradient(135deg,#10b981,#0ea5e9)",
                boxShadow: "0 0 18px rgba(16,185,129,.4)",
              }}
            >
              LP
            </span>
            Learning Point
          </div>

          <div className="hidden md:flex items-center gap-7">
            <a href="#" className="text-sm font-medium text-content-secondary hover:text-content-primary transition-colors">Exams</a>
            <a href="#" className="text-sm font-medium text-content-secondary hover:text-content-primary transition-colors">Courses</a>
            <a href="#" className="text-sm font-medium text-content-secondary hover:text-content-primary transition-colors">Test Series</a>
            <a href="#" className="text-sm font-medium text-content-secondary hover:text-content-primary transition-colors">Free Tests</a>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-2 border border-border rounded-lg text-xs text-content-secondary cursor-pointer">
              🌐 EN
            </span>
            <Button variant="primary" size="sm">Login</Button>
          </div>
        </nav>
      </header>

      {/* ===== HERO ===== */}
      <section className="max-w-container mx-auto px-4 md:px-6 py-16 md:py-20 text-center animate-fade-in-up">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-500/10 border border-brand-600 rounded-full text-xs font-semibold text-brand-300 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500" style={{ boxShadow: "0 0 10px #10b981" }} />
          INDIA&apos;S EXAM-FOCUSED TEST PLATFORM
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-5">
          Master your exam with{" "}
          <span className="text-gradient">confidence</span>.
        </h1>

        <p className="text-lg text-content-secondary max-w-xl mx-auto mb-8">
          Syllabus-grounded tests, deep-approved explanations &amp; real ranks —
          built for serious aspirants. No fluff, just results.
        </p>

        <div className="flex gap-3 justify-center flex-wrap">
          <Button variant="primary" size="lg">Start Free Test →</Button>
          <Button variant="cta" size="lg">⚡ Explore Courses</Button>
        </div>

        <div className="flex gap-8 md:gap-12 justify-center mt-12 flex-wrap">
          {[
            { n: "500+", l: "Tests" },
            { n: "50k+", l: "Questions" },
            { n: "1,000+", l: "Students" },
            { n: "5", l: "Reattempts" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <div className="text-2xl md:text-3xl font-extrabold text-brand-300">{s.n}</div>
              <div className="text-xs text-content-muted mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      <section className="border-t border-border-subtle">
        <div className="max-w-container mx-auto px-4 md:px-6 py-12">
          <div className="text-center mb-9">
            <div className="text-xs font-bold uppercase tracking-widest text-brand-300 mb-2.5">Exam Categories</div>
            <h2 className="text-3xl font-extrabold">What are you preparing for?</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {categories.map((c) => (
              <div
                key={c.name}
                className="bg-surface-1 border border-border-subtle rounded-2xl p-5 text-center transition-all duration-base hover:-translate-y-1 hover:border-border"
              >
                <div
                  className="w-11 h-11 rounded-xl mx-auto mb-3 flex items-center justify-center text-xl"
                  style={{ background: `${c.color}26`, color: c.color }}
                >
                  {c.icon}
                </div>
                <div className="font-bold text-sm">{c.name}</div>
                <div className="text-xs text-content-muted mt-0.5">{c.exams}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== COURSES ===== */}
      <section className="border-t border-border-subtle">
        <div className="max-w-container mx-auto px-4 md:px-6 py-12">
          <div className="text-center mb-9">
            <div className="text-xs font-bold uppercase tracking-widest text-brand-300 mb-2.5">Popular Courses</div>
            <h2 className="text-3xl font-extrabold">Start your preparation today</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((course) => (
              <Card key={course.title} variant="accent" accentColor={course.accentColor} className="flex flex-col hover:-translate-y-1 hover:border-brand-600 transition-all duration-base">
                <CardHeader>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant={course.category}>{course.category === "agriculture" ? "Agriculture" : "Quant"}</Badge>
                    {course.badges.map((b) => (
                      <Badge key={b} variant={b === "Free" ? "brand" : "neutral"} size="sm">{b === "Free" ? "✓ Free" : b}</Badge>
                    ))}
                  </div>
                </CardHeader>

                <CardTitle className="mb-2">{course.title}</CardTitle>
                <CardDescription className="mb-4">{course.desc}</CardDescription>

                <div className="flex gap-3.5 text-xs text-content-muted mb-4">
                  {course.meta.map((m) => (
                    <span key={m}>{m}</span>
                  ))}
                </div>

                <CardFooter className="mt-auto justify-between">
                  <div className="font-extrabold text-2xl">
                    {course.oldPrice && (
                      <span className="text-sm text-content-muted line-through font-medium mr-1.5">{course.oldPrice}</span>
                    )}
                    <span className={course.price === "Free" ? "text-brand-300" : ""}>{course.price}</span>
                  </div>
                  <Button variant={course.ctaVariant} size="sm">{course.cta} →</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-border-subtle">
        <div className="max-w-container mx-auto px-4 md:px-6 py-10 text-center">
          <div className="flex items-center justify-center gap-2.5 font-extrabold text-lg mb-3">
            <span
              className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black"
              style={{ background: "linear-gradient(135deg,#10b981,#0ea5e9)" }}
            >
              LP
            </span>
            Learning Point
          </div>
          <p className="text-sm text-content-muted">
            Learning Point · Emerald Edge Design System v1.0 · Built with Next.js + Cloudflare
          </p>
        </div>
      </footer>
    </div>
  );
}
