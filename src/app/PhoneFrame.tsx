/*
 * Cadre de téléphone neutre (sans marque), centré, pour les vues Chauffeur et Client.
 * À gauche, une légende pour le présentateur : à qui appartient ce téléphone.
 */
import { useEffect, useState, type ReactNode } from 'react'
import { BatteryFull, SignalHigh, Wifi } from 'lucide-react'
import { useI18n } from '../i18n'
import { fmtTime } from '../i18n/format'
import { Avatar } from '../ui/Avatar'

interface PhoneFrameProps {
  caption: string
  hint: string
  user: { name: string; role: string }
  children: ReactNode
}

export function PhoneFrame({ caption, hint, user, children }: PhoneFrameProps) {
  const { lang } = useI18n()
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center gap-14 px-6 py-6">
      <div className="hidden max-w-[260px] lg:block">
        <div className="flex items-center gap-3">
          <Avatar name={user.name} size={44} />
          <div>
            <p className="font-semibold text-ink">{user.name}</p>
            <p className="text-sm text-muted">{user.role}</p>
          </div>
        </div>
        <p className="mt-5 text-lg font-semibold leading-snug tracking-[-0.01em] text-ink text-balance">{caption}</p>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">{hint}</p>
      </div>

      <div
        data-phone
        className="relative w-[390px] shrink-0 rounded-[54px] bg-[#14182e] p-[11px] shadow-[0_40px_80px_-24px_rgb(11_16_38/0.45),0_0_0_1px_rgb(255_255_255/0.06)_inset]"
        style={{ height: 'min(820px, calc(100dvh - 7.5rem))' }}
      >
        <div className="relative flex h-full flex-col overflow-hidden rounded-[44px] bg-[#f7f6fc]">
          <div className="relative flex h-12 shrink-0 items-center justify-between px-8 pt-1 text-[15px] font-semibold text-ink">
            <span className="tabular">{fmtTime(now, lang)}</span>
            <span aria-hidden="true" className="absolute left-1/2 top-2.5 h-[30px] w-[108px] -translate-x-1/2 rounded-full bg-[#14182e]" />
            <span className="flex items-center gap-1" aria-hidden="true">
              <SignalHigh size={17} strokeWidth={2.5} />
              <Wifi size={16} strokeWidth={2.5} />
              <BatteryFull size={21} strokeWidth={2} />
            </span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none]">{children}</div>
          <div aria-hidden="true" className="flex h-7 shrink-0 items-center justify-center">
            <span className="h-[5px] w-32 rounded-full bg-ink/80" />
          </div>
        </div>
      </div>
    </div>
  )
}
