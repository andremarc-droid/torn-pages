import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useLocation } from "react-router-dom";

/**
 * Wraps a route so only authenticated users can access it.
 * While Firebase is still loading the auth state we show a simple spinner.
 * If the user is not signed in, they're redirected to /auth.
 * If they are signed in but haven't finished onboarding, redirect to /onboarding.
 */
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, userProfile, loading } = useAuth();
    const location = useLocation();
    const fromOnboarding = (location.state as any)?.fromOnboarding;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    // Force onboarding, unless the user has just come from the onboarding flow
    if (
        userProfile &&
        !userProfile.hasCompletedOnboarding &&
        location.pathname !== "/onboarding" &&
        !fromOnboarding
    ) {
        return <Navigate to="/onboarding" replace />;
    }

    // Prevent visiting onboarding if already completed
    if (userProfile && userProfile.hasCompletedOnboarding && location.pathname === "/onboarding") {
        return <Navigate to="/wall" replace />;
    }

    return <>{children}</>;
}
