import {
    createUserWithEmailAndPassword,
    deleteUser,
    onAuthStateChanged,
    sendEmailVerification,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    type User,
} from "firebase/auth";
import { auth } from "./config";

/**
 * Sign up a new user with email and password.
 * Optionally sets the displayName on the profile.
 */
export async function signUp(email: string, password: string, username?: string) {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    if (username) {
        await updateProfile(credential.user, { displayName: username });
    }
    return credential.user;
}

/**
 * Send a verification email to the user.
 */
export async function sendVerificationEmailLink(user: User) {
    return sendEmailVerification(user, {
        url: window.location.origin + "/auth", // Redirect back to login after verification
    });
}

/**
 * Sign in an existing user with email and password.
 */
export async function signIn(email: string, password: string) {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
}

/**
 * Sign-out the currently authenticated user.
 */
export async function logOut() {
    return signOut(auth);
}

/**
 * Subscribe to auth-state changes.
 * Returns an unsubscribe function.
 */
export function onAuthChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
}

/**
 * Permanently delete the currently authenticated user from Firebase Auth.
 */
export async function deleteCurrentUser() {
    if (!auth.currentUser) {
        throw new Error("No authenticated user");
    }
    await deleteUser(auth.currentUser);
}

/**
 * Update the displayName on the currently authenticated Firebase user.
 */
export async function updateAuthDisplayName(displayName: string) {
    if (!auth.currentUser) {
        throw new Error("No authenticated user");
    }
    await updateProfile(auth.currentUser, { displayName });
}
