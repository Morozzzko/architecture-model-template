import { LikeC4 } from 'likec4'

const likec4 = await LikeC4.fromWorkspace('model', { throwIfInvalid: true })

export const model = await likec4.computedModel()
