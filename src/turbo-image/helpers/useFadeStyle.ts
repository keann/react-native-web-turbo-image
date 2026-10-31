import { useEffect, useState } from 'react'
import type { ViewStyle } from 'react-native'

/**
 * The image layer's fade-in, as a CSS transition. A browser advances a transition only while it
 * paints, and a preview in a background tab doesn't, so a timer drops the transition once the
 * fade is due and the layer can't stop part-way.
 */
export const useFadeStyle = (isLoaded: boolean, durationMs: number) => {
    const [isSettled, setIsSettled] = useState(false)
    if (!isLoaded && isSettled) {
        setIsSettled(false)
    }

    useEffect(() => {
        if (!isLoaded || durationMs === 0 || isSettled) {
            return undefined
        }
        const timer = setTimeout(() => setIsSettled(true), durationMs)

        return () => clearTimeout(timer)
    }, [durationMs, isLoaded, isSettled])

    // react-native-web passes the transition properties to CSS, and react-native's types lack them.
    return {
        opacity: isLoaded ? 1 : 0,
        transitionDuration: `${durationMs}ms`,
        // Removing the property, not the duration, is what stops a running transition.
        transitionProperty: isSettled ? 'none' : 'opacity',
    } as ViewStyle
}
