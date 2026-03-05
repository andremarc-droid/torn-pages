import type { GroupData } from "@/integrations/firebase";
import { Globe, Lock, Users } from "lucide-react";

interface GroupPreviewProps {
    group: GroupData & { id: string };
    onJoin: () => void;
    onRequestJoin: () => void;
    onEnterCode: () => void;
    onBack: () => void;
    joining: boolean;
    isMember: boolean;
}

export default function GroupPreview({ group, onJoin, onRequestJoin, onEnterCode, onBack, joining, isMember }: GroupPreviewProps) {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
            {/* Cover */}
            <div
                className="w-full max-w-lg h-48 rounded-t-xl overflow-hidden relative"
                style={{
                    background: group.coverImageUrl
                        ? `url(${group.coverImageUrl}) center/cover`
                        : `linear-gradient(135deg, hsl(200 45% 55%), hsl(240 50% 45%))`,
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                    <h2 className="font-handwritten text-4xl text-white drop-shadow-lg">{group.name}</h2>
                </div>
            </div>

            <div className="w-full max-w-lg bg-paper rounded-b-xl shadow-lg border border-border/40 border-t-0 p-6">
                <div className="flex items-center gap-3 mb-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-body font-medium ${group.isPublic
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        }`}>
                        {group.isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        {group.isPublic ? "Public" : "Private"}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-body text-muted-foreground">
                        <Users className="w-3 h-3" />
                        {group.memberCount || 0} members
                    </span>
                </div>

                <p className="font-body text-sm text-ink-light mb-6">
                    {group.description || "No description provided."}
                </p>

                {/* Blurred preview placeholder for wall */}
                <div className="relative rounded-lg overflow-hidden mb-6">
                    <div className="h-32 corkboard-texture opacity-60" />
                    <div className="absolute inset-0 backdrop-blur-md bg-paper/30 flex items-center justify-center">
                        <p className="font-handwritten text-xl text-ink/60">Join to see the group wall</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onBack}
                        className="px-4 py-2.5 text-sm font-body rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                    >
                        ← Back
                    </button>
                    {isMember ? (
                        <span className="flex-1 flex items-center justify-center px-4 py-2.5 text-sm font-body rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            Already a Member ✓
                        </span>
                    ) : group.isPublic ? (
                        <button
                            onClick={onJoin}
                            disabled={joining}
                            className="flex-1 px-4 py-2.5 text-sm font-body rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                            {joining ? "Joining…" : "Join Group"}
                        </button>
                    ) : (
                        <div className="flex-1 flex gap-2">
                            <button
                                onClick={onEnterCode}
                                className="flex-1 px-4 py-2.5 text-sm font-body rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                            >
                                Enter Invite Code
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
