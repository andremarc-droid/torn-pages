import {
    addDoc,
    collection,
    deleteDoc,
    getDocs,
    query,
    serverTimestamp,
    where,
} from "firebase/firestore";
import { db } from "./config";

const verificationCodesCollection = collection(db, "verification_codes");

/** Generate a random 6-character alphanumeric code (uppercase) */
export function generateVerificationCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed lookalikes: I,O,0,1
    let code = "";
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/** Store a verification code in Firestore for a given email */
export async function storeVerificationCode(email: string, code: string) {
    // Delete any existing codes for this email first
    await clearVerificationCodes(email);

    return addDoc(verificationCodesCollection, {
        email: email.toLowerCase().trim(),
        code,
        createdAt: serverTimestamp(),
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes from now
    });
}

/** Verify a code matches what was stored for the given email */
export async function verifyCode(email: string, code: string): Promise<boolean> {
    const q = query(
        verificationCodesCollection,
        where("email", "==", email.toLowerCase().trim()),
        where("code", "==", code.toUpperCase().trim()),
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return false;

    // Check if the code has expired
    const docData = snapshot.docs[0].data();
    if (docData.expiresAt && Date.now() > docData.expiresAt) {
        // Code expired — clean up
        await deleteDoc(snapshot.docs[0].ref);
        return false;
    }

    return true;
}

/** Remove all verification codes for an email (cleanup after successful verification) */
export async function clearVerificationCodes(email: string) {
    const q = query(
        verificationCodesCollection,
        where("email", "==", email.toLowerCase().trim()),
    );
    const snapshot = await getDocs(q);
    const deletions = snapshot.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletions);
}
