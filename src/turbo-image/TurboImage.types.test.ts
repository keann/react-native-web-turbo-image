import type UpstreamTurboImage from 'react-native-turbo-image-upstream'
import type * as Upstream from 'react-native-turbo-image-upstream'
import { describe, expectTypeOf, it } from 'vitest'

import type TurboImage from '../index'
import type * as Package from '../index'

// `bun check` fails on a mismatch. At runtime the assertions do nothing.

describe('the types', () => {
    it('match upstream react-native-turbo-image', () => {
        expectTypeOf<typeof TurboImage>().toEqualTypeOf<typeof UpstreamTurboImage>()

        expectTypeOf<Package.CachePolicy>().toEqualTypeOf<Upstream.CachePolicy>()
        expectTypeOf<Package.Completion>().toEqualTypeOf<Upstream.Completion>()
        expectTypeOf<Package.Failure>().toEqualTypeOf<Upstream.Failure>()
        expectTypeOf<Package.Format>().toEqualTypeOf<Upstream.Format>()
        expectTypeOf<Package.Indicator>().toEqualTypeOf<Upstream.Indicator>()
        expectTypeOf<Package.IndicatorStyle>().toEqualTypeOf<Upstream.IndicatorStyle>()
        expectTypeOf<Package.Progress>().toEqualTypeOf<Upstream.Progress>()
        expectTypeOf<Package.ResizeMode>().toEqualTypeOf<Upstream.ResizeMode>()
        expectTypeOf<Package.Source>().toEqualTypeOf<Upstream.Source>()
        expectTypeOf<Package.Start>().toEqualTypeOf<Upstream.Start>()
        expectTypeOf<Package.Success>().toEqualTypeOf<Upstream.Success>()
        expectTypeOf<Package.TurboImageProps>().toEqualTypeOf<Upstream.TurboImageProps>()
    })
})
