import { useState } from "react";
import TornNote from "@/components/pinning-wall/TornNote";
import { cn } from "@/lib/utils";

const MOCK_NOTES = [
  { content: "I finally told someone how I really feel, and they listened. That's all I ever needed.", author: "quiet_storm", tags: ["gratitude", "confession"], reactions: { heart: 24, thought: 8, fire: 3, sad: 1 } },
  { content: "Some nights I write letters I'll never send. But at least the words exist somewhere now.", author: "midnight_ink", tags: ["rant"], reactions: { heart: 41, thought: 15, fire: 7, sad: 12 } },
  { content: "Stop waiting for the 'right moment.' Just start. The moment you begin IS the right moment.", author: "paper_crane", tags: ["advice"], reactions: { heart: 67, thought: 5, fire: 32, sad: 0 } },
  { content: "My grandmother used to fold my sadness into origami birds. I still see them everywhere.", author: "folded_sky", tags: ["confession", "gratitude"], reactions: { heart: 89, thought: 22, fire: 4, sad: 18 } },
  { content: "To whoever needs this: you are not your worst day. You are every day you chose to keep going.", author: "unnamed_sun", tags: ["advice"], reactions: { heart: 112, thought: 9, fire: 45, sad: 3 } },
  { content: "I eat lunch alone most days. It used to bother me. Now I bring a book and call it peace.", author: "solo_chapter", tags: ["confession"], reactions: { heart: 33, thought: 19, fire: 2, sad: 7 } },
];

const filters = ["Latest", "Most Reacted", "Tags"];

export default function Index() {
  const [activeFilter, setActiveFilter] = useState("Latest");

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="container px-4 text-center relative z-10">
          <h1 className="font-handwritten text-5xl md:text-7xl font-bold text-foreground mb-3">
            Notes & Ears
          </h1>
          <p className="font-handwritten text-2xl md:text-3xl text-ink-light mb-2">
            Write it. Rip it. Be heard.
          </p>
          <p className="font-body text-sm text-muted-foreground max-w-md mx-auto mb-8">
            An anonymous space to tear out your thoughts, pin them to the wall, 
            and know that someone, somewhere, is listening.
          </p>
          <div className="flex justify-center gap-3">
            <a
              href="/auth"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-md font-body text-sm hover:bg-primary/90 transition-colors shadow-md"
            >
              Start Writing
            </a>
            <a
              href="#wall"
              className="px-6 py-3 bg-secondary text-secondary-foreground rounded-md font-body text-sm hover:bg-secondary/80 transition-colors"
            >
              Browse the Wall
            </a>
          </div>
        </div>
        {/* Decorative torn paper edges */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-background torn-edge-top" />
      </section>

      {/* Pinning Wall */}
      <section id="wall" className="corkboard-texture py-12 min-h-screen">
        <div className="container px-4">
          {/* Filters */}
          <div className="flex justify-center gap-2 mb-10">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-body transition-all shadow-sm",
                  activeFilter === f
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-paper text-ink-light hover:bg-paper-dark"
                )}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Notes grid */}
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6 max-w-5xl mx-auto">
            {MOCK_NOTES.map((note, i) => (
              <div key={i} className="break-inside-avoid">
                <TornNote
                  {...note}
                  rotation={((i % 5) - 2) * 1.5}
                  delay={i}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
