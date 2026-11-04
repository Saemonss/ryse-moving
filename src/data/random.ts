/*
 * Hasard « reproductible » : avec la même graine, on obtient toujours les mêmes valeurs.
 * C'est ce qui garantit que la réinitialisation redonne exactement le même jeu de départ.
 */
export function createRandom(seed: number) {
  let a = seed >>> 0
  const next = () => {
    // mulberry32
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1))
  function pick<T>(list: readonly T[]): T {
    const item = list[Math.floor(next() * list.length)]
    if (item === undefined) throw new Error('pick: liste vide')
    return item
  }
  return { next, int, pick }
}

export type Random = ReturnType<typeof createRandom>
