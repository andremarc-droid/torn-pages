import { useAuth } from "@/contexts/AuthContext";
import { subscribeToUnreadNotificationsCount } from "@/integrations/firebase";
import { logOut } from "@/integrations/firebase/auth";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";
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
            <Logo className="h-7" />
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
