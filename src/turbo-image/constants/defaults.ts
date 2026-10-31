import type { ResizeMode } from '../TurboImage.types'

/** iOS' `fadeDuration` default. Android's is 100. */
export const DEFAULT_FADE_DURATION_MS = 300

export const DEFAULT_RESIZE_MODE: ResizeMode = 'contain'

/** A `source.uri` with this prefix starts a load that never settles. Upstream has no equivalent. */
export const PENDING_URI_PREFIX = 'pending:'
