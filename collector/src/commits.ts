import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { promisify } from 'node:util'
import type { CommitInput } from '@angularians/shared'

const run = promisify(execFile)
const RECORD = '\x1e'
const FIELD = '\x00'

/**
 * The commits of a repository's default branch, from a local clone: no API calls.
 * Treeless (`--filter=tree:0`): commits and messages only, about 16 MB for angular/angular's 39,000 commits.
 */
export async function gitCommits(repo: string, cacheDir: string, since: Date | null): Promise<CommitInput[]> {
  const dir = join(cacheDir, `${repo.replace('/', '__')}.git`)
  if (existsSync(dir)) {
    await git(['-C', dir, 'fetch', '--quiet', '--filter=tree:0', 'origin', '+HEAD:refs/remotes/origin/HEAD'])
  }
  else {
    await git(['clone', '--quiet', '--bare', '--filter=tree:0', '--single-branch', `https://github.com/${repo}.git`, dir])
    await git(['-C', dir, 'fetch', '--quiet', '--filter=tree:0', 'origin', '+HEAD:refs/remotes/origin/HEAD'])
  }
  // git writes the separators itself: %x1e and %x00 (a NUL byte cannot be passed in an argument).
  const args = ['-C', dir, 'log', '--format=%x1e%cI%x00%B', 'refs/remotes/origin/HEAD']
  if (since) args.push(`--since=${since.toISOString()}`)
  const { stdout } = await git(args)
  return parseGitLog(stdout)
}

/** `git log --format=<RS>%cI<NUL>%B` output → commits. */
export function parseGitLog(output: string): CommitInput[] {
  return output.split(RECORD).flatMap((record) => {
    const separator = record.indexOf(FIELD)
    if (separator === -1) return []
    return [{ date: record.slice(0, separator).trim(), message: record.slice(separator + 1) }]
  })
}

function git(args: string[]) {
  return run('git', args, { maxBuffer: 512 * 1024 * 1024 })
}
