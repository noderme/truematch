import Link from "next/link";

const features = [
  { icon: "✦", label: "AI Trait Analysis", desc: "Claude AI extracts your personality traits from your own words" },
  { icon: "⟳", label: "No Endless Swiping", desc: "Only people who truly align with who you are" },
  { icon: "⬡", label: "No Paywall", desc: "Core features are free — no subscription to match" },
  { icon: "⬛", label: "End-to-End Encrypted", desc: "Your messages stay private, always" },
];

export default function Landing() {
  return (
    <div className="relative min-h-[calc(100vh-120px)] flex flex-col items-center justify-center px-4 py-16 overflow-hidden">

      {/* Background glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-fuchsia-500/8 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-rose-500/6 rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-sky-500/6 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 max-w-2xl w-full text-center">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-fuchsia-500/25 bg-fuchsia-500/8 text-fuchsia-300 text-xs font-medium tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-pulse" />
          AI-Powered Compatibility Matching
        </div>

        {/* Headline */}
        <div className="flex flex-col gap-3">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-tight">
            Meet people who{" "}
            <span className="gradient-text">actually get you</span>
          </h1>
          <p className="text-slate-400 text-lg sm:text-xl leading-relaxed max-w-xl mx-auto">
            No swiping games. No paywalls. Just local AI that reads your story and finds people who truly match your vibe.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Link href="/signup" className="flex-1 sm:flex-none">
            <button className="w-full px-8 py-3.5 rounded-xl bg-gradient-to-r from-rose-500 via-fuchsia-500 to-sky-500 text-white font-semibold text-base shadow-lg shadow-fuchsia-900/40 hover:brightness-110 hover:shadow-fuchsia-900/60 transition-all duration-200">
              Get Started — Free
            </button>
          </Link>
          <Link href="/login" className="flex-1 sm:flex-none">
            <button className="w-full px-8 py-3.5 rounded-xl border border-slate-700/80 bg-slate-900/50 text-slate-200 font-semibold text-base hover:bg-slate-800/70 hover:border-slate-600 transition-all duration-200">
              Sign In
            </button>
          </Link>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-2 gap-3 w-full mt-4">
          {features.map((f) => (
            <div
              key={f.label}
              className="flex flex-col gap-1.5 p-4 rounded-xl border border-slate-800/80 bg-slate-900/40 text-left"
            >
              <span className="text-fuchsia-400 text-lg leading-none">{f.icon}</span>
              <span className="text-sm font-semibold text-slate-100">{f.label}</span>
              <span className="text-xs text-slate-500 leading-relaxed">{f.desc}</span>
            </div>
          ))}
        </div>

        {/* Social proof hint */}
        <p className="text-xs text-slate-600">
          Privacy-first · Runs locally · No data sold · Ever.
        </p>
      </div>
    </div>
  );
}
