import * as core from '@actions/core'
import {exec} from '../utils/cache'

async function run(): Promise<void> {
  try {
    const cacheHit = core.getState('cache-hit')
    const key = core.getState('key')

    if (cacheHit === 'false') {
      const cachePath = core.getState('cache-path')
      const path = core.getState('path')
      const target = `${cachePath}/${path.split('/').slice(-1)[0]}`

      // Skip if another concurrent job already saved this cache key
      const check = await exec(
        `test -d ${target} && echo exists || echo missing`
      )
      if (check.stdout.trim() === 'exists') {
        core.info(`Cache already saved by another job for key ${key}, skipping`)
        return
      }

      await exec(`mkdir -p ${cachePath}`)
      const mv = await exec(`mv ./${path} ${cachePath}`)

      core.debug(mv.stdout)
      if (mv.stderr) core.error(mv.stderr)
      if (!mv.stderr) core.info(`Cache saved with key ${key}`)
    } else {
      core.info(`Cache hit on the key ${key}, not saving cache`)
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
