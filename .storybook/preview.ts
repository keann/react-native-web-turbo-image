import addonVitest from '@storybook/addon-vitest'
import { definePreview } from '@storybook/react-vite'

export default definePreview({
    addons: [addonVitest()],
})
