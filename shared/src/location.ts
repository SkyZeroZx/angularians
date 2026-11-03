// Ported from nuxt/nuxters `scripts/utils/countries.ts` (MIT, Copyright (c) 2023 Nuxt).
// The download of the GeoNames dumps stays in the collector: this file only parses and matches.

/**
 * The country of a free-form GitHub location ("Lyon, France", "Paris", "Austin, TX"),
 * as an ISO 3166-1 alpha-2 code. Names come from GeoNames (CC BY 4.0): countries, and cities of 15,000+ people
 * (`countryInfo.txt` and `cities15000.txt`).
 */
export type CountryIndex = {
  /** Normalized country name or ISO3 code → ISO2 code */
  countries: Map<string, string>
  /** Normalized city name → ISO2 code of the most populated city of that name */
  cities: Map<string, { country: string, population: number }>
  /** Normalized city name and letter region code ("paris|tx") → ISO2 code */
  regions: Map<string, string>
}

const COUNTRY_ALIASES: Record<string, string> = { uk: 'GB', england: 'GB', scotland: 'GB', wales: 'GB' }
/** Still listed by GeoNames, dissolved: Netherlands Antilles, Serbia and Montenegro. */
const DISSOLVED = new Set(['AN', 'CS'])
/** Country names in these languages too ("Deutschland", "España"): GeoNames only has the English ones. */
const LOCALES = ['de', 'es', 'fr', 'it', 'pt', 'nl', 'pl', 'sv', 'da', 'nb', 'fi', 'cs', 'tr', 'ro', 'hu', 'id', 'vi']

const normalize = (value: string) => value
  .normalize('NFKD')
  .replace(/[̀-ͯ]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()

/** Build the index from GeoNames `countryInfo.txt` and a `cities*.txt` dump. */
export function parseCountryIndex(countryInfo: string, cityDump: string): CountryIndex {
  const countries = new Map(Object.entries(COUNTRY_ALIASES))
  for (const line of countryInfo.split('\n')) {
    const [code, iso3, , , name] = line.split('\t')
    if (line.startsWith('#') || !code || !iso3 || !name || DISSOLVED.has(code)) continue
    countries.set(normalize(iso3), code)
    countries.set(normalize(name), code)
  }
  for (const code of new Set(countries.values())) {
    for (const locale of LOCALES) {
      const key = normalize(new Intl.DisplayNames([locale], { type: 'region' }).of(code) ?? '')
      // English first: a localized name never replaces another country's English one.
      if (key && !countries.has(key)) countries.set(key, code)
    }
  }

  const cities: CountryIndex['cities'] = new Map()
  const regions: CountryIndex['regions'] = new Map()
  for (const line of cityDump.split('\n')) {
    const fields = line.split('\t')
    const [, name, asciiName, alternateNames] = fields
    const country = fields[8]
    // US states and a few other countries: "TX", "CA". Numeric codes ("08") are not what people write.
    const region = /^[A-Z]{2}$/.test(fields[10] ?? '') ? fields[10]!.toLowerCase() : null
    const population = Number(fields[14] || 0)
    if (!name || !country) continue
    for (const candidate of [name, asciiName, ...(alternateNames?.split(',') ?? [])]) {
      const key = normalize(candidate ?? '')
      // Two-letter names are codes ("CA" is Canada and California), not cities.
      if (key.length > 2 && population > (cities.get(key)?.population ?? -1)) {
        cities.set(key, { country, population })
      }
      if (key.length > 2 && region) regions.set(`${key}|${region}`, country)
    }
  }
  return { countries, cities, regions }
}

/**
 * A city and its region code ("Paris, TX") is in that region's country. A location ending with a country
 * ("Lyon, France") is in that country. Otherwise the city decides, the most populated one of that name.
 * Two-letter codes alone match nothing: "CA" is Canada and California.
 */
export function countryFromLocation(location: string | null | undefined, index: CountryIndex): string | null {
  const parts = (location ?? '').split(/[,/|·•()]|\s+-\s+/).map(normalize).filter(Boolean)
  const region = parts.length > 1 ? index.regions.get(`${parts[0]}|${parts.at(-1)}`) : undefined
  if (region) return region
  const country = index.countries.get(parts.at(-1) ?? '')
  if (country) return country
  for (const part of parts) {
    const city = index.cities.get(part)
    if (city) return city.country
  }
  return null
}
