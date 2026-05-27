/// <reference types="vite/client" />

import type { CSSProperties, HTMLAttributes, DetailedHTMLProps } from 'react'

type ModelViewerAttributes = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  src?: string
  alt?: string
  'auto-rotate'?: boolean | string
  'camera-controls'?: boolean | string
  'shadow-intensity'?: string
  'environment-image'?: string
  exposure?: string
  'rotation-per-second'?: string
  poster?: string
  loading?: string
  reveal?: string
  ar?: boolean | string
  style?: CSSProperties
  className?: string
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerAttributes
    }
  }
}
