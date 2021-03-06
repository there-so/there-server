import fetch from 'node-fetch'
import Lru from 'lru-cache'
import ms from 'ms'

const debug = require('debug')('github')
const { GH_TOKEN_RELEASES } = process.env

// Cache
const latestReleaseAssetsKey = 'github-latest-release'
const cache = new Lru({
  max: 10,
  maxAge: ms('5m'),
})

export const getLatestReleaseDlLink = async () => {
  const cachedAssets = cache.get(latestReleaseAssetsKey)

  console.log(cachedAssets)
  let assets
  if (!cachedAssets) {
    debug('Fetching latest release...')

    // We should fetch for the first time
    const response = await fetch(
      'https://api.github.com/repos/therehq/there-desktop/releases/latest',
      // { headers: { Authorization: `token ${GH_TOKEN_RELEASES}` } },
    )
    const json = await response.json()
    assets = json.assets
    cache.set(latestReleaseAssetsKey, assets)
  } else {
    debug('Using cached latest release assets')

    // The assets have been cached
    assets = cachedAssets
  }

  // Check if there is no assets, return an error
  if (!assets) {
    debug(`No assets were found.`)
    throw new Error(
      `Sorry, couldn't find the file now. Chat with us on https://there.team`,
    )
  }

  const asset = assets.find(asset => asset.name.endsWith('-mac.zip'))
  return asset.browser_download_url
}
