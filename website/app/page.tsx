import { motion } from "framer-motion";

const features = [
  {
    title: "Autonomous workflows",
    body: "Design, launch, and monitor agentic tasks with a polished interface built for clarity and speed."
  },
  {
    title: "Machine-readable structure",
    body: "Semantic sections, clear labels, and accessible controls make the site friendlier to humans and agents."
  },
  {
    title: "Future-grade visuals",
    body: "Neon lighting, glass panels, and cinematic motion create a premium product experience."
  }
];

const stats = [
  { value: "99.9%", label: "workflow visibility" },
  { value: "24/7", label: "agent readiness" },
  { value: "∞", label: "scalable prompts" }
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-radial-glow text-slate-100">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 py-16 lg:px-10">
        <div className="mb-8 inline-flex w-fit rounded-full border border-cyan-400/20 bg-white/5 px-4 py-2 text-sm text-cyan-200 backdrop-blur">
          Agent-ready website · cinematic motion · GitHub Pages deployable
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
              The futuristic AI agent website for modern automation.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Lorapok AI combines premium design, structured content, and
              machine-friendly presentation to showcase an advanced AI product
              with world-class polish.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#features"
                className="rounded-full bg-cyan-400 px-6 py-3 font-medium text-slate-950 transition hover:bg-cyan-300"
              >
                Explore features
              </a>
              <a
                href="#contact"
                className="rounded-full border border-white/15 bg-white/5 px-6 py-3 font-medium text-white backdrop-blur transition hover:bg-white/10"
              >
                Request a demo
              </a>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur-xl"
          >
            <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5">
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
                live agent status
              </p>
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text