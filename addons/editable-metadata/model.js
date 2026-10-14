import { LikeC4 } from 'likec4'
import config from 'virtual:editable-metadata/config'

const likec4 = await LikeC4.fromWorkspace(config.modelDir, { throwIfInvalid: true })

export const model = await likec4.computedModel()
