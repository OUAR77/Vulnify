'use client'

import { SplineScene } from "@/components/ui/splite";
import { Card, CardContent } from "@/components/ui/card"
import { Spotlight } from "@/components/ui/spotlight"

export function HeroSection() {
  return (
    <Card className="w-full min-h-[600px] bg-black/[0.96] relative overflow-hidden border-none rounded-none">
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill="white"
      />

      <div className="flex h-full min-h-[600px] flex-col lg:flex-row">
        <div className="flex-1 p-8 md:p-16 relative z-10 flex flex-col justify-center">
          <p className="text-sm uppercase tracking-widest text-neutral-500 mb-4">
            Desarrollo Web & IA
          </p>
          <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 leading-tight">
            Creamos tu web <br />con inteligencia <br />artificial
          </h1>
          <p className="mt-6 text-neutral-400 max-w-lg text-lg leading-relaxed">
            Transformamos tu negocio con sitios web modernos e integraciones de IA 
            que automatizan procesos, mejoran la experiencia de usuario y aumentan tus ventas.
          </p>
          <div className="flex gap-4 mt-8">
            <a href="#" className="inline-flex h-12 items-center justify-center rounded-md bg-white px-8 text-sm font-medium text-black transition-colors hover:bg-neutral-200">
              Solicitar presupuesto
            </a>
            <a href="#" className="inline-flex h-12 items-center justify-center rounded-md border border-neutral-700 px-8 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800">
              Ver proyectos
            </a>
          </div>
        </div>

        <div className="flex-1 relative min-h-[300px] lg:min-h-full">
          <SplineScene
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
          />
        </div>
      </div>
    </Card>
  )
}
