/*
 * Messages de confirmation (« Photo enregistrée »). Appel : toast('Texte', 'success').
 * Ils s'affichent en bas au centre et disparaissent seuls après 4 secondes.
 */
import { create } from 'zustand'
import { CircleCheck, Info } from 'lucide-react'

interface ToastItem {
  id: number
  message: string
  tone: 'success' | 'info'
}

interface ToastState {
  items: ToastItem[]
  push: (message: string, tone: ToastItem['tone']) => void
  remove: (id: number) => void
}

let nextId = 1

const useToasts = create<ToastState>()((set) => ({
  items: [],
  push: (message, tone) => {
    const id = nextId++
    set((s) => ({ items: [...s.items.slice(-2), { id, message, tone }] }))
    window.setTimeout(() => set((s) => ({ items: s.items.filter((i) => i.id !== id) })), 4000)
  },
  remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
}))

export function toast(message: string, tone: ToastItem['tone'] = 'success') {
  useToasts.getState().push(message, tone)
}

export function Toaster() {
  const items = useToasts((s) => s.items)
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2 px-4">
      {items.map((item) => {
        const Icon = item.tone === 'success' ? CircleCheck : Info
        return (
          <div
            key={item.id}
            data-toast
            className="flex max-w-md items-center gap-2.5 rounded-xl bg-ink px-4 py-3 text-[15px] font-medium text-white shadow-float animate-[rm-fade-up_200ms_var(--ease-out)]"
          >
            <Icon size={18} className={item.tone === 'success' ? 'text-[#5fd3a0]' : 'text-accent-on-dark'} aria-hidden="true" />
            {item.message}
          </div>
        )
      })}
    </div>
  )
}
