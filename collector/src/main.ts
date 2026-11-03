import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  buildContributorRecords,
  landedPullRequests,
  periodFile,
  PROFILES_FILE,
  prCloseNumbers,
  toJsonLines,
  type LandedPullRequest,
} from '@angularians/shared'
import { gitCommits } from './commits.ts'
import { parseConfig } from './config.ts'
import { collectProfiles } from './profiles.ts'
import { restPulls, searchPulls } from './pulls.ts'

/** Below this, a full run is most likely broken (token, API): keep the previous files. */
const MIN_FULL_RUN_CONTRIBUTORS = 1000
export const META_FILE = 'meta.json'

const config = parseConfig(process.argv.slice(2), process.env)
const now = new Date()
console.log(`Collecting ${config.repos.map(r => `${r.owner}/${r.name}`).join(', ')}${config.since ? ` since ${config.since.toISOString()}` : ', full history'} (PRs from ${config.pulls})`)

const landed: LandedPullRequest[] = []
const stats = { pulls: 0, commits: 0, prCloseCommits: 0, multiPrCommits: 0, landedMerged: 0, landedByPrClose: 0 }

for (const repo of config.repos) {
  const fullName = `${repo.owner}/${repo.name}`
  const [pulls, commits] = await Promise.all([
    config.pulls === 'rest' ? restPulls(repo, config.since) : searchPulls(repo, config.since, now),
    gitCommits(fullName, config.cacheDir, config.since),
  ])
  const repoLanded = landedPullRequests(pulls, commits)
  const merged = new Set(pulls.filter(pull => pull.merged_at).map(pull => pull.number))
  for (const commit of commits) {
    const numbers = prCloseNumbers(commit.message)
    if (numbers.length) stats.prCloseCommits++
    if (numbers.length > 1) stats.multiPrCommits++
  }
  stats.pulls += pulls.length
  stats.commits += commits.length
  stats.landedMerged += repoLanded.filter(pull => merged.has(pull.number)).length
  stats.landedByPrClose += repoLanded.filter(pull => !merged.has(pull.number)).length
  landed.push(...repoLanded)
  console.log(`${fullName}: ${pulls.length} closed PRs, ${commits.length} commits, ${repoLanded.length} landed PRs`)
}

const files = buildContributorRecords(landed, now)
const allTime = files.get('all') ?? []
if (!allTime.length) {
  console.error('No contributors collected: refusing to write empty files. Check the token and API access.')
  process.exit(1)
}
if (!config.since && allTime.length < MIN_FULL_RUN_CONTRIBUTORS) {
  console.error(`Only ${allTime.length} contributors in a full run (minimum ${MIN_FULL_RUN_CONTRIBUTORS}): refusing to write.`)
  process.exit(1)
}

await mkdir(config.outputDir, { recursive: true })
for (const [period, records] of files) {
  await writeFile(join(config.outputDir, periodFile(period)), toJsonLines(records), 'utf8')
}
console.log(`Wrote ${files.size} period files to ${config.outputDir} (${allTime.length} contributors all time)`)

let profiles: number | null = null
if (config.profiles) {
  try {
    const records = await collectProfiles(allTime.map(({ username, githubId }) => ({ username, githubId })))
    await writeFile(join(config.outputDir, PROFILES_FILE), toJsonLines(records), 'utf8')
    profiles = records.length
    console.log(`Wrote ${records.length} profiles (${records.filter(r => r.country).length} with a country)`)
  }
  catch (error) {
    // Profiles are a bonus: keep the previous file rather than publishing a partial one, still publish the stats.
    console.error(`Profiles failed, ${existsSync(join(config.outputDir, PROFILES_FILE)) ? 'keeping the previous file' : 'no profiles file'}:`, error instanceof Error ? error.message : error)
  }
}

const meta = {
  collectedAt: now.toISOString(),
  repos: config.repos.map(r => `${r.owner}/${r.name}`),
  /** A test run with `--since`: all-time totals and first contributions only cover that window. */
  partial: config.since !== null,
  since: config.since?.toISOString() ?? null,
  contributors: allTime.length,
  landedPullRequests: landed.length,
  profiles,
  ...stats,
}
await writeFile(join(config.outputDir, META_FILE), `${JSON.stringify(meta, null, 2)}\n`, 'utf8')
console.log(meta)

// Logins to check by hand for bots that `isBotAccount` does not catch yet.
const suspects = allTime.filter(r => /bot|robot|automation|machine|\bci\b|release|sync/i.test(r.username))
console.log('Possible bots:', suspects.length ? suspects.map(r => `${r.username} (${r.pullRequests.all})`).join(', ') : 'none')
console.log('Top 25:', allTime.slice(0, 25).map(r => `${r.username} ${r.score}`).join(', '))
