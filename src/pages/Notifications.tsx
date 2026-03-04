import { Bell } from "lucide-react";

export default function Notifications() {
  return (
    <div className="min-h-screen py-8 pb-24 md:pb-8">
      <div className="container px-4 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-6 h-6 text-primary" />
          <h1 className="font-handwritten text-4xl text-foreground">Notifications</h1>
        </div>

        <div className="bg-paper rounded-md p-12 text-center shadow-sm">
          <p className="font-handwritten text-2xl text-ink-light mb-2">All quiet here</p>
          <p className="font-body text-sm text-muted-foreground">
            When someone reacts to or replies to your pinned notes, you'll see it here.
          </p>
        </div>
      </div>
    </div>
  );
}
