// Firebase integration barrel exports
// Import everything from here: import { auth, db, signIn, ... } from "@/integrations/firebase"

export {
    logOut,
    onAuthChange,
    sendVerificationEmailLink,
    signIn,
    signUp,
    deleteCurrentUser,
    updateAuthDisplayName,
} from "./auth";
export { auth, db } from "./config";
export {
    // Notes
    clearNoteConnection,
    // Groups
    createGroup,
    createGroupNote, createNote,
    // Notifications
    createNotification, deleteGroup, deleteNote, getGroup,
    getGroupByInviteCode,
    getGroupNotes, getPinnedNotes, getPublicGroups,
    getUserGroups, getUserNotes, getUserNotifications,
    // Users
    getUserProfile, joinGroup,
    leaveGroup, markNotificationRead,
    // Helpers
    queryCollection, removeMember, setUserProfile, subscribeToUnreadNotificationsCount, touchGroupActivity,
    updateGroup, updateNote,
    // Types
    type GroupData,
    type NoteData,
    type NotificationData,
    type UserProfile
} from "./firestore";

