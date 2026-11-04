// The Angularian card: the profile's link preview (og:image) and the GitHub README card, as one PNG.
// After nuxt.com's `OgImage/Nuxter.takumi.vue` (MIT, Copyright (c) 2022-2023 NuxtLabs): the same layout,
// our colours and mark. Only the username and the period are in its URL: the numbers are read when it renders.
import { Resvg } from '@resvg/resvg-js'
import { isPeriod, periodPhrase, type ContributorProfile, type Period } from '@angularians/shared'
import satori from 'satori'

export const CARD_WIDTH = 1200
export const CARD_HEIGHT = 630

/** The brand colour and the profile's stat colours (Tailwind sky-400, violet-400, amber-400). */
const BRAND = '#E5194B'
const COLORS = { pullRequests: BRAND, issues: '#38BDF8', comments: '#A78BFA', reactions: '#FBBF24' }
/** The mark, its small variant (public/favicon.svg). */
const MARK = 'M20.22 16.84L20.28 16.79L20.34 16.73L20.39 16.67L20.42 16.59L20.43 16.51L21.8 4.72L21.8 4.64L21.79 4.56L21.76 4.48L21.72 4.41L21.66 4.35L21.59 4.31L21.52 4.27L12.47 1.03L12.39 1.01L12.32 1L12.25 1.01L12.18 1.03L12.14 1.04L19.73 17.11ZM2.28 6.26L2.24 6.32L2.21 6.4L2.2 6.48L2.2 6.56L3.57 18.35L3.58 18.43L3.61 18.51L3.66 18.57L3.72 18.63L3.78 18.68L5.58 19.67L11.68 6.77L17.78 19.67L19.09 18.95L11.5 2.88L2.48 6.11L2.41 6.15L2.34 6.2ZM10.78 15L12.58 15L11.68 13.09ZM11.72 23L11.81 22.98L11.89 22.95L15.41 20.99L13.53 17L9.83 17L7.95 20.99L11.47 22.95L11.55 22.98L11.64 23Z'

type Node = { type: string, props: Record<string, unknown> & { style?: Record<string, unknown>, children?: unknown } }
const h = (type: string, style: Record<string, unknown>, children?: unknown, props: Record<string, unknown> = {}): Node =>
  ({ type, props: { ...props, style: { display: 'flex', ...style }, children } })

const format = new Intl.NumberFormat('en-US').format
const label = (value: number, one: string, many: string) => (value === 1 ? one : many)

/** `?period=`: a period with contributions, else all time (like the profile page). */
export function cardPeriod(profile: ContributorProfile, requested: unknown): Period {
  const period = typeof requested === 'string' && isPeriod(requested) ? requested : 'all'
  return period !== 'all' && profile.periods.some(row => row.period === period) ? period : 'all'
}

/** `avatar`: a data URL, or `null` when GitHub did not send it (a grey circle instead). */
export function cardTree(profile: ContributorProfile, period: Period, avatar: string | null): Node {
  const stats = period === 'all' ? profile : profile.periods.find(row => row.period === period)!
  const since = profile.firstContributionAt ? new Date(profile.firstContributionAt).getUTCFullYear() : null
  const rows = [
    [
      { label: label(stats.pullRequests.all, 'Merged PR', 'Merged PRs'), value: stats.pullRequests.all, color: COLORS.pullRequests },
      { label: label(stats.issues, 'Issue', 'Issues'), value: stats.issues, color: COLORS.issues },
    ],
    [
      { label: label(stats.comments + stats.reviewComments, 'Comment', 'Comments'), value: stats.comments + stats.reviewComments, color: COLORS.comments },
      { label: label(stats.reactions, 'Reaction', 'Reactions'), value: stats.reactions, color: COLORS.reactions },
    ],
  ]
  return h('div', { width: '100%', height: '100%', flexDirection: 'row', backgroundColor: '#0a0a0a', color: '#ffffff', padding: 64, gap: 64, fontFamily: 'Inter' }, [
    h('div', { flexDirection: 'column', width: 380, alignItems: 'center', justifyContent: 'space-between' }, [
      h('div', { flexDirection: 'column', alignItems: 'center' }, [
        avatar
          ? h('img', { width: 176, height: 176, borderRadius: 9999, border: '4px solid #262626' }, undefined, { src: avatar, width: 176, height: 176 })
          : h('div', { width: 176, height: 176, borderRadius: 9999, backgroundColor: '#262626' }),
        h('div', { fontSize: 48, fontWeight: 600, marginTop: 24, maxWidth: 380, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, profile.username),
        h('div', { fontSize: 30, color: '#a3a3a3', marginTop: 16 }, period === 'all' ? `Angularian #${format(profile.rank)}` : `#${format(stats.rank)} ${periodPhrase(period)}`),
        h('div', { fontSize: 36, fontWeight: 600, color: BRAND, marginTop: 16 }, `${format(stats.score)} ${stats.score === 1 ? 'pt' : 'pts'}`),
        ...(since ? [h('div', { fontSize: 24, color: '#737373', marginTop: 12 }, `Angularian since ${since}`)] : []),
      ]),
      h('svg', { width: 48, height: 48 }, h('path', {}, undefined, { d: MARK, fill: BRAND }), { viewBox: '0 0 24 24', width: 48, height: 48 }),
    ]),
    h('div', { flexDirection: 'column', flex: 1, gap: 32, justifyContent: 'center' }, rows.map(row =>
      h('div', { flexDirection: 'row', gap: 32 }, row.map(stat =>
        h('div', { flexDirection: 'column', justifyContent: 'flex-end', flex: 1, height: 220, borderRadius: 24, padding: 32, border: `2px solid ${stat.color}`, backgroundColor: `${stat.color}0D` }, [
          h('div', { fontSize: 60, fontWeight: 600 }, format(stat.value)),
          h('div', { fontSize: 30, marginTop: 8, color: stat.color }, stat.label),
        ])),
      ))),
  ])
}

export interface CardFonts { regular: ArrayBuffer | Buffer, semibold: ArrayBuffer | Buffer }

export async function renderCard(tree: Node, fonts: CardFonts): Promise<Buffer> {
  const svg = await satori(tree as never, {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    fonts: [
      { name: 'Inter', data: fonts.regular, weight: 400, style: 'normal' },
      { name: 'Inter', data: fonts.semibold, weight: 600, style: 'normal' },
    ],
  })
  return new Resvg(svg, { fitTo: { mode: 'width', value: CARD_WIDTH } }).render().asPng()
}
