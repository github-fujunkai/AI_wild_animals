import type { ReactNode } from 'react'

type PageToolbarProps = {
  title: string
  description: string
  actions?: ReactNode
}

export function PageToolbar({ title, description, actions }: PageToolbarProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm xl:flex-row xl:items-center xl:justify-between">
      <div>
        <h2 className="text-2xl font-semibold text-slate-50">{title}</h2>
        <p className="mt-1 text-sm text-slate-400">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  )
}
