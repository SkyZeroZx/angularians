// The Angularian card: the profile's link preview (og:image) and the GitHub README card, as one PNG.
// After nuxt.com's `OgImage/Nuxter.takumi.vue` (MIT, Copyright (c) 2022-2023 NuxtLabs): the same layout,
// our colours and mark. Only the username and the period are in its URL: the numbers are read when it renders.
import { Resvg } from '@resvg/resvg-js'
import { isPeriod, periodPhrase, type ContributorProfile, type Period } from '@angularians/shared'
import satori from 'satori'

export const CARD_WIDTH = 1200
export const CARD_HEIGHT = 630

/** The brand colour and the profile's stat colours (Tailwind sky-400, violet-400, pink-400). */
const BRAND = '#F9AD26'
const COLORS = { pullRequests: BRAND, issues: '#38BDF8', comments: '#A78BFA', reactions: '#F472B6' }
/** The mark, in its dark colours: [fill, path] of each part (app/scripts/logo/build.py). */
const MARK: Array<[string, string]> = [
  ['#F9AD26', 'M10.26 3.2L10.34 3.41L10.44 3.68L11.28 7.69L11.1 8.16L11.41 8.39L12.67 14.71L12.67 15.08L13.33 17.51L13.4 17.96L13.43 17.96L14.21 21.67L15.44 20.98L11.6 2.69L11.55 2.7L10.26 3.16ZM2.34 6.01L2.28 6.06L2.22 6.12L2.18 6.19L2.15 6.27L2.13 6.35L2.14 6.43L3.51 18.32L3.53 18.4L3.56 18.47L3.61 18.54L3.67 18.6L3.73 18.64L4.51 19.07L4.71 17.96L4.69 17.96L4.76 17.64L5.02 15.99L5.31 15.7L5.28 15.18L5.81 11.96L5.88 11.46L6.04 10.91L6.04 10.44L6.83 6.93L7.3 6.37L7.01 5.98L7.19 4.93L7.35 4.21L2.42 5.98ZM11.56 22.98L11.65 23L11.74 23L11.82 22.98L11.9 22.95L12.03 22.88L11 17.96L11.04 17.96L10.94 17.28L11.15 17.02L10.92 16.86L10.71 15.99L10.65 15.78L10.29 15.84L10.26 15.84L9.74 16.2L7.98 16.62L7.75 16.73L7.22 16.94L7.06 17.96L7.09 17.96L6.71 20.3L11.48 22.95ZM9.34 13.87L10.08 13.69L9.55 10.86L9.45 9.49L9.34 9.02L8.95 6.24L8.43 9.44L8.16 9.57L8.3 9.99L7.95 12.53L7.98 12.51L7.67 14.21L7.64 14.39Z'],
  ['#4A525C', 'M14.51 2.9L14.5 2.95L14.53 3L14.57 3.03L15.48 3.35L15.53 3.36L15.58 3.34L15.61 3.29L15.94 2.38L15.94 2.33L15.92 2.28L15.87 2.25L14.97 1.93L14.91 1.92L14.86 1.94L14.83 1.99ZM12.78 2.62L12.54 2.54L12.68 3.2L12.84 2.76L12.84 2.7L12.82 2.65ZM13.83 4.13L14.15 3.23L14.16 3.17L14.13 3.12L14.09 3.09L13.18 2.77L13.13 2.76L13.08 2.79L13.05 2.83L12.77 3.62L12.82 3.88L13.69 4.2L13.75 4.2L13.8 4.18ZM17.07 4.18L17.02 4.2L16.99 4.24L16.66 5.15L16.66 5.2L16.68 5.25L16.73 5.28L17.63 5.61L17.69 5.61L17.74 5.59L17.77 5.55L18.09 4.64L18.1 4.58L18.07 4.54L18.03 4.51L17.12 4.18ZM13.99 7.5L13.55 7.35L13.77 8.42L14.05 7.64L14.06 7.58L14.03 7.53ZM14.36 10.6L14.22 10.55L14.32 11.02L14.42 10.73L14.43 10.68L14.41 10.63ZM17.34 11.68L17.29 11.71L17.26 11.75L16.94 12.66L16.93 12.71L16.95 12.76L17 12.79L17.91 13.12L17.96 13.12L18.01 13.1L18.04 13.05L18.36 12.15L18.37 12.09L18.35 12.04L18.3 12.01L17.39 11.69ZM15.27 12.46L15.25 12.42L15.2 12.39L14.56 12.15L14.84 13.49L14.86 13.49L14.91 13.47L14.94 13.43L15.27 12.52ZM15.23 15.36L15.41 16.24L15.64 15.61L15.64 15.56L15.62 15.51L15.58 15.48ZM16.25 18.74L16.22 18.79L16.05 19.27L16.06 19.3L16.8 18.89L16.35 18.73L16.3 18.72ZM18.45 4.31L18.44 4.36L18.47 4.41L18.51 4.44L19.42 4.77L19.47 4.77L19.52 4.75L19.55 4.7L19.88 3.8L19.88 3.74L19.86 3.69L19.81 3.66L18.9 3.34L18.85 3.33L18.8 3.36L18.77 3.4ZM19.22 6.43L19.17 6.45L19.14 6.5L18.82 7.41L18.81 7.46L18.84 7.51L18.88 7.54L19.79 7.86L19.84 7.87L19.89 7.84L19.92 7.8L20.25 6.89L20.25 6.84L20.23 6.79L20.18 6.76L19.28 6.44ZM20.97 9.71L20.99 9.76L21.04 9.79L21.27 9.88L21.41 8.69L21.38 8.69L21.33 8.71L21.3 8.75L20.97 9.66ZM19.55 9.55L19.52 9.59L19.19 10.5L19.19 10.56L19.21 10.6L19.25 10.64L20.16 10.96L20.21 10.96L20.26 10.94L20.29 10.9L20.62 9.99L20.62 9.94L20.6 9.89L20.56 9.86L19.65 9.53L19.59 9.53ZM18.65 12.15L18.6 12.18L18.57 12.22L18.25 13.13L18.24 13.18L18.27 13.23L18.31 13.26L19.22 13.59L19.27 13.59L19.32 13.57L19.35 13.52L19.68 12.62L19.68 12.56L19.66 12.51L19.61 12.48L18.71 12.16ZM18.18 13.47L18.13 13.49L18.1 13.53L17.78 14.44L17.77 14.5L17.8 14.54L17.84 14.57L18.75 14.9L18.8 14.9L18.85 14.88L18.88 14.84L19.21 13.93L19.21 13.88L19.19 13.83L19.14 13.8L18.24 13.47ZM20.42 15.49L20.47 15.52L20.61 15.57L20.74 14.47L20.73 14.48L20.4 15.38L20.4 15.44ZM20.58 15.8L20.39 15.73L20.34 15.72L20.29 15.75L20.26 15.79L19.93 16.7L19.93 16.75L19.95 16.8L20 16.83L20.3 16.94L20.33 16.92L20.39 16.86L20.44 16.79L20.47 16.72L20.49 16.64ZM17.88 18.29L18.43 17.99L18.14 17.88L18.08 17.88L18.04 17.9L18 17.95Z'],
  ['#653E00', 'M12.23 1.01L12.22 1.02L12.49 2.28L12.85 2.41L12.9 2.42L12.95 2.39L12.98 2.35L13.31 1.44L13.31 1.39L13.29 1.34L13.25 1.31L12.6 1.08L12.45 1.03L12.38 1.01L12.31 1ZM13.19 2.48L13.21 2.53L13.26 2.56L14.16 2.88L14.22 2.89L14.27 2.86L14.3 2.82L14.62 1.91L14.63 1.86L14.6 1.81L14.56 1.78L13.65 1.46L13.6 1.45L13.55 1.47L13.52 1.52L13.19 2.43ZM14.39 3.26L14.36 3.3L14.04 4.21L14.03 4.26L14.06 4.31L14.1 4.34L15.01 4.67L15.06 4.67L15.11 4.65L15.14 4.6L15.46 3.7L15.47 3.64L15.45 3.59L15.4 3.56L14.49 3.24L14.44 3.23ZM15.75 3.71L15.71 3.73L15.68 3.77L15.35 4.68L15.35 4.73L15.37 4.78L15.41 4.81L16.32 5.14L16.37 5.14L16.42 5.12L16.45 5.08L16.78 4.17L16.78 4.11L16.76 4.07L16.72 4.04L15.81 3.71ZM13.68 4.54L13.69 4.49L13.66 4.44L13.62 4.41L12.88 4.14L13.16 5.49L13.22 5.51L13.28 5.51L13.32 5.49L13.36 5.45ZM14.76 6.35L14.73 6.4L14.41 7.31L14.4 7.36L14.43 7.41L14.47 7.44L15.38 7.76L15.43 7.77L15.48 7.75L15.51 7.7L15.84 6.79L15.84 6.74L15.82 6.69L15.77 6.66L14.87 6.34L14.81 6.33ZM14.34 7.65L14.29 7.67L14.26 7.71L13.94 8.62L13.93 8.67L13.96 8.72L14 8.75L14.91 9.08L14.96 9.08L15.01 9.06L15.04 9.01L15.37 8.11L15.37 8.05L15.35 8.01L15.3 7.97L14.4 7.65ZM16.92 8.61L16.89 8.65L16.56 9.56L16.56 9.61L16.58 9.66L16.63 9.69L17.53 10.02L17.59 10.02L17.64 10L17.67 9.96L17.99 9.05L18 9L17.97 8.95L17.93 8.92L17.02 8.59L16.97 8.59ZM14.89 9.42L14.9 9.37L14.88 9.32L14.83 9.29L13.92 8.96L13.89 8.96L14.17 10.29L14.44 10.39L14.49 10.4L14.54 10.37L14.57 10.33ZM15.14 9.45L15.11 9.5L14.78 10.4L14.78 10.46L14.8 10.51L14.84 10.54L15.75 10.86L15.8 10.87L15.85 10.84L15.88 10.8L16.21 9.89L16.21 9.84L16.19 9.79L16.15 9.76L15.24 9.43L15.18 9.43ZM15.74 11.2L15.74 11.15L15.72 11.1L15.67 11.07L14.77 10.75L14.71 10.74L14.67 10.77L14.63 10.81L14.41 11.44L14.5 11.9L15.28 12.17L15.33 12.18L15.38 12.16L15.41 12.11ZM15.51 12.55L15.48 12.59L15.15 13.5L15.15 13.55L15.17 13.6L15.21 13.63L16.12 13.96L16.18 13.96L16.22 13.94L16.25 13.9L16.58 12.99L16.58 12.93L16.56 12.89L16.52 12.86L15.61 12.53L15.56 12.53ZM16.11 14.3L16.11 14.25L16.09 14.2L16.05 14.17L15.14 13.84L15.09 13.84L15.04 13.86L15.01 13.91L14.95 14.05L15.18 15.1L15.65 15.27L15.7 15.28L15.75 15.25L15.78 15.21ZM16.16 18.31L16.48 17.4L16.48 17.35L16.46 17.3L16.42 17.27L15.57 16.96L15.85 18.31L16.02 18.37L16.08 18.37L16.12 18.35ZM17.13 3.89L17.15 3.94L17.2 3.97L18.1 4.3L18.16 4.3L18.21 4.28L18.24 4.23L18.56 3.32L18.57 3.27L18.54 3.22L18.5 3.19L17.59 2.87L17.54 2.86L17.49 2.89L17.46 2.93L17.13 3.84ZM19.76 4.83L19.78 4.88L19.82 4.91L20.73 5.24L20.78 5.24L20.83 5.22L20.86 5.17L21.19 4.27L21.19 4.21L21.17 4.16L21.13 4.13L20.22 3.81L20.16 3.8L20.12 3.83L20.09 3.87L19.76 4.78ZM21.72 4.38L21.66 4.33L21.58 4.3L21.53 4.28L21.48 4.28L21.43 4.3L21.4 4.34L21.07 5.25L21.07 5.3L21.09 5.35L21.14 5.38L21.76 5.61L21.86 4.75L21.87 4.67L21.85 4.59L21.82 4.51L21.78 4.44ZM19.65 5.14L19.62 5.18L19.29 6.09L19.29 6.15L19.31 6.19L19.35 6.22L20.26 6.55L20.31 6.55L20.36 6.53L20.39 6.49L20.72 5.58L20.72 5.53L20.7 5.48L20.66 5.45L19.75 5.12L19.69 5.12ZM20.49 6.92L20.46 6.97L20.13 7.88L20.13 7.93L20.15 7.98L20.19 8.01L21.1 8.33L21.16 8.34L21.2 8.32L21.23 8.27L21.56 7.36L21.56 7.31L21.54 7.26L21.5 7.23L20.59 6.91L20.54 6.9ZM20.02 8.24L19.99 8.28L19.66 9.19L19.66 9.24L19.68 9.29L19.72 9.32L20.63 9.65L20.68 9.65L20.73 9.63L20.76 9.58L21.09 8.68L21.09 8.62L21.07 8.58L21.03 8.54L20.12 8.22L20.07 8.21ZM20.83 10.07L20.5 10.97L20.5 11.03L20.52 11.08L20.57 11.11L21.1 11.3L21.24 10.1L20.96 10L20.91 10L20.86 10.02ZM17.76 10.39L17.73 10.44L17.41 11.35L17.4 11.4L17.42 11.45L17.47 11.48L18.38 11.8L18.43 11.81L18.48 11.78L18.51 11.74L18.83 10.83L18.84 10.78L18.82 10.73L18.77 10.7L17.86 10.37L17.81 10.37ZM20.03 12.29L20.03 12.34L20.05 12.39L20.1 12.42L20.94 12.72L21.08 11.53L20.49 11.32L20.44 11.31L20.39 11.33L20.36 11.38ZM19.45 13.96L19.42 14.01L19.09 14.91L19.09 14.97L19.11 15.01L19.15 15.05L20.06 15.37L20.12 15.38L20.16 15.35L20.19 15.31L20.52 14.4L20.52 14.35L20.5 14.3L20.46 14.27L19.55 13.94L19.5 13.94ZM18.98 15.27L18.95 15.32L18.62 16.23L18.62 16.28L18.64 16.33L18.68 16.36L19.59 16.68L19.64 16.69L19.69 16.67L19.72 16.62L20.05 15.71L20.05 15.66L20.03 15.61L19.99 15.58L19.08 15.26L19.02 15.25ZM17.19 16.12L17.16 16.16L16.84 17.07L16.83 17.12L16.86 17.17L16.9 17.2L17.81 17.53L17.86 17.53L17.91 17.51L17.94 17.46L18.26 16.56L18.27 16.5L18.25 16.45L18.2 16.42L17.29 16.1L17.24 16.09ZM18.61 16.57L18.55 16.57L18.51 16.59L18.48 16.63L18.15 17.54L18.15 17.59L18.17 17.64L18.21 17.67L18.69 17.84L19.43 17.43L19.58 17.03L19.58 16.97L19.56 16.93L19.52 16.89Z'],
  ['#965E00', 'M18.43 4.65L18.38 4.65L18.33 4.67L18.3 4.71L17.98 5.62L17.97 5.67L17.99 5.72L18.04 5.75L18.95 6.08L19 6.08L19.05 6.06L19.08 6.02L19.4 5.11L19.41 5.06L19.39 5.01L19.34 4.98ZM15.34 5.02L15.28 5.02L15.24 5.04L15.2 5.09L14.88 5.99L14.87 6.05L14.9 6.09L14.94 6.13L15.85 6.45L15.9 6.46L15.95 6.43L15.98 6.39L16.31 5.48L16.31 5.43L16.29 5.38L16.24 5.35ZM20.96 5.61L20.93 5.66L20.6 6.56L20.6 6.62L20.62 6.66L20.67 6.7L21.57 7.02L21.6 7.02L21.74 5.84L21.06 5.59L21.01 5.59ZM18.33 9.06L18.28 9.06L18.23 9.08L18.2 9.12L17.88 10.03L17.87 10.09L17.9 10.13L17.94 10.16L18.85 10.49L18.9 10.49L18.95 10.47L18.98 10.43L19.31 9.52L19.31 9.47L19.29 9.42L19.24 9.39ZM16.55 9.9L16.5 9.9L16.45 9.92L16.42 9.97L16.09 10.87L16.09 10.93L16.11 10.98L16.16 11.01L17.06 11.33L17.12 11.34L17.17 11.31L17.2 11.27L17.52 10.36L17.53 10.31L17.5 10.26L17.46 10.23ZM16.08 11.22L16.03 11.21L15.98 11.24L15.95 11.28L15.62 12.19L15.62 12.24L15.64 12.29L15.68 12.32L16.59 12.65L16.65 12.65L16.69 12.63L16.72 12.58L17.05 11.68L17.05 11.62L17.03 11.57L16.99 11.54ZM16.92 13L16.87 13L16.82 13.02L16.79 13.06L16.46 13.97L16.46 14.03L16.48 14.07L16.53 14.1L17.44 14.43L17.49 14.43L17.54 14.41L17.57 14.37L17.89 13.46L17.9 13.41L17.87 13.36L17.83 13.33ZM17.71 14.78L17.66 14.8L17.63 14.85L17.31 15.76L17.3 15.81L17.33 15.86L17.37 15.89L18.28 16.21L18.33 16.22L18.38 16.19L18.41 16.15L18.74 15.24L18.74 15.19L18.72 15.14L18.67 15.11L17.77 14.79ZM17.73 17.74L16.82 17.41L16.77 17.41L16.72 17.43L16.69 17.47L16.37 18.38L16.36 18.44L16.38 18.48L16.43 18.51L17.06 18.74L17.58 18.45L17.79 17.87L17.8 17.82L17.78 17.77Z'],
  ['#F9AD26', 'M16.15 2.46L15.82 3.37L15.82 3.42L15.84 3.47L15.88 3.5L16.79 3.82L16.84 3.83L16.89 3.81L16.92 3.76L17.25 2.85L17.25 2.8L17.23 2.75L17.19 2.72L16.28 2.4L16.23 2.39L16.18 2.42ZM13.97 4.55L13.92 4.57L13.89 4.61L13.57 5.52L13.56 5.58L13.58 5.62L13.63 5.65L14.54 5.98L14.59 5.98L14.64 5.96L14.67 5.92L14.99 5.01L15 4.96L14.98 4.91L14.93 4.88L14.02 4.55ZM14.2 7.23L14.52 6.32L14.53 6.27L14.5 6.22L14.46 6.19L13.55 5.87L13.5 5.86L13.45 5.88L13.42 5.93L13.31 6.23L13.49 7.09L14.07 7.29L14.12 7.3L14.17 7.27ZM16.18 6.81L16.13 6.8L16.08 6.83L16.05 6.87L15.72 7.78L15.72 7.83L15.74 7.88L15.78 7.91L16.69 8.23L16.75 8.24L16.79 8.22L16.82 8.17L17.15 7.26L17.15 7.21L17.13 7.16L17.09 7.13ZM15.66 8.12L15.61 8.14L15.58 8.18L15.25 9.09L15.25 9.14L15.27 9.19L15.31 9.22L16.22 9.55L16.27 9.55L16.32 9.53L16.35 9.49L16.68 8.58L16.68 8.52L16.66 8.48L16.62 8.45L15.71 8.12ZM16.4 14.31L16.35 14.33L16.32 14.38L15.99 15.28L15.99 15.34L16.01 15.39L16.06 15.42L16.96 15.74L17.02 15.75L17.07 15.72L17.1 15.68L17.42 14.77L17.43 14.72L17.4 14.67L17.36 14.64L16.45 14.31ZM15.98 15.63L15.93 15.62L15.88 15.65L15.85 15.69L15.52 16.6L15.52 16.65L15.54 16.7L15.59 16.73L16.49 17.06L16.55 17.06L16.6 17.04L16.63 16.99L16.95 16.09L16.96 16.03L16.93 15.98L16.89 15.95ZM16.6 5.49L16.55 5.51L16.52 5.56L16.19 6.46L16.19 6.52L16.21 6.57L16.25 6.6L17.16 6.92L17.22 6.93L17.26 6.9L17.29 6.86L17.62 5.95L17.62 5.9L17.6 5.85L17.56 5.82L16.65 5.49ZM17.91 5.96L17.86 5.98L17.83 6.03L17.51 6.93L17.5 6.99L17.52 7.04L17.57 7.07L18.48 7.39L18.53 7.4L18.58 7.37L18.61 7.33L18.93 6.42L18.94 6.37L18.92 6.32L18.87 6.29L17.96 5.96ZM17.44 7.27L17.39 7.3L17.36 7.34L17.03 8.25L17.03 8.3L17.05 8.35L17.1 8.38L18.01 8.71L18.06 8.71L18.11 8.69L18.14 8.64L18.46 7.74L18.47 7.68L18.44 7.63L18.4 7.6L17.49 7.28ZM18.75 7.74L18.7 7.77L18.67 7.81L18.35 8.72L18.34 8.77L18.37 8.82L18.41 8.85L19.32 9.18L19.37 9.18L19.42 9.16L19.45 9.11L19.78 8.21L19.78 8.15L19.76 8.1L19.71 8.07L18.81 7.75ZM19.12 10.84L19.08 10.86L19.05 10.91L18.72 11.82L18.72 11.87L18.74 11.92L18.78 11.95L19.69 12.27L19.74 12.28L19.79 12.26L19.82 12.21L20.15 11.3L20.15 11.25L20.13 11.2L20.09 11.17L19.18 10.85ZM19.89 12.69L19.56 13.6L19.56 13.65L19.58 13.7L19.62 13.73L20.53 14.06L20.59 14.06L20.63 14.04L20.66 14L20.85 13.47L20.91 12.95L20.02 12.63L19.97 12.63L19.92 12.65Z'],
]

type Node = { type: string, props: Record<string, unknown> & { style?: Record<string, unknown>, children?: unknown } }
const h = (type: string, style: Record<string, unknown>, children?: unknown, props: Record<string, unknown> = {}): Node =>
  ({ type, props: { ...props, style: { display: 'flex', ...style }, children } })

/** Satori sets Norse a little high on the baseline: moved down by this much of the font size, measured. */
const NUDGE = 0.09
const markSvg = (size: number): Node =>
  h('svg', { width: size, height: size }, MARK.map(([fill, d]) => h('path', {}, undefined, { d, fill })), { viewBox: '0 0 24 24', width: size, height: size })

const format = new Intl.NumberFormat('en-US').format
const label = (value: number, one: string, many: string) => (value === 1 ? one : many)

/**
 * Text with the word "Angularian(s)" set in the brand font (its capitals are as tall as Inter's):
 * the pieces as flex items, so the line still wraps between them.
 */
function branded(text: string, style: Record<string, unknown>, brandColor?: string): Node {
  const size = Number(style.fontSize ?? 16)
  const pieces = text.split(/(Angularians?)/).filter(Boolean)
  return h('div', { flexWrap: 'wrap', alignItems: 'baseline', columnGap: size * .25, ...style }, pieces.map(piece => /^Angularians?$/.test(piece)
    ? h('span', { fontFamily: 'Norse', fontWeight: 700, fontSize: size, letterSpacing: size * .02, position: 'relative', top: size * NUDGE, ...(brandColor ? { color: brandColor } : {}) }, piece)
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
      markSvg(48),
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
        markSvg(56),
        // Norse's capitals sit high in their line box: moved down so they centre on the mark.
        h('div', { fontFamily: 'Norse', fontWeight: 700, fontSize: 48, letterSpacing: 1, color: BRAND, lineHeight: 1, marginTop: 13 }, 'Angularians'),
      ]),
      branded(input.title, { fontSize: 76, fontWeight: 600, marginTop: 48, lineHeight: 1.1 }, BRAND),
      h('div', { fontSize: 32, color: '#a3a3a3', marginTop: 24, maxWidth: 980, lineHeight: 1.35 }, input.description),
    ]),
    h('div', { alignItems: 'center', justifyContent: 'space-between' }, [
      h('div', { alignItems: 'center' }, avatars.map((avatar, index) => avatar
        ? h('img', { width: 88, height: 88, borderRadius: 9999, border: '4px solid #0a0a0a', marginLeft: index ? -18 : 0 }, undefined, { src: avatar, width: 88, height: 88 })
        : h('div', { width: 88, height: 88, borderRadius: 9999, border: '4px solid #0a0a0a', backgroundColor: '#262626', marginLeft: index ? -18 : 0 }))),
      h('div', { fontSize: 26, color: '#737373' }, 'angularians.dev'),
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
