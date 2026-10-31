import type { Meta, StoryObj } from '@storybook/react-vite'
import TurboImage from 'react-native-turbo-image'
import { expect, fn, waitFor } from 'storybook/test'

/**
 * A 7 by 3 pixel SVG, so the story loads without the network. Base64, because react-native-web
 * escapes the markup of a `utf8` SVG data URI a second time.
 */
const SAMPLE_URI = `data:image/svg+xml;base64,${btoa(
    '<svg xmlns="http://www.w3.org/2000/svg" width="7" height="3"><rect width="7" height="3" fill="teal"/></svg>',
)}`

/** **TurboImage** for react-native-web. This placeholder renders react-native-web's `Image`. */
export default {
    title: 'Components/TurboImage',
    component: TurboImage,
    args: {
        source: { uri: SAMPLE_URI },
        style: { width: 140, height: 60 },
        onLoad: fn(),
    },
} satisfies Meta<typeof TurboImage>

type Story = StoryObj<typeof TurboImage>

export const Sandbox: Story = {
    play: async ({ args }) => {
        await waitFor(() => expect(args.onLoad).toHaveBeenCalledOnce())
    },
}
