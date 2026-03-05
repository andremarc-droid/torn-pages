import {
    addDoc,
    collection,
    deleteDoc,
    deleteField,
    doc,
    getDoc,
    getDocs,
    limit,
    onSnapshot,
    query,
    serverTimestamp,
    updateDoc,
    where,
    type DocumentData,
    type QueryConstraint
} from "firebase/firestore";
import { db } from "./config";

// ─── Collection references ───────────────────────────────────

export const notesCollection = collection(db, "notes");
export const groupsCollection = collection(db, "groups");
export const usersCollection = collection(db, "users");
export const notificationsCollection = collection(db, "notifications");

// ─── Notes (torn pages pinned to the wall) ───────────────────

export interface NoteData {
    content: string;
    authorId: string;
    authorName: string;
    tags: string[];
    reactions: { heart: number; thought: number; fire: number; sad: number };
    /** Whether the page has been torn & kept in the book */
    isTorn: boolean;
    /** Whether the torn page is visible on the public wall */
    onWall: boolean;
    /** Whether the note's wall position is locked until it expires */
    isPinned?: boolean;
    /** If this note is a response, which note it is replying to */
    parentNoteId?: string;
    /** Root id for a thread of connected notes */
    threadRootId?: string;
    /** Users who have reacted to this note */
    reactedUsers?: string[];
    /** Optional x position on the wall board */
    wallX?: number;
    /** Optional y position on the wall board */
    wallY?: number;
    /** If the note was pinned to a group, store the group ID */
    pinnedToGroup?: string;
    /** Display name of the group the note was pinned to */
    pinnedToGroupName?: string;
    createdAt: any;
}

/** Create a new note */
export async function createNote(
    data: Omit<NoteData, "createdAt" | "isTorn" | "onWall"> &
        Partial<Pick<NoteData, "isTorn" | "onWall">>,
) {
    return addDoc(notesCollection, {
        isTorn: false,
        onWall: false,
        isPinned: false,
        reactedUsers: [],
        ...data,
        createdAt: serverTimestamp(),
    });
}

/** Get all notes that should appear on the wall */
export async function getPinnedNotes(maxResults = 50) {
    const q = query(notesCollection, where("onWall", "==", true));
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as NoteData & { id: string }));

    return items
        .sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() ?? 0;
            const bTime = b.createdAt?.toMillis?.() ?? 0;
            return bTime - aTime;
        })
        .slice(0, maxResults);
}

/** Get notes by a specific user */
export async function getUserNotes(userId: string) {
    // Simple query (no composite index required); sort on client.
    const q = query(notesCollection, where("authorId", "==", userId));
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as NoteData & { id: string }));

    return items.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() ?? 0;
        const bTime = b.createdAt?.toMillis?.() ?? 0;
        return bTime - aTime;
    });
}

/** Update a note (e.g. reactions, pin status) */
export async function updateNote(noteId: string, data: Partial<NoteData>) {
    const ref = doc(db, "notes", noteId);
    return updateDoc(ref, data as DocumentData);
}

/** Remove a note's connection to another note (clears parentNoteId and threadRootId). */
export async function clearNoteConnection(noteId: string) {
    const ref = doc(db, "notes", noteId);
    return updateDoc(ref, { parentNoteId: deleteField(), threadRootId: deleteField() });
}

/** Delete a note */
export async function deleteNote(noteId: string) {
    const ref = doc(db, "notes", noteId);
    return deleteDoc(ref);
}

// ─── Groups ──────────────────────────────────────────────────

export interface GroupData {
    name: string;
    description: string;
    coverImageUrl?: string;
    createdBy: string;
    adminId: string;
    isPublic: boolean;
    memberCount: number;
    members: string[];
    inviteCode?: string;
    lastActivity?: any;
    createdAt: any;
}

/** Create a group */
export async function createGroup(
    data: Omit<GroupData, "createdAt" | "lastActivity" | "memberCount" | "members" | "adminId" | "inviteCode"> & { adminId?: string },
) {
    const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    // Strip undefined values — Firestore rejects them
    const clean = Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== undefined),
    );
    return addDoc(groupsCollection, {
        ...clean,
        adminId: data.adminId || data.createdBy,
        members: [data.createdBy],
        memberCount: 1,
        inviteCode,
        lastActivity: serverTimestamp(),
        createdAt: serverTimestamp(),
    });
}

/** Get all public groups */
export async function getPublicGroups() {
    const q = query(
        groupsCollection,
        where("isPublic", "==", true),
    );
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    return items.sort((a: any, b: any) => (b.memberCount || 0) - (a.memberCount || 0));
}

/** Get groups the user is a member of */
export async function getUserGroups(userId: string) {
    const q = query(
        groupsCollection,
        where("members", "array-contains", userId),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as GroupData & { id: string }));
}

/** Get a single group by ID */
export async function getGroup(groupId: string) {
    const ref = doc(db, "groups", groupId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as GroupData & { id: string };
}

/** Join a group */
export async function joinGroup(groupId: string, userId: string) {
    const ref = doc(db, "groups", groupId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) throw new Error("Group not found");
    const data = snapshot.data() as GroupData;
    if (data.members?.includes(userId)) return; // already a member
    const newMembers = [...(data.members || []), userId];
    await updateDoc(ref, {
        members: newMembers,
        memberCount: newMembers.length,
    });
}

/** Leave a group */
export async function leaveGroup(groupId: string, userId: string) {
    const ref = doc(db, "groups", groupId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) throw new Error("Group not found");
    const data = snapshot.data() as GroupData;
    const newMembers = (data.members || []).filter((m: string) => m !== userId);
    await updateDoc(ref, {
        members: newMembers,
        memberCount: newMembers.length,
    });
}

/** Remove a member from a group (admin action) */
export async function removeMember(groupId: string, userId: string) {
    return leaveGroup(groupId, userId);
}

/** Update group data */
export async function updateGroup(groupId: string, data: Partial<GroupData>) {
    const ref = doc(db, "groups", groupId);
    return updateDoc(ref, data as DocumentData);
}

/** Delete a group entirely */
export async function deleteGroup(groupId: string) {
    const ref = doc(db, "groups", groupId);
    return deleteDoc(ref);
}

/** Find a group by invite code */
export async function getGroupByInviteCode(code: string) {
    const q = query(groupsCollection, where("inviteCode", "==", code.toUpperCase()), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const d = snapshot.docs[0];
    return { id: d.id, ...d.data() } as GroupData & { id: string };
}

/** Get notes for a specific group */
export async function getGroupNotes(groupId: string) {
    const q = query(notesCollection, where("groupId", "==", groupId));
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as NoteData & { id: string; groupId?: string }));
    return items.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() ?? 0;
        const bTime = b.createdAt?.toMillis?.() ?? 0;
        return bTime - aTime;
    });
}

/** Create a note in a group */
export async function createGroupNote(
    groupId: string,
    data: Omit<NoteData, "createdAt" | "isTorn" | "onWall"> & Partial<Pick<NoteData, "isTorn" | "onWall">>,
) {
    return addDoc(notesCollection, {
        isTorn: true,
        onWall: false,
        isPinned: false,
        reactedUsers: [],
        ...data,
        groupId,
        createdAt: serverTimestamp(),
    });
}

/** Touch group lastActivity timestamp */
export async function touchGroupActivity(groupId: string) {
    const ref = doc(db, "groups", groupId);
    return updateDoc(ref, { lastActivity: serverTimestamp() });
}

// ─── User profiles ───────────────────────────────────────────

export interface UserProfile {
    uid: string;
    username: string;
    bio?: string;
    pinnedCount: number;
    reactionCount: number;
    groupCount: number;
    hasCompletedOnboarding?: boolean;
    lastNameChangeAt?: any;
    createdAt: any;
}

/** Create or update a user profile */
export async function setUserProfile(uid: string, data: Partial<UserProfile>) {
    // Look up an existing profile document for this uid (if any)
    const profileQuery = query(usersCollection, where("uid", "==", uid), limit(1));
    const snapshot = await getDocs(profileQuery);

    const updateData: DocumentData = {
        ...data,
    };

    // If the username is being changed, record when it was last updated
    if (typeof data.username === "string") {
        updateData.lastNameChangeAt = serverTimestamp();
    }

    if (!snapshot.empty) {
        const existingDocRef = snapshot.docs[0].ref;
        return updateDoc(existingDocRef, updateData);
    }

    // No existing profile — create a new one with sensible defaults
    const baseData: DocumentData = {
        uid,
        pinnedCount: 0,
        reactionCount: 0,
        groupCount: 0,
        hasCompletedOnboarding: false,
        createdAt: serverTimestamp(),
        ...updateData,
    };

    return addDoc(usersCollection, baseData);
}

/** Get a user profile by UID */
export async function getUserProfile(uid: string) {
    const q = query(usersCollection, where("uid", "==", uid), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const d = snapshot.docs[0];
    return { id: d.id, ...d.data() } as UserProfile & { id: string };
}

// ─── Notifications ───────────────────────────────────────────

export interface NotificationData {
    userId: string;
    actorId: string;
    actorName: string;
    type: "reaction" | "connection" | "group_invite" | "group_remove" | "group_note" | "group_reaction" | "admin_transfer";
    noteId?: string;
    noteContent?: string;
    groupId?: string;
    groupName?: string;
    reactionType?: string;
    read: boolean;
    createdAt: any;
}

export async function createNotification(data: Omit<NotificationData, "createdAt" | "read">) {
    return addDoc(notificationsCollection, {
        ...data,
        read: false,
        createdAt: serverTimestamp(),
    });
}

export async function getUserNotifications(userId: string) {
    const q = query(
        notificationsCollection,
        where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as NotificationData & { id: string }));

    return items.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() ?? 0;
        const bTime = b.createdAt?.toMillis?.() ?? 0;
        return bTime - aTime;
    });
}

export function subscribeToUnreadNotificationsCount(userId: string, callback: (count: number) => void) {
    const q = query(
        notificationsCollection,
        where("userId", "==", userId),
        where("read", "==", false)
    );
    return onSnapshot(q, (snapshot) => {
        callback(snapshot.docs.length);
    });
}

export async function markNotificationRead(notificationId: string) {
    const ref = doc(db, "notifications", notificationId);
    return updateDoc(ref, { read: true });
}

// ─── Generic helpers ─────────────────────────────────────────

/** Run an arbitrary query on any collection */
export async function queryCollection(
    collectionName: string,
    ...constraints: QueryConstraint[]
) {
    const ref = collection(db, collectionName);
    const q = query(ref, ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}
