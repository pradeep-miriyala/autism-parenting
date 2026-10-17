// One picture for the thinking games: a drawing from spot/art.tsx, or a plain coloured shape. Drawn in the same
// 80 x 80 box, so they can sit side by side. `scale` shrinks it inside the box (for "small").
import { ART } from './spot/art'
import { COLOURS } from './spot/generate'
import type { ShapeName } from './thinking/rounds'

const OUT = '#3B3B4F'

const SHAPE_PATH: Record<ShapeName, (fill: string) => React.ReactElement> = {
  circle: fill => <circle cx="40" cy="40" r="30" fill={fill} stroke={OUT} strokeWidth="2.5" />,
  square: fill => <rect x="11" y="11" width="58" height="58" rx="7" fill={fill} stroke={OUT} strokeWidth="2.5" strokeLinejoin="round" />,
  triangle: fill => <polygon points="40,9 71,66 9,66" fill={fill} stroke={OUT} strokeWidth="2.5" strokeLinejoin="round" />,
  star: fill => <polygon points="40,8 49,30 72,31 54,46 60,69 40,56 20,69 26,46 8,31 31,30" fill={fill} stroke={OUT} strokeWidth="2.5" strokeLinejoin="round" />,
}

export function Pic({ shape, kind, colour, scale = 1, className = 'th-pic' }: {
  shape?: ShapeName
  kind?: string
  colour?: string
  scale?: number
  className?: string
}) {
  const fill = COLOURS[colour ?? 'y'] ?? '#F5CE4F'
  const Art = kind ? ART[kind] : undefined
  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden="true">
      <g transform={scale === 1 ? undefined : `translate(40 40) scale(${scale}) translate(-40 -40)`}>
        {shape ? SHAPE_PATH[shape](fill) : Art ? <Art c={fill} /> : null}
      </g>
    </svg>
  )
}
