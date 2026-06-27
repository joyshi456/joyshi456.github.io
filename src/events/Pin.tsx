interface Props {
  /** head diameter in px */
  size?: number
  /** rotation of the whole tack, deg */
  tilt?: number
  className?: string
  style?: React.CSSProperties
}

/**
 * A realistic wooden push-pin / thumbtack, drawn head-on as if pressed into
 * the board: a turned-wood domed knob with concentric grain rings, a soft
 * specular highlight, and a cast shadow on the paper beneath it.
 */
export function Pin({ size = 30, tilt = 0, className, style }: Props) {
  return (
    <svg
      className={className}
      style={style}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <radialGradient id="pinWood" cx="40%" cy="34%" r="72%">
          <stop offset="0%" stopColor="#f6e8c9" />
          <stop offset="34%" stopColor="#e3c896" />
          <stop offset="68%" stopColor="#c39a5e" />
          <stop offset="90%" stopColor="#9e7338" />
          <stop offset="100%" stopColor="#7c5526" />
        </radialGradient>
        <radialGradient id="pinHi" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>

      {/* cast shadow on the paper, offset down-right (kept upright) */}
      <ellipse cx="26" cy="32" rx="17" ry="7" fill="rgba(40,26,12,0.30)" />

      <g transform={`rotate(${tilt} 23 23)`}>
        {/* wooden dome */}
        <circle cx="23" cy="23" r="16" fill="url(#pinWood)" stroke="#6c481f" strokeWidth="0.9" />

        {/* turned-wood grain rings */}
        <circle cx="23" cy="23" r="11.5" fill="none" stroke="rgba(108,72,31,0.30)" strokeWidth="0.7" />
        <circle cx="23" cy="23" r="7" fill="none" stroke="rgba(108,72,31,0.26)" strokeWidth="0.7" />
        <circle cx="23" cy="23" r="3" fill="none" stroke="rgba(108,72,31,0.30)" strokeWidth="0.7" />

        {/* specular highlight */}
        <ellipse cx="17" cy="16" rx="6.5" ry="5" fill="url(#pinHi)" />
      </g>
    </svg>
  )
}
