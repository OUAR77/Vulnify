import { Mail, Check } from "lucide-react";
import { BorderBeam } from "@/components/ui/border-beam";

export default function PricingSection4() {
  return (
    <section id="precios" className="py-24 bg-black">
      <div className="mx-auto max-w-3xl px-4">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500 mb-3">Precios</p>
          <h2 className="text-3xl md:text-5xl font-bold text-white">Inversión transparente</h2>
          <p className="text-zinc-500 text-sm mt-2">Un solo plan, sin sorpresas</p>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 md:p-10 relative overflow-hidden">
          <BorderBeam lightWidth={300} duration={12} lightColor="#FAFAFA" borderWidth={1} />
          <div className="flex flex-col items-center text-center">
            <span className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-800/60 px-3 py-1 text-xs font-medium text-zinc-300 mb-6">
              PLAN ÚNICO
            </span>
            <h3 className="text-5xl md:text-6xl font-bold text-white mb-2">
              A medida
            </h3>
            <p className="text-zinc-500 text-sm mb-8">
              Precio personalizado según tu proyecto
            </p>
            <a
              href="mailto:hola@vulnify.es"
              className="inline-flex items-center gap-2 h-12 rounded-xl bg-white px-8 text-sm font-semibold text-black transition-all hover:bg-zinc-200 hover:scale-105 active:scale-95 mb-8"
            >
              <Mail className="size-4" />
              Solicitar presupuesto
            </a>
          </div>

          <div className="border-t border-zinc-800 pt-8">
            <p className="text-sm text-zinc-400 text-center mb-6">
              Todo lo que necesitas para tu proyecto web:
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "Web a medida con el stack que prefieras",
                "Integración de IA y chatbots",
                "Diseño UI/UX responsive",
                "Backend escalable y APIs",
                "SEO técnico y rendimiento",
                "Soporte y mantenimiento",
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                  <Check className="size-4 text-blue-400 shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-blue-500/10">
                <Mail className="size-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">¿Hablamos?</p>
                <p className="text-xs text-zinc-500">Respuesta en menos de 24h</p>
              </div>
            </div>
            <a href="mailto:hola@vulnify.es" className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors underline underline-offset-4">
              hola@vulnify.es
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
