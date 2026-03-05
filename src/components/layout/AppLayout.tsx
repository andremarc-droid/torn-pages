import { useAuth } from "@/contexts/AuthContext";
import { subscribeToUnreadNotificationsCount } from "@/integrations/firebase";
import { logOut } from "@/integrations/firebase/auth";
import { cn } from "@/lib/utils";
import { Bell, BookOpen, Home, LogOut, User, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { to: "/wall", icon: Home, label: "Wall" },
  { to: "/book", icon: BookOpen, label: "My Book" },
  { to: "/groups", icon: Users, label: "Groups" },
  { to: "/notifications", icon: Bell, label: "Alerts" },
  { to: "/profile", icon: User, label: "Profile" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    const unsubscribe = subscribeToUnreadNotificationsCount(user.uid, (count) => {
      setUnreadCount(count);
    });
    return () => unsubscribe();
  }, [user]);

  const handleSignOut = async () => {
    await logOut();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14 px-4">
          <Link to="/wall" className="flex items-center gap-2">
            <EarLogo />
            <span className="font-handwritten text-2xl font-bold text-foreground">
              Notes &amp; Ears
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-body transition-colors",
                  pathname === item.to
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                )}
              >
                <div className="relative">
                  <item.icon className="w-4 h-4" />
                  {item.to === "/notifications" && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                  )}
                </div>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {user && (
              <span className="hidden sm:inline font-body text-xs text-muted-foreground truncate max-w-[140px]">
                {user.displayName || user.email}
              </span>
            )}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors font-body"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t bg-card/95 backdrop-blur-sm">
        <div className="flex justify-around py-2">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 text-xs transition-colors",
                pathname === item.to
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <item.icon className="w-5 h-5" />
                {item.to === "/notifications" && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                )}
              </div>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

function EarLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14 2C8.48 2 4 6.48 4 12c0 3.5 1.8 6.6 4.5 8.4.5.3.8.9.8 1.5V24c0 1.1.9 2 2 2h5.4c1.1 0 2-.9 2-2v-2.1c0-.6.3-1.2.8-1.5C22.2 18.6 24 15.5 24 12c0-5.52-4.48-10-10-10z"
        fill="hsl(var(--primary))"
        opacity="0.9"
      />
      <path
        d="M14 5c-3.87 0-7 3.13-7 7 0 2.2 1 4.2 2.6 5.5"
        stroke="hsl(var(--primary-foreground))"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M14 8c-2.21 0-4 1.79-4 4s1.79 4 4 4"
        stroke="hsl(var(--primary-foreground))"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Torn paper piece */}
      <rect x="17" y="3" width="8" height="10" rx="1" fill="hsl(var(--paper))" transform="rotate(15 21 8)" />
      <line x1="19" y1="5.5" x2="24" y2="4.5" stroke="hsl(var(--ink-light))" strokeWidth="0.8" transform="rotate(15 21 8)" />
      <line x1="19" y1="7.5" x2="23" y2="6.5" stroke="hsl(var(--ink-light))" strokeWidth="0.8" transform="rotate(15 21 8)" />
    </svg>
  );
}
