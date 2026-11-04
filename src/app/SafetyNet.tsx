/*
 * Filet de sécurité : si un écran plante (donnée inattendue), on recharge les données de départ et on réaffiche
 * la vue, au lieu d'un écran blanc devant le prospect. Après deux échecs de suite, un message clair s'affiche.
 */
import { Component, type ReactNode } from 'react'
import { translate, useLangStore } from '../i18n'
import { useDemo } from '../store/demoStore'

interface State {
  attempt: number
  failed: boolean
}

export class SafetyNet extends Component<{ children: ReactNode }, State> {
  state: State = { attempt: 0, failed: false }

  static getDerivedStateFromError(): Partial<State> {
    return {}
  }

  componentDidCatch() {
    if (this.state.attempt >= 2) {
      this.setState({ failed: true })
      return
    }
    useDemo.getState().resetDemo()
    this.setState((s) => ({ attempt: s.attempt + 1 }))
  }

  render() {
    if (this.state.failed) {
      const lang = useLangStore.getState().lang
      return (
        <div className="grid min-h-dvh place-items-center p-6 text-center">
          <div>
            <p className="text-lg font-semibold text-ink">{translate(lang, 'shell.crashTitle')}</p>
            <button
              type="button"
              className="mt-4 rounded-xl bg-accent px-5 py-3 font-semibold text-white"
              onClick={() => {
                useDemo.getState().resetDemo()
                this.setState({ attempt: 0, failed: false })
              }}
            >
              {translate(lang, 'shell.reset')}
            </button>
          </div>
        </div>
      )
    }
    return <div key={this.state.attempt}>{this.props.children}</div>
  }
}
