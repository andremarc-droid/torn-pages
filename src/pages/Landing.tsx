import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { BookOpen, Shield, Users, Ear, Scissors, Heart } from "lucide-react";

const features = [
  {
    icon: Scissors,
    title: "Tear it out",
    description: "Rip your deepest thoughts from the page. No filters, no polish — just raw honesty.",
  },
  {
    icon: Ear,
    title: "Be heard",
    description: "Pin your torn notes to the wall and know that someone, somewhere, is truly listening.",
  },
  {
    icon: Shield,
    title: "Stay anonymous",
    description: "Your identity stays hidden. Share freely under the safety of anonymity.",
  },
  {
    icon: Users,
    title: "Find your circle",
    description: "Join groups of like-minded souls. Late-night writers, healers, ranters — all welcome.",
  },
  {
    icon: Heart,
    title: "React & connect",
    description: "No comments, no trolls — just heartfelt reactions: 🤍 💭 🔥 😔",
  },
  {
    icon: BookOpen,
    title: "Keep your book",
    description: "Every page you write lives in your private book. Tear pieces out, or keep them close.",
  },
];

const floatingNotes = [
  { content: "I finally told someone how I really feel…", rotation: -8, top: "12%", left: "5%", delay: 0 },
  { content: "Stop waiting for the 'right moment.'", rotation: 5, top: "28%", right: "4%", delay: 0.3 },
  { content: "Some nights I write letters I'll never send.", rotation: -3, top: "55%", left: "3%", delay: 0.6 },
  { content: "You are not your worst day.", rotation: 7, top: "72%", right: "6%", delay: 0.9 },
];

export default function Landing() {
  return (
    <div className="min-h-screen overflow-hidden">
      {/* ── Floating decorative notes (larger screens) ── */}
      <div className="hidden lg:block fixed inset-0 pointer-events-none z-0">
        {floatingNotes.map((note, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 0.35, y: 0 }}
            transition={{ delay: note.delay + 1, duration: 1.2, ease: "easeOut" }}
            className="absolute max-w-[200px] bg-paper p-4 shadow-lg torn-edge-bottom"
            style={{
              transform: `rotate(${note.rotation}deg)`,
              top: note.top,
              left: note.left,
              right: (note as any).right,
            }}
          >
            <p className="font-handwritten text-base text-ink">{note.content}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Navigation ── */}
      <header className="relative z-20 border-b border-border/50 bg-card/60 backdrop-blur-md">
        <div className="container flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <EarLogo />
            <span className="font-handwritten text-2xl font-bold text-foreground">
              Notes &amp; Ears
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/auth"
              className="px-4 py-2 rounded-md font-body text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/auth?mode=signup"
              className="px-5 py-2.5 bg-primary text-primary-foreground rounded-md font-body text-sm font-medium hover:bg-primary/90 transition-colors shadow-md"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative z-10 py-24 md:py-36 overflow-hidden">
        {/* Background grain */}
        <div className="absolute inset-0 corkboard-texture opacity-20 pointer-events-none" />

        <div className="container px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="inline-block px-4 py-1.5 mb-6 bg-primary/10 text-primary rounded-full font-body text-xs tracking-wide uppercase">
              A safe space for raw honesty
            </span>
            <h1 className="font-handwritten text-6xl md:text-8xl lg:text-9xl font-bold text-foreground mb-4 leading-tight">
              Notes &amp; Ears
            </h1>
            <p className="font-handwritten text-2xl md:text-3xl text-ink-light mb-3">
              Write it. Rip it. Be heard.
            </p>
            <p className="font-body text-sm md:text-base text-muted-foreground max-w-lg mx-auto mb-10 leading-relaxed">
              An anonymous space to tear out your thoughts, pin them to the wall,
              and know that someone, somewhere, is listening.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <Link
              to="/auth?mode=signup"
              className="px-8 py-4 bg-primary text-primary-foreground rounded-md font-body text-sm font-medium hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Start Writing — It's Free
            </Link>
            <a
              href="#how-it-works"
              className="px-8 py-4 bg-secondary text-secondary-foreground rounded-md font-body text-sm hover:bg-secondary/80 transition-all"
            >
              How It Works
            </a>
          </motion.div>
        </div>

        {/* Torn edge at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-background torn-edge-top" />
      </section>

      {/* ── Sample Torn Note Showcase ── */}
      <section className="relative z-10 py-20 bg-background">
        <div className="container px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="font-handwritten text-4xl md:text-5xl text-foreground mb-2">
              Voices on the wall
            </h2>
            <p className="font-body text-sm text-muted-foreground">
              Real thoughts, torn from real pages — pinned anonymously.
            </p>
          </motion.div>

          <div className="corkboard-texture rounded-xl p-8 md:p-12 max-w-4xl mx-auto">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { text: "I finally told someone how I really feel, and they listened. That's all I ever needed.", author: "quiet_storm", rotation: -2 },
                { text: "Stop waiting for the 'right moment.' Just start. The moment you begin IS the right moment.", author: "paper_crane", rotation: 1.5 },
                { text: "My grandmother used to fold my sadness into origami birds. I still see them everywhere.", author: "folded_sky", rotation: -1 },
              ].map((note, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  className="relative"
                >
                  {/* Thumbtack */}
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 w-5 h-5">
                    <div
                      className="w-4 h-4 rounded-full shadow-md mx-auto"
                      style={{ background: "radial-gradient(circle at 35% 35%, hsl(0 80% 60%), hsl(0 70% 38%))" }}
                    />
                  </div>
                  <div
                    className="bg-paper p-5 pt-6 pb-8 shadow-lg torn-edge-bottom hover:scale-105 transition-transform cursor-default"
                    style={{ transform: `rotate(${note.rotation}deg)` }}
                  >
                    <p className="font-handwritten text-xl leading-relaxed text-ink mb-3">
                      {note.text}
                    </p>
                    <p className="text-xs font-body text-ink-light italic">— {note.author}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="relative z-10 py-20 bg-card/40">
        <div className="container px-4 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <h2 className="font-handwritten text-4xl md:text-5xl text-foreground mb-2">
              How it works
            </h2>
            <p className="font-body text-sm text-muted-foreground max-w-md mx-auto">
              Three simple steps to let your thoughts breathe.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Write a page", desc: "Open your book and pour your thoughts onto a blank page. No rules, no structure." },
              { step: "02", title: "Tear it out", desc: "Select the words that matter most. Rip them from the page as a torn note." },
              { step: "03", title: "Pin it to the wall", desc: "Share your torn note anonymously on the community wall. Let the world listen." },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="text-center group"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-5 group-hover:bg-primary/20 transition-colors">
                  <span className="font-handwritten text-3xl font-bold">{item.step}</span>
                </div>
                <h3 className="font-handwritten text-2xl text-foreground mb-2">{item.title}</h3>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="relative z-10 py-20 bg-background">
        <div className="container px-4 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <h2 className="font-handwritten text-4xl md:text-5xl text-foreground mb-2">
              Everything you need
            </h2>
            <p className="font-body text-sm text-muted-foreground">
              Simple tools for honest expression.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="bg-paper p-6 rounded-md shadow-sm hover:shadow-md transition-all group border border-border/30"
              >
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feat.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-handwritten text-2xl text-ink mb-1">{feat.title}</h3>
                <p className="font-body text-sm text-ink-light leading-relaxed">{feat.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="relative z-10 py-24 corkboard-texture">
        <div className="container px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-handwritten text-4xl md:text-6xl text-foreground mb-3">
              Ready to tear out your first page?
            </h2>
            <p className="font-body text-sm text-muted-foreground mb-8 max-w-md mx-auto">
              Join a community of anonymous writers who choose honesty over perfection.
            </p>
            <Link
              to="/auth?mode=signup"
              className="inline-block px-10 py-4 bg-primary text-primary-foreground rounded-md font-body text-sm font-medium hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Create Your Free Account
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 py-8 bg-card border-t border-border/50">
        <div className="container px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <EarLogo />
            <span className="font-handwritten text-lg text-foreground">Notes &amp; Ears</span>
          </div>
          <p className="font-body text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Notes &amp; Ears. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ── Shared logo component ── */
function EarLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14 2C8.48 2 4 6.48 4 12c0 3.5 1.8 6.6 4.5 8.4.5.3.8.9.8 1.5V24c0 1.1.9 2 2 2h5.4c1.1 0 2-.9 2-2v-2.1c0-.6.3-1.2.8-1.5C22.2 18.6 24 15.5 24 12c0-5.52-4.48-10-10-10z"
        fill="hsl(var(--primary))"
        opacity="0.9"
      />
      <path
        d="M14 5c-3.87 0-7 3.13-7 7 0 2.2 1 4.2 2.6 5.5"
        stroke="hsl(var(--primary-foreground))"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M14 8c-2.21 0-4 1.79-4 4s1.79 4 4 4"
        stroke="hsl(var(--primary-foreground))"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <rect x="17" y="3" width="8" height="10" rx="1" fill="hsl(var(--paper))" transform="rotate(15 21 8)" />
      <line x1="19" y1="5.5" x2="24" y2="4.5" stroke="hsl(var(--ink-light))" strokeWidth="0.8" transform="rotate(15 21 8)" />
      <line x1="19" y1="7.5" x2="23" y2="6.5" stroke="hsl(var(--ink-light))" strokeWidth="0.8" transform="rotate(15 21 8)" />
    </svg>
  );
}
