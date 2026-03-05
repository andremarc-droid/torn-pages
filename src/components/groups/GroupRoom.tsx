import { useAuth } from "@/contexts/AuthContext";
import {
    createNotification,
    deleteGroup,
    getUserProfile,
    leaveGroup, removeMember, updateGroup,
    type GroupData
} from "@/integrations/firebase";
import { motion } from "framer-motion";
import {
    ArrowLeft, ChevronDown, ChevronUp, LogOut, Settings, Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AdminPanel from "./AdminPanel";
import GroupWall from "./GroupWall";

interface GroupRoomProps {
    group: GroupData & { id: string };
    onBack: () => void;
    onGroupDeleted: () => void;
}

export default function GroupRoom({ group: initialGroup, onBack, onGroupDeleted }: GroupRoomProps) {
    const { user } = useAuth();
    const [group, setGroup] = useState(initialGroup);
    const [showMembers, setShowMembers] = useState(false);
    const [showAdmin, setShowAdmin] = useState(false);
    const [memberProfiles, setMemberProfiles] = useState<{ uid: string; name: string }[]>([]);
    const [adminUpdating, setAdminUpdating] = useState(false);

    const isAdmin = user?.uid === group.adminId;
    const isMember = group.members?.includes(user?.uid || "");

    // Fetch member profiles
    useEffect(() => {
        async function loadProfiles() {
            const profiles = await Promise.all(
                (group.members || []).map(async (uid) => {
                    try {
                        const p = await getUserProfile(uid);
                        return { uid, name: p?.username || uid.slice(0, 8) };
                    } catch { return { uid, name: uid.slice(0, 8) }; }
                })
            );
            setMemberProfiles(profiles);
        }
        loadProfiles();
    }, [group.members]);

    // Leave group
    const handleLeave = async () => {
        if (!user) return;
        if (isAdmin) {
            const others = group.members.filter((m) => m !== user.uid);
            if (others.length > 0) {
                toast.error("Transfer admin to another member before leaving.");
                setShowAdmin(true);
                return;
            }
        }
        try {
            await leaveGroup(group.id, user.uid);
            toast.success("You left the group.");
            onBack();
        } catch (err) {
            console.error("Failed to leave:", err);
        }
    };

    // Admin actions
    const handleAdminUpdate = async (data: Partial<GroupData>) => {
        setAdminUpdating(true);
        try {
            await updateGroup(group.id, data);
            setGroup((prev) => ({ ...prev, ...data }));
            toast.success("Group updated!");
            setShowAdmin(false);
        } catch (err) {
            console.error("Failed to update group:", err);
            toast.error("Failed to update group.");
        } finally {
            setAdminUpdating(false);
        }
    };

    const handleRemoveMember = async (uid: string) => {
        try {
            await removeMember(group.id, uid);
            setGroup((prev) => ({
                ...prev,
                members: prev.members.filter((m) => m !== uid),
                memberCount: (prev.memberCount || 1) - 1,
            }));
            await createNotification({
                userId: uid, actorId: user!.uid,
                actorName: user!.displayName || user!.email || "Anonymous",
                type: "group_remove", groupId: group.id, groupName: group.name,
            });
            toast.success("Member removed.");
        } catch (err) {
            console.error("Failed to remove member:", err);
        }
    };

    const handleTransferAdmin = async (uid: string) => {
        try {
            await updateGroup(group.id, { adminId: uid });
            setGroup((prev) => ({ ...prev, adminId: uid }));
            await createNotification({
                userId: uid, actorId: user!.uid,
                actorName: user!.displayName || user!.email || "Anonymous",
                type: "admin_transfer", groupId: group.id, groupName: group.name,
            });
            toast.success("Admin transferred!");
            setShowAdmin(false);
        } catch (err) {
            console.error("Failed to transfer admin:", err);
        }
    };

    const handleDeleteGroup = async () => {
        try {
            await deleteGroup(group.id);
            toast.success("Group deleted.");
            onGroupDeleted();
        } catch (err) {
            console.error("Failed to delete group:", err);
            toast.error("Failed to delete group.");
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-3.5rem)]">
            {/* Group Header — compact */}
            <div
                className="relative shrink-0 overflow-hidden"
                style={{
                    height: showMembers ? "auto" : "4.5rem",
                    minHeight: "4.5rem",
                    background: group.coverImageUrl
                        ? `url(${group.coverImageUrl}) center/cover`
                        : `linear-gradient(135deg, hsl(200 45% 55%), hsl(240 50% 45%))`,
                }}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30" />
                <div className="relative z-10 flex items-center justify-between px-4 h-[4.5rem]">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white/10 text-white text-sm font-body backdrop-blur-sm hover:bg-white/20 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div>
                            <h1 className="font-handwritten text-2xl text-white drop-shadow-lg leading-tight">{group.name}</h1>
                            <p className="font-body text-[11px] text-white/70 truncate max-w-[240px]">{group.description}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Members toggle */}
                        <button onClick={() => setShowMembers(!showMembers)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white/10 text-white text-xs font-body backdrop-blur-sm hover:bg-white/20 transition-colors">
                            <Users className="w-3.5 h-3.5" />
                            {group.memberCount || 0}
                            {showMembers ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                        {isAdmin && (
                            <button onClick={() => setShowAdmin(true)} className="p-2 rounded-md bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 transition-colors" title="Manage Group">
                                <Settings className="w-4 h-4" />
                            </button>
                        )}
                        {isMember && !isAdmin && (
                            <button onClick={handleLeave} className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white/10 text-white text-xs font-body backdrop-blur-sm hover:bg-red-600/80 transition-colors">
                                <LogOut className="w-3.5 h-3.5" /> Leave
                            </button>
                        )}
                    </div>
                </div>

                {/* Members panel */}
                {showMembers && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 px-4 pb-3">
                        <div className="flex flex-wrap gap-1.5">
                            {memberProfiles.map((m) => (
                                <span key={m.uid} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 text-[11px] font-body text-white backdrop-blur-sm">
                                    <span className="w-4 h-4 rounded-full bg-white/25 flex items-center justify-center text-[8px] font-bold">
                                        {m.name.charAt(0).toUpperCase()}
                                    </span>
                                    {m.name}
                                    {m.uid === group.adminId && <span className="text-[8px]">👑</span>}
                                </span>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Corkboard Wall — fills remaining space */}
            <div className="flex-1 min-h-0">
                <GroupWall group={group} isAdmin={isAdmin || false} />
            </div>

            {/* Admin Panel */}
            {showAdmin && (
                <AdminPanel
                    group={group}
                    memberProfiles={memberProfiles}
                    onUpdate={handleAdminUpdate}
                    onRemoveMember={handleRemoveMember}
                    onTransferAdmin={handleTransferAdmin}
                    onDeleteGroup={handleDeleteGroup}
                    onClose={() => setShowAdmin(false)}
                    updating={adminUpdating}
                />
            )}
        </div>
    );
}
