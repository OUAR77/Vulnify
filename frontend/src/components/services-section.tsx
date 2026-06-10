const services = [
  {
    title: "Desarrollo Web",
    desc: "Creamos páginas web corporativas, tiendas online y aplicaciones web con tecnologías modernas.",
    icon: "01",
  },
  {
    title: "Integraciones IA",
    desc: "Conectamos tu negocio con inteligencia artificial: chatbots, automatizaciones y análisis predictivo.",
    icon: "02",
  },
  {
    title: "APIs & Backend",
    desc: "Diseñamos APIs robustas, paneles de administración y sistemas backend escalables.",
    icon: "03",
  },
  {
    title: "Consultoría",
    desc: "Te asesoramos en la estrategia digital de tu empresa, desde la tecnología hasta la implementación.",
    icon: "04",
  },
]

export function ServicesSection() {
  return (
    <section className="py-32 px-6 bg-[#f2f2f2]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <p className="text-sm uppercase tracking-[0.2em] text-neutral-400 mb-4">
            Servicios
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-neutral-900">
            Todo lo que necesitas
          </h2>
          <p className="mt-4 text-neutral-500 max-w-xl mx-auto text-lg">
            Soluciones completas para llevar tu negocio al siguiente nivel digital.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((s) => (
            <div key={s.title} className="group bg-white border border-neutral-200 rounded-lg p-8 transition-all hover:border-neutral-300 hover:shadow-lg">
              <span className="text-3xl font-bold text-neutral-200 group-hover:text-neutral-300 transition-colors">
                {s.icon}
              </span>
              <h3 className="text-xl font-semibold text-neutral-900 mt-4">
                {s.title}
              </h3>
              <p className="text-neutral-500 mt-3 leading-relaxed">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
