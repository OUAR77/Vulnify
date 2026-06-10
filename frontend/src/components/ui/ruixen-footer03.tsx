"use client"

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

interface Props {
    className?: string;
    children: React.ReactNode;
    delay?: number;
    reverse?: boolean;
    simple?: boolean;
}

const Container = ({ children, className, delay = 0.2, reverse, simple }: Props) => {
    return (
        <motion.div
            className={cn("w-full h-full", className)}
            initial={{ opacity: 0, y: reverse ? -20 : 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: delay, duration: simple ? 0.2 : 0.4, type: simple ? "keyframes" : "spring", stiffness: simple && 100 }}
        >
            {children}
        </motion.div>
    )
};

export default function Footer_03() {
  return (
    <footer className="flex flex-col relative items-center justify-center border-t border-white/[0.04] pt-16 pb-8 px-6 w-full lg:pt-32">
      <div className="flex flex-col items-center w-full max-w-5xl">
        <Container className="flex flex-col items-center mb-12 lg:mb-16">
          <div className="size-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
            <Zap className="size-6 text-white/70" />
          </div>
          <p className="text-zinc-500 text-sm text-center max-w-xs">
            Desarrollo web e inteligencia artificial para impulsar tu negocio.
          </p>
        </Container>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full">
          <Container delay={0.1} className="flex flex-col items-center text-center">
            <h3 className="text-sm font-semibold text-zinc-300 tracking-widest uppercase">Servicios</h3>
            <ul className="mt-5 text-sm text-zinc-600 space-y-3">
              <li><a href="#servicios" className="hover:text-zinc-300 transition-all duration-300">Desarrollo Web</a></li>
              <li><a href="#servicios" className="hover:text-zinc-300 transition-all duration-300">Integraciones IA</a></li>
              <li><a href="#servicios" className="hover:text-zinc-300 transition-all duration-300">APIs & Backend</a></li>
              <li><a href="#servicios" className="hover:text-zinc-300 transition-all duration-300">Consultoría</a></li>
            </ul>
          </Container>

          <Container delay={0.2} className="flex flex-col items-center text-center">
            <h3 className="text-sm font-semibold text-zinc-300 tracking-widest uppercase">Proceso</h3>
            <ul className="mt-5 text-sm text-zinc-600 space-y-3">
              <li><a href="#proceso" className="hover:text-zinc-300 transition-all duration-300">Planificación</a></li>
              <li><a href="#proceso" className="hover:text-zinc-300 transition-all duration-300">Diseño UI/UX</a></li>
              <li><a href="#proceso" className="hover:text-zinc-300 transition-all duration-300">Desarrollo</a></li>
              <li><a href="#proceso" className="hover:text-zinc-300 transition-all duration-300">Lanzamiento</a></li>
            </ul>
          </Container>

          <Container delay={0.3} className="flex flex-col items-center text-center">
            <h3 className="text-sm font-semibold text-zinc-300 tracking-widest uppercase">Recursos</h3>
            <ul className="mt-5 text-sm text-zinc-600 space-y-3">
              <li><a href="#" className="hover:text-zinc-300 transition-all duration-300">Blog</a></li>
              <li><a href="#" className="hover:text-zinc-300 transition-all duration-300">Casos de Éxito</a></li>
              <li><a href="#" className="hover:text-zinc-300 transition-all duration-300">FAQ</a></li>
            </ul>
          </Container>

          <Container delay={0.4} className="flex flex-col items-center text-center">
            <h3 className="text-sm font-semibold text-zinc-300 tracking-widest uppercase">Contacto</h3>
            <ul className="mt-5 text-sm text-zinc-600 space-y-3">
              <li><a href="mailto:hola@vulnify.es" className="hover:text-zinc-300 transition-all duration-300">Email</a></li>
              <li><a href="#" className="hover:text-zinc-300 transition-all duration-300">Twitter / X</a></li>
              <li><a href="#" className="hover:text-zinc-300 transition-all duration-300">LinkedIn</a></li>
            </ul>
          </Container>
        </div>

        <Container delay={0.5} className="w-full mt-12 lg:mt-20">
          <div className="flex items-center justify-center w-full pt-8 border-t border-white/[0.04]">
            <p className="text-sm text-zinc-600">&copy; {new Date().getFullYear()} Vulnify.</p>
          </div>
        </Container>
      </div>
    </footer>
  );
}
