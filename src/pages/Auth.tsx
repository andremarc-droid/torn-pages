import { useAuth } from "@/contexts/AuthContext";
import { sendVerificationEmailLink, signIn, signUp } from "@/integrations/firebase";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Logo from "@/components/Logo";

type AuthMode = "login" | "signup";
type SignUpStep = "form" | "verify";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Verification step state
  const [signUpStep, setSignUpStep] = useState<SignUpStep>("form");

  const navigate = useNavigate();
  const { user } = useAuth();

  // If user is already signed in (and verified), redirect to the main wall
  useEffect(() => {
    // If the user's email is verified, send them to the wall.
    // If we just signed them up, they will briefly be logged in but unverified.
    // The UX here is minimal. For now, if they are signed in, send to wall. 
    // Wait, if they just signed up, we don't want to redirect until they've read the verify screen.
    // Let's only auto-redirect if mode === "login" and user exists.
    if (user && user.emailVerified && mode === "login") {
      navigate("/wall", { replace: true });
    }
  }, [user, navigate, mode]);

  // ─── Login handler ─────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const userCredential = await signIn(email, password);
      // Optional: Prevent unverified users from logging in
      // if (!userCredential.emailVerified) {
      //   setError("Please verify your email before logging in.");
      //   await logOut();
      //   return;
      // }
      navigate("/wall", { replace: true });
    } catch (err: any) {
      const code = err?.code || "";
      if (
        code === "auth/user-not-found" ||
        code === "auth/wrong-password" ||
        code === "auth/invalid-credential"
      ) {
        setError("Invalid email or password.");
      } else {
        setError(err?.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Sign-up step 1: Create Account & Send Verification Link ───
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please fill in all required fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password should be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      // 1. Create User
      const newUser = await signUp(email, password, username || undefined);

      // 2. Send Built-in Firebase Email Verification Link
      await sendVerificationEmailLink(newUser);

      // 3. Move to Verification Success Screen
      setSignUpStep("verify");
    } catch (err: any) {
      console.error("Failed to sign up:", err);
      const code = err?.code || "";
      if (code === "auth/email-already-in-use") {
        setError("This email is already in use.");
      } else if (code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else {
        setError(err?.message || "Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Logo className="h-10" />
          <span className="font-handwritten text-3xl font-bold text-foreground">
            Notes &amp; Ears
          </span>
        </div>
        <AnimatePresence mode="wait">
          {/* ─── Login Form ─────────────────────────────── */}
          {mode === "login" && (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 20, rotate: -1 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-paper p-8 pb-12 shadow-xl torn-edge-bottom relative"
            >
              <Thumbtack />

              <h2 className="font-handwritten text-4xl text-center text-ink mb-1 mt-2">
                Welcome back
              </h2>
              <p className="font-body text-sm text-ink-light text-center mb-6">
                Your torn pages are waiting.
              </p>

              {error && <ErrorBanner message={error} />}

              <form className="space-y-4 relative z-10" onSubmit={handleLogin}>
                <EmailInput value={email} onChange={setEmail} />
                <PasswordInput
                  value={password}
                  onChange={setPassword}
                  show={showPassword}
                  onToggle={() => setShowPassword(!showPassword)}
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-md font-body text-sm font-medium hover:bg-primary/90 transition-colors shadow-md disabled:opacity-60"
                >
                  {loading ? "Please wait..." : "Sign In"}
                </button>
              </form>

              <div className="mt-4 text-center relative z-10">
                <button
                  onClick={() => {
                    setMode("signup");
                    setSignUpStep("form");
                    setError(null);
                  }}
                  className="font-body text-sm text-ink-light hover:text-primary transition-colors"
                >
                  Don't have an account? Sign up
                </button>
              </div>

              <BackToHome />
            </motion.div>
          )}

          {/* ─── Sign-up Step 1: Form ───────────────────── */}
          {mode === "signup" && signUpStep === "form" && (
            <motion.div
              key="signup-form"
              initial={{ opacity: 0, y: 20, rotate: -1 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-paper p-8 pb-12 shadow-xl torn-edge-bottom relative"
            >
              <Thumbtack />

              <h2 className="font-handwritten text-4xl text-center text-ink mb-1 mt-2">
                Join the wall
              </h2>
              <p className="font-body text-sm text-ink-light text-center mb-6">
                Start tearing out your thoughts.
              </p>

              {error && <ErrorBanner message={error} />}

              <form className="space-y-4 relative z-10" onSubmit={handleSignUp}>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-light" />
                  <input
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-paper-dark border border-border rounded-md font-body text-sm text-ink placeholder:text-ink-light/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <EmailInput value={email} onChange={setEmail} />
                <PasswordInput
                  value={password}
                  onChange={setPassword}
                  show={showPassword}
                  onToggle={() => setShowPassword(!showPassword)}
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-md font-body text-sm font-medium hover:bg-primary/90 transition-colors shadow-md disabled:opacity-60"
                >
                  {loading ? "Creating account..." : "Sign Up"}
                </button>
              </form>

              <div className="mt-4 text-center relative z-10">
                <button
                  onClick={() => {
                    setMode("login");
                    setError(null);
                  }}
                  className="font-body text-sm text-ink-light hover:text-primary transition-colors"
                >
                  Already have an account? Sign in
                </button>
              </div>

              <BackToHome />
            </motion.div>
          )}

          {/* ─── Sign-up Step 2: Verification Success ───────────── */}
          {mode === "signup" && signUpStep === "verify" && (
            <motion.div
              key="signup-verify"
              initial={{ opacity: 0, y: 20, rotate: -1 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-paper p-8 pb-12 shadow-xl torn-edge-bottom relative"
            >
              <Thumbtack />

              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center py-4 relative z-10"
              >
                <CheckCircle2 className="w-16 h-16 text-primary mb-4" />
                <h2 className="font-handwritten text-3xl text-center text-ink mb-2">Check your email</h2>
                <p className="font-body text-sm text-ink-light text-center mb-6">
                  We've sent a verification link to <strong className="text-ink">{email}</strong>.
                  Please click the link in your email to verify your account.
                </p>

                <button
                  onClick={() => {
                    setMode("login");
                    setSignUpStep("form");
                    setEmail("");
                    setPassword("");
                  }}
                  className="w-full py-3 bg-secondary text-secondary-foreground rounded-md font-body text-sm font-medium hover:bg-secondary/90 transition-colors shadow-md"
                >
                  Go to Login
                </button>
              </motion.div>

              <BackToHome />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Shared sub-components ───────────────────────────────────

function Thumbtack() {
  return (
    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-5 z-20">
      <div
        className="w-5 h-5 rounded-full mx-auto shadow-sm"
        style={{ background: "radial-gradient(circle at 35% 35%, hsl(0 80% 60%), hsl(0 70% 38%))" }}
      />
    </div>
  );
}

function BackToHome() {
  return (
    <div className="mt-6 pt-4 border-t border-border relative z-10">
      <a
        href="/"
        className="block text-center font-body text-sm text-ink-light hover:text-ink transition-colors"
      >
        ← Back to home
      </a>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 px-4 py-3 bg-destructive/10 text-destructive text-sm font-body rounded-md relative z-10"
    >
      {message}
    </motion.div>
  );
}

function EmailInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-light" />
      <input
        type="email"
        placeholder="Email address"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="w-full pl-10 pr-4 py-3 bg-paper-dark border border-border rounded-md font-body text-sm text-ink placeholder:text-ink-light/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
    </div>
  );
}

function PasswordInput({
  value,
  onChange,
  show,
  onToggle,
}: {
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-light" />
      <input
        type={show ? "text" : "password"}
        placeholder="Password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="w-full pl-10 pr-10 py-3 bg-paper-dark border border-border rounded-md font-body text-sm text-ink placeholder:text-ink-light/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-light hover:text-ink transition-colors"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}
