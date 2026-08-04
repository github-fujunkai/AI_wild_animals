import type { CSSProperties, PropsWithChildren, ReactNode } from 'react'

type SectionCardProps = PropsWithChildren<{
  title: string
  extra?: ReactNode
  className?: string
  style?: CSSProperties
}>

export function SectionCard({ title, extra, className, style, children }: SectionCardProps) {
  return (
    <section className={`rounded-2xl border border-white/[0.08] bg-[rgba(20,32,45,0.5)] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.2),0_1px_4px_rgba(0,0,0,0.1)] backdrop-blur-[12px] ${className ?? ''}`} style={style}>
      {(title || extra) && (
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-50">{title}</h3>
          {extra}
        </div>
      )}
      {children}
    </section>
  )
}
