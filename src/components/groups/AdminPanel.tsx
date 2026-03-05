import type { GroupData } from "@/integrations/firebase";
import { Copy, Globe, ImagePlus, Lock, Shield, Trash2, UserMinus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface AdminPanelProps {
    group: GroupData & { id: string };
    memberProfiles: { uid: string; name: string }[];
    onUpdate: (data: Partial<GroupData>) => void;
    onRemoveMember: (uid: string) => void;
    onTransferAdmin: (uid: string) => void;
    onDeleteGroup: () => void;
    onClose: () => void;
    updating: boolean;
}

export default function AdminPanel({
    group, memberProfiles, onUpdate, onRemoveMember, onTransferAdmin, onDeleteGroup, onClose, updating,
}: AdminPanelProps) {
    const [name, setName] = useState(group.name);
    const [description, setDescription] = useState(group.description);
    const [coverImageUrl, setCoverImageUrl] = useState(group.coverImageUrl || "");
    const [isPublic, setIsPublic] = useState(group.isPublic);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const handleSave = () => {
        onUpdate({ name: name.trim(), description: description.trim(), coverImageUrl: coverImageUrl.trim(), isPublic });
    };

    const copyInvite = () => {
        if (group.inviteCode) {
            navigator.clipboard.writeText(group.inviteCode);
            toast.success("Invite code copied!");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-paper rounded-xl shadow-2xl border border-border/50 w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-5 pt-5 pb-2 sticky top-0 bg-paper z-10">
                    <h2 className="font-handwritten text-3xl text-ink">Manage Group</h2>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-secondary transition-colors">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                <div className="px-5 pb-5 space-y-5">
                    {/* Edit fields */}
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-body text-ink-light mb-1">Group Name</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={60}
                                className="w-full px-3 py-2 bg-paper-dark border border-border rounded-md font-body text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/40" />
                        </div>
                        <div>
                            <label className="block text-xs font-body text-ink-light mb-1">Description</label>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={200} rows={2}
                                className="w-full px-3 py-2 bg-paper-dark border border-border rounded-md font-body text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-body text-ink-light mb-1">Cover Image URL</label>
                            <div className="relative">
                                <ImagePlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input type="url" value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-paper-dark border border-border rounded-md font-body text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/40" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-body text-ink-light mb-2">Visibility</label>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setIsPublic(true)}
                                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-body border transition-all ${isPublic ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-700 dark:text-emerald-400" : "bg-paper-dark border-border text-ink-light"}`}>
                                    <Globe className="w-4 h-4" /> Public
                                </button>
                                <button type="button" onClick={() => setIsPublic(false)}
                                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-body border transition-all ${!isPublic ? "bg-amber-500/15 border-amber-500/50 text-amber-700 dark:text-amber-400" : "bg-paper-dark border-border text-ink-light"}`}>
                                    <Lock className="w-4 h-4" /> Private
                                </button>
                            </div>
                        </div>
                        <button onClick={handleSave} disabled={updating || !name.trim()}
                            className="w-full px-4 py-2 text-sm font-body rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                            {updating ? "Saving…" : "Save Changes"}
                        </button>
                    </div>

                    {/* Invite Code */}
                    {group.inviteCode && (
                        <div className="bg-paper-dark rounded-lg p-3 border border-border/50">
                            <label className="block text-xs font-body text-ink-light mb-1">Invite Code</label>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 font-mono text-lg text-ink tracking-widest">{group.inviteCode}</code>
                                <button onClick={copyInvite} className="p-2 rounded-md hover:bg-secondary transition-colors" title="Copy">
                                    <Copy className="w-4 h-4 text-muted-foreground" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Members */}
                    <div>
                        <h3 className="text-xs font-body font-semibold text-ink-light uppercase tracking-wider mb-2">
                            Members ({memberProfiles.length})
                        </h3>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                            {memberProfiles.map((m) => (
                                <div key={m.uid} className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-paper-dark/50 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-body font-bold text-primary">
                                            {m.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-sm font-body text-ink">{m.name}</span>
                                        {m.uid === group.adminId && (
                                            <span className="px-1.5 py-0.5 text-[9px] font-body font-semibold rounded bg-amber-500/20 text-amber-700 dark:text-amber-400">
                                                👑 Admin
                                            </span>
                                        )}
                                    </div>
                                    {m.uid !== group.adminId && (
                                        <div className="flex gap-1">
                                            <button onClick={() => onTransferAdmin(m.uid)} title="Transfer admin"
                                                className="p-1 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-amber-600">
                                                <Shield className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={() => onRemoveMember(m.uid)} title="Remove member"
                                                className="p-1 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-red-500">
                                                <UserMinus className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="border-t border-border pt-4">
                        {!confirmDelete ? (
                            <button onClick={() => setConfirmDelete(true)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-body rounded-md border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors">
                                <Trash2 className="w-4 h-4" /> Delete Group
                            </button>
                        ) : (
                            <div className="space-y-2">
                                <p className="text-xs font-body text-red-600 dark:text-red-400">Are you sure? This cannot be undone.</p>
                                <div className="flex gap-2">
                                    <button onClick={() => setConfirmDelete(false)}
                                        className="flex-1 px-3 py-2 text-sm font-body rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
                                        Cancel
                                    </button>
                                    <button onClick={onDeleteGroup}
                                        className="flex-1 px-3 py-2 text-sm font-body rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors">
                                        Yes, Delete
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
