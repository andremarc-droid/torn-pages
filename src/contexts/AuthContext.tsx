import { onAuthChange } from "@/integrations/firebase/auth";
import { getUserProfile, setUserProfile, type UserProfile } from "@/integrations/firebase/firestore";
import { type User } from "firebase/auth";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    markOnboardingComplete: () => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userProfile: null,
    loading: true,
    markOnboardingComplete: () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfileState] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthChange(async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                try {
                    // Try to fetch existing profile
                    let profile = await getUserProfile(firebaseUser.uid);

                    // If it doesn't exist (new user), create it
                    if (!profile) {
                        await setUserProfile(firebaseUser.uid, {
                            username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "User",
                        });
                        // Re-fetch after creation to get the full object with defaults
                        profile = await getUserProfile(firebaseUser.uid);
                    }
                    setUserProfileState(profile);
                } catch (error) {
                    console.error("Error fetching user profile:", error);
                    setUserProfileState(null);
                }
            } else {
                setUserProfileState(null);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const markOnboardingComplete = () => {
        setUserProfileState((prev) =>
            prev ? { ...prev, hasCompletedOnboarding: true } : prev,
        );
    };

    return (
        <AuthContext.Provider value={{ user, userProfile, loading, markOnboardingComplete }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
