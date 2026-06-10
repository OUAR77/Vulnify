"use client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Sparkles as SparklesComp } from "@/components/ui/sparkles";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { Mail } from "lucide-react";

const plans = [
  {
    name: "Starter",
    description: "Ideal para pequeños negocios y startups que quieren despegar",
    price: "A medida",
    buttonText: "Consultar",
    buttonVariant: "outline" as const,
    includes: [
      "Web corporativa o landing page",
      "Diseño responsive",
      "Integración de formularios",
      "SEO básico",
      "Hosting incluido 1 año",
      "Soporte por email",
    ],
  },
  {
    name: "Business",
    description: "La mejor opción para empresas en crecimiento",
    price: "A medida",
    buttonText: "Consultar",
    buttonVariant: "default" as const,
    popular: true,
    includes: [
      "Web + panel de administración",
      "Integración de IA y chatbots",
      "API personalizada",
      "SEO avanzado + analíticas",
      "Hosting incluido 1 año",
      "Soporte prioritario 24/7",
    ],
  },
  {
    name: "Enterprise",
    description: "Solución completa para grandes equipos y proyectos",
    price: "A medida",
    buttonText: "Consultar",
    buttonVariant: "outline" as const,
    includes: [
      "Plataforma web completa",
      "IA, automatización y datos",
      "Arquitectura escalable",
      "Seguridad avanzada",
      "SLA garantizado",
      "Gerente de cuenta dedicado",
    ],
  },
];

export default function PricingSection4() {
  const pricingRef = useRef<HTMLDivElement>(null);

  const revealVariants = {
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        delay: i * 0.4,
        duration: 0.5,
      },
    }),
    hidden: {
      filter: "blur(10px)",
      y: -20,
      opacity: 0,
    },
  };

  return (
    <div
      className="min-h-screen mx-auto relative bg-black overflow-x-hidden"
      ref={pricingRef}
    >
      <TimelineContent
        animationNum={4}
        timelineRef={pricingRef}
        customVariants={revealVariants}
        className="absolute top-0 h-96 w-screen overflow-hidden [mask-image:radial-gradient(50%_50%,white,transparent)]"
      >
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#ffffff2c_1px,transparent_1px),linear-gradient(to_bottom,#3a3a3a01_1px,transparent_1px)] bg-[size:70px_80px]"></div>
        <SparklesComp
          density={1800}
          direction="bottom"
          speed={1}
          color="#FFFFFF"
          className="absolute inset-x-0 bottom-0 h-full w-full [mask-image:radial-gradient(50%_50%,white,transparent_85%)]"
        />
      </TimelineContent>
      <TimelineContent
        animationNum={5}
        timelineRef={pricingRef}
        customVariants={revealVariants}
        className="absolute left-0 top-[-114px] w-full h-[113.625vh] flex flex-col items-start justify-start content-start flex-none flex-nowrap gap-2.5 overflow-hidden p-0 z-0"
      >
        <div>
          <div
            className="absolute left-[-568px] right-[-568px] top-0 h-[2053px] flex-none rounded-full"
            style={{
              border: "200px solid #3131f5",
              filter: "blur(92px)",
              WebkitFilter: "blur(92px)",
            }}
          ></div>
          <div
            className="absolute left-[-568px] right-[-568px] top-0 h-[2053px] flex-none rounded-full"
            style={{
              border: "200px solid #3131f5",
              filter: "blur(92px)",
              WebkitFilter: "blur(92px)",
            }}
          ></div>
        </div>
      </TimelineContent>

      <article className="text-center mb-6 pt-32 max-w-3xl mx-auto space-y-2 relative z-50">
        <h2 className="text-4xl font-medium text-white">
          <VerticalCutReveal
            splitBy="words"
            staggerDuration={0.15}
            staggerFrom="first"
            reverse={true}
            containerClassName="justify-center"
            transition={{
              type: "spring",
              stiffness: 250,
              damping: 40,
              delay: 0,
            }}
          >
            Planes que se adaptan a ti
          </VerticalCutReveal>
        </h2>

        <TimelineContent
          as="p"
          animationNum={0}
          timelineRef={pricingRef}
          customVariants={revealVariants}
          className="text-zinc-400"
        >
          Cada proyecto es único. Todos nuestros planes incluyen presupuesto personalizado sin compromiso.
        </TimelineContent>
      </article>

      <div
        className="absolute top-0 left-[10%] right-[10%] w-[80%] h-full z-0"
        style={{
          backgroundImage: "radial-gradient(circle at center, #206ce8 0%, transparent 70%)",
          opacity: 0.6,
          mixBlendMode: "multiply",
        }}
      />

      <div className="grid md:grid-cols-3 max-w-5xl gap-4 py-6 mx-auto px-4">
        {plans.map((plan, index) => (
          <TimelineContent
            key={plan.name}
            as="div"
            animationNum={2 + index}
            timelineRef={pricingRef}
            customVariants={revealVariants}
          >
            <Card
              className={cn(
                "relative text-white border-zinc-800",
                plan.popular
                  ? "bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 shadow-[0px_-13px_300px_0px_#0900ff] z-20"
                  : "bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 z-10"
              )}
            >
              <CardHeader className="text-left">
                <div className="flex justify-between items-center">
                  <h3 className="text-3xl mb-2 font-bold">{plan.name}</h3>
                  {plan.popular && (
                    <span className="text-xs font-medium text-blue-400 border border-blue-500/30 bg-blue-500/10 px-3 py-1 rounded-full">
                      Más popular
                    </span>
                  )}
                </div>
                <div className="flex items-baseline">
                  <span className="text-4xl font-semibold text-white">
                    {plan.price}
                  </span>
                </div>
                <p className="text-sm text-zinc-400 mb-4">{plan.description}</p>
                <p className="text-xs text-zinc-500">Presupuesto personalizado sin compromiso</p>
              </CardHeader>

              <CardContent className="pt-0">
                <a
                  href="mailto:hola@vulnify.es"
                  className={cn(
                    "flex items-center justify-center gap-2 w-full mb-6 p-4 text-base rounded-xl transition-all",
                    plan.popular
                      ? "bg-gradient-to-t from-blue-500 to-blue-600 shadow-lg shadow-blue-800 border border-blue-500 text-white hover:scale-[1.02]"
                      : "bg-gradient-to-t from-zinc-950 to-zinc-700 shadow-lg shadow-zinc-900 border border-zinc-800 text-white hover:scale-[1.02]"
                  )}
                >
                  <Mail className="size-4" />
                  {plan.buttonText}
                </a>

                <div className="space-y-3 pt-4 border-t border-zinc-700">
                  <h4 className="font-medium text-sm text-zinc-300 mb-3">Incluye:</h4>
                  <ul className="space-y-2">
                    {plan.includes.map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className="flex items-center gap-2"
                      >
                        <span className="h-2 w-2 bg-zinc-500 rounded-full shrink-0"></span>
                        <span className="text-sm text-zinc-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TimelineContent>
        ))}
      </div>
    </div>
  );
}
