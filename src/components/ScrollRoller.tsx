import type { TextureId } from '../types.ts'

type ScrollRollerProps = {
  position: 'top' | 'bottom'
  className?: string
}

/** Turned-wood spindle with brass ferrules and a coiled parchment cylinder. */
export function ScrollRoller({ position, className = '' }: ScrollRollerProps) {
  const uid = `roller-${position}`
  return (
    <div
      className={`scroll-roller scroll-roller-${position} ${className}`.trim()}
      aria-hidden="true"
    >
      <svg className="scroll-roller-svg" viewBox="0 0 640 56" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`${uid}-wood`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c9a06a" />
            <stop offset="22%" stopColor="#8a5a30" />
            <stop offset="48%" stopColor="#5c3818" />
            <stop offset="55%" stopColor="#3a2210" />
            <stop offset="78%" stopColor="#8a5a30" />
            <stop offset="100%" stopColor="#b88850" />
          </linearGradient>
          <linearGradient id={`${uid}-brass`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f0d090" />
            <stop offset="40%" stopColor="#c89640" />
            <stop offset="100%" stopColor="#8a6020" />
          </linearGradient>
          <linearGradient id={`${uid}-paper`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,248,230,0.95)" />
            <stop offset="18%" stopColor="rgba(255,255,255,0.35)" />
            <stop offset="45%" stopColor="rgba(80,48,18,0.28)" />
            <stop offset="52%" stopColor="rgba(40,22,8,0.42)" />
            <stop offset="78%" stopColor="rgba(255,244,220,0.55)" />
            <stop offset="100%" stopColor="rgba(120,80,40,0.35)" />
          </linearGradient>
          <linearGradient id={`${uid}-shine`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>

        {/* Left finial */}
        <g className="scroll-finial scroll-finial-left">
          <ellipse cx="18" cy="28" rx="10" ry="14" fill={`url(#${uid}-wood)`} />
          <ellipse cx="18" cy="28" rx="6" ry="9" fill={`url(#${uid}-brass)`} opacity="0.85" />
          <rect x="26" y="18" width="10" height="20" rx="2" fill={`url(#${uid}-brass)`} />
        </g>

        {/* Right finial */}
        <g className="scroll-finial scroll-finial-right">
          <ellipse cx="622" cy="28" rx="10" ry="14" fill={`url(#${uid}-wood)`} />
          <ellipse cx="622" cy="28" rx="6" ry="9" fill={`url(#${uid}-brass)`} opacity="0.85" />
          <rect x="604" y="18" width="10" height="20" rx="2" fill={`url(#${uid}-brass)`} />
        </g>

        {/* Main cylinder body — paper-tinted via CSS fill on .scroll-roller-body */}
        <rect
          className="scroll-roller-body"
          x="36"
          y="8"
          width="568"
          height="40"
          rx="20"
          fill={`url(#${uid}-paper)`}
        />
        <rect
          className="scroll-roller-tube"
          x="36"
          y="8"
          width="568"
          height="40"
          rx="20"
          fill="var(--tube, #e4d0b2)"
          opacity="0.92"
        />
        <rect
          x="36"
          y="8"
          width="568"
          height="40"
          rx="20"
          fill={`url(#${uid}-paper)`}
          opacity="0.85"
        />

        {/* Spinning grain / seam bands */}
        <g className="scroll-roller-spin">
          <rect x="36" y="14" width="568" height="3" fill="rgba(255,255,255,0.28)" />
          <rect x="36" y="26" width="568" height="2" fill="rgba(40,20,8,0.22)" />
          <rect x="36" y="38" width="568" height="3" fill="rgba(255,240,210,0.2)" />
        </g>

        {/* End coil rings */}
        <ellipse cx="52" cy="28" rx="8" ry="16" fill="none" stroke="rgba(60,35,12,0.35)" strokeWidth="1.5" />
        <ellipse cx="588" cy="28" rx="8" ry="16" fill="none" stroke="rgba(60,35,12,0.35)" strokeWidth="1.5" />
        <ellipse cx="58" cy="28" rx="5" ry="12" fill="none" stroke="rgba(255,230,190,0.25)" strokeWidth="1" />
        <ellipse cx="582" cy="28" rx="5" ry="12" fill="none" stroke="rgba(255,230,190,0.25)" strokeWidth="1" />

        {/* Specular highlight strip */}
        <rect x="48" y="10" width="544" height="10" rx="5" fill={`url(#${uid}-shine)`} />
      </svg>
    </div>
  )
}

type RolledScrollSvgProps = {
  texture?: TextureId
  title?: string
  className?: string
  tied?: boolean
}

/** Standalone rolled parchment for the empty desk / library shelf. */
export function RolledScrollSvg({
  texture = 'cream',
  title = 'Untitled',
  className = '',
  tied = true,
}: RolledScrollSvgProps) {
  const label = title.length > 28 ? `${title.slice(0, 27)}…` : title
  const uid = `rolled-${texture}-${label.replace(/\W+/g, '').slice(0, 12) || 'scroll'}`
  return (
    <div className={`rolled-scroll tube-${texture} ${className}`.trim()} aria-hidden="true">
      <svg className="rolled-scroll-svg" viewBox="0 0 280 90" role="img">
        <defs>
          <linearGradient id={`${uid}-wood`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d4a86a" />
            <stop offset="40%" stopColor="#7a4e28" />
            <stop offset="100%" stopColor="#4a2e14" />
          </linearGradient>
          <linearGradient id={`${uid}-brass`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f0d090" />
            <stop offset="100%" stopColor="#9a6820" />
          </linearGradient>
          <linearGradient id={`${uid}-paper`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,248,230,0.9)" />
            <stop offset="45%" stopColor="rgba(90,55,25,0.25)" />
            <stop offset="55%" stopColor="rgba(40,22,8,0.4)" />
            <stop offset="100%" stopColor="rgba(255,240,210,0.45)" />
          </linearGradient>
          <linearGradient id={`${uid}-ribbon`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a84040" />
            <stop offset="50%" stopColor="#6e2f2a" />
            <stop offset="100%" stopColor="#4a1814" />
          </linearGradient>
        </defs>

        {/* Left finial */}
        <ellipse cx="22" cy="42" rx="12" ry="18" fill={`url(#${uid}-wood)`} />
        <ellipse cx="22" cy="42" rx="7" ry="11" fill={`url(#${uid}-brass)`} opacity="0.9" />
        <rect x="30" y="30" width="12" height="24" rx="2" fill={`url(#${uid}-brass)`} />

        {/* Right finial */}
        <ellipse cx="258" cy="42" rx="12" ry="18" fill={`url(#${uid}-wood)`} />
        <ellipse cx="258" cy="42" rx="7" ry="11" fill={`url(#${uid}-brass)`} opacity="0.9" />
        <rect x="238" y="30" width="12" height="24" rx="2" fill={`url(#${uid}-brass)`} />

        {/* Rolled body */}
        <rect
          className="rolled-scroll-body"
          x="40"
          y="18"
          width="200"
          height="48"
          rx="24"
          fill="var(--tube, #e4d0b2)"
        />
        <rect x="40" y="18" width="200" height="48" rx="24" fill={`url(#${uid}-paper)`} />
        <ellipse cx="52" cy="42" rx="7" ry="20" fill="none" stroke="rgba(60,35,12,0.4)" strokeWidth="1.5" />
        <ellipse cx="228" cy="42" rx="7" ry="20" fill="none" stroke="rgba(60,35,12,0.4)" strokeWidth="1.5" />
        <rect x="48" y="22" width="184" height="8" rx="4" fill="rgba(255,255,255,0.35)" />

        {tied && (
          <g className="rolled-ribbon">
            <rect x="128" y="16" width="14" height="52" rx="2" fill={`url(#${uid}-ribbon)`} />
            <path
              d="M128 66 Q120 78 112 82 Q128 76 135 68 Q142 76 158 82 Q150 78 142 66 Z"
              fill={`url(#${uid}-ribbon)`}
            />
            <circle cx="135" cy="42" r="7" fill="#8c2f28" stroke="rgba(253,220,180,0.4)" strokeWidth="1" />
            <text
              x="135"
              y="45"
              textAnchor="middle"
              fontSize="8"
              fill="#fdf4e3"
              fontFamily="Georgia, serif"
            >
              ✦
            </text>
          </g>
        )}

        {/* Fluttering title tag */}
        <g className="rolled-tag">
          <path
            d="M168 8 L248 8 L248 28 L168 28 L160 18 Z"
            fill="#f7efe3"
            stroke="rgba(80,50,24,0.2)"
            strokeWidth="1"
          />
          <text
            x="208"
            y="22"
            textAnchor="middle"
            fontSize="9"
            fill="#5a4434"
            fontFamily="Georgia, serif"
          >
            {label}
          </text>
        </g>
      </svg>
    </div>
  )
}

type SilkRibbonProps = {
  className?: string
  state?: 'tied' | 'untied' | 'hidden'
}

/** Crimson silk ribbon overlay for the open/closing stage. */
export function SilkRibbon({ className = '', state = 'tied' }: SilkRibbonProps) {
  return (
    <div className={`silk-ribbon silk-ribbon-${state} ${className}`.trim()} aria-hidden="true">
      <svg viewBox="0 0 80 120" className="silk-ribbon-svg">
        <defs>
          <linearGradient id="silk-ribbon-fill" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8c2f28" />
            <stop offset="40%" stopColor="#c45a4a" />
            <stop offset="100%" stopColor="#5a1814" />
          </linearGradient>
        </defs>
        <rect x="32" y="0" width="16" height="78" rx="3" fill="url(#silk-ribbon-fill)" />
        <path
          d="M32 76 Q22 96 12 108 Q32 98 40 88 Q48 98 68 108 Q58 96 48 76 Z"
          fill="url(#silk-ribbon-fill)"
        />
        <circle cx="40" cy="40" r="11" fill="#8c2f28" stroke="rgba(253,220,180,0.45)" strokeWidth="1.5" />
        <text x="40" y="44" textAnchor="middle" fontSize="12" fill="#fdf4e3" fontFamily="Georgia, serif">
          ✦
        </text>
      </svg>
    </div>
  )
}
