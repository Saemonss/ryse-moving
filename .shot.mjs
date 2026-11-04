import { chromium } from '@playwright/test'
for (let i = 0; i < 40; i++) { try { await fetch('http://localhost:4173/'); break } catch { await new Promise(r => setTimeout(r, 250)) } }
const b = await chromium.launch(); const [,, route, lang, name, w = '1440', h = '900'] = process.argv
const p = await (await b.newContext({ viewport: { width: +w, height: +h } })).newPage()
const errs = []; p.on('console', m => ['error','warning'].includes(m.type()) && errs.push(m.text())); p.on('pageerror', e => errs.push(e.message))
await p.goto('http://localhost:4173/'); await p.evaluate((l) => { localStorage.clear(); localStorage.setItem('ryse-moving-lang', JSON.stringify({ state: { lang: l }, version: 0 })) }, lang)
await p.goto('http://localhost:4173/#/' + route); await p.reload(); await p.waitForTimeout(500)
await p.screenshot({ path: `docs/captures/${name}.png`, fullPage: true }); console.log('errors:', errs.length ? errs : 'none'); await b.close()
