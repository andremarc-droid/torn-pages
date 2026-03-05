import CreateGroupDialog from "@/components/groups/CreateGroupDialog";
import GroupCard from "@/components/groups/GroupCard";
import GroupPreview from "@/components/groups/GroupPreview";
import GroupRoom from "@/components/groups/GroupRoom";
import { useAuth } from "@/contexts/AuthContext";
import {
  createGroup, getGroup, getGroupByInviteCode, getPublicGroups, getUserGroups,
  joinGroup, type GroupData,
} from "@/integrations/firebase";
import { motion } from "framer-motion";
import { Compass, KeyRound, Loader2, Plus, Search, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type Tab = "my" | "explore";
type View = "landing" | "preview" | "room";

interface Group extends GroupData { id: string; }

export default function Groups() {
  const { user } = useAuth();

  // View state
  const [view, setView] = useState<View>("landing");
  const [tab, setTab] = useState<Tab>("my");
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  // Data
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [publicGroups, setPublicGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "active" | "members">("active");

  // Dialogs
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [inviteCode, setInviteCode] = useState("");

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [mine, pub] = await Promise.all([getUserGroups(user.uid), getPublicGroups()]);
      setMyGroups(mine as Group[]);
      setPublicGroups(pub as Group[]);
    } catch (err) {
      console.error("Failed to load groups:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Create group
  const handleCreate = async (data: { name: string; description: string; isPublic: boolean; coverImageUrl: string }) => {
    if (!user) return;
    setCreating(true);
    try {
      const docRef = await createGroup({
        name: data.name, description: data.description,
        coverImageUrl: data.coverImageUrl || undefined,
        isPublic: data.isPublic, createdBy: user.uid,
      });
      const newGroup = await getGroup(docRef.id);
      if (newGroup) {
        setShowCreate(false);
        setSelectedGroup(newGroup);
        setView("room");
        await fetchData();
        toast.success("Group created!");
      }
    } catch (err) {
      console.error("Failed to create group:", err);
      toast.error("Failed to create group.");
    } finally {
      setCreating(false);
    }
  };

  // Join group
  const handleJoin = async (groupId: string) => {
    if (!user) return;
    setJoining(true);
    try {
      await joinGroup(groupId, user.uid);
      const updated = await getGroup(groupId);
      if (updated) {
        setSelectedGroup(updated);
        setView("room");
        await fetchData();
        toast.success("You joined the group!");
      }
    } catch (err) {
      console.error("Failed to join:", err);
      toast.error("Failed to join group.");
    } finally {
      setJoining(false);
    }
  };

  // Join by invite code
  const handleInviteCodeJoin = async () => {
    if (!user || !inviteCode.trim()) return;
    setJoining(true);
    try {
      const found = await getGroupByInviteCode(inviteCode.trim());
      if (!found) { toast.error("Invalid invite code."); return; }
      await joinGroup(found.id, user.uid);
      const updated = await getGroup(found.id);
      if (updated) {
        setSelectedGroup(updated);
        setView("room");
        setShowInviteCode(false);
        setInviteCode("");
        await fetchData();
        toast.success("You joined the group!");
      }
    } catch (err) {
      console.error("Failed to join with code:", err);
      toast.error("Failed to join.");
    } finally {
      setJoining(false);
    }
  };

  // Open group
  const openGroup = async (group: Group) => {
    const isMember = group.members?.includes(user?.uid || "");
    if (isMember) {
      setSelectedGroup(group);
      setView("room");
    } else {
      setSelectedGroup(group);
      setView("preview");
    }
  };

  // Sort & filter explore groups
  const filteredExplore = publicGroups
    .filter((g) => g.name.toLowerCase().includes(search.toLowerCase()) || g.description?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "members") return (b.memberCount || 0) - (a.memberCount || 0);
      if (sortBy === "newest") {
        const at = a.createdAt?.toMillis?.() ?? a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0;
        const bt = b.createdAt?.toMillis?.() ?? b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0;
        return bt - at;
      }
      // active
      const at = a.lastActivity?.toMillis?.() ?? a.lastActivity?.seconds ? a.lastActivity.seconds * 1000 : 0;
      const bt = b.lastActivity?.toMillis?.() ?? b.lastActivity?.seconds ? b.lastActivity.seconds * 1000 : 0;
      return bt - at;
    });

  const filteredMy = myGroups.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()));

  // ── ROOM VIEW ──
  if (view === "room" && selectedGroup) {
    return (
      <GroupRoom
        group={selectedGroup}
        onBack={() => { setView("landing"); setSelectedGroup(null); fetchData(); }}
        onGroupDeleted={() => { setView("landing"); setSelectedGroup(null); fetchData(); }}
      />
    );
  }

  // ── PREVIEW VIEW ──
  if (view === "preview" && selectedGroup) {
    return (
      <div className="min-h-screen py-8 pb-24 md:pb-8">
        <div className="container px-4 max-w-3xl">
          <GroupPreview
            group={selectedGroup}
            onJoin={() => handleJoin(selectedGroup.id)}
            onRequestJoin={() => toast.info("Request sent!")}
            onEnterCode={() => setShowInviteCode(true)}
            onBack={() => { setView("landing"); setSelectedGroup(null); }}
            joining={joining}
            isMember={selectedGroup.members?.includes(user?.uid || "") || false}
          />
        </div>
        {/* Invite code modal */}
        {showInviteCode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowInviteCode(false)}>
            <div className="bg-paper rounded-xl shadow-2xl border border-border/50 w-full max-w-sm mx-4 p-5 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-handwritten text-2xl text-ink mb-3">Enter Invite Code</h3>
              <input type="text" value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="e.g. A3B8K2X1" maxLength={10}
                className="w-full px-3 py-2.5 bg-paper-dark border border-border rounded-md font-mono text-lg text-ink text-center tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-primary/40 mb-3" autoFocus />
              <div className="flex gap-2">
                <button onClick={() => setShowInviteCode(false)} className="flex-1 px-3 py-2 text-sm font-body rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">Cancel</button>
                <button onClick={handleInviteCodeJoin} disabled={joining || !inviteCode.trim()} className="flex-1 px-3 py-2 text-sm font-body rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {joining ? "Joining…" : "Join"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── LANDING VIEW ──
  return (
    <div className="min-h-screen py-8 pb-24 md:pb-8">
      <div className="container px-4 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-primary" />
            <h1 className="font-handwritten text-4xl text-foreground">Groups</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-paper-dark rounded-lg p-1">
          <button onClick={() => setTab("my")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-body transition-all ${tab === "my" ? "bg-paper shadow-sm text-ink font-medium" : "text-muted-foreground hover:text-ink"}`}>
            <Users className="w-4 h-4" /> My Groups
            {myGroups.length > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-semibold">{myGroups.length}</span>}
          </button>
          <button onClick={() => setTab("explore")}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-body transition-all ${tab === "explore" ? "bg-paper shadow-sm text-ink font-medium" : "text-muted-foreground hover:text-ink"}`}>
            <Compass className="w-4 h-4" /> Explore
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input placeholder={tab === "my" ? "Search your groups…" : "Search all public groups…"}
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-paper border border-border rounded-md font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>

        {/* Explore sort bar */}
        {tab === "explore" && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-body text-muted-foreground">Sort:</span>
            {(["active", "newest", "members"] as const).map((s) => (
              <button key={s} onClick={() => setSortBy(s)}
                className={`px-2.5 py-1 text-xs font-body rounded-full transition-colors ${sortBy === s ? "bg-primary text-primary-foreground" : "bg-paper-dark text-ink-light hover:bg-secondary"}`}>
                {s === "active" ? "Most Active" : s === "newest" ? "Newest" : "Most Members"}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center py-16 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mb-3" />
            <p className="font-body text-sm">Loading groups…</p>
          </div>
        ) : tab === "my" ? (
          /* My Groups */
          filteredMy.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="font-handwritten text-2xl text-ink mb-2">
                {search ? "No groups found" : "No groups yet"}
              </p>
              <p className="font-body text-sm text-muted-foreground mb-4">
                {search ? "Try a different search." : "Create your first group or explore public ones."}
              </p>
              {!search && (
                <div className="flex justify-center gap-3">
                  <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md font-body text-sm hover:bg-primary/90 transition-colors">
                    <Plus className="w-4 h-4" /> Create Group
                  </button>
                  <button onClick={() => setTab("explore")} className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md font-body text-sm hover:bg-secondary/80 transition-colors">
                    <Compass className="w-4 h-4" /> Explore
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredMy.map((group, i) => (
                <GroupCard key={group.id} group={group} index={i} onClick={() => openGroup(group)} isMember={true} />
              ))}
            </div>
          )
        ) : (
          /* Explore */
          filteredExplore.length === 0 ? (
            <div className="text-center py-16">
              <Compass className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="font-handwritten text-2xl text-ink mb-2">No public groups found</p>
              <p className="font-body text-sm text-muted-foreground">Be the first to create one!</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredExplore.map((group, i) => (
                <GroupCard key={group.id} group={group as Group} index={i} onClick={() => openGroup(group as Group)}
                  showJoinButton onJoin={() => handleJoin(group.id)}
                  isMember={(group as Group).members?.includes(user?.uid || "")} />
              ))}
            </div>
          )
        )}
      </div>

      {/* Floating actions */}
      <div className="fixed bottom-20 md:bottom-6 right-4 z-30 flex flex-col gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setShowInviteCode(true)}
          className="w-12 h-12 rounded-full bg-secondary text-secondary-foreground shadow-lg hover:shadow-xl flex items-center justify-center transition-shadow"
          title="Join with invite code"
        >
          <KeyRound className="w-5 h-5" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreate(true)}
          className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl flex items-center justify-center transition-shadow"
          title="Create new group"
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      </div>

      {/* Create Dialog */}
      <CreateGroupDialog open={showCreate} onClose={() => setShowCreate(false)} onCreate={handleCreate} creating={creating} />

      {/* Invite code modal (landing) */}
      {showInviteCode && view === "landing" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowInviteCode(false)}>
          <div className="bg-paper rounded-xl shadow-2xl border border-border/50 w-full max-w-sm mx-4 p-5 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-handwritten text-2xl text-ink mb-3">Enter Invite Code</h3>
            <input type="text" value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="e.g. A3B8K2X1" maxLength={10}
              className="w-full px-3 py-2.5 bg-paper-dark border border-border rounded-md font-mono text-lg text-ink text-center tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-primary/40 mb-3" autoFocus />
            <div className="flex gap-2">
              <button onClick={() => { setShowInviteCode(false); setInviteCode(""); }} className="flex-1 px-3 py-2 text-sm font-body rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">Cancel</button>
              <button onClick={handleInviteCodeJoin} disabled={joining || !inviteCode.trim()} className="flex-1 px-3 py-2 text-sm font-body rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {joining ? "Joining…" : "Join"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
