/**
 * Finds the parts of a rendered **TurboImage** by the `testID` it was given. The `testID` lands
 * on the inner image, as upstream spreads its view props there, and the wrapper sits two levels
 * up: wrapper, then the image layer, then the image.
 */
export const turboImageParts = (container: HTMLElement, testID: string) => {
    const image = container.querySelector<HTMLElement>(`[data-testid="${testID}"]`)
    const layer = image?.parentElement
    const root = layer?.parentElement
    if (
        image === null ||
        layer === null ||
        layer === undefined ||
        root === null ||
        root === undefined
    ) {
        throw new Error(`No TurboImage with testID "${testID}"`)
    }
    const siblings = [...root.children].filter(child => child !== layer)

    return {
        /** The inner react-native-web `Image`. */
        image,
        /** The URL the image paints, or `null` while it paints nothing. */
        imageUri: image.querySelector('img')?.getAttribute('src') ?? null,
        /** The activity indicator, when it shows. */
        indicator: root.querySelector('[role="progressbar"]'),
        /** The layer that fades the image in. */
        layer,
        /** The element that paints the image as its background, styled by `blur` and `tint`. */
        painter: image.firstElementChild as HTMLElement,
        /** The URL the placeholder paints, or `null` when no placeholder shows. */
        placeholderUri:
            siblings
                .map(sibling => sibling.querySelector('img')?.getAttribute('src'))
                .find(uri => uri !== undefined && uri !== null) ?? null,
        /** The clipping wrapper that takes `style` and the ref. */
        root,
    }
}

/** The lines a **LoggedTurboImage** has written. */
export const logLines = (container: HTMLElement, testID: string) =>
    [...(container.querySelector(`[data-testid="${testID}-log"]`)?.children ?? [])].map(
        line => line.textContent,
    )
