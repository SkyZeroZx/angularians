// Location cases ported from nuxt/nuxters `test/unit/countries.spec.ts` (MIT, Copyright (c) 2023 Nuxt).
import { describe, expect, it } from 'vitest'
import { COUNTRIES, countryCode, countryName } from '../src/countries.ts'
import { countryFromLocation, parseCountryIndex } from '../src/location.ts'

// The columns of GeoNames `countryInfo.txt` and `cities15000.txt` that the index reads.
const countryInfo = [
  '#ISO\tISO3\tISO-Numeric\tfips\tCountry',
  'FR\tFRA\t250\tFR\tFrance',
  'DE\tDEU\t276\tGM\tGermany',
  'ES\tESP\t724\tSP\tSpain',
  'US\tUSA\t840\tUS\tUnited States',
  'CA\tCAN\t124\tCA\tCanada',
  'TR\tTUR\t792\tTU\tTurkey',
  'AN\tANT\t530\tNT\tNetherlands Antilles',
].join('\n')

const city = (name: string, country: string, population: number, alternateNames = '', region = '') =>
  ['1', name, name, alternateNames, '0', '0', 'P', 'PPL', country, '', region, '', '', '', String(population)].join('\t')

const index = parseCountryIndex(countryInfo, [
  city('Paris', 'FR', 2_100_000),
  city('Paris', 'US', 25_000, '', 'TX'),
  city('San Francisco', 'US', 870_000, 'SF,CA', 'CA'),
  city('Toronto', 'CA', 2_700_000, '', '08'),
  city('Cambridge', 'GB', 145_000),
  city('Cambridge', 'US', 118_000, '', 'MA'),
  city('Montréal', 'CA', 1_700_000, 'Montreal'),
  city('İzmir', 'TR', 2_900_000, 'Izmir'),
].join('\n'))

describe('countryFromLocation', () => {
  it.each([
    ['Lyon, France', 'FR'],
    ['Paris', 'FR'],
    ['San Francisco, CA', 'US'],
    ['Toronto, CA', 'CA'],
    ['Montreal', 'CA'],
    ['New York, USA', 'US'],
    ['London, UK', 'GB'],
    ['Paris, TX', 'US'],
    ['Cambridge, MA', 'US'],
    ['Cambridge', 'GB'],
    ['Deutschland', 'DE'],
    ['Madrid, España', 'ES'],
    ['Estados Unidos', 'US'],
    ['Izmir', 'TR'],
    ['İzmir, Türkiye', 'TR'],
  ])('%s → %s', (location, country) => {
    expect(countryFromLocation(location, index)).toBe(country)
  })

  it.each([null, '', 'Remote', 'localhost:3000', 'CA', 'SF', 'Netherlands Antilles'])('%s → null', (location) => {
    expect(countryFromLocation(location, index)).toBeNull()
  })
})

describe('COUNTRIES', () => {
  it('names countries and validates codes', () => {
    expect(countryName('TR')).toBe('Turkey')
    expect(countryName('XX')).toBe('XX')
    expect(countryCode('fr')).toBe('FR')
    expect(countryCode('XX')).toBeNull()
    expect(countryCode(42)).toBeNull()
  })

  it('has a name for every code, and locations on the globe', () => {
    for (const [code, country] of Object.entries(COUNTRIES)) {
      expect(code).toMatch(/^[A-Z]{2}$/)
      expect(country.name.trim()).toBe(country.name)
      if (country.location) {
        const [lat, lng] = country.location
        expect(Math.abs(lat)).toBeLessThanOrEqual(90)
        expect(Math.abs(lng)).toBeLessThanOrEqual(180)
      }
    }
  })
})
