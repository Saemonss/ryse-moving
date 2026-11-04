# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite + React + TypeScript (strict), Tailwind CSS v4, lucide-react, recharts, pdf-lib. Single page, hash routing.
100 % local: no CDN, no API, no backend, no online font (Inter Tight bundled via @fontsource-variable/inter-tight).
State in a small store persisted to localStorage, with a "Réinitialiser la démo" action. (Source: CLAUDE.md.)

## Users

- **Presenter (primary operator):** Ryan, RySe Studio. Runs the demo himself on his laptop during a sales meeting,
  browsing freely according to the prospect's interest. The prospect watches; they do not operate it alone.
- **Prospect (primary audience):** owner/manager of a moving company in Belgium or France, from a 2-truck craftsman to
  a 20+ truck company. Often uncomfortable with technology. Must think "this is exactly what I need" within 15 minutes.
- **Roles portrayed in the demo:** gérant (manager), planificateur (planner), chauffeur/déménageur (driver/mover,
  often reluctant with tech, works on a phone in the field), commercial (sales), client (end customer, on a
  smartphone), comptabilité (accounting).

## Product Purpose

A sales demonstration of what RySe Studio builds: a "RySe Moving" base for moving companies, later adapted to each
company and integrated with its tools (ERP, accounting). The demo follows the life of one move, from quote to
invoice: request → quote → planning → field execution → documents → invoice → margin. Success = the prospect signs.

## Positioning

Not an off-the-shelf SaaS: a base built by an AI & ERP integration agency, adapted to the prospect's company and
connected to the software they already use. Every screen speaks the moving trade's vocabulary.

## Operating Context

- Shown live on a laptop screen, often with Wi-Fi off. Must never crash, show an empty screen, a visible error or a
  dead button.
- Driver and client views are shown inside a phone frame centered on the laptop screen (decision: client view uses the
  phone frame too).
- Presenter shortcuts: 1–6 switch view, L switches language, Ctrl+Shift+R resets the demo (with confirmation).
- Business scope of the fictional company: private, business and office moves; international Belgium ↔ France (CMR);
  storage (garde-meuble); furniture lift (monte-meubles); packing; clearance (débarras).
- A discreet "Démo – données fictives" banner is always visible.

## Capabilities and Constraints

- Languages: French (source, formatted fr-BE) and Dutch (standard, formal "u", formatted nl-BE). No fr-FR option.
  Dutch texts are flagged for review by a native speaker.
- All data is fictional and generated relative to today's date, so the demo is always current.
- All "AI" features are simulated: prepared results after a 0.8–2 s delay with a processing animation. No API call.
- Every visible control does something credible; unfinished features are never shown (no disabled or "coming soon").
- `npm run check` (Playwright) clicks every visible control in every view and language and must be fully green.

## Brand Commitments

- Name: **RySe Moving**. Wordmark "RySe" (bold) + "Moving" (light, violet gradient). Logo: three rising bars, redrawn
  as inline SVG. References: `assets/logo-clair.png`, `assets/logo-sombre.png`.
- Single typeface: Inter Tight (300–700).
- Palette tokens are fixed in CLAUDE.md (ink #0b1026, accent #5b3bea, etc.), plus sober status colors.
- Voice: expert, accessible, very simple. Trade vocabulary a small-business owner understands. No IT jargon.
- No "generic AI" clichés: no violet gradients everywhere, no emojis, no identical card grids.

## Evidence on Hand

Only the two logo files. RySe Studio has no customers, testimonials, certifications or statistics to show: none may be
invented. Gains shown by any calculator are estimates computed from the prospect's own figures and visible, editable
assumptions.

## Product Principles

1. Simplicity first: every screen is understood without explanation.
2. Driver view passes the test "a reluctant driver completes the day without help": one main action per screen,
   ≥ 56 px buttons with icon and word, ≥ 17 px text, "Maintenant : …" always visible, progress shown, back always
   possible, reassuring confirmation after each action.
3. Manager view uses progressive disclosure: 4–5 key facts on the home screen; alerts say what to do.
4. One color = one meaning, consistently.
5. Credibility over flash: realistic data, zero dead buttons, sober and fast motion (it is a work tool).

## Accessibility & Inclusion

WCAG AA contrast minimum, full keyboard navigation, `prefers-reduced-motion` respected. Large touch targets and text in
the driver and client views. Robust to long Dutch strings and 200 % zoom.
