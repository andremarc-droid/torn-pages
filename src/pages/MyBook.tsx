import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, FileText, Scissors, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const MOCK_PAGES = [
  { id: 1, title: "Untitled Page", preview: "Today I realized that the things I fear most are...", date: "Mar 2, 2026" },
  { id: 2, title: "Letter to nobody", preview: "Dear whoever finds this — I've been carrying something heavy...", date: "Feb 28, 2026" },
  { id: 3, title: "3am thoughts", preview: "Why do we wait until it's too late to say the things that matter?", date: "Feb 25, 2026" },
];

const MOCK_TORN = [
  { id: 1, content: "the things I fear most are the things I've already survived", pinned: false },
  { id: 2, content: "carrying something heavy doesn't mean you're weak — it means you haven't put it down yet", pinned: true },
];

export default function MyBook() {
  const [tab, setTab] = useState<"pages" | "torn">("pages");

  return (
    <div className="min-h-screen py-8 pb-24 md:pb-8">
      <div className="container px-4 max-w-3xl">
        {/* Book header */}
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="w-6 h-6 text-primary" />
          <h1 className="font-handwritten text-4xl text-foreground">My Book</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("pages")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md font-body text-sm transition-colors",
              tab === "pages" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            <FileText className="w-4 h-4" />
            Pages
          </button>
          <button
            onClick={() => setTab("torn")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md font-body text-sm transition-colors",
              tab === "torn" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            <Scissors className="w-4 h-4" />
            Torn & Kept
          </button>
        </div>

        {tab === "pages" ? (
          <div className="space-y-3">
            {/* New page button */}
            <button className="w-full p-4 border-2 border-dashed border-border rounded-md flex items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors font-body text-sm">
              <Plus className="w-4 h-4" />
              New Page
            </button>

            {MOCK_PAGES.map((page, i) => (
              <motion.div
                key={page.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-paper p-5 rounded-md shadow-sm hover:shadow-md transition-shadow cursor-pointer paper-texture"
              >
                <h3 className="font-handwritten text-xl text-ink mb-1">{page.title}</h3>
                <p className="font-body text-sm text-ink-light line-clamp-2 mb-2">{page.preview}</p>
                <span className="font-body text-xs text-muted-foreground">{page.date}</span>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {MOCK_TORN.length === 0 ? (
              <p className="text-center text-muted-foreground font-body text-sm py-12">
                No torn notes yet. Open a page and rip something out!
              </p>
            ) : (
              MOCK_TORN.map((note, i) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-paper p-5 shadow-md torn-edge-bottom"
                  style={{ transform: `rotate(${(i % 3 - 1) * 0.8}deg)` }}
                >
                  <p className="font-handwritten text-xl text-ink mb-3">{note.content}</p>
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "text-xs font-body px-2 py-1 rounded-full",
                      note.pinned ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"
                    )}>
                      {note.pinned ? "📌 Pinned to wall" : "Kept private"}
                    </span>
                    {!note.pinned && (
                      <button className="text-xs font-body text-primary hover:underline">
                        Pin to Wall →
                      </button>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
