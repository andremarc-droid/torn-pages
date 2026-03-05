import { useAuth } from "@/contexts/AuthContext";
import { setUserProfile } from "@/integrations/firebase/firestore";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BookMarked, Check, MessageSquarePlus, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

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

const steps = [
    {
        id: "welcome",
        icon: <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />,
        title: "Welcome to Torn Pages",
        description: "A digital space to rip out your thoughts and pin them for the world to see.",
        buttonText: "Show me how",
    },
    {
        id: "wall",
        icon: <MessageSquarePlus className="w-12 h-12 text-primary mx-auto mb-4" />,
        title: "The Wall",
        description: "Write notes and pin them to the public wall. Reply to others and react to thoughts that resonate. It's a living, breathing canvas.",
        buttonText: "Next",
    },
    {
        id: "book",
        icon: <BookMarked className="w-12 h-12 text-primary mx-auto mb-4" />,
        title: "My Book",
        description: "Found a note you love? Tear it off the wall and keep it in your personal book before it gets lost in the noise.",
        buttonText: "Continue to the wall",
    }
];

export default function Onboarding() {
    const { user, userProfile, markOnboardingComplete } = useAuth();
    const navigate = useNavigate();
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isFinishing, setIsFinishing] = useState(false);

    const finishOnboarding = useCallback(async () => {
        if (!user) return;
        setIsFinishing(true);
        try {
            await setUserProfile(user.uid, { hasCompletedOnboarding: true });
            markOnboardingComplete();
            navigate("/wall", { replace: true, state: { fromOnboarding: true } });
            toast.success("Welcome aboard!");
        } catch (error) {
            console.error("Error completing onboarding:", error);
            toast.error("Something went wrong. Please try again.");
            setIsFinishing(false);
        }
    }, [navigate, user]);

    const handleNext = useCallback(async () => {
        if (isFinishing) return;
        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex((prev) => prev + 1);
        } else {
            await finishOnboarding();
        }
    }, [currentStepIndex, finishOnboarding, isFinishing]);

    const handlePrev = useCallback(() => {
        if (isFinishing) return;
        setCurrentStepIndex((prev) => (prev > 0 ? prev - 1 : prev));
    }, [isFinishing]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Enter") {
                event.preventDefault();
                // Advance just like a swipe or button press
                void handleNext();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [handleNext]);

    const currentStep = steps[currentStepIndex];

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 relative overflow-hidden bg-background">
            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
                <div className="absolute top-20 left-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl mix-blend-multiply" />
                <div className="absolute bottom-20 right-10 w-80 h-80 bg-secondary/20 rounded-full blur-3xl mix-blend-multiply" />
            </div>

            <div className="w-full max-w-md relative z-10">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep.id}
                        initial={{ opacity: 0, x: 20, rotate: 1 }}
                        animate={{ opacity: 1, x: 0, rotate: 0 }}
                        exit={{ opacity: 0, x: -20, rotate: -1 }}
                        transition={{ duration: 0.3 }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.2}
                        onDragEnd={async (_event, info) => {
                            const threshold = 80;
                            if (info.offset.x < -threshold) {
                                await handleNext();
                            } else if (info.offset.x > threshold) {
                                handlePrev();
                            }
                        }}
                        whileDrag={{ scale: 0.98 }}
                        className="bg-paper p-8 pb-10 shadow-xl torn-edge-bottom relative"
                    >
                        <Thumbtack />

                        <div className="mt-6 mb-8 text-center min-h-[220px] flex flex-col justify-center">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.1, duration: 0.4 }}
                            >
                                {currentStep.icon}
                            </motion.div>
                            <h2 className="font-handwritten text-4xl text-ink mb-4">
                                {currentStep.title}
                            </h2>
                            <p className="font-body text-base text-ink-light leading-relaxed">
                                {currentStep.description}
                            </p>
                        </div>

                        <div className="flex flex-col items-center space-y-4">
                            {/* Step Indicators */}
                            <div className="flex gap-2 mb-2">
                                {steps.map((step, idx) => (
                                    <div
                                        key={step.id}
                                        className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStepIndex
                                            ? "w-6 bg-primary"
                                            : idx < currentStepIndex
                                                ? "w-2 bg-primary/40"
                                                : "w-2 bg-border"
                                            }`}
                                    />
                                ))}
                            </div>

                            <button
                                onClick={handleNext}
                                disabled={isFinishing}
                                className="w-full py-3.5 bg-primary text-primary-foreground rounded-md font-body text-base font-medium hover:bg-primary/90 transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-2 group disabled:opacity-70 disabled:active:scale-100"
                            >
                                {isFinishing ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        {currentStep.buttonText}
                                        {currentStepIndex < steps.length - 1 ? (
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        ) : (
                                            <Check className="w-4 h-4" />
                                        )}
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
