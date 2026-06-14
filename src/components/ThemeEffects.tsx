import { useEffect } from 'react'

interface ThemeEffectsProps {
  theme: string
}

export default function ThemeEffects({ theme }: ThemeEffectsProps) {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('truck-theme', theme)

    const oldSakura = document.querySelector('.sakura-fall')
    const oldChocobi = document.querySelector('.chocobi-fall')
    if (oldSakura) oldSakura.remove()
    if (oldChocobi) oldChocobi.remove()

    if (theme === 'sakura') {
      const container = document.createElement('div')
      container.className = 'sakura-fall'
      document.body.appendChild(container)
      for (let i = 0; i < 15; i++) {
        const p = document.createElement('div')
        p.className = 'petal'
        p.style.left = Math.random() * 100 + '%'
        p.style.animationDuration = Math.random() * 5 + 5 + 's'
        p.style.animationDelay = Math.random() * 5 + 's'
        container.appendChild(p)
      }
    } else if (theme === 'shinchan') {
      const container = document.createElement('div')
      container.className = 'chocobi-fall'
      document.body.appendChild(container)
      for (let i = 0; i < 10; i++) {
        const s = document.createElement('div')
        s.className = 'star'
        s.style.left = Math.random() * 100 + '%'
        s.style.animationDuration = Math.random() * 4 + 4 + 's'
        s.style.animationDelay = Math.random() * 3 + 's'
        container.appendChild(s)
      }
    }
  }, [theme])

  return null
}
