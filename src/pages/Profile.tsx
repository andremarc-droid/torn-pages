import { useAuth } from "@/contexts/AuthContext";
import {
  deleteCurrentUser,
  getUserGroups,
  getUserNotes,
  getUserProfile,
  logOut,
  setUserProfile,
  updateAuthDisplayName,
  type NoteData,
  type UserProfile,
} from "@/integrations/firebase";
import { Loader2, LogOut, Pin, Settings, Trash2, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Profile() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<(UserProfile & { id: string }) | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [pinnedCount, setPinnedCount] = useState(0);
  const [reactionCount, setReactionCount] = useState(0);
  const [groupCount, setGroupCount] = useState(0);
  const [nameInput, setNameInput] = useState("");
  const [updatingName, setUpdatingName] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      if (!user) {
        setProfile(null);
        setPinnedCount(0);
        setReactionCount(0);
        setGroupCount(0);
        setLoadingProfile(false);
        return;
      }
      try {
        const [profileData, notes, groups] = await Promise.all([
          getUserProfile(user.uid),
          getUserNotes(user.uid),
          getUserGroups(user.uid),
        ]);
        setProfile(profileData);

        // Pinned = notes currently on the wall
        const pinned = notes.filter((n: NoteData & { id: string }) => n.onWall).length;
        setPinnedCount(pinned);

        // Reactions = sum of all reaction values across user's notes
        const totalReactions = notes.reduce((sum: number, n: NoteData & { id: string }) => {
          const r = n.reactions || { heart: 0, thought: 0, fire: 0, sad: 0 };
          return sum + r.heart + r.thought + r.fire + r.sad;
        }, 0);
        setReactionCount(totalReactions);

        // Groups = number of groups the user belongs to
        setGroupCount(groups.length);
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoadingProfile(false);
      }
    }
    if (!authLoading) {
      fetchProfile();
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!user && !profile) return;
    const baseName =
      profile?.username ||
      user?.displayName ||
      user?.email?.split("@")[0] ||
      "anonymous_user";
    setNameInput(baseName);
  }, [user, profile]);

  const handleSignOut = async () => {
    try {
      await logOut();
      navigate("/auth");
    } catch (err) {
      console.error("Failed to sign out:", err);
    }
  };

  // Derive display values from Firebase auth user and/or Firestore profile
  const displayName = profile?.username || user?.displayName || user?.email?.split("@")[0] || "anonymous_user";
  const initials = displayName.charAt(0).toUpperCase();

  // Enforce a once-per-day limit on name changes
  const oneDayMs = 24 * 60 * 60 * 1000;
  let canChangeName = true;
  let nextNameChangeDate: Date | null = null;

  const rawLastChange: any = (profile as any)?.lastNameChangeAt;
  if (rawLastChange) {
    const lastChangeMs =
      typeof rawLastChange.toMillis === "function"
        ? rawLastChange.toMillis()
        : rawLastChange instanceof Date
        ? rawLastChange.getTime()
        : undefined;

    if (lastChangeMs) {
      const elapsed = Date.now() - lastChangeMs;
      if (elapsed < oneDayMs) {
        canChangeName = false;
        nextNameChangeDate = new Date(lastChangeMs + oneDayMs);
      }
    }
  }

  const handleUpdateName = async () => {
    if (!user) return;
    const trimmed = nameInput.trim();
    if (!trimmed) {
      toast.error("Name cannot be empty.");
      return;
    }
    if (!canChangeName) {
      toast.error("You can only change your name once per day.");
      return;
    }

    setUpdatingName(true);
    try {
      await updateAuthDisplayName(trimmed);
      await setUserProfile(user.uid, { username: trimmed });

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              username: trimmed,
              lastNameChangeAt: new Date(),
            }
          : prev
      );

      toast.success("Name updated.");
    } catch (err) {
      console.error("Failed to update name:", err);
      toast.error("Failed to update name. Please try again.");
    } finally {
      setUpdatingName(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete your account? This cannot be undone."
    );
    if (!confirmed) return;

    setDeletingAccount(true);
    try {
      // Best-effort cleanup of profile document
      await setUserProfile(user.uid, {
        username: "",
        bio: "",
        pinnedCount: 0,
        reactionCount: 0,
        groupCount: 0,
      });
      // Then delete the auth user
      await deleteCurrentUser();
      toast.success("Your account has been deleted.");
      navigate("/auth", { replace: true });
    } catch (err: any) {
      console.error("Failed to delete account:", err);
      const code = err?.code || "";
      if (code === "auth/requires-recent-login") {
        toast.error("Please sign in again and then delete your account.");
      } else {
        toast.error("Failed to delete account. Please try again.");
      }
      setDeletingAccount(false);
    }
  };

  if (authLoading || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p className="font-body text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Not signed in
  if (!user) {
    return (
      <div className="min-h-screen py-8 pb-24 md:pb-8">
        <div className="container px-4 max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-6 h-6 text-primary" />
            <h1 className="font-handwritten text-4xl text-foreground">Profile</h1>
          </div>

          {/* Profile card */}
          <div className="bg-paper rounded-md p-6 shadow-sm mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
                <span className="font-handwritten text-2xl text-secondary-foreground">?</span>
              </div>
              <div>
                <p className="font-handwritten text-2xl text-ink">anonymous_user</p>
                <p className="font-body text-sm text-muted-foreground">Sign in to claim your identity</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: "Pinned", value: "0", icon: Pin },
              { label: "Reactions", value: "0", icon: () => <span>🔥</span> },
              { label: "Groups", value: "0", icon: Settings },
            ].map((stat) => (
              <div key={stat.label} className="bg-paper rounded-md p-4 text-center shadow-sm">
                <p className="font-handwritten text-3xl text-ink">{stat.value}</p>
                <p className="font-body text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          <a
            href="/auth"
            className="block text-center py-3 bg-primary text-primary-foreground rounded-md font-body text-sm hover:bg-primary/90 transition-colors shadow-md"
          >
            Sign in to get started
          </a>
        </div>
      </div>
    );
  }

  // Signed in
  return (
    <div className="min-h-screen py-8 pb-24 md:pb-8">
      <div className="container px-4 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <User className="w-6 h-6 text-primary" />
          <h1 className="font-handwritten text-4xl text-foreground">Profile</h1>
        </div>

        {/* Profile card */}
        <div className="bg-paper rounded-md p-6 shadow-sm mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center">
              <span className="font-handwritten text-2xl text-primary">{initials}</span>
            </div>
            <div>
              <p className="font-handwritten text-2xl text-ink">{displayName}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Pinned", value: String(pinnedCount), icon: Pin },
            { label: "Reactions", value: String(reactionCount), icon: () => <span>🔥</span> },
            { label: "Groups", value: String(groupCount), icon: Settings },
          ].map((stat) => (
            <div key={stat.label} className="bg-paper rounded-md p-4 text-center shadow-sm">
              <p className="font-handwritten text-3xl text-ink">{stat.value}</p>
              <p className="font-body text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Name editor */}
        <div className="bg-paper rounded-md p-6 shadow-sm mb-6 space-y-3">
          <h2 className="font-handwritten text-2xl text-ink">Display name</h2>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            className="w-full mt-1 px-3 py-2 bg-paper-dark border border-border rounded-md font-body text-sm text-ink placeholder:text-ink-light/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handleUpdateName}
              disabled={updatingName || !canChangeName || nameInput.trim().length === 0}
              className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-primary text-primary-foreground font-body text-sm hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {updatingName ? "Saving..." : "Save name"}
            </button>
            <p className="font-body text-xs text-muted-foreground text-right">
              {canChangeName
                ? "You can change your name once per day."
                : nextNameChangeDate
                ? `You can change your name again ${nextNameChangeDate.toLocaleString()}.`
                : "You can change your name once per day."}
            </p>
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-paper rounded-md p-6 shadow-sm mb-6 border border-destructive/20">
          <h2 className="font-handwritten text-2xl text-destructive mb-2">Danger zone</h2>
          <p className="font-body text-xs text-muted-foreground mb-4">
            Deleting your account will remove your profile and authentication. This action cannot be undone.
          </p>
          <button
            onClick={handleDeleteAccount}
            disabled={deletingAccount}
            className="w-full flex items-center justify-center gap-2 py-3 bg-destructive text-destructive-foreground rounded-md font-body text-sm hover:bg-destructive/90 transition-colors disabled:opacity-60"
          >
            <Trash2 className="w-4 h-4" />
            {deletingAccount ? "Deleting..." : "Delete account"}
          </button>
        </div>

        {/* Sign out button */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-3 bg-secondary text-secondary-foreground rounded-md font-body text-sm hover:bg-secondary/80 transition-colors shadow-sm"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}
