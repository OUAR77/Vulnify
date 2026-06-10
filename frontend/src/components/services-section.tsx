import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const services = [
  {
    title: "Desarrollo Web",
    desc: "Creamos páginas web corporativas, tiendas online y aplicaciones web con tecnologías modernas (React, Next.js, Tailwind).",
    icon: "🌐",
  },
  {
    title: "Integraciones IA",
    desc: "Conectamos tu negocio con inteligencia artificial: chatbots, automatizaciones, análisis predictivo y procesamiento de datos.",
    icon: "🤖",
  },
  {
    title: "APIs & Backend",
    desc: "Diseñamos e implementamos APIs robustas, paneles de administración y sistemas backend escalables en Python y Node.js.",
    icon: "⚙️",
  },
  {
    title: "Consultoría",
    desc: "Te asesoramos en la estrategia digital de tu empresa, desde la elección de tecnología hasta la implementación y mantenimiento.",
    icon: "📊",
  },
]

export function ServicesSection() {
  return (
    <section className="py-24 px-8 max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-foreground">Servicios</h2>
        <p className="mt-4 text-neutral-500 max-w-xl mx-auto">
          Todo lo que necesitas para llevar tu negocio al siguiente nivel digital.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {services.map((s) => (
          <Card key={s.title} className="bg-white border-neutral-200">
            <CardHeader>
              <span className="text-3xl">{s.icon}</span>
              <CardTitle className="text-foreground">{s.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-neutral-500 text-base">
                {s.desc}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
