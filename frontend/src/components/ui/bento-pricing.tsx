import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Mail, Zap, Shield, Rocket, Cpu } from 'lucide-react';
import { BorderBeam } from '@/components/ui/border-beam';
import { HoverBorderGradient } from '@/components/ui/hover-border-gradient';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

const features = [
  { icon: Zap, text: 'Web a medida con el stack que prefieras' },
  { icon: Sparkles, text: 'Integración de IA, chatbots y automatización' },
  { icon: Shield, text: 'Diseño UI/UX optimizado para conversión' },
  { icon: Cpu, text: 'Backend escalable, APIs y panel admin' },
  { icon: Rocket, text: 'SEO técnico y rendimiento incluidos' },
  { icon: Mail, text: 'Soporte continuo y mantenimiento' },
];

export function BentoPricing() {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      variants={containerVariants}
      className="mx-auto w-full max-w-4xl px-4"
    >
      <div className="relative overflow-hidden rounded-2xl p-[1px] bg-gradient-to-b from-white/[0.03] to-transparent">
        <div className="relative rounded-[inherit] bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl overflow-hidden">
          <BorderBeam duration={12} lightColor="#FAFAFA" borderWidth={1} />
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-white/[0.03] blur-3xl" />
            <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-blue-500/5 blur-3xl" />
          </div>

          <div className="relative z-10 p-6 sm:p-10">
            <motion.div variants={itemVariants} className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-xs font-medium text-zinc-400">
                    <Sparkles className="mr-1.5 size-3 text-zinc-400" />
                    TODO INCLUIDO
                  </span>
                  <span className="inline-flex items-center rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-xs font-medium text-zinc-500">
                    Sin sorpresas
                  </span>
                </div>
                <h3 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Precio <span className="text-zinc-400">a medida</span>
                </h3>
                <p className="mt-2 text-sm text-zinc-500 max-w-md">
                  Cada proyecto es único. Te enviamos un presupuesto transparente y detallado sin compromiso.
                </p>
              </div>
              <HoverBorderGradient as="button" onClick={() => window.dispatchEvent(new CustomEvent('open-contact'))} className="flex items-center gap-2 px-6 py-3 text-sm font-medium">
                Solicitar presupuesto
                <Mail className="size-4" />
              </HoverBorderGradient>
            </motion.div>

            <motion.div variants={itemVariants} className="mt-8 grid gap-3 sm:grid-cols-2">
              {features.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div
                    key={i}
                    className="group flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 transition-all hover:border-white/[0.10] hover:bg-white/[0.04]"
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-zinc-500 transition-colors group-hover:bg-white/[0.08] group-hover:text-zinc-300">
                      <Icon className="size-4" />
                    </div>
                    <span className="text-sm leading-snug text-zinc-500 group-hover:text-zinc-300 transition-colors">
                      {f.text}
                    </span>
                  </div>
                );
              })}
            </motion.div>

            <motion.div variants={itemVariants} className="mt-8 flex flex-col items-start gap-4 rounded-xl border border-white/[0.04] bg-white/[0.02] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-white/[0.04]">
                  <Mail className="size-5 text-zinc-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">¿Hablamos?</p>
                  <p className="text-xs text-zinc-500">Respuesta en menos de 24h</p>
                </div>
              </div>
              <a
                href="mailto:hola@vulnify.es"
                className="text-sm font-medium text-zinc-400 hover:text-white transition-colors underline underline-offset-4"
              >
                hola@vulnify.es
              </a>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
