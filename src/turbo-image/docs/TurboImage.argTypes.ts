import type { ArgTypes } from '@storybook/react-vite'

import type { TurboImageProps } from '../TurboImage.types'

type TurboImageArgTypes = ArgTypes<Partial<TurboImageProps>>

const categorize = (category: string, keys: Array<keyof TurboImageProps>): TurboImageArgTypes =>
    Object.fromEntries(keys.map(key => [key, { table: { category } }]))

export const a11yArgTypes = categorize('Accessibility', [
    'accessibilityLabel',
    'accessible',
    'aria-hidden',
    'aria-label',
    'aria-labelledby',
    'role',
])

export const eventsArgTypes = categorize('Events', [
    'onCompletion',
    'onFailure',
    'onLayout',
    'onProgress',
    'onStart',
    'onSuccess',
])

export const systemArgTypes = categorize('System', ['nativeID', 'testID'])

/** Disables the table row of each key, for a story that writes those props in its JSX. */
export const hideArgTypes = (...keys: Array<keyof TurboImageProps>): TurboImageArgTypes =>
    Object.fromEntries(keys.map(key => [key, { table: { disable: true } }]))
