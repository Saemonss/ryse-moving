/*
 * Connexion simple : le chauffeur touche son nom, puis tape son code à 4 chiffres. Pas de mot de passe.
 */
import { useEffect, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { useI18n } from '../../i18n'
import { useDemo } from '../../store/demoStore'
import { fullName } from '../../data/selectors'
import { Avatar } from '../../ui/Avatar'
import { Keypad, PhoneScreen } from '../../ui/phone/PhoneKit'

const DEMO_PIN = '1234'

export function LoginScreen() {
  const { t } = useI18n()
  const data = useDemo((s) => s.data)
  const login = useDemo((s) => s.login)
  const [who, setWho] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [wrong, setWrong] = useState(false)
  // Un téléphone par équipe : celui du chef d'équipe (évite deux relevés pour le même déménagement)
  const drivers = data.staff.filter((s) => data.teams.some((tm) => tm.leaderId === s.id))
  const person = drivers.find((d) => d.id === who)

  useEffect(() => {
    if (code.length < 4 || !who) return
    if (code === DEMO_PIN) login(who)
    else {
      setWrong(true)
      setCode('')
    }
  }, [code, who, login])

  if (!person)
    return (
      <PhoneScreen now={t('terrain.now.login')} title={t('terrain.login.title')}>
        <ul className="space-y-2">
          {drivers.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => {
                  setWho(d.id)
                  setCode('')
                  setWrong(false)
                }}
                className="flex min-h-16 w-full items-center gap-3 rounded-2xl bg-white px-4 py-2 text-left shadow-card ring-1 ring-line active:scale-[0.98]"
              >
                <Avatar name={fullName(d)} size={44} />
                <span className="flex-1">
                  <span className="block text-[18px] font-semibold">{fullName(d)}</span>
                  <span className="block text-[15px] text-muted">{t(`roles.${d.role}.${d.gender}`)}</span>
                </span>
                <ChevronRight size={22} className="text-subtle" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      </PhoneScreen>
    )

  return (
    <PhoneScreen now={t('terrain.now.pin')} title={t('terrain.login.pinTitle', { name: person.firstName })} onBack={() => setWho(null)}>
      <p className="text-center text-muted">{t('terrain.login.pinSubtitle')}</p>
      <div className={`flex justify-center gap-3 ${wrong ? 'animate-[rm-shake_300ms_ease-out]' : ''}`} aria-live="polite" aria-label={`${code.length} / 4`}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`size-5 rounded-full ${i < code.length ? 'bg-accent' : 'bg-surface-2 ring-1 ring-line'}`} />
        ))}
      </div>
      {wrong && <p className="text-center font-semibold text-danger">{t('terrain.login.pinWrong')}</p>}
      <Keypad
        value={code}
        maxLength={4}
        onChange={(v) => {
          setWrong(false)
          setCode(v)
        }}
      />
      <p className="text-center text-[15px] text-muted">{t('terrain.login.pinHint')}</p>
    </PhoneScreen>
  )
}
