import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  ContributorsAccumulator,
  landedPullRequests,
  periodFile,
  PACKAGES_FILE,
  PROFILES_FILE,
  prCloseNumbers,
  TEAM_FILE,
  toJsonLines,
  type LandedPullRequest,
  type TeamRecord,
} from '@angularians/shared'
import { collectActivity } from './activity.ts'
import { gitCommits } from './commits.ts'
import { parseConfig } from './config.ts'
import { paginate } from './github.ts'
import { collectProfiles } from './profiles.ts'
import { restPulls, searchPulls } from './pulls.ts'

/** Below this, a full run is most likely broken (token, API): keep the previous files. */
const MIN_FULL_RUN_CONTRIBUTORS = 1000
export const META_FILE = 'meta.json'

const config = parseConfig(process.argv.slice(2), process.env)
const now = new Date()
console.log(`Collecting ${config.repos.map(r => `${r.owner}/${r.name}`).join(', ')}${config.since ? ` since ${config.since.toISOString()}` : ', full history'} (PRs from ${config.pulls}${config.activity ? ', with issues, comments and review comments' : ', landed PRs only'})`)

const accumulator = new ContributorsAccumulator(now)
const landed: LandedPullRequest[] = []
const stats = {
  pulls: 0, commits: 0, prCloseCommits: 0, multiPrCommits: 0, landedMerged: 0, landedByPrClose: 0,
  issues: 0, comments: 0, reviewComments: 0, activityPages: 0,
}

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
  for (const pull of repoLanded) accumulator.addLandedPullRequest(pull)
  console.log(`${fullName}: ${pulls.length} closed PRs, ${commits.length} commits, ${repoLanded.length} landed PRs`)

  if (config.activity) {
    const activity = await collectActivity(repo, config.since, accumulator)
    stats.issues += activity.issues
    stats.comments += activity.comments
    stats.reviewComments += activity.reviewComments
    stats.activityPages += activity.pages
    console.log(`${fullName}: ${activity.issues} issues, ${activity.comments} comments, ${activity.reviewComments} review comments (${activity.pages} pages)`)
  }
}

const files = accumulator.records()
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

// The packages each contributor's merged PRs named (`fix(router)`), all time.
const packages = accumulator.packages()
await writeFile(join(config.outputDir, PACKAGES_FILE), toJsonLines(packages), 'utf8')
console.log(`Wrote ${packages.length} contributors' packages`)

// The public members of the organizations of the repositories: the "Angular team" badge.
let team: number | null = null
try {
  const members: TeamRecord[] = []
  for (const owner of new Set(config.repos.map(repo => repo.owner))) {
    for await (const page of paginate<{ login: string, id: number }>(`/orgs/${owner}/public_members?per_page=100`)) {
      for (const member of page) members.push({ githubId: member.id, username: member.login })
    }
  }
  members.sort((a, b) => a.githubId - b.githubId)
  await writeFile(join(config.outputDir, TEAM_FILE), toJsonLines(members), 'utf8')
  team = members.length
  console.log(`Wrote ${members.length} public organization members`)
}
catch (error) {
  console.error(`Team members failed, ${existsSync(join(config.outputDir, TEAM_FILE)) ? 'keeping the previous file' : 'no team file'}:`, error instanceof Error ? error.message : error)
}

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
  /** Issues, comments and review comments are in the scores. */
  activity: config.activity,
  contributors: allTime.length,
  landedPullRequests: landed.length,
  profiles,
  team,
  ...stats,
}
await writeFile(join(config.outputDir, META_FILE), `${JSON.stringify(meta, null, 2)}\n`, 'utf8')
console.log(meta)

// Logins to check by hand for bots that `isBotAccount` does not catch yet: by name, and the busiest commenters.
const suspects = allTime.filter(r => /bot|robot|automation|machine|\bci\b|release|sync|cla\b/i.test(r.username))
console.log('Possible bots:', suspects.length ? suspects.map(r => `${r.username} (${r.pullRequests.all} PRs, ${r.comments} comments)`).join(', ') : 'none')
if (config.activity) {
  const commenters = [...allTime].sort((a, b) => b.comments + b.reviewComments - a.comments - a.reviewComments).slice(0, 20)
  console.log('Busiest commenters:', commenters.map(r => `${r.username} ${r.comments}+${r.reviewComments}`).join(', '))
}
console.log('Top 25:', allTime.slice(0, 25).map(r => `${r.username} ${r.score}`).join(', '))
