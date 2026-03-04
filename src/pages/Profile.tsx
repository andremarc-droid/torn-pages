import { User, Pin, Settings } from "lucide-react";

export default function Profile() {
  return (
    <div className="min-h-screen py-8 pb-24 md:pb-8">
      <div className="container px-4 max-w-3xl">
        <div className="flex items-center gap-3 mb-6">
          <User className="w-6 h-6 text-primary" />
          <h1 className="font-handwritten text-4xl text-foreground">Profile</h1>
        </div>

        {/* Profile card */}
        <div className="bg-paper rounded-md p-6 shadow-sm mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
              <span className="font-handwritten text-2xl text-secondary-foreground">?</span>
            </div>
            <div>
              <p className="font-handwritten text-2xl text-ink">anonymous_user</p>
              <p className="font-body text-sm text-muted-foreground">Sign in to claim your identity</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Pinned", value: "0", icon: Pin },
            { label: "Reactions", value: "0", icon: () => <span>🔥</span> },
            { label: "Groups", value: "0", icon: Settings },
          ].map((stat) => (
            <div key={stat.label} className="bg-paper rounded-md p-4 text-center shadow-sm">
              <p className="font-handwritten text-3xl text-ink">{stat.value}</p>
              <p className="font-body text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        <a
          href="/auth"
          className="block text-center py-3 bg-primary text-primary-foreground rounded-md font-body text-sm hover:bg-primary/90 transition-colors shadow-md"
        >
          Sign in to get started
        </a>
      </div>
    </div>
  );
}
