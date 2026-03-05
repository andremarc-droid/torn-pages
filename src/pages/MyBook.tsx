import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { createGroupNote, createNote, deleteNote, getUserGroups, getUserNotes, touchGroupActivity, updateNote, type GroupData, type NoteData } from "@/integrations/firebase";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { BookOpen, FileText, Loader2, MapPin, Plus, Scissors, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

interface Note extends NoteData {
  id: string;
}

export default function MyBook() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<"pages" | "torn" | "pinned" | "group-pinned">("pages");
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newPageOpen, setNewPageOpen] = useState(false);
  const [newPageContent, setNewPageContent] = useState("");
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const newPageRef = useRef<HTMLDivElement>(null);
  const activeEditorRef = useRef<HTMLDivElement>(null);
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [userGroups, setUserGroups] = useState<(GroupData & { id: string })[]>([]);
  const [pinningToGroup, setPinningToGroup] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (newPageOpen && newPageRef.current && !newPageRef.current.contains(event.target as Node)) {
        // Prevent closing if the user is interacting with an element inside the ref
        // or if they are just dragging something.
        setNewPageOpen(false);
        setNewPageContent("");
      }
    }

    if (newPageOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [newPageOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        activePageId &&
        activeEditorRef.current &&
        !activeEditorRef.current.contains(event.target as Node)
      ) {
        const target = event.target as HTMLElement;
        // Do not close if clicking on another page card or the group picker
        if (!target.closest?.('[data-page-card]') && !target.closest?.('[data-group-picker]')) {
          setActivePageId(null);
        }
      }
    }

    if (activePageId) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activePageId]);

  useEffect(() => {
    async function fetchNotes() {
      if (!user) {
        setNotes([]);
        setLoading(false);
        return;
      }
      try {
        const data = await getUserNotes(user.uid);
        setNotes(data as Note[]);
      } catch (err) {
        console.error("Failed to load notes:", err);
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading) {
      fetchNotes();
    }
  }, [user, authLoading]);

  // Fetch user groups for "Pin to Group"
  useEffect(() => {
    if (!user) return;
    getUserGroups(user.uid).then(setUserGroups).catch(console.error);
  }, [user]);

  const pages = notes.filter((n) => !n.isTorn);
  const tornNotes = notes.filter((n) => n.isTorn && !n.onWall && !n.pinnedToGroup);
  const pinnedNotes = notes.filter((n) => n.isTorn && n.onWall);
  const groupPinnedNotes = notes.filter((n) => n.isTorn && !!n.pinnedToGroup);
  const activeNote = activePageId ? notes.find((n) => n.id === activePageId) ?? null : null;
  const activeIsTorn = !!activeNote?.isTorn;
  const activeOnWall = !!activeNote?.onWall;

  // Keep editor content in sync when switching pages or when notes refresh.
  useEffect(() => {
    if (!activePageId) return;
    const current = notes.find((n) => n.id === activePageId);
    if (current) {
      setEditorContent(current.content);
    }
  }, [activePageId, notes]);

  // Autosave draft content shortly after the user types.
  useEffect(() => {
    if (!activePageId || !user) return;
    const content = editorContent.trim();

    // Don't fire autosave for an empty untouched editor.
    if (!content) return;

    setSaving(true);
    const timeout = window.setTimeout(async () => {
      try {
        await updateNote(activePageId, { content });
        setNotes((prev) =>
          prev.map((note) => (note.id === activePageId ? { ...note, content } : note)),
        );
        setLastSavedAt(new Date());
      } catch (err) {
        console.error("Failed to autosave page:", err);
      } finally {
        setSaving(false);
      }
    }, 800);

    return () => window.clearTimeout(timeout);
  }, [activePageId, editorContent, user, setNotes]);

  async function handlePinPage(pageId: string, putOnWall: boolean) {
    try {
      const update: Partial<NoteData> = { isTorn: true };
      if (putOnWall) {
        update.onWall = true;
      }
      await updateNote(pageId, update);
      setNotes((prev) =>
        prev.map((note) =>
          note.id === pageId
            ? { ...note, isTorn: true, onWall: putOnWall ? true : note.onWall }
            : note,
        ),
      );
      setTab("torn");
      setActivePageId(pageId);
      if (putOnWall) {
        navigate("/wall");
      }
    } catch (err) {
      console.error("Failed to pin page:", err);
    }
  }

  async function handleDeletePage(pageId: string) {
    try {
      await deleteNote(pageId);
      setNotes((prev) => prev.filter((note) => note.id !== pageId));
      if (activePageId === pageId) {
        setActivePageId(null);
        setEditorContent("");
      }
    } catch (err) {
      console.error("Failed to delete page:", err);
    }
  }

  async function handleCreatePage() {
    if (!user || creating) return;

    const content = newPageContent.trim();
    if (!content) return;

    setCreating(true);
    try {
      const authorName = user.displayName || user.email || "Anonymous";

      const docRef = await createNote({
        content,
        authorId: user.uid,
        authorName,
        tags: [],
        reactions: { heart: 0, thought: 0, fire: 0, sad: 0 },
      });

      const newPage: Note = {
        id: docRef.id,
        content,
        authorId: user.uid,
        authorName,
        tags: [],
        reactions: { heart: 0, thought: 0, fire: 0, sad: 0 },
        isTorn: false,
        onWall: false,
        createdAt: new Date(),
      };

      setNotes((prev) => [newPage, ...prev]);
      setNewPageContent("");
      setNewPageOpen(false);
      setActivePageId(docRef.id);
      setEditorContent(content);
    } catch (err) {
      console.error("Failed to create page:", err);
    } finally {
      setCreating(false);
    }
  }

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
          <button
            onClick={() => setTab("pinned")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md font-body text-sm transition-colors",
              tab === "pinned" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            <MapPin className="w-4 h-4" />
            Torn & Pinned
          </button>
          <button
            onClick={() => setTab("group-pinned")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md font-body text-sm transition-colors",
              tab === "group-pinned" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            <Users className="w-4 h-4" />
            Pinned to Group
          </button>
        </div>

        {!user && !authLoading ? (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="font-handwritten text-2xl text-ink mb-2">Your book awaits</p>
            <p className="font-body text-sm text-muted-foreground mb-4">
              Sign in to start writing your pages.
            </p>
            <a
              href="/auth"
              className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-md font-body text-sm hover:bg-primary/90 transition-colors shadow-md"
            >
              Sign in
            </a>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mb-3" />
            <p className="font-body text-sm">Loading your book...</p>
          </div>
        ) : tab === "pages" ? (
          <div className="space-y-3">
            {/* New page CTA */}
            {!newPageOpen ? (
              <button
                type="button"
                onClick={() => setNewPageOpen(true)}
                className="w-full p-4 border-2 border-dashed border-border rounded-md flex items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors font-body text-sm"
              >
                <Plus className="w-4 h-4" />
                New Page
              </button>
            ) : (
              <div ref={newPageRef} className="bg-paper p-5 rounded-md shadow-sm border border-border space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-handwritten text-xl text-ink">New Page</p>
                  <span className="text-xs font-body text-muted-foreground">
                    This will stay private until you tear a note out.
                  </span>
                </div>
                <Textarea
                  autoFocus
                  rows={6}
                  value={newPageContent}
                  onChange={(e) => setNewPageContent(e.target.value)}
                  placeholder="Start writing your page here..."
                  className="bg-paper-light resize-vertical"
                />
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={creating}
                    onClick={() => {
                      setNewPageOpen(false);
                      setNewPageContent("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    disabled={creating || !newPageContent.trim()}
                    onClick={handleCreatePage}
                  >
                    {creating ? "Saving..." : "Save Page"}
                  </Button>
                </div>
              </div>
            )}

            {pages.length === 0 ? (
              <p className="text-center text-muted-foreground font-body text-sm py-12">
                No pages yet. Tap "New Page" to start writing!
              </p>
            ) : (
              pages.map((page, i) => (
                <motion.div
                  key={page.id}
                  data-page-card="true"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    "bg-paper p-5 rounded-md shadow-sm hover:shadow-md transition-shadow cursor-pointer paper-texture",
                    activePageId === page.id && "ring-2 ring-primary",
                  )}
                  onClick={() => setActivePageId(page.id)}
                >
                  <h3 className="font-handwritten text-xl text-ink mb-1">
                    {page.content.slice(0, 40) || "Untitled Page"}
                  </h3>
                  <p className="font-body text-sm text-ink-light line-clamp-2 mb-2">{page.content}</p>
                </motion.div>
              ))
            )}

          </div>
        ) : tab === "torn" ? (
          <div className="space-y-4">
            {tornNotes.length === 0 ? (
              <p className="text-center text-muted-foreground font-body text-sm py-12">
                No torn notes kept here yet. Open a page and tear one out without pinning it!
              </p>
            ) : (
              tornNotes.map((note, i) => (
                <motion.div
                  key={note.id}
                  data-page-card="true"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    "bg-paper p-5 shadow-md torn-edge-bottom cursor-pointer",
                    activePageId === note.id && "ring-2 ring-primary",
                  )}
                  style={{ transform: `rotate(${(i % 3 - 1) * 0.8}deg)` }}
                  onClick={() => setActivePageId(note.id)}
                >
                  <p className="font-handwritten text-xl text-ink mb-3">{note.content}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-body px-2 py-1 rounded-full bg-primary/10 text-primary">
                      ✂️ Torn & kept
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        ) : tab === "pinned" ? (
          <div className="space-y-4">
            {pinnedNotes.length === 0 ? (
              <p className="text-center text-muted-foreground font-body text-sm py-12">
                No pinned notes yet. Tear out a page and stick it on the wall!
              </p>
            ) : (
              pinnedNotes.map((note, i) => (
                <motion.div
                  key={note.id}
                  data-page-card="true"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    "bg-paper p-5 shadow-md torn-edge-bottom cursor-pointer",
                    activePageId === note.id && "ring-2 ring-primary",
                  )}
                  style={{ transform: `rotate(${(i % 3 - 1) * 0.8}deg)` }}
                  onClick={() => navigate(`/wall?noteId=${note.id}`)}
                >
                  <p className="font-handwritten text-xl text-ink mb-3">{note.content}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-body px-2 py-1 rounded-full bg-primary/10 text-primary">
                      📌 On the wall
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {groupPinnedNotes.length === 0 ? (
              <p className="text-center text-muted-foreground font-body text-sm py-12">
                No notes pinned to groups yet. Open a page and pin it to one of your groups!
              </p>
            ) : (
              groupPinnedNotes.map((note, i) => (
                <motion.div
                  key={note.id}
                  data-page-card="true"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    "bg-paper p-5 shadow-md torn-edge-bottom cursor-pointer",
                    activePageId === note.id && "ring-2 ring-primary",
                  )}
                  style={{ transform: `rotate(${(i % 3 - 1) * 0.8}deg)` }}
                  onClick={() => {
                    const group = userGroups.find(g => g.id === note.pinnedToGroup);
                    if (group) {
                      navigate(`/groups`);
                    } else {
                      setActivePageId(note.id);
                    }
                  }}
                >
                  <p className="font-handwritten text-xl text-ink mb-3">{note.content}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-body px-2 py-1 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {note.pinnedToGroupName || "Group"}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {activePageId && activeNote && (
          <div ref={activeEditorRef} className="mt-6 bg-paper p-5 rounded-md shadow-md space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-handwritten text-2xl text-ink mb-1">
                  {activeIsTorn ? "Torn Page" : "Page"}
                </p>
                <p className="font-body text-xs text-muted-foreground">
                  Your writing saves automatically as a draft.
                </p>
              </div>
              {lastSavedAt && (
                <p className="font-body text-xs text-muted-foreground">
                  {saving ? "Saving..." : `Saved just now`}
                </p>
              )}
            </div>
            <Textarea
              rows={10}
              value={editorContent}
              onChange={(e) => setEditorContent(e.target.value)}
              placeholder="Continue your page here..."
              className="bg-paper-light resize-vertical"
            />
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <p className="font-body text-xs text-muted-foreground">
                Choose what to do with this page.
              </p>
              <div className="flex items-center gap-2">
                {!activeIsTorn && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handlePinPage(activePageId, false)}
                  >
                    Tear &amp; Keep
                  </Button>
                )}
                <Button
                  type="button"
                  variant="default"
                  disabled={activeOnWall}
                  onClick={() => handlePinPage(activePageId, true)}
                >
                  {activeOnWall ? "Already on Wall" : "Put on Wall"}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => handleDeletePage(activePageId)}
                >
                  Delete
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowGroupPicker(true)}
                >
                  <Users className="w-4 h-4 mr-1" />
                  Pin to Group
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Group Picker Modal */}
      {showGroupPicker && activePageId && activeNote && (
        <div data-group-picker="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowGroupPicker(false)}>
          <div className="bg-paper rounded-xl shadow-2xl border border-border/50 w-full max-w-sm mx-4 p-5 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-handwritten text-2xl text-ink mb-1">Pin to Group</h3>
            <p className="font-body text-xs text-muted-foreground mb-4">Choose a group to pin this note to its wall.</p>
            {userGroups.length === 0 ? (
              <p className="font-body text-sm text-muted-foreground text-center py-6">You haven't joined any groups yet.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {userGroups.map((g) => (
                  <button key={g.id} disabled={pinningToGroup}
                    onClick={async () => {
                      if (!user || pinningToGroup) return;
                      setPinningToGroup(true);
                      try {
                        const authorName = user.displayName || user.email || "Anonymous";
                        await createGroupNote(g.id, {
                          content: activeNote.content,
                          authorId: user.uid,
                          authorName,
                          tags: activeNote.tags || [],
                          reactions: { heart: 0, thought: 0, fire: 0, sad: 0 },
                        });
                        const noteUpdate: Partial<NoteData> = { isTorn: true, pinnedToGroup: g.id, pinnedToGroupName: g.name };
                        await updateNote(activePageId, noteUpdate);
                        setNotes((prev) => prev.map((n) => n.id === activePageId ? { ...n, ...noteUpdate } : n));
                        await touchGroupActivity(g.id);
                        setShowGroupPicker(false);
                        setTab("group-pinned");
                        const { toast } = await import("sonner");
                        toast.success(`Pinned to "${g.name}"!`);
                      } catch (err) {
                        console.error("Failed to pin to group:", err);
                        const { toast } = await import("sonner");
                        toast.error("Failed to pin to group.");
                      } finally {
                        setPinningToGroup(false);
                      }
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-paper-dark/60 transition-colors text-left disabled:opacity-50"
                  >
                    <div className="w-8 h-8 rounded-md overflow-hidden flex-shrink-0"
                      style={{ background: g.coverImageUrl ? `url(${g.coverImageUrl}) center/cover` : `linear-gradient(135deg, hsl(200 45% 55%), hsl(240 50% 45%))` }} />
                    <div className="min-w-0">
                      <p className="font-handwritten text-lg text-ink truncate">{g.name}</p>
                      <p className="text-[10px] font-body text-muted-foreground">{g.memberCount || 0} members</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <div className="flex justify-end mt-4">
              <Button type="button" variant="ghost" onClick={() => setShowGroupPicker(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
