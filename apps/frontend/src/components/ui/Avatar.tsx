interface AvatarProps {
  src?: string | null
  name?: string
  size?: number
  className?: string
}

function getInitials(name?: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  const initials = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '')
  return initials.join('') || '?'
}

export function Avatar({ src, name, size = 40, className = '' }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name ?? 'Avatar'}
        width={size}
        height={size}
        className={`object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <div
      className={`flex items-center justify-center bg-[var(--color-primary)] text-[var(--color-on-primary)] font-semibold ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {getInitials(name)}
    </div>
  )
}
