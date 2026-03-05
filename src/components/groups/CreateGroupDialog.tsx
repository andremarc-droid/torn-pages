import { Globe, ImagePlus, Lock, X } from "lucide-react";
import { useState } from "react";

interface CreateGroupDialogProps {
    open: boolean;
    onClose: () => void;
    onCreate: (data: { name: string; description: string; isPublic: boolean; coverImageUrl: string }) => void;
    creating: boolean;
}

export default function CreateGroupDialog({ open, onClose, onCreate, creating }: CreateGroupDialogProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isPublic, setIsPublic] = useState(true);
    const [coverImageUrl, setCoverImageUrl] = useState("");

    if (!open) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        onCreate({ name: name.trim(), description: description.trim(), isPublic, coverImageUrl: coverImageUrl.trim() });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-paper rounded-xl shadow-2xl border border-border/50 w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-2">
                    <h2 className="font-handwritten text-3xl text-ink">Create a Group</h2>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-secondary transition-colors">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-4">
                    {/* Group Name */}
                    <div>
                        <label className="block text-xs font-body text-ink-light mb-1">Group Name *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Late Night Poets"
                            maxLength={60}
                            className="w-full px-3 py-2.5 bg-paper-dark border border-border rounded-md font-body text-sm text-ink placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                            autoFocus
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-body text-ink-light mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What's this group about?"
                            maxLength={200}
                            rows={3}
                            className="w-full px-3 py-2.5 bg-paper-dark border border-border rounded-md font-body text-sm text-ink placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                        />
                    </div>

                    {/* Cover Image URL */}
                    <div>
                        <label className="block text-xs font-body text-ink-light mb-1">Cover Image URL (optional)</label>
                        <div className="relative">
                            <ImagePlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="url"
                                value={coverImageUrl}
                                onChange={(e) => setCoverImageUrl(e.target.value)}
                                placeholder="https://example.com/image.jpg"
                                className="w-full pl-9 pr-3 py-2.5 bg-paper-dark border border-border rounded-md font-body text-sm text-ink placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                            />
                        </div>
                    </div>

                    {/* Visibility Toggle */}
                    <div>
                        <label className="block text-xs font-body text-ink-light mb-2">Visibility</label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setIsPublic(true)}
                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm font-body border transition-all ${isPublic
                                        ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-700 dark:text-emerald-400"
                                        : "bg-paper-dark border-border text-ink-light hover:bg-secondary"
                                    }`}
                            >
                                <Globe className="w-4 h-4" />
                                Public
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsPublic(false)}
                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm font-body border transition-all ${!isPublic
                                        ? "bg-amber-500/15 border-amber-500/50 text-amber-700 dark:text-amber-400"
                                        : "bg-paper-dark border-border text-ink-light hover:bg-secondary"
                                    }`}
                            >
                                <Lock className="w-4 h-4" />
                                Private
                            </button>
                        </div>
                        <p className="text-[11px] font-body text-muted-foreground mt-1.5">
                            {isPublic ? "Anyone can find and join this group." : "Invite only — members need a code or invitation."}
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-body rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!name.trim() || creating}
                            className="px-4 py-2 text-sm font-body rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                            {creating ? "Creating…" : "Create Group"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
