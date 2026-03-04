import { motion } from "framer-motion";
import { Heart, MessageCircle, Flame, Frown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TornNoteProps {
  content: string;
  author: string;
  tags?: string[];
  reactions?: { heart: number; thought: number; fire: number; sad: number };
  rotation?: number;
  delay?: number;
}

const reactionIcons = [
  { key: "heart", icon: "🤍", label: "Heart" },
  { key: "thought", icon: "💭", label: "Thought" },
  { key: "fire", icon: "🔥", label: "Fire" },
  { key: "sad", icon: "😔", label: "Sad" },
] as const;

export default function TornNote({
  content,
  author,
  tags = [],
  reactions = { heart: 0, thought: 0, fire: 0, sad: 0 },
  rotation = 0,
  delay = 0,
}: TornNoteProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.4, ease: "easeOut" }}
      style={{ "--rotation": `${rotation}deg` } as React.CSSProperties}
      className="group relative"
    >
      {/* Thumbtack */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 w-5 h-5">
        <div className="w-4 h-4 rounded-full bg-pin shadow-md mx-auto" 
          style={{ background: "radial-gradient(circle at 35% 35%, hsl(0 80% 60%), hsl(0 70% 38%))" }}
        />
        <div className="w-1 h-2 bg-pin/60 mx-auto -mt-0.5 rounded-b-full" />
      </div>

      {/* Paper note */}
      <div
        className={cn(
          "bg-paper p-5 pt-6 pb-8 shadow-lg transition-transform duration-300",
          "hover:scale-105 hover:shadow-xl cursor-pointer",
          "torn-edge-bottom"
        )}
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        {/* Content */}
        <p className="font-handwritten text-xl leading-relaxed text-ink mb-3">
          {content}
        </p>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {tags.map((tag) => (
              <span
                key={tag}
                className="text-xs font-body text-ink-light bg-paper-dark px-2 py-0.5 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Author */}
        <p className="text-xs font-body text-ink-light italic mb-3">— {author}</p>

        {/* Reactions */}
        <div className="flex gap-2">
          {reactionIcons.map(({ key, icon }) => (
            <button
              key={key}
              className="flex items-center gap-1 text-xs font-body text-ink-light hover:text-ink transition-colors bg-paper-dark/50 px-2 py-1 rounded-full hover:bg-paper-dark"
            >
              <span>{icon}</span>
              <span>{reactions[key as keyof typeof reactions]}</span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
