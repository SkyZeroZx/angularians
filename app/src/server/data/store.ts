import bundle from './bundle.generated.json'
import type { DataBundle } from './bundle'
import { ContributorsData } from './contributors'

let data: ContributorsData | undefined

/** The contributors of the bundled `data/`, indexed on first use. Shared by API routes and server functions. */
export function contributorsData(): ContributorsData {
  data ??= new ContributorsData(bundle as DataBundle)
  return data
}
