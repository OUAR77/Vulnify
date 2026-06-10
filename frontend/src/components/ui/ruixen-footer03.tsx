"use client"

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Globe, Bot, Zap } from "lucide-react";

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
    <footer className="flex flex-col relative items-center justify-center border-t border-white/[0.04] pt-16 pb-8 px-6 lg:px-8 w-full max-w-6xl mx-auto lg:pt-32">
      <div className="grid gap-8 xl:grid-cols-3 xl:gap-8 w-full">
        <Container>
          <div className="flex flex-col items-start justify-start md:max-w-[200px]">
            <div className="flex items-center gap-2">
              <div className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <Zap className="size-5 text-white/70" />
              </div>
            </div>
            <p className="text-zinc-500 mt-4 text-sm text-start">
              Desarrollo web e inteligencia artificial para impulsar tu negocio.
            </p>
          </div>
        </Container>

        <div className="grid-cols-2 gap-8 grid mt-16 xl:col-span-2 xl:mt-0">
          <div className="md:grid md:grid-cols-2 md:gap-8">
            <Container delay={0.1} className="h-auto">
              <h3 className="text-base font-normal text-zinc-300">
                Servicios
              </h3>
              <ul className="mt-4 text-sm text-zinc-600 space-y-4">
                <li className="mt-2">
                  <a href="#servicios" className="hover:text-zinc-300 transition-all duration-300">
                    Desarrollo Web
                  </a>
                </li>
                <li className="mt-2">
                  <a href="#servicios" className="hover:text-zinc-300 transition-all duration-300">
                    Integraciones IA
                  </a>
                </li>
                <li className="mt-2">
                  <a href="#servicios" className="hover:text-zinc-300 transition-all duration-300">
                    APIs & Backend
                  </a>
                </li>
                <li className="mt-2">
                  <a href="#servicios" className="hover:text-zinc-300 transition-all duration-300">
                    Consultoría Digital
                  </a>
                </li>
              </ul>
            </Container>
            <Container delay={0.2} className="h-auto">
              <div className="mt-10 md:mt-0 flex flex-col">
                <h3 className="text-base font-normal text-zinc-300">
                  Proceso
                </h3>
                <ul className="mt-4 text-sm text-zinc-600 space-y-4">
                  <li>
                    <a href="#proceso" className="hover:text-zinc-300 transition-all duration-300">
                      Planificación
                    </a>
                  </li>
                  <li className="mt-2">
                    <a href="#proceso" className="hover:text-zinc-300 transition-all duration-300">
                      Diseño UI/UX
                    </a>
                  </li>
                  <li className="mt-2">
                    <a href="#proceso" className="hover:text-zinc-300 transition-all duration-300">
                      Desarrollo Web
                    </a>
                  </li>
                  <li className="mt-2">
                    <a href="#proceso" className="hover:text-zinc-300 transition-all duration-300">
                      Integración IA
                    </a>
                  </li>
                  <li className="mt-2">
                    <a href="#proceso" className="hover:text-zinc-300 transition-all duration-300">
                      Lanzamiento
                    </a>
                  </li>
                </ul>
              </div>
            </Container>
          </div>
          <div className="md:grid md:grid-cols-2 md:gap-8">
            <Container delay={0.3} className="h-auto">
              <h3 className="text-base font-normal text-zinc-300">
                Recursos
              </h3>
              <ul className="mt-4 text-sm text-zinc-600 space-y-4">
                <li className="mt-2">
                  <a href="#" className="hover:text-zinc-300 transition-all duration-300">
                    Blog
                  </a>
                </li>
                <li className="mt-2">
                  <a href="#" className="hover:text-zinc-300 transition-all duration-300">
                    Casos de Éxito
                  </a>
                </li>
                <li className="mt-2">
                  <a href="#" className="hover:text-zinc-300 transition-all duration-300">
                    FAQ
                  </a>
                </li>
              </ul>
            </Container>
            <Container delay={0.4} className="h-auto">
              <div className="mt-10 md:mt-0 flex flex-col">
                <h3 className="text-base font-normal text-zinc-300">
                  Contacto
                </h3>
                <ul className="mt-4 text-sm text-zinc-600 space-y-4">
                  <li>
                    <a href="mailto:hola@vulnify.es" className="hover:text-zinc-300 transition-all duration-300">
                      hola@vulnify.es
                    </a>
                  </li>
                  <li className="mt-2">
                    <a href="#" className="hover:text-zinc-300 transition-all duration-300">
                      Twitter / X
                    </a>
                  </li>
                  <li className="mt-2">
                    <a href="#" className="hover:text-zinc-300 transition-all duration-300">
                      LinkedIn
                    </a>
                  </li>
                </ul>
              </div>
            </Container>
          </div>
        </div>
      </div>

      <Container delay={0.5} className="w-full relative mt-12 lg:mt-20">
        <div className="mt-8 md:flex md:items-center justify-center w-full">
          <p className="text-sm text-zinc-600 mt-8 md:mt-0">
            &copy; {new Date().getFullYear()} Vulnify.
          </p>
        </div>
      </Container>
    </footer>
  );
}
