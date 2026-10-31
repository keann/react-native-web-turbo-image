import { rgbaToThumbHash } from 'thumbhash'

/** The sample image's size in pixels: wider than tall, so each `resizeMode` looks different. */
export const SAMPLE_SIZE = { height: 180, width: 320 } as const

export const TILE_STYLE = { height: 135, width: 240 } as const

/** The blurhash from woltapp/blurhash's README, 4 by 3 components. */
export const SAMPLE_BLURHASH = 'LEHV6nWB2yk8pyo0adR*.7kCMdnj'

/** A PNG that fails to decode as soon as the browser reads it. */
export const BROKEN_URI = 'data:image/png;base64,Tm90QVBORw=='

/** Draws a sunset over two mountains, so the stories load an image without the network. */
const drawSample = (width: number, height: number) => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (context === null) {
        throw new Error('The sample image needs a 2D canvas')
    }

    const sky = context.createLinearGradient(0, 0, 0, height)
    sky.addColorStop(0, '#1b3a6b')
    sky.addColorStop(0.55, '#e8734a')
    sky.addColorStop(1, '#f7c26b')
    context.fillStyle = sky
    context.fillRect(0, 0, width, height)

    context.fillStyle = '#ffd88a'
    context.beginPath()
    context.arc(width * 0.68, height * 0.42, Math.min(width, height) * 0.14, 0, Math.PI * 2)
    context.fill()

    context.fillStyle = '#20304a'
    context.beginPath()
    context.moveTo(0, height)
    context.lineTo(width * 0.28, height * 0.42)
    context.lineTo(width * 0.52, height)
    context.closePath()
    context.fill()

    context.fillStyle = '#16233a'
    context.beginPath()
    context.moveTo(width * 0.34, height)
    context.lineTo(width * 0.66, height * 0.55)
    context.lineTo(width, height)
    context.closePath()
    context.fill()

    return canvas
}

const sampleCanvas = drawSample(SAMPLE_SIZE.width, SAMPLE_SIZE.height)

export const SAMPLE_URI = sampleCanvas.toDataURL('image/png')

/** The sample image's PNG bytes, for a mocked `fetch` to serve. */
export const SAMPLE_BYTES = Uint8Array.from(
    atob(SAMPLE_URI.split(',')[1]),
    character => character.codePointAt(0) ?? 0,
)

/** The sample image encoded as a thumbhash, so its placeholder reads as a blurred copy of it. */
export const SAMPLE_THUMBHASH = (() => {
    // A thumbhash encodes at most 100 by 100 pixels.
    const small = document.createElement('canvas')
    small.width = 64
    small.height = 36
    const context = small.getContext('2d')
    if (context === null) {
        throw new Error('The sample thumbhash needs a 2D canvas')
    }
    context.drawImage(sampleCanvas, 0, 0, small.width, small.height)
    const { data } = context.getImageData(0, 0, small.width, small.height)

    return btoa(String.fromCodePoint(...rgbaToThumbHash(small.width, small.height, data)))
})()
