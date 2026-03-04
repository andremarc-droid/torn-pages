import { motion } from "framer-motion";
import { Plus, Users, Globe, Lock, Search } from "lucide-react";

const MOCK_GROUPS = [
  { id: 1, name: "Late Night Writers", desc: "For those who think too much after midnight.", members: 42, isPublic: true },
  { id: 2, name: "Healing Circle", desc: "A safe space to share what hurts and what heals.", members: 128, isPublic: true },
  { id: 3, name: "The Rant Room", desc: "Let it out. No judgement. Just ears.", members: 87, isPublic: true },
  { id: 4, name: "Close Friends", desc: "Private group for the inner circle.", members: 5, isPublic: false },
];

export default function Groups() {
  return (
    <div className="min-h-screen py-8 pb-24 md:pb-8">
      <div className="container px-4 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-primary" />
            <h1 className="font-handwritten text-4xl text-foreground">Groups</h1>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md font-body text-sm hover:bg-primary/90 transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            New Group
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            placeholder="Search groups..."
            className="w-full pl-10 pr-4 py-3 bg-paper border border-border rounded-md font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {/* Groups list */}
        <div className="space-y-3">
          {MOCK_GROUPS.map((group, i) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-paper p-5 rounded-md shadow-sm hover:shadow-md transition-all cursor-pointer border border-border/50"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-handwritten text-2xl text-ink">{group.name}</h3>
                    {group.isPublic ? (
                      <Globe className="w-3.5 h-3.5 text-ink-light" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-ink-light" />
                    )}
                  </div>
                  <p className="font-body text-sm text-ink-light">{group.desc}</p>
                </div>
                <span className="text-xs font-body text-muted-foreground whitespace-nowrap ml-4">
                  {group.members} members
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
