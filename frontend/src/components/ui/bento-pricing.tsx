import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckIcon, SparklesIcon } from 'lucide-react';

const features = [
  'Web a medida con React, Next.js o el stack que prefieras',
  'Integración de IA: chatbots, automatización, análisis',
  'Diseño UI/UX responsive y optimizado para conversión',
  'Backend escalable, APIs y panel de administración',
  'SEO técnico, rendimiento y accesibilidad incluidos',
  'Soporte y mantenimiento continuo',
  'Sin costes ocultos. Precio cerrado desde el inicio',
];

export function BentoPricing() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4">
      <div
        className={cn(
          'bg-[#111] border border-zinc-800 relative w-full overflow-hidden rounded-xl',
          'backdrop-blur',
        )}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="from-white/[0.03] to-transparent absolute inset-0 bg-gradient-to-b [mask-image:radial-gradient(farthest-side_at_top,white,transparent)]" />
        </div>

        <div className="flex flex-col items-center gap-4 p-6 sm:flex-row sm:p-8">
          <Badge variant="secondary">TODO INCLUIDO</Badge>
          <Badge variant="outline" className="hidden sm:flex">
            <SparklesIcon className="me-1 size-3" /> Sin sorpresas
          </Badge>
          <div className="sm:ml-auto">
            <a href="mailto:hola@vulnify.es">
              <Button className="w-full sm:w-auto">Solicitar presupuesto</Button>
            </a>
          </div>
        </div>

        <div className="flex flex-col items-start gap-6 px-6 pb-6 sm:flex-row sm:px-8 sm:pb-8">
          <div className="shrink-0">
            <span className="font-mono text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              A medida
            </span>
            <p className="text-zinc-500 text-sm mt-1">Precio personalizado según tu proyecto</p>
          </div>

          <div className="border-t border-zinc-800 pt-6 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6 sm:ml-auto">
            <p className="text-zinc-400 text-sm leading-relaxed max-w-md">
              Cada negocio es único. Cuéntanos qué necesitas y te enviaremos un presupuesto 
              transparente y sin compromiso en menos de 24h.
            </p>
          </div>
        </div>

        <ul className="grid gap-3 px-6 pb-8 text-sm sm:grid-cols-2 sm:px-8">
          {features.map((f, i) => (
            <li key={i} className="flex items-center gap-3 text-zinc-300">
              <div className="bg-white text-black rounded-full p-0.5 shrink-0">
                <CheckIcon className="size-3" strokeWidth={3} />
              </div>
              <span className="leading-relaxed">{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
