import type { CSSProperties } from 'react'
import './AnimatedCatLogo.css'

const SPRITE_URL = `${import.meta.env.BASE_URL}assets/title/spritesheet.webp`

type AnimatedCatLogoProps = {
  className?: string
  ariaLabel?: string
  style?: CSSProperties
}

export function AnimatedCatLogo({
  className = '',
  ariaLabel = 'Pixel art cat with shining glasses',
  style,
}: AnimatedCatLogoProps) {
  const mergedStyle = {
    ['--cat-logo-sprite' as string]: `url("${SPRITE_URL}")`,
    ...style,
  } as CSSProperties
  return (
    <div
      className={`animated-cat-logo ${className}`.trim()}
      role="img"
      aria-label={ariaLabel}
      style={mergedStyle}
    />
  )
}
