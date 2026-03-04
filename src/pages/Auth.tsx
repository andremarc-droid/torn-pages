import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";

export default function Auth() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Paper card */}
        <motion.div
          initial={{ opacity: 0, y: 20, rotate: -1 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          className="bg-paper p-8 shadow-xl torn-edge-bottom relative"
        >
          {/* Thumbtack */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-5 z-10">
            <div className="w-5 h-5 rounded-full mx-auto"
              style={{ background: "radial-gradient(circle at 35% 35%, hsl(0 80% 60%), hsl(0 70% 38%))" }}
            />
          </div>

          <h2 className="font-handwritten text-4xl text-center text-ink mb-1 mt-2">
            {mode === "login" ? "Welcome back" : "Join the wall"}
          </h2>
          <p className="font-body text-sm text-ink-light text-center mb-6">
            {mode === "login"
              ? "Your torn pages are waiting."
              : "Start tearing out your thoughts."}
          </p>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            {mode === "signup" && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-light" />
                <input
                  type="text"
                  placeholder="Choose a username"
                  className="w-full pl-10 pr-4 py-3 bg-paper-dark border border-border rounded-md font-body text-sm text-ink placeholder:text-ink-light/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-light" />
              <input
                type="email"
                placeholder="Email address"
                className="w-full pl-10 pr-4 py-3 bg-paper-dark border border-border rounded-md font-body text-sm text-ink placeholder:text-ink-light/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-light" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="w-full pl-10 pr-10 py-3 bg-paper-dark border border-border rounded-md font-body text-sm text-ink placeholder:text-ink-light/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-light hover:text-ink"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-primary text-primary-foreground rounded-md font-body text-sm font-medium hover:bg-primary/90 transition-colors shadow-md"
            >
              {mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="font-body text-sm text-ink-light hover:text-primary transition-colors"
            >
              {mode === "login"
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <a
              href="/"
              className="block text-center font-body text-sm text-ink-light hover:text-ink transition-colors"
            >
              Continue as guest →
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
