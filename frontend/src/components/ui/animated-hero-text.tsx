import { motion } from 'framer-motion'

const words = ['CREAR', 'OPTIMIZAR', 'ESCALAR']

export function AnimatedHeroText() {
  return (
    <div className="flex flex-col leading-[0.85]">
      <motion.span
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.1, 1] }}
        className="text-[clamp(3.5rem,12vw,14rem)] font-bold uppercase tracking-tight text-white"
      >
        VULNIFY
      </motion.span>
      <div className="flex flex-wrap gap-x-[4vw]">
        {words.map((word, i) => (
          <motion.span
            key={word}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.7,
              delay: 1 + i * 0.25,
              ease: [0.25, 0.1, 0.1, 1],
            }}
            className="text-[clamp(2.5rem,8vw,10rem)] font-bold uppercase tracking-tight text-zinc-400"
          >
            {word}
          </motion.span>
        ))}
      </div>
    </div>
  )
}
