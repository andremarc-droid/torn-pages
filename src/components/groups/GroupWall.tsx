import TornNote from "@/components/pinning-wall/TornNote";
import { useAuth } from "@/contexts/AuthContext";
import {
    clearNoteConnection,
    createGroupNote, createNotification,
    getGroupNotes,
    touchGroupActivity, updateNote, type GroupData, type NoteData
} from "@/integrations/firebase";
import { Loader2, MapPin, Maximize2, Minus, Plus, User } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

interface Note extends NoteData { id: string; wallX?: number; wallY?: number; groupId?: string; }

const BOARD_WIDTH = 3200;
const BOARD_HEIGHT = 2400;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 1.8;
const ZOOM_STEP = 0.08;
const NOTE_MARGIN = 40;
const NOTE_SIZE = 260;

type ZoomZone = "overview" | "default" | "detail";
function getZoomZone(z: number): ZoomZone {
    if (z < 0.45) return "overview";
    if (z > 1.1) return "detail";
    return "default";
}
function totalReactions(r?: { heart: number; thought: number; fire: number; sad: number }) {
    if (!r) return 0; return r.heart + r.thought + r.fire + r.sad;
}

// ── Pin Confirmation Dialog ───────────────────────
function PinConfirmDialog({
    position,
    onConfirm,
    onCancel,
}: {
    position: { x: number; y: number };
    onConfirm: () => void;
    onCancel: () => void;
}) {
    return (
        <div className="fixed inset-0 z-50" onClick={onCancel}>
            <div
                className="absolute z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
                style={{
                    left: Math.min(position.x, window.innerWidth - 260),
                    top: Math.min(position.y - 10, window.innerHeight - 90),
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-paper rounded-lg shadow-xl border border-black/10 p-3 min-w-[210px]">
                    <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="text-sm font-body font-medium text-ink">
                            Pin note here?
                        </span>
                    </div>
                    <p className="text-xs font-body text-ink-light mb-3">
                        Once pinned, this note can&apos;t be moved. Others can connect their notes to it.
                    </p>
                    <div className="flex gap-2 justify-end">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-3 py-1 text-xs font-body rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            className="px-3 py-1 text-xs font-body rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                            Pin it 📌
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Draggable Note ────────────────────────────────
function DraggableNote({ note, index, zoom, zoomZone, isOwn, isHighlighted, onDragEnd, onRequestPin, onConnect, onReact }: {
    note: Note; index: number; zoom: number; zoomZone: ZoomZone; isOwn: boolean;
    isHighlighted?: boolean;
    onDragEnd: (id: string, x: number, y: number) => void;
    onRequestPin: (id: string, x: number, y: number, screenX: number, screenY: number) => void;
    onConnect?: () => void;
    onReact: (noteId: string, authorId: string, type: "heart" | "thought" | "fire" | "sad") => void;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const dragging = useRef(false);
    const hasMoved = useRef(false);
    const startPos = useRef({ x: 0, y: 0 });
    const startPointer = useRef({ x: 0, y: 0 });
    const fallbackX = 120 + (index % 5) * 260;
    const fallbackY = 120 + Math.floor(index / 5) * 260;
    const left = note.wallX ?? fallbackX;
    const top = note.wallY ?? fallbackY;
    const currentPos = useRef({ x: left, y: top });

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        e.stopPropagation(); e.preventDefault();
        dragging.current = true; hasMoved.current = false;
        startPos.current = { x: left, y: top };
        startPointer.current = { x: e.clientX, y: e.clientY };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }, [left, top]);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        if (!dragging.current || !ref.current) return;
        const f = zoom || 1;
        const dx = (e.clientX - startPointer.current.x) / f;
        const dy = (e.clientY - startPointer.current.y) / f;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) hasMoved.current = true;
        const newX = Math.min(BOARD_WIDTH - NOTE_SIZE, Math.max(NOTE_MARGIN, startPos.current.x + dx));
        const newY = Math.min(BOARD_HEIGHT - NOTE_SIZE, Math.max(NOTE_MARGIN, startPos.current.y + dy));
        currentPos.current = { x: newX, y: newY };
        ref.current.style.left = `${newX}px`;
        ref.current.style.top = `${newY}px`;
    }, [zoom]);

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        if (!dragging.current) return;
        dragging.current = false;
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
        if (hasMoved.current) onDragEnd(note.id, currentPos.current.x, currentPos.current.y);
    }, [onDragEnd, note.id]);

    const handleDoubleClickPin = useCallback((e: React.MouseEvent) => {
        if (note.isPinned) return;
        if (!isOwn) {
            toast.error("You can only pin your own notes.");
            return;
        }
        e.stopPropagation();
        e.preventDefault();
        onRequestPin(note.id, currentPos.current.x, currentPos.current.y, e.clientX, e.clientY);
    }, [note.id, note.isPinned, isOwn, onRequestPin]);

    const handleDoubleClickConnect = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        onConnect?.();
    }, [onConnect]);

    if (zoomZone === "overview") {
        const heat = totalReactions(note.reactions);
        const intensity = Math.min(1, heat / 20);
        const bg = isOwn
            ? `hsl(210, ${50 + intensity * 30}%, ${60 - intensity * 20}%)`
            : `hsl(${30 + intensity * 20}, ${50 + intensity * 30}%, ${80 - intensity * 35}%)`;
        return (
            <div ref={ref} data-note data-note-id={note.id}
                className={`absolute rounded-full shadow-sm transition-colors ${note.isPinned ? "" : "cursor-grab active:cursor-grabbing"}`}
                style={{
                    left, top, width: isOwn ? 22 : 18, height: isOwn ? 22 : 18, backgroundColor: bg,
                    border: isOwn ? "2px solid rgba(59,130,246,0.5)" : "2px solid rgba(0,0,0,0.12)"
                }}
                onPointerDown={note.isPinned ? undefined : handlePointerDown}
                onPointerMove={note.isPinned ? undefined : handlePointerMove}
                onPointerUp={note.isPinned ? undefined : handlePointerUp}
                title={note.content.slice(0, 60)} />
        );
    }

    return (
        <div ref={ref} data-note data-note-id={note.id}
            className={`absolute ${note.isPinned ? "cursor-default" : "cursor-grab active:cursor-grabbing"}`}
            style={{ left, top, touchAction: "none", zIndex: isOwn ? 30 : 10 }}
            title={
                isOwn
                    ? note.isPinned
                        ? onConnect ? "Double-click to connect notes" : undefined
                        : "Double-click pin to pin here"
                    : note.isPinned && onConnect
                        ? "Double-click to connect your note"
                        : undefined
            }
            onPointerDown={note.isPinned ? undefined : handlePointerDown}
            onPointerMove={note.isPinned ? undefined : handlePointerMove}
            onPointerUp={note.isPinned ? undefined : handlePointerUp}>
            {isOwn && (
                <div className="absolute -top-5 -right-1 z-20 px-1.5 py-0.5 rounded text-[9px] font-body font-semibold bg-blue-500 text-white shadow-sm whitespace-nowrap">
                    My note
                </div>
            )}
            {note.isPinned && (
                <div className="absolute -top-5 left-0 z-20 px-1.5 py-0.5 rounded text-[9px] font-body font-semibold bg-amber-500 text-white shadow-sm whitespace-nowrap">
                    Pinned
                </div>
            )}
            <TornNote content={note.content} author={note.authorName} tags={note.tags}
                reactions={note.reactions} rotation={((index % 5) - 2) * 1.5} delay={index}
                onDoubleClickPin={onConnect ? (isOwn ? handleDoubleClickPin : handleDoubleClickConnect) : handleDoubleClickPin}
                onDoubleClickPaper={onConnect ? handleDoubleClickConnect : handleDoubleClickPin}
                onReact={(e, type) => { e.stopPropagation(); onReact(note.id, note.authorId, type); }}
                isPinned={note.isPinned}
                isHighlighted={isHighlighted} />
        </div>
    );
}

// ── MiniMap ────────────────────────────────────────
function MiniMap({ notes, pan, zoom, viewportSize, currentUserId, onJump }: {
    notes: Note[]; pan: { x: number; y: number }; zoom: number;
    viewportSize: { w: number; h: number }; currentUserId?: string;
    onJump: (pan: { x: number; y: number }) => void;
}) {
    const MAP_W = 140;
    const MAP_H = (MAP_W / BOARD_WIDTH) * BOARD_HEIGHT;
    const sx = MAP_W / BOARD_WIDTH, sy = MAP_H / BOARD_HEIGHT;
    const visW = viewportSize.w / zoom, visH = viewportSize.h / zoom;
    const visX = -pan.x / zoom, visY = -pan.y / zoom;

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const clickX = (e.clientX - rect.left) / sx, clickY = (e.clientY - rect.top) / sy;
        onJump({ x: -(clickX - viewportSize.w / zoom / 2) * zoom, y: -(clickY - viewportSize.h / zoom / 2) * zoom });
    };

    return (
        <div className="absolute left-4 bottom-4 z-20 rounded-lg overflow-hidden shadow-lg border border-black/10 bg-[#c9a96e]/70 backdrop-blur-sm cursor-pointer"
            style={{ width: MAP_W, height: MAP_H }} onClick={handleClick}>
            {notes.map((n) => {
                const isOwn = currentUserId && n.authorId === currentUserId;
                return <div key={n.id} className={`absolute rounded-full ${isOwn ? "w-[5px] h-[5px] bg-blue-500" : "w-[3px] h-[3px] bg-ink/60"}`}
                    style={{ left: (n.wallX ?? 0) * sx, top: (n.wallY ?? 0) * sy }} />;
            })}
            <div className="absolute border-2 border-primary/80 rounded-sm"
                style={{ left: Math.max(0, visX * sx), top: Math.max(0, visY * sy), width: Math.min(MAP_W, visW * sx), height: Math.min(MAP_H, visH * sy) }} />
        </div>
    );
}

// ── Group Wall (main export) ──────────────────────
export default function GroupWall({ group, isAdmin, onDeleteNote }: {
    group: GroupData & { id: string }; isAdmin: boolean;
    onDeleteNote?: (noteId: string) => void;
}) {
    const { user } = useAuth();
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [zoom, setZoom] = useState(0.85);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const lastPanPoint = useRef<{ x: number; y: number } | null>(null);
    const [viewportSize, setViewportSize] = useState({ w: 1200, h: 800 });
    const viewportRef = useRef<HTMLDivElement | null>(null);
    const boardRef = useRef<HTMLDivElement | null>(null);
    const [showPinInput, setShowPinInput] = useState(false);
    const [newNoteContent, setNewNoteContent] = useState("");
    const [pinning, setPinning] = useState(false);

    // Pin confirmation state
    const [pendingPin, setPendingPin] = useState<{
        noteId: string; x: number; y: number; screenX: number; screenY: number;
    } | null>(null);

    // Connect state
    const [connectTargetId, setConnectTargetId] = useState<string | null>(null);
    const [connectMode, setConnectMode] = useState<"new" | "existing">("new");
    const [connectExistingId, setConnectExistingId] = useState("");
    const [connectContent, setConnectContent] = useState("");
    const [connecting, setConnecting] = useState(false);

    const zoomZone = getZoomZone(zoom);
    const zoomLabel = useMemo(() => {
        if (zoomZone === "overview") return "🔭 Overview";
        if (zoomZone === "detail") return "🔍 Detail";
        return "👁️ Reading";
    }, [zoomZone]);

    // Fetch notes
    useEffect(() => {
        (async () => {
            try {
                const data = await getGroupNotes(group.id);
                const withPos = (data as Note[]).map((note, i) => {
                    if (typeof note.wallX === "number" && typeof note.wallY === "number") return note;
                    const col = i % 6, row = Math.floor(i / 6);
                    const wallX = Math.min(BOARD_WIDTH - NOTE_SIZE, Math.max(NOTE_MARGIN, 160 + col * 300));
                    const wallY = Math.min(BOARD_HEIGHT - NOTE_SIZE, Math.max(NOTE_MARGIN, 160 + row * 300));
                    void updateNote(note.id, { wallX, wallY });
                    return { ...note, wallX, wallY };
                });
                setNotes(withPos);
            } catch (err) { console.error("Failed to load group notes:", err); }
            finally { setLoading(false); }
        })();
    }, [group.id]);

    // Clamp helpers
    const clampPan = useCallback((p: { x: number; y: number }) => {
        const bW = BOARD_WIDTH * zoom, bH = BOARD_HEIGHT * zoom;
        const vW = viewportSize.w, vH = viewportSize.h;
        let minX: number, maxX: number, minY: number, maxY: number;
        if (bW <= vW) { minX = maxX = (vW - bW) / 2; } else { maxX = 0; minX = vW - bW; }
        if (bH <= vH) { minY = maxY = (vH - bH) / 2; } else { maxY = 0; minY = vH - bH; }
        return { x: Math.min(maxX, Math.max(minX, p.x)), y: Math.min(maxY, Math.max(minY, p.y)) };
    }, [viewportSize, zoom]);

    function clampNotePosition(x: number, y: number) {
        return {
            x: Math.min(BOARD_WIDTH - NOTE_SIZE, Math.max(NOTE_MARGIN, x)),
            y: Math.min(BOARD_HEIGHT - NOTE_SIZE, Math.max(NOTE_MARGIN, y)),
        };
    }

    function findNonOverlappingPosition(preferredX: number, preferredY: number, excludeIds: string[]) {
        const STEP_X = NOTE_SIZE + 80;
        const STEP_Y = NOTE_SIZE + 40;
        const SAFE_GAP = 24;
        let x = preferredX, y = preferredY;
        const isOverlapping = (cx: number, cy: number) =>
            notes.some((n) => {
                if (!n.wallX || !n.wallY) return false;
                if (excludeIds.includes(n.id)) return false;
                return !(cx + NOTE_SIZE + SAFE_GAP < n.wallX || n.wallX + NOTE_SIZE + SAFE_GAP < cx ||
                    cy + NOTE_SIZE + SAFE_GAP < n.wallY || n.wallY + NOTE_SIZE + SAFE_GAP < cy);
            });
        for (let i = 0; i < 40; i++) {
            const clamped = clampNotePosition(x, y);
            if (!isOverlapping(clamped.x, clamped.y)) return clamped;
            x += STEP_X;
            if (x > BOARD_WIDTH - NOTE_SIZE - NOTE_MARGIN) { x = preferredX; y += STEP_Y; }
        }
        return clampNotePosition(preferredX, preferredY);
    }

    // Center board on mount
    useEffect(() => {
        const vp = viewportRef.current; if (!vp) return;
        const update = () => {
            const { clientWidth: w, clientHeight: h } = vp;
            setViewportSize((prev) => prev.w === w && prev.h === h ? prev : { w, h });
            setPan((prev) => {
                if (prev.x !== 0 || prev.y !== 0) return prev;
                return clampPan({ x: w / 2 - (BOARD_WIDTH * zoom) / 2, y: h / 2 - (BOARD_HEIGHT * zoom) / 2 });
            });
        };
        update();
        const ro = new ResizeObserver(update);
        ro.observe(vp);
        return () => ro.disconnect();
    }, [clampPan, zoom]);

    // Save position
    async function savePosition(id: string, x: number, y: number, extra?: Partial<Pick<Note, "isPinned" | "parentNoteId" | "threadRootId">>) {
        const clamped = clampNotePosition(x, y);
        setNotes((prev) => prev.map((n) => n.id === id ? { ...n, wallX: clamped.x, wallY: clamped.y, ...(extra ?? {}) } : n));
        try { await updateNote(id, { wallX: clamped.x, wallY: clamped.y, ...(extra ?? {}) }); } catch (err) { console.error(err); }
    }

    // Update note connection
    async function updateNoteConnection(id: string, parentNoteId: string, threadRootId: string) {
        setNotes((prev) => prev.map((n) => n.id === id ? { ...n, parentNoteId, threadRootId } : n));
        try { await updateNote(id, { parentNoteId, threadRootId }); } catch (err) { console.error("Failed to update note connection:", err); }
    }

    // Unconnect
    async function handleUnconnect(noteId: string) {
        setNotes((prev) => prev.map((n) => n.id === noteId ? { ...n, parentNoteId: undefined, threadRootId: undefined } : n));
        try { await clearNoteConnection(noteId); } catch (err) { console.error("Failed to unconnect note:", err); }
    }

    // Pin request
    function handleRequestPin(noteId: string, x: number, y: number, screenX: number, screenY: number) {
        setPendingPin({ noteId, x, y, screenX, screenY });
    }

    function confirmPin() {
        if (!pendingPin) return;
        void savePosition(pendingPin.noteId, pendingPin.x, pendingPin.y, { isPinned: true });
        setPendingPin(null);
    }

    function cancelPin() {
        setPendingPin(null);
    }

    // Connect
    function openConnect(noteId: string) {
        const target = notes.find((n) => n.id === noteId);
        if (!target?.isPinned) {
            toast.error("Please pin this note first before connecting others to it.");
            return;
        }
        setConnectTargetId(noteId);
        setConnectMode("new");
        setConnectExistingId("");
        setConnectContent("");
    }

    // React
    async function handleReact(noteId: string, authorId: string, type: "heart" | "thought" | "fire" | "sad") {
        if (!user) return;
        const note = notes.find((n) => n.id === noteId);
        if (!note) return;
        if (note.reactedUsers?.includes(user.uid)) { toast.error("You've already reacted!"); return; }
        const newR = { ...note.reactions, [type]: (note.reactions?.[type] || 0) + 1 };
        const newU = [...(note.reactedUsers || []), user.uid];
        setNotes((prev) => prev.map((n) => n.id === noteId ? { ...n, reactions: newR, reactedUsers: newU } : n));
        try {
            await updateNote(noteId, { reactions: newR, reactedUsers: newU });
            if (user.uid !== authorId) {
                await createNotification({
                    userId: authorId, actorId: user.uid,
                    actorName: user.displayName || user.email || "Anonymous",
                    type: "group_reaction", noteId, noteContent: note.content,
                    groupId: group.id, groupName: group.name, reactionType: type,
                });
            }
        } catch (err) { console.error(err); }
    }

    // Pin new note
    async function handlePinNote() {
        if (!user || !newNoteContent.trim()) return;
        setPinning(true);
        try {
            const authorName = user.displayName || user.email || "Anonymous";
            const col = notes.length % 6, row = Math.floor(notes.length / 6);
            const wallX = Math.min(BOARD_WIDTH - NOTE_SIZE, Math.max(NOTE_MARGIN, 160 + col * 300));
            const wallY = Math.min(BOARD_HEIGHT - NOTE_SIZE, Math.max(NOTE_MARGIN, 160 + row * 300));
            const docRef = await createGroupNote(group.id, {
                content: newNoteContent.trim(), authorId: user.uid, authorName,
                tags: [], reactions: { heart: 0, thought: 0, fire: 0, sad: 0 },
                wallX, wallY,
            });
            await touchGroupActivity(group.id);
            const newNote: Note = {
                id: docRef.id, content: newNoteContent.trim(), authorId: user.uid, authorName,
                tags: [], reactions: { heart: 0, thought: 0, fire: 0, sad: 0 },
                isTorn: true, onWall: false, wallX, wallY, createdAt: new Date(),
            };
            setNotes((prev) => [...prev, newNote]);
            setNewNoteContent("");
            setShowPinInput(false);
            toast.success("Note pinned to the group wall!");
        } catch (err) { console.error(err); toast.error("Failed to pin note."); }
        finally { setPinning(false); }
    }

    // Submit connect
    async function submitConnect() {
        if (!user || !connectTargetId) return;
        const target = notes.find((n) => n.id === connectTargetId);
        if (!target) return;

        setConnecting(true);
        try {
            const authorName = user.displayName || user.email || "Anonymous";
            const baseX = target.wallX ?? 200;
            const baseY = target.wallY ?? 200;
            const offset = findNonOverlappingPosition(baseX + 40, baseY + NOTE_SIZE + 100, [target.id]);
            const threadRootId = target.threadRootId ?? target.id;

            if (connectMode === "existing") {
                if (!connectExistingId) return;
                const existing = notes.find((n) => n.id === connectExistingId && n.authorId === user.uid);
                if (!existing) return;
                if (!existing.isPinned) return;

                await updateNoteConnection(existing.id, target.id, threadRootId);

                if (user.uid !== target.authorId) {
                    await createNotification({
                        userId: target.authorId, actorId: user.uid,
                        actorName: authorName,
                        type: "connection", noteId: target.id, noteContent: target.content,
                        groupId: group.id, groupName: group.name,
                    });
                }
            } else {
                if (!connectContent.trim()) return;

                const docRef = await createGroupNote(group.id, {
                    content: connectContent.trim(), authorId: user.uid, authorName,
                    tags: target.tags ?? [], reactions: { heart: 0, thought: 0, fire: 0, sad: 0 },
                    isTorn: true, onWall: false,
                    wallX: offset.x, wallY: offset.y,
                    parentNoteId: target.id, threadRootId,
                });

                await touchGroupActivity(group.id);

                const newNote: Note = {
                    id: docRef.id, content: connectContent.trim(), authorId: user.uid, authorName,
                    tags: target.tags ?? [], reactions: { heart: 0, thought: 0, fire: 0, sad: 0 },
                    isTorn: true, onWall: false, isPinned: false,
                    wallX: offset.x, wallY: offset.y,
                    parentNoteId: target.id, threadRootId,
                    createdAt: new Date(),
                };

                setNotes((prev) => [newNote, ...prev]);

                if (user.uid !== target.authorId) {
                    await createNotification({
                        userId: target.authorId, actorId: user.uid,
                        actorName: authorName,
                        type: "connection", noteId: target.id, noteContent: target.content,
                        groupId: group.id, groupName: group.name,
                    });
                }
            }

            setConnectContent("");
            setConnectExistingId("");
            setConnectTargetId(null);
        } catch (err) {
            console.error("Failed to create connected note:", err);
        } finally {
            setConnecting(false);
        }
    }

    // "Go to my notes"
    function goToMyNotes() {
        if (!user) return;
        const myNotes = notes.filter((n) => n.authorId === user.uid);
        if (myNotes.length === 0) return;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const n of myNotes) {
            const x = n.wallX ?? 0, y = n.wallY ?? 0;
            minX = Math.min(minX, x); minY = Math.min(minY, y);
            maxX = Math.max(maxX, x + 260); maxY = Math.max(maxY, y + 260);
        }
        const centerX = (minX + maxX) / 2, centerY = (minY + maxY) / 2;
        const bboxW = maxX - minX + 200, bboxH = maxY - minY + 200;
        const fitZoom = Math.min(viewportSize.w / bboxW, viewportSize.h / bboxH, 1.2);
        const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, fitZoom));
        setZoom(clampedZoom);
        setPan(() => clampPan({
            x: viewportSize.w / 2 - centerX * clampedZoom,
            y: viewportSize.h / 2 - centerY * clampedZoom,
        }));
    }

    // Pan
    function startPan(e: React.PointerEvent<HTMLDivElement>) {
        if ((e.target as HTMLElement).closest("[data-note]")) return;
        setIsPanning(true); lastPanPoint.current = { x: e.clientX, y: e.clientY };
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    }
    function onPanMove(e: React.PointerEvent<HTMLDivElement>) {
        if (!isPanning || !lastPanPoint.current) return;
        const lp = lastPanPoint.current;
        const dx = e.clientX - lp.x;
        const dy = e.clientY - lp.y;
        setPan((prev) => clampPan({ x: prev.x + dx, y: prev.y + dy }));
        lastPanPoint.current = { x: e.clientX, y: e.clientY };
    }
    function endPan() { setIsPanning(false); lastPanPoint.current = null; }

    // Zoom
    const zoomToward = useCallback((cx: number, cy: number, delta: number) => {
        setZoom((prev) => {
            const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta));
            const clamped = Number(next.toFixed(2));
            const ratio = clamped / prev;
            setPan((p) => ({ x: cx - ratio * (cx - p.x), y: cy - ratio * (cy - p.y) }));
            return clamped;
        });
    }, []);

    // Attach native wheel listener with { passive: false } so preventDefault works
    useEffect(() => {
        const vp = viewportRef.current;
        if (!vp) return;
        const handleWheel = (e: WheelEvent) => {
            if (e.buttons !== 0) return;
            e.preventDefault();
            const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
            zoomToward(e.clientX, e.clientY, delta);
        };
        vp.addEventListener("wheel", handleWheel, { passive: false });
        return () => vp.removeEventListener("wheel", handleWheel);
    }, [zoomToward, loading]);

    function adjustZoom(delta: number) {
        const vp = viewportRef.current; if (!vp) return;
        const r = vp.getBoundingClientRect();
        zoomToward(r.left + r.width / 2, r.top + r.height / 2, delta);
    }
    function resetView() {
        const vp = viewportRef.current; if (!vp) return;
        setZoom(0.85);
        setPan(clampPan({ x: vp.clientWidth / 2 - (BOARD_WIDTH * 0.85) / 2, y: vp.clientHeight / 2 - (BOARD_HEIGHT * 0.85) / 2 }));
    }

    // Computed values
    const myNoteCount = useMemo(
        () => (user ? notes.filter((n) => n.authorId === user.uid).length : 0),
        [notes, user],
    );

    const myWallNotes = useMemo(
        () => (user ? notes.filter((n) => n.authorId === user.uid) : []),
        [notes, user],
    );

    const myPinnedWallNotes = useMemo(
        () => myWallNotes.filter((n) => n.isPinned),
        [myWallNotes],
    );

    const connectableNotes = useMemo(
        () => connectTargetId
            ? myPinnedWallNotes.filter((n) => n.id !== connectTargetId)
            : myPinnedWallNotes,
        [myPinnedWallNotes, connectTargetId],
    );

    return (
        <div className="relative w-full h-full bg-[#c9a96e]">
            <section className="corkboard-texture h-full w-full relative">
                {loading ? (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                        <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                ) : (
                    <div ref={viewportRef} className="absolute inset-0 overflow-hidden" style={{ touchAction: "none" }}>

                        {/* Controls */}
                        <div className="absolute right-4 top-4 z-20 flex flex-col gap-2 rounded-lg bg-paper/90 p-2 shadow-lg backdrop-blur-sm">
                            <button onClick={() => adjustZoom(ZOOM_STEP)} className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors" title="Zoom in">
                                <Plus className="h-4 w-4" />
                            </button>
                            <button onClick={() => adjustZoom(-ZOOM_STEP)} className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors" title="Zoom out">
                                <Minus className="h-4 w-4" />
                            </button>
                            <button onClick={resetView} className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors" title="Reset view">
                                <Maximize2 className="h-4 w-4" />
                            </button>
                            <span className="text-[10px] text-center font-body text-ink-light select-none">{Math.round(zoom * 100)}%</span>
                        </div>

                        {/* Top-left buttons */}
                        <div className="absolute left-4 top-4 z-20 flex items-center gap-2">
                            <button onClick={() => setShowPinInput(true)}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground shadow-lg text-sm font-body hover:bg-primary/90 transition-colors">
                                <MapPin className="w-4 h-4" /> Pin a Note
                            </button>
                            {user && myNoteCount > 0 && (
                                <button
                                    type="button"
                                    onClick={goToMyNotes}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-paper/90 shadow-lg backdrop-blur-sm text-sm font-body text-ink hover:bg-paper transition-colors"
                                    title="Pan to your notes"
                                >
                                    <User className="w-4 h-4 text-blue-500" />
                                    <span>My notes</span>
                                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-blue-500 text-white text-[10px] font-semibold">
                                        {myNoteCount}
                                    </span>
                                </button>
                            )}
                        </div>

                        {/* Zoom zone label */}
                        <div className="absolute left-1/2 -translate-x-1/2 top-4 z-20 px-3 py-1 rounded-full bg-paper/80 shadow text-xs font-body text-ink-light backdrop-blur-sm select-none pointer-events-none">
                            {zoomLabel}
                        </div>

                        {/* Board */}
                        <div ref={boardRef} className="absolute"
                            style={{ width: BOARD_WIDTH, height: BOARD_HEIGHT, transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0", cursor: isPanning ? "grabbing" : "grab", touchAction: "none" }}
                            onPointerDown={startPan} onPointerMove={onPanMove} onPointerUp={endPan} onPointerLeave={endPan}>

                            {/* Connection lines between notes */}
                            <svg className="absolute inset-0 pointer-events-none" width={BOARD_WIDTH} height={BOARD_HEIGHT}>
                                {notes.map((child) => {
                                    if (!child.parentNoteId) return null;
                                    const parent = notes.find((n) => n.id === child.parentNoteId);
                                    if (!parent) return null;
                                    const parentX = (parent.wallX ?? 0) + NOTE_SIZE / 2;
                                    const parentY = (parent.wallY ?? 0) + 8;
                                    const childX = (child.wallX ?? 0) + NOTE_SIZE / 2;
                                    const childY = (child.wallY ?? 0) + 8;
                                    return (
                                        <line key={`${parent.id}-${child.id}`}
                                            x1={parentX} y1={parentY} x2={childX} y2={childY}
                                            stroke="rgba(0,0,0,0.35)" strokeWidth={2} strokeDasharray="4 4" />
                                    );
                                })}
                            </svg>

                            {notes.map((note, i) => (
                                <DraggableNote key={note.id} note={note} index={i} zoom={zoom} zoomZone={zoomZone}
                                    isOwn={!!user && note.authorId === user.uid}
                                    onDragEnd={(id, x, y) => void savePosition(id, x, y)}
                                    onRequestPin={handleRequestPin}
                                    onConnect={user ? () => openConnect(note.id) : undefined}
                                    onReact={handleReact} />
                            ))}
                        </div>

                        {/* Minimap */}
                        <MiniMap notes={notes} pan={pan} zoom={zoom} viewportSize={viewportSize} currentUserId={user?.uid} onJump={setPan} />

                        {/* Info badge */}
                        <div className="absolute right-4 bottom-4 z-20 px-3 py-1.5 rounded-lg bg-paper/80 shadow text-xs font-body text-ink-light backdrop-blur-sm select-none">
                            {notes.length} note{notes.length !== 1 ? "s" : ""} · group wall
                        </div>

                        {/* Pin confirmation dialog */}
                        {pendingPin && (
                            <PinConfirmDialog
                                position={{ x: pendingPin.screenX, y: pendingPin.screenY }}
                                onConfirm={confirmPin}
                                onCancel={cancelPin}
                            />
                        )}

                        {/* Pin input overlay */}
                        {showPinInput && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowPinInput(false)}>
                                <div className="bg-paper rounded-xl shadow-2xl border border-border/50 w-full max-w-md mx-4 p-5 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                                    <h3 className="font-handwritten text-2xl text-ink mb-3">📌 Pin a Note</h3>
                                    <textarea value={newNoteContent} onChange={(e) => setNewNoteContent(e.target.value)}
                                        placeholder="Write something for the group wall…" rows={4} autoFocus
                                        className="w-full bg-paper-dark border border-border rounded-md font-body text-sm text-ink p-3 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none mb-3 placeholder:text-muted-foreground" />
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setShowPinInput(false)} className="px-4 py-2 text-sm font-body rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">Cancel</button>
                                        <button onClick={handlePinNote} disabled={pinning || !newNoteContent.trim()} className="px-4 py-2 text-sm font-body rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                                            {pinning ? "Pinning…" : "Pin it 📌"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Connect note dialog */}
                        {connectTargetId && (() => {
                            const targetNote = notes.find((n) => n.id === connectTargetId);
                            const canUnconnectTarget =
                                user && targetNote?.authorId === user.uid && targetNote?.parentNoteId;
                            return (
                                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
                                    <div className="bg-paper rounded-lg shadow-xl border border-black/10 p-4 w-full max-w-md">
                                        <h2 className="font-handwritten text-2xl text-ink mb-2">Connect a note</h2>
                                        <p className="font-body text-xs text-ink-light mb-3">
                                            Choose whether to connect one of your existing notes or write a brand new one.
                                        </p>

                                        {canUnconnectTarget && (
                                            <div className="mb-3">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (connecting) return;
                                                        void handleUnconnect(connectTargetId);
                                                        setConnectTargetId(null);
                                                        setConnectExistingId("");
                                                        setConnectContent("");
                                                    }}
                                                    disabled={connecting}
                                                    className="w-full px-3 py-2 text-xs font-body rounded-md border border-amber-500/60 bg-amber-500/10 text-amber-800 hover:bg-amber-500/20 transition-colors disabled:opacity-60"
                                                >
                                                    Unconnect this note
                                                </button>
                                            </div>
                                        )}

                                        <div className="flex gap-2 mb-3">
                                            <button
                                                type="button"
                                                onClick={() => setConnectMode("existing")}
                                                className={`flex-1 px-3 py-1 text-xs font-body rounded-md border ${connectMode === "existing"
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "bg-paper-dark/80 text-ink-light border-border hover:bg-paper-dark"
                                                    } transition-colors`}
                                            >
                                                Connect to existing note
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setConnectMode("new")}
                                                className={`flex-1 px-3 py-1 text-xs font-body rounded-md border ${connectMode === "new"
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "bg-paper-dark/80 text-ink-light border-border hover:bg-paper-dark"
                                                    } transition-colors`}
                                            >
                                                Connect to new note
                                            </button>
                                        </div>

                                        {connectMode === "existing" ? (
                                            <div className="mb-3 space-y-1">
                                                {connectableNotes.length === 0 ? (
                                                    <p className="font-body text-xs text-ink-light">
                                                        {myPinnedWallNotes.length === 0
                                                            ? "You don't have any pinned notes on the wall yet. Pin one of your notes first (double-click the pin), then you can connect it here."
                                                            : "This is your only pinned note. Pin another note first, or use \"Connect to new note\" to add a new one."}
                                                    </p>
                                                ) : (
                                                    <>
                                                        <select
                                                            className="w-full bg-paper-dark border border-border rounded-md font-body text-sm text-ink p-2"
                                                            value={connectExistingId}
                                                            onChange={(e) => setConnectExistingId(e.target.value)}
                                                        >
                                                            <option value="">Select one of your pinned notes…</option>
                                                            {connectableNotes.map((n) => (
                                                                <option key={n.id} value={n.id}>
                                                                    {n.content.slice(0, 60)}
                                                                    {n.content.length > 60 ? "…" : ""}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <p className="font-body text-[11px] text-ink-light">
                                                            Any pinned note can be linked here. Already-connected notes will be re-linked to this one.
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            <textarea
                                                className="w-full min-h-[90px] bg-paper-dark border border-border rounded-md font-body text-sm text-ink p-2 mb-3 resize-vertical"
                                                placeholder="What do you want to add, respond with, or share back?"
                                                value={connectContent}
                                                onChange={(e) => setConnectContent(e.target.value)}
                                            />
                                        )}

                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (connecting) return;
                                                    setConnectTargetId(null);
                                                    setConnectExistingId("");
                                                    setConnectContent("");
                                                }}
                                                className="px-3 py-1 text-xs font-body rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={submitConnect}
                                                disabled={
                                                    connecting ||
                                                    (connectMode === "new" ? !connectContent.trim() : !connectExistingId)
                                                }
                                                className="px-3 py-1 text-xs font-body rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
                                            >
                                                {connecting
                                                    ? "Connecting..."
                                                    : connectMode === "new"
                                                        ? "Post connected note"
                                                        : "Connect existing note"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}
            </section>
        </div>
    );
}
