import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HomeHero } from "@/components/home-hero";

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
      {/* ===== HERO ===== */}
      <HomeHero />

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
