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
const MARK = 'M9.06 8.01L9.6 5.6L10.11 5L9.8 4.58L10 3.44L10.05 3.18L3.16 5.66L3.43 8.01ZM12.32 7.87L11.9 4.86L11.38 8.01L12.36 8.01ZM8.49 11.04L8.58 10.51L8.75 9.91L8.75 9.4L8.98 8.35L3.47 8.35L3.97 12.67L8.23 12.67ZM10.85 11.64L10.66 12.67L13.07 12.67L12.55 9.85L12.44 8.38L12.43 8.35L11.28 8.35L11.05 8.46L11.19 8.92L10.82 11.67ZM3.15 17.93L3.16 18.01L3.2 18.1L3.25 18.17L3.31 18.23L3.38 18.28L6.83 20.2L7.03 19.06L4.19 17.48L2.8 5.43L10.14 2.8L10.25 2.25L10.36 1.56L1.96 4.57L1.88 4.61L1.81 4.66L1.75 4.73L1.7 4.8L1.67 4.89L1.65 4.97L1.65 5.06ZM6.1 4.01L6 3.99L5.91 3.93L5.84 3.84L5.82 3.73L5.84 3.63L5.91 3.54L6 3.48L6.1 3.45L6.21 3.48L6.3 3.54L6.36 3.63L6.38 3.73L6.36 3.84L6.3 3.93L6.21 3.99ZM2.38 5.36L2.27 5.39L2.17 5.36L2.08 5.3L2.02 5.21L1.99 5.11L2.02 5L2.08 4.91L2.17 4.85L2.27 4.83L2.38 4.85L2.47 4.91L2.53 5L2.55 5.11L2.53 5.21L2.47 5.3ZM2.85 9.4L2.74 9.43L2.64 9.4L2.54 9.34L2.48 9.25L2.46 9.15L2.48 9.04L2.54 8.95L2.64 8.89L2.74 8.87L2.85 8.89L2.94 8.95L3 9.04L3.02 9.15L3 9.25L2.94 9.34ZM3.21 13.47L3.1 13.45L3.01 13.38L2.95 13.29L2.93 13.19L2.95 13.08L3.01 12.99L3.1 12.93L3.21 12.91L3.32 12.93L3.41 12.99L3.47 13.08L3.49 13.19L3.47 13.29L3.41 13.38L3.32 13.45ZM3.79 17.49L3.68 17.51L3.57 17.49L3.48 17.42L3.42 17.33L3.4 17.23L3.42 17.12L3.48 17.03L3.57 16.97L3.68 16.95L3.79 16.97L3.88 17.03L3.94 17.12L3.96 17.23L3.94 17.33L3.88 17.42ZM10.51 13.48L10.48 13.68L12.32 13.12L12.76 13.01L10.6 13.01ZM4.51 17.27L4.61 17.33L7.33 17.33L7.36 17.2L7.64 15.41L7.95 15.1L7.93 14.53L8.17 13.01L4.01 13.01ZM7.28 17.67L5.22 17.67L7.09 18.71ZM13.73 3.11L14.42 6.42L14.23 6.93L14.57 7.19L14.73 8.01L20.57 8.01L20.84 5.66ZM20.53 8.35L14.8 8.35L15.66 12.67L20.03 12.67ZM22.35 5.06L22.35 4.97L22.33 4.89L22.3 4.8L22.25 4.73L22.19 4.66L22.12 4.61L22.04 4.57L13.32 1.44L13.32 1.57L13.4 1.79L13.52 2.08L13.65 2.72L21.2 5.43L19.81 17.48L17.06 19.01L17.29 20.13L20.62 18.28L20.69 18.23L20.75 18.17L20.8 18.1L20.84 18.01L20.85 17.93ZM17.7 3.88L17.59 3.9L17.48 3.88L17.39 3.82L17.33 3.73L17.31 3.62L17.33 3.52L17.39 3.43L17.48 3.37L17.59 3.34L17.7 3.37L17.79 3.43L17.85 3.52L17.87 3.62L17.85 3.73L17.79 3.82ZM21.62 5.19L21.53 5.25L21.42 5.28L21.31 5.25L21.22 5.19L21.16 5.1L21.14 5L21.16 4.89L21.22 4.8L21.31 4.74L21.42 4.72L21.53 4.74L21.62 4.8L21.68 4.89L21.7 5L21.68 5.1ZM21.49 9.02L21.4 9.08L21.29 9.1L21.19 9.08L21.1 9.02L21.04 8.93L21.02 8.82L21.04 8.72L21.1 8.62L21.19 8.56L21.29 8.54L21.4 8.56L21.49 8.62L21.55 8.72L21.57 8.82L21.55 8.93ZM20.93 13.12L20.83 13.14L20.72 13.12L20.63 13.06L20.57 12.97L20.55 12.86L20.57 12.76L20.63 12.66L20.72 12.6L20.83 12.58L20.93 12.6L21.02 12.66L21.08 12.76L21.11 12.86L21.08 12.97L21.02 13.06ZM20.56 17.1L20.46 17.16L20.36 17.18L20.25 17.16L20.16 17.1L20.1 17.01L20.08 16.9L20.1 16.8L20.16 16.71L20.25 16.64L20.36 16.62L20.46 16.64L20.56 16.71L20.62 16.8L20.64 16.9L20.62 17.01ZM19.99 13.01L15.73 13.01L15.93 14.02L15.93 14.42L16.64 17.06L16.68 17.33L19.39 17.33L19.49 17.27ZM10.85 16.1L10.59 16.21L10.03 16.44L9.89 17.33L14.13 17.33L14.06 16.8L14.28 16.52L14.03 16.35L13.8 15.41L13.74 15.19L13.35 15.24L13.32 15.24L12.75 15.64ZM16.78 17.67L16.99 18.67L18.78 17.67ZM9.48 20.04L12 21.44L14.62 19.98L14.14 17.67L9.86 17.67ZM14.7 20.32L12 21.82L9.42 20.39L9.23 21.53L11.77 22.94L11.86 22.98L11.95 23L12.05 23L12.14 22.98L12.23 22.94L14.93 21.44ZM10.47 21.72L10.36 21.74L10.26 21.72L10.17 21.66L10.11 21.57L10.09 21.46L10.11 21.36L10.17 21.26L10.26 21.2L10.36 21.18L10.47 21.2L10.56 21.26L10.62 21.36L10.64 21.46L10.62 21.57L10.56 21.66ZM14.03 21.56L13.92 21.58L13.81 21.56L13.72 21.5L13.66 21.41L13.64 21.3L13.66 21.2L13.72 21.11L13.81 21.05L13.92 21.02L14.03 21.05L14.12 21.11L14.18 21.2L14.2 21.3L14.18 21.41L14.12 21.5Z'

type Node = { type: string, props: Record<string, unknown> & { style?: Record<string, unknown>, children?: unknown } }
const h = (type: string, style: Record<string, unknown>, children?: unknown, props: Record<string, unknown> = {}): Node =>
  ({ type, props: { ...props, style: { display: 'flex', ...style }, children } })

const format = new Intl.NumberFormat('en-US').format
const label = (value: number, one: string, many: string) => (value === 1 ? one : many)

/**
 * Text with the word "Angularian(s)" set in the brand font, a size up to match (as the site's `brand` utility):
 * the pieces as flex items, so the line still wraps between them.
 */
function branded(text: string, style: Record<string, unknown>, brandColor?: string): Node {
  const size = Number(style.fontSize ?? 16)
  const pieces = text.split(/(Angularians?)/).filter(Boolean)
  return h('div', { flexWrap: 'wrap', alignItems: 'baseline', columnGap: size * .25, ...style }, pieces.map(piece => /^Angularians?$/.test(piece)
    ? h('span', { fontFamily: 'Norse', fontWeight: 700, fontSize: size * 1.18, letterSpacing: size * .02, ...(brandColor ? { color: brandColor } : {}) }, piece)
    : h('span', {}, piece.trim())))
}

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
        branded(period === 'all' ? `Angularian #${format(profile.rank)}` : `#${format(stats.rank)} ${periodPhrase(period)}`, { fontSize: 30, color: '#a3a3a3', marginTop: 16 }),
        h('div', { fontSize: 36, fontWeight: 600, color: BRAND, marginTop: 16 }, `${format(stats.score)} ${stats.score === 1 ? 'pt' : 'pts'}`),
        ...(since ? [branded(`Angularian since ${since}`, { fontSize: 24, color: '#737373', marginTop: 12 })] : []),
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

/**
 * The home page's link preview: the mark, the title, a line of totals and the first avatars of the board.
 * After nuxt.com's `/nuxters` card (its `Docs` template with a "Community" headline).
 */
export function homeTree(input: { title: string, description: string, avatars: Array<string | null> }): Node {
  const avatars = input.avatars.slice(0, 8)
  return h('div', { width: '100%', height: '100%', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: '#0a0a0a', color: '#ffffff', padding: 72, fontFamily: 'Inter' }, [
    h('div', { flexDirection: 'column' }, [
      h('div', { alignItems: 'center', gap: 16 }, [
        h('svg', { width: 56, height: 56 }, h('path', {}, undefined, { d: MARK, fill: BRAND }), { viewBox: '0 0 24 24', width: 56, height: 56 }),
        branded('Angularians', { fontSize: 40 }, BRAND),
      ]),
      branded(input.title, { fontSize: 76, fontWeight: 600, marginTop: 48, lineHeight: 1.1 }, BRAND),
      h('div', { fontSize: 32, color: '#a3a3a3', marginTop: 24, maxWidth: 980, lineHeight: 1.35 }, input.description),
    ]),
    h('div', { alignItems: 'center', justifyContent: 'space-between' }, [
      h('div', { alignItems: 'center' }, avatars.map((avatar, index) => avatar
        ? h('img', { width: 88, height: 88, borderRadius: 9999, border: '4px solid #0a0a0a', marginLeft: index ? -18 : 0 }, undefined, { src: avatar, width: 88, height: 88 })
        : h('div', { width: 88, height: 88, borderRadius: 9999, border: '4px solid #0a0a0a', backgroundColor: '#262626', marginLeft: index ? -18 : 0 }))),
      h('div', { fontSize: 26, color: '#737373' }, 'angularians.netlify.app'),
    ]),
  ])
}

export interface CardFonts { regular: ArrayBuffer | Buffer, semibold: ArrayBuffer | Buffer, brand?: ArrayBuffer | Buffer | null }

export async function renderCard(tree: Node, fonts: CardFonts): Promise<Buffer> {
  const svg = await satori(tree as never, {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    fonts: [
      { name: 'Inter', data: fonts.regular, weight: 400, style: 'normal' },
      { name: 'Inter', data: fonts.semibold, weight: 600, style: 'normal' },
      ...(fonts.brand ? [{ name: 'Norse', data: fonts.brand, weight: 700 as const, style: 'normal' as const }] : []),
    ],
  })
  return new Resvg(svg, { fitTo: { mode: 'width', value: CARD_WIDTH } }).render().asPng()
}
