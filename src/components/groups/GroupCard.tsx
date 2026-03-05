import type { GroupData } from "@/integrations/firebase";
import { motion } from "framer-motion";
import { Clock, Globe, Lock, Users } from "lucide-react";

interface GroupCardProps {
    group: GroupData & { id: string };
    index: number;
    onClick: () => void;
    showJoinButton?: boolean;
    onJoin?: () => void;
    isMember?: boolean;
}

function timeAgo(ts: any): string {
    if (!ts) return "";
    let ms = 0;
    if (ts?.toMillis) ms = ts.toMillis();
    else if (ts?.seconds) ms = ts.seconds * 1000;
    else return "";
    const diff = Date.now() - ms;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

export default function GroupCard({ group, index, onClick, showJoinButton, onJoin, isMember }: GroupCardProps) {
    const lastActivityStr = timeAgo(group.lastActivity || group.createdAt);

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.35 }}
            onClick={onClick}
            className="group/card bg-paper rounded-lg shadow-sm hover:shadow-lg transition-all cursor-pointer border border-border/40 overflow-hidden"
        >
            {/* Cover strip */}
            <div
                className="h-20 w-full relative overflow-hidden"
                style={{
                    background: group.coverImageUrl
                        ? `url(${group.coverImageUrl}) center/cover`
                        : `linear-gradient(135deg, hsl(${(index * 47) % 360} 45% 55%), hsl(${(index * 47 + 40) % 360} 50% 45%))`,
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                {/* Badge */}
                <div className="absolute top-2 right-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-body font-semibold backdrop-blur-sm ${group.isPublic
                            ? "bg-emerald-500/80 text-white"
                            : "bg-amber-500/80 text-white"
                        }`}>
                        {group.isPublic ? <Globe className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                        {group.isPublic ? "Public" : "Private"}
                    </span>
                </div>
            </div>

            <div className="p-4">
                <h3 className="font-handwritten text-2xl text-ink mb-1 group-hover/card:text-primary transition-colors">
                    {group.name}
                </h3>
                <p className="font-body text-xs text-ink-light line-clamp-2 mb-3 min-h-[2rem]">
                    {group.description || "No description yet."}
                </p>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1 text-xs font-body text-muted-foreground">
                            <Users className="w-3 h-3" />
                            {group.memberCount || 0}
                        </span>
                        {lastActivityStr && (
                            <span className="inline-flex items-center gap-1 text-xs font-body text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {lastActivityStr}
                            </span>
                        )}
                    </div>

                    {showJoinButton && !isMember && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onJoin?.(); }}
                            className="px-3 py-1 text-xs font-body rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                            Join
                        </button>
                    )}
                    {isMember && (
                        <span className="px-2 py-0.5 text-[10px] font-body rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            Joined
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
