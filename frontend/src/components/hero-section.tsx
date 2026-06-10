import { Spotlight } from "@/components/ui/spotlight"

export function HeroSection() {
  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill="white"
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)]" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-neutral-500 mb-6">
          Desarrollo Web & Inteligencia Artificial
        </p>
        <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-500 leading-[1.1] max-w-4xl">
          Creamos tu web<br />
          <span className="bg-gradient-to-r from-neutral-100 via-white to-neutral-300 bg-clip-text text-transparent">
            con inteligencia artificial
          </span>
        </h1>
        <p className="mt-6 text-neutral-400 max-w-xl text-lg leading-relaxed">
          Transformamos tu negocio con sitios web modernos e integraciones de IA
          que automatizan procesos, mejoran la experiencia de usuario y aumentan tus ventas.
        </p>
        <div className="flex gap-4 mt-10">
          <a href="#" className="inline-flex h-12 items-center justify-center rounded-md bg-white px-8 text-sm font-medium text-black transition-all hover:bg-neutral-200 hover:scale-105">
            Solicitar presupuesto
          </a>
          <a href="#" className="inline-flex h-12 items-center justify-center rounded-md border border-neutral-700 px-8 text-sm font-medium text-neutral-300 transition-all hover:bg-neutral-800 hover:scale-105">
            Ver proyectos
          </a>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="w-6 h-10 border-2 border-neutral-600 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-neutral-400 rounded-full mt-2 animate-bounce" />
        </div>
      </div>
    </div>
  )
}
