import { useAuth } from "@/contexts/AuthContext";
import { getUserNotifications, markNotificationRead, type NotificationData } from "@/integrations/firebase";
import { formatDistanceToNow } from "date-fns";
import { Bell, Check, Heart, Link as LinkIcon, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<(NotificationData & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotifications() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const data = await getUserNotifications(user.uid);
        setNotifications(data);
      } catch (e) {
        console.error("Failed to load notifications", e);
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();
  }, [user]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (e) {
      console.error("Failed to mark notification as read", e);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen py-8 pb-24 md:pb-8 flex items-center justify-center">
        <div className="container px-4 text-center">
          <p className="font-handwritten text-2xl text-ink-light">Sign in to see notifications</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 pb-24 md:pb-8">
      <div className="container px-4 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-6 h-6 text-primary" />
          <h1 className="font-handwritten text-4xl text-foreground">Alerts</h1>
        </div>

        {loading ? (
          <div className="flex justify-center p-12 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-paper rounded-md p-12 text-center shadow-sm">
            <p className="font-handwritten text-2xl text-ink-light mb-2">All quiet here</p>
            <p className="font-body text-sm text-muted-foreground">
              When someone reacts to or replies to your pinned notes, you'll see it here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`bg-paper rounded-md p-4 shadow-sm border ${n.read ? "border-transparent" : "border-primary/50"
                  }`}
              >
                <div className="flex sm:items-start max-sm:flex-col gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-paper-dark shrink-0">
                    {n.type === "reaction" ? (
                      <Heart className="w-5 h-5 text-red-500" />
                    ) : (
                      <LinkIcon className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-body text-sm mb-1 text-ink">
                      <span className="font-bold">{n.actorName}</span>{" "}
                      {n.type === "reaction"
                        ? `reacted ${n.reactionType === "heart"
                          ? "🤍"
                          : n.reactionType === "thought"
                            ? "💭"
                            : n.reactionType === "fire"
                              ? "🔥"
                              : "😔"
                        } to your note:`
                        : "connected an answer to your note:"}
                    </p>
                    <p className="font-handwritten text-lg text-ink-light italic mb-2">
                      "{n.noteContent.length > 50 ? n.noteContent.substring(0, 50) + "..." : n.noteContent}"
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-body text-muted-foreground">
                        {n.createdAt?.toMillis
                          ? formatDistanceToNow(n.createdAt.toMillis(), { addSuffix: true })
                          : "Recently"}
                      </span>

                      {!n.read && (
                        <button
                          onClick={() => handleMarkAsRead(n.id)}
                          className="text-xs font-body flex items-center gap-1 text-primary hover:text-primary/80 transition-colors"
                        >
                          <Check className="w-3 h-3" /> Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
