import { Component, type ReactNode, useState } from 'react'
import TurboImage, { type TurboImageProps } from 'react-native-turbo-image'
import { Pressable, Text, View } from 'react-native-web'

/** A URL short enough for a log line: a data URI runs to thousands of characters. */
export const shortUri = (uri: string) => (uri.length > 40 ? `${uri.slice(0, 32)}…` : uri)

const LABEL_STYLE = { color: '#8b8b8b', fontFamily: 'monospace', fontSize: 12 } as const

export const Label = ({ children, testID }: { children: ReactNode; testID?: string }) => (
    <Text style={LABEL_STYLE} testID={testID}>
        {children}
    </Text>
)

export const Case = ({ children, title }: { children: ReactNode; title: string }) => (
    <View style={{ gap: 6 }}>
        <Label>{title}</Label>
        {children}
    </View>
)

export const Row = ({ children }: { children: ReactNode }) => (
    <View style={{ alignItems: 'flex-start', flexDirection: 'row', flexWrap: 'wrap', gap: 24 }}>
        {children}
    </View>
)

export const Button = ({ onPress, title }: { onPress: () => void; title: string }) => (
    <Pressable
        onPress={onPress}
        style={{ backgroundColor: '#2c2c2c', borderRadius: 6, paddingInline: 12, paddingBlock: 8 }}
    >
        <Text style={{ color: '#e6e6e6', fontSize: 13 }}>{title}</Text>
    </Pressable>
)

export class Boundary extends Component<
    { children: ReactNode; testID: string },
    { message: string | null }
> {
    override state: { message: string | null } = { message: null }

    static getDerivedStateFromError(error: Error) {
        return { message: error.message }
    }

    override render() {
        const { children, testID } = this.props
        const { message } = this.state

        return message === null ? (
            children
        ) : (
            <Text style={{ color: '#e0785f', fontSize: 13 }} testID={testID}>
                threw: {message}
            </Text>
        )
    }
}

export const LoggedTurboImage = (props: TurboImageProps & { testID: string }) => {
    const { onCompletion, onFailure, onProgress, onStart, onSuccess, testID } = props
    const [lines, setLines] = useState<string[]>([])
    const log = (line: string) => setLines(previous => [...previous, line])

    return (
        <View style={{ gap: 6 }}>
            <TurboImage
                {...props}
                onCompletion={event => {
                    log(`onCompletion ${event.nativeEvent.state}`)
                    onCompletion?.(event)
                }}
                onFailure={event => {
                    log(`onFailure ${event.nativeEvent.error}`)
                    onFailure?.(event)
                }}
                onProgress={
                    onProgress === undefined
                        ? undefined
                        : event => {
                              log(
                                  `onProgress ${event.nativeEvent.completed}/${event.nativeEvent.total}`,
                              )
                              onProgress(event)
                          }
                }
                onStart={event => {
                    log(`onStart ${event.nativeEvent.state}`)
                    onStart?.(event)
                }}
                onSuccess={event => {
                    const { height, source, width } = event.nativeEvent
                    log(`onSuccess ${width}x${height} ${shortUri(source)}`)
                    onSuccess?.(event)
                }}
            />
            <View testID={`${testID}-log`}>
                {lines.map((line, index) => (
                    // oxlint-disable-next-line react/no-array-index-key -- the log only appends
                    <Label key={index}>{line}</Label>
                ))}
            </View>
        </View>
    )
}
