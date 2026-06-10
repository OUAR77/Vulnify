"use client"

import { motion } from "framer-motion"
import { ReactNode } from "react"

const motionTags = {
  div: motion.div,
  p: motion.p,
  span: motion.span,
  section: motion.section,
  article: motion.article,
} as const

interface TimelineContentProps {
  children: ReactNode
  as?: keyof typeof motionTags
  animationNum: number
  timelineRef: React.RefObject<HTMLElement | null>
  customVariants: {
    visible: (i: number) => Record<string, unknown>
    hidden: Record<string, unknown>
  }
  className?: string
}

export function TimelineContent({
  children,
  as = "div",
  animationNum,
  customVariants,
  className,
}: TimelineContentProps) {
  const MotionTag = motionTags[as]

  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={customVariants}
      custom={animationNum}
    >
      {children}
    </MotionTag>
  )
}
