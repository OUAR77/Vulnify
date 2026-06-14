"use client";

import { motion } from "framer-motion";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import { ArrowUpRight } from "lucide-react";

export function BackgroundPaths({
    title = "Background Paths",
    onAboutOpen,
}: {
    title?: string;
    onAboutOpen?: () => void;
}) {
    const words = title.split(" ");

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
            <div className="relative z-10 mx-auto max-w-6xl px-6 md:px-12 lg:px-20 text-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 2 }}
                    className="max-w-4xl mx-auto"
                >
                    <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold mb-8 tracking-tighter">
                        {words.map((word, wordIndex) => (
                            <span
                                key={wordIndex}
                                className="inline-block mr-4 last:mr-0"
                            >
                                {word.split("").map((letter, letterIndex) => (
                                    <motion.span
                                        key={`${wordIndex}-${letterIndex}`}
                                        initial={{ y: 100, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{
                                            delay:
                                                wordIndex * 0.1 +
                                                letterIndex * 0.03,
                                            type: "spring",
                                            stiffness: 150,
                                            damping: 25,
                                        }}
                                        className="inline-block text-white"
                                    >
                                        {letter}
                                    </motion.span>
                                ))}
                            </span>
                        ))}
                    </h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.4, duration: 0.6 }}
                        className="text-lg md:text-xl text-zinc-500 max-w-xl mx-auto leading-relaxed mb-10"
                    >
                        No construimos páginas. Diseñamos ecosistemas digitales con inteligencia artificial integrada para que tu negocio crezca.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.8, duration: 0.6 }}
                    >
                        <HoverBorderGradient
                            as="a"
                            href="mailto:hola@vulnify.es"
                            className="inline-flex items-center gap-2 px-8 py-4 text-base font-medium"
                        >
                            Solicitar presupuesto <ArrowUpRight className="size-4" />
                        </HoverBorderGradient>
                        <div className="mt-6">
                            <button
                                onClick={onAboutOpen}
                                className="text-xs text-zinc-600 hover:text-white transition-colors tracking-wide underline underline-offset-4 decoration-white/[0.06] hover:decoration-white/30"
                            >
                                Conócenos →
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2, duration: 0.8 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2"
            >
                <motion.div
                    animate={{ y: [0, 6, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-px h-10 bg-white/[0.06]"
                />
            </motion.div>
        </div>
    );
}
