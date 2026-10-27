export interface NeighborhoodEntity {
  name: string;
  postalCode: string;
  coords?: [number, number]; // [latitude, longitude]
}

export interface MunicipalityMeta {
  cityName: string;
  county: 'King County' | 'Pierce County';
  zipCodes: string[];
  coords: [number, number];
  wikidataUri: string;
  neighborhoods?: string[];
  neighborhoodEntities?: NeighborhoodEntity[];
  majorCorridors?: string[];
  transferStation?: string;
  donationPartners?: string[];
  landmarks?: string[];
}

export const AUTHORIZED_MUNICIPALITIES: Record<string, MunicipalityMeta> = {
  'federal-way': {
    cityName: 'Federal Way',
    county: 'King County',
    zipCodes: ['98001', '98003', '98023', '98063', '98093'],
    coords: [47.3223, -122.3126],
    wikidataUri: 'https://www.wikidata.org/wiki/Q852586',
    neighborhoods: [
      'Twin Lakes',
      'Campus Reserve',
      'Marine Hills',
      'Mirror Lake',
      'Lakota & Buenna',
      'Adelaide',
      'Steel Lake',
      'Redondo'
    ],
    neighborhoodEntities: [
      { name: 'Twin Lakes', postalCode: '98023', coords: [47.3155, -122.3789] },
      { name: 'Campus Reserve', postalCode: '98023', coords: [47.2975, -122.3550] },
      { name: 'Marine Hills', postalCode: '98023', coords: [47.3385, -122.3550] },
      { name: 'Mirror Lake', postalCode: '98003', coords: [47.3045, -122.3380] },
      { name: 'Lakota & Buenna', postalCode: '98023', coords: [47.3275, -122.3850] },
      { name: 'Adelaide', postalCode: '98023', coords: [47.3375, -122.3750] },
      { name: 'Steel Lake', postalCode: '98003', coords: [47.3085, -122.3160] },
      { name: 'Redondo', postalCode: '98023', coords: [47.3485, -122.3320] }
    ],
    majorCorridors: [
      'Pacific Hwy S (Hwy 99)',
      'SR-18',
      'SW Campus Dr',
      'SW 320th St near The Commons'
    ],
    transferStation: 'King County Algona Transfer Station & Bow Lake Recycling',
    donationPartners: [
      'Federal Way St. Vincent de Paul',
      'Federal Way Goodwill'
    ],
    landmarks: [
      'The Commons at Federal Way',
      'Celebration Park',
      'Federal Way Community Center',
      'Steel Lake Park'
    ]
  },
  'auburn': {
    cityName: 'Auburn',
    county: 'King County',
    zipCodes: ['98001', '98002', '98071', '98092'],
    coords: [47.3073, -122.2285],
    wikidataUri: 'https://www.wikidata.org/wiki/Q758414',
    neighborhoods: ['Lea Hill', 'West Hill', 'Lakeland Hills', 'North Auburn', 'Game Farm Wilderness'],
    neighborhoodEntities: [
      { name: 'Lea Hill', postalCode: '98092', coords: [47.3285, -122.1850] },
      { name: 'West Hill', postalCode: '98001', coords: [47.3100, -122.2550] },
      { name: 'Lakeland Hills', postalCode: '98092', coords: [47.2750, -122.2150] },
      { name: 'North Auburn', postalCode: '98002', coords: [47.3300, -122.2250] },
      { name: 'Game Farm Wilderness', postalCode: '98002', coords: [47.2950, -122.2050] }
    ],
    majorCorridors: ['SR-167 (Valley Freeway)', 'SR-18', 'Auburn Way S / Auburn Way N'],
    transferStation: 'Algona Transfer Station & Bow Lake Recycling',
    donationPartners: ['Auburn Valley Humane Society Thrift', 'Auburn Goodwill']
  },
  'kent': {
    cityName: 'Kent',
    county: 'King County',
    zipCodes: ['98030', '98031', '98032', '98035', '98042', '98064'],
    coords: [47.3809, -122.2348],
    wikidataUri: 'https://www.wikidata.org/wiki/Q852579',
    neighborhoods: ['Kent East Hill', 'West Hill', 'Valley Industrial Park', 'Lake Meridian', 'Panther Lake'],
    neighborhoodEntities: [
      { name: 'Kent East Hill', postalCode: '98031', coords: [47.3850, -122.2050] },
      { name: 'West Hill', postalCode: '98032', coords: [47.3850, -122.2650] },
      { name: 'Valley Industrial Park', postalCode: '98032', coords: [47.4100, -122.2450] },
      { name: 'Lake Meridian', postalCode: '98042', coords: [47.3650, -122.1650] },
      { name: 'Panther Lake', postalCode: '98031', coords: [47.3750, -122.1950] }
    ],
    majorCorridors: ['SR-167', 'I-5 (Exit 149)', 'Central Ave', 'SE 256th St'],
    transferStation: 'Bow Lake Recycling and Transfer Station',
    donationPartners: ['Kent Valley Goodwill', 'St. Vincent de Paul Kent']
  },
  'tacoma': {
    cityName: 'Tacoma',
    county: 'Pierce County',
    zipCodes: ['98402', '98403', '98404', '98405', '98406', '98407', '98408', '98409', '98416', '98418', '98421', '98422'],
    coords: [47.2529, -122.4443],
    wikidataUri: 'https://www.wikidata.org/wiki/Q202488',
    neighborhoods: ['North End', 'Proctor District', 'South Tacoma', 'NE Tacoma', 'Hilltop', 'Point Ruston', 'Fern Hill'],
    neighborhoodEntities: [
      { name: 'North End', postalCode: '98406', coords: [47.2650, -122.4850] },
      { name: 'Proctor District', postalCode: '98406', coords: [47.2700, -122.4850] },
      { name: 'South Tacoma', postalCode: '98409', coords: [47.2050, -122.4750] },
      { name: 'NE Tacoma', postalCode: '98422', coords: [47.2850, -122.3850] },
      { name: 'Hilltop', postalCode: '98405', coords: [47.2500, -122.4550] },
      { name: 'Point Ruston', postalCode: '98407', coords: [47.3000, -122.5050] },
      { name: 'Fern Hill', postalCode: '98408', coords: [47.1950, -122.4350] }
    ],
    majorCorridors: ['I-5', 'SR-16', 'Pacific Ave', '6th Ave'],
    transferStation: 'City of Tacoma Recovery & Transfer Center (S Mullen St)',
    donationPartners: ['Tacoma Goodwill', 'St. Vincent de Paul Tacoma']
  },
  'edgewood': {
    cityName: 'Edgewood',
    county: 'Pierce County',
    zipCodes: ['98371', '98372'],
    coords: [47.2504, -122.2935],
    wikidataUri: 'https://www.wikidata.org/wiki/Q852583',
    neighborhoods: ['North Edgewood', 'Jovita', 'Surprise Lake', 'Edgewood Plateau'],
    neighborhoodEntities: [
      { name: 'North Edgewood', postalCode: '98371', coords: [47.2600, -122.2900] },
      { name: 'Jovita', postalCode: '98372', coords: [47.2550, -122.2800] },
      { name: 'Surprise Lake', postalCode: '98372', coords: [47.2500, -122.3000] },
      { name: 'Edgewood Plateau', postalCode: '98371', coords: [47.2450, -122.2950] }
    ],
    majorCorridors: ['Meridian Ave E (SR-161)', 'Freeman Rd E', 'Valley Ave E'],
    transferStation: 'Pierce County Hidden Valley Transfer Station',
    donationPartners: ['Puyallup Valley Goodwill', 'St. Francis House']
  },
  'des-moines': {
    cityName: 'Des Moines',
    county: 'King County',
    zipCodes: ['98198'],
    coords: [47.4018, -122.3243],
    wikidataUri: 'https://www.wikidata.org/wiki/Q852581',
    neighborhoods: ['Marina District', 'North Hill', 'Pacific Ridge', 'Woodmont Beach', 'Redondo Beach'],
    neighborhoodEntities: [
      { name: 'Marina District', postalCode: '98198', coords: [47.4018, -122.3243] },
      { name: 'North Hill', postalCode: '98198', coords: [47.4200, -122.3200] },
      { name: 'Pacific Ridge', postalCode: '98198', coords: [47.3950, -122.3150] },
      { name: 'Woodmont Beach', postalCode: '98198', coords: [47.3750, -122.3250] },
      { name: 'Redondo Beach', postalCode: '98198', coords: [47.3550, -122.3250] }
    ],
    majorCorridors: ['Marine View Dr S', 'Pacific Hwy S (SR-99)', 'Kent-Des Moines Rd (SR-516)', 'I-5'],
    transferStation: 'King County Bow Lake Recycling and Transfer Station',
    donationPartners: ['Des Moines Goodwill', 'St. Vincent de Paul']
  },
  'milton': {
    cityName: 'Milton',
    county: 'Pierce County',
    zipCodes: ['98354'],
    coords: [47.2498, -122.3168],
    wikidataUri: 'https://www.wikidata.org/wiki/Q1936495',
    neighborhoods: ['North Milton', 'Surprise Lake Border', 'Fife Heights Border', 'Milton Interurban'],
    majorCorridors: ['Meridian Ave E (SR-161)', 'Milton Way', 'Pacific Hwy E'],
    transferStation: 'Pierce County Hidden Valley Transfer Station',
    donationPartners: ['Puyallup Valley Goodwill', 'St. Francis House']
  },
  'pacific': {
    cityName: 'Pacific',
    county: 'King County',
    zipCodes: ['98047'],
    coords: [47.2648, -122.2479],
    wikidataUri: 'https://www.wikidata.org/wiki/Q852601',
    neighborhoods: ['City Center', 'White River Border', 'Milwaukee Ave District', 'Pacific Meadows'],
    majorCorridors: ['SR-167', 'Valentine Ave SE', 'Thornton Ave SW', '3rd Ave SE'],
    transferStation: 'King County Algona Transfer Station',
    donationPartners: ['Auburn Goodwill', 'Auburn Valley Humane Society Thrift']
  },
  'algona': {
    cityName: 'Algona',
    county: 'King County',
    zipCodes: ['98001'],
    coords: [47.2798, -122.2501],
    wikidataUri: 'https://www.wikidata.org/wiki/Q852569',
    neighborhoods: ['Algona City Center', 'Matchett District', 'Algona Wetland Buffer'],
    majorCorridors: ['SR-167', 'Algona Blvd N', '1st Ave N', 'West Valley Hwy'],
    transferStation: 'King County Algona Transfer Station',
    donationPartners: ['Auburn Goodwill', 'Algona Community Food & Clothing Bank']
  },
  'covington': {
    cityName: 'Covington',
    county: 'King County',
    zipCodes: ['98042'],
    coords: [47.3643, -122.0948],
    wikidataUri: 'https://www.wikidata.org/wiki/Q852580',
    neighborhoods: ['Timberlane', 'Jenkins Creek', 'Covington Town Center', 'Mattson', 'Crestview'],
    majorCorridors: ['SR-516 (SE 272nd St)', 'SR-18', '164th Ave SE', '180th Ave SE'],
    transferStation: 'King County Bow Lake Recycling and Transfer Station',
    donationPartners: ['Covington Goodwill', 'Kent St. Vincent de Paul']
  },
  'maple-valley': {
    cityName: 'Maple Valley',
    county: 'King County',
    zipCodes: ['98038'],
    coords: [47.3984, -122.0498],
    wikidataUri: 'https://www.wikidata.org/wiki/Q852594',
    neighborhoods: ['Lake Wilderness', 'Four Corners', 'Hobart Border', 'Tahoma High Area', 'Pipe Lake'],
    majorCorridors: ['SR-169 (Maple Valley Hwy)', 'SR-516', 'SE 240th St', 'Witte Rd SE'],
    transferStation: 'King County Bow Lake Recycling and Transfer Station',
    donationPartners: ['Maple Valley Goodwill', 'Maple Valley Food Bank']
  },
  'normandy-park': {
    cityName: 'Normandy Park',
    county: 'King County',
    zipCodes: ['98166'],
    coords: [47.4418, -122.3418],
    wikidataUri: 'https://www.wikidata.org/wiki/Q852598',
    neighborhoods: ['The Cove', 'Manhattan', 'Normandy Terrace', 'Marine View Estates'],
    majorCorridors: ['First Ave S (SR-509)', 'SW Normandy Rd', 'Marine View Dr SW'],
    transferStation: 'King County Bow Lake Recycling and Transfer Station',
    donationPartners: ['Burien Goodwill', 'St. Vincent de Paul Burien']
  },
  'renton': {
    cityName: 'Renton',
    county: 'King County',
    zipCodes: ['98055', '98056', '98057', '98058', '98059'],
    coords: [47.4829, -122.2171],
    wikidataUri: 'https://www.wikidata.org/wiki/Q852604',
    neighborhoods: ['Renton Highlands', 'Downtown Renton', 'Kennydale', 'Benson Hill', 'Talbot Hill', 'Fairwood', 'Skyway-West Hill'],
    neighborhoodEntities: [
      { name: 'Skyway-West Hill', postalCode: '98057', coords: [47.4984, -122.2479] },
      { name: 'Downtown Renton', postalCode: '98057', coords: [47.4800, -122.2030] },
      { name: 'Renton Highlands', postalCode: '98056', coords: [47.5020, -122.1670] },
      { name: 'Kennydale', postalCode: '98056', coords: [47.5250, -122.2010] },
      { name: 'Benson Hill', postalCode: '98055', coords: [47.4580, -122.1950] },
      { name: 'Talbot Hill', postalCode: '98055', coords: [47.4650, -122.2150] },
      { name: 'Fairwood', postalCode: '98058', coords: [47.4510, -122.1480] }
    ],
    majorCorridors: ['I-405', 'SR-167', 'Sunset Blvd NE', 'Renton Pkwy', 'SR-900'],
    transferStation: 'DTG Recycle Center (Renton) / Bow Lake Transfer Station',
    donationPartners: ['Renton Goodwill', 'St. Vincent de Paul Renton']
  },
  'seatac': {
    cityName: 'SeaTac',
    county: 'King County',
    zipCodes: ['98148', '98158', '98168', '98188', '98198'],
    coords: [47.4435, -122.2961],
    wikidataUri: 'https://www.wikidata.org/wiki/Q852607',
    neighborhoods: ['Angle Lake', 'McMicken Heights', 'Bow Lake', 'Riverton Heights'],
    majorCorridors: ['International Blvd (SR-99)', 'S 188th St', 'I-5', 'S 176th St', 'SR-518'],
    transferStation: 'King County Bow Lake Recycling and Transfer Station',
    donationPartners: ['SeaTac Goodwill', 'St. Vincent de Paul']
  },
  'tukwila': {
    cityName: 'Tukwila',
    county: 'King County',
    zipCodes: ['98168', '98188'],
    coords: [47.4740, -122.2610],
    wikidataUri: 'https://www.wikidata.org/wiki/Q852614',
    neighborhoods: ['Southcenter District', 'Tukwila Hill', 'Allentown', 'Foster', 'Thorndyke'],
    majorCorridors: ['I-5', 'I-405', 'West Valley Hwy (SR-181)', 'Southcenter Pkwy', 'Tukwila International Blvd'],
    transferStation: 'King County Bow Lake Recycling and Transfer Station',
    donationPartners: ['Tukwila Foster Community Donations', 'Goodwill Tukwila']
  },
  'bonney-lake': {
    cityName: 'Bonney Lake',
    county: 'Pierce County',
    zipCodes: ['98391'],
    coords: [47.1776, -122.1818],
    wikidataUri: 'https://www.wikidata.org/wiki/Q852572',
    neighborhoods: ['Tehaleh', 'Lake Tapps Border', 'Midtown', 'Kelly Lake', 'Church Lake'],
    majorCorridors: ['SR-410', '198th Ave E', '214th Ave E', 'South Prairie Rd E'],
    transferStation: 'Pierce County Prairie Ridge Transfer Station & Hidden Valley Transfer Station',
    donationPartners: ['Bonney Lake Goodwill', 'St. Francis House']
  },
  'fife': {
    cityName: 'Fife',
    county: 'Pierce County',
    zipCodes: ['98424'],
    coords: [47.2384, -122.3596],
    wikidataUri: 'https://www.wikidata.org/wiki/Q852584',
    neighborhoods: ['Fife Valley', 'Fife Heights Border', 'Wapato Creek Area', 'Port Logistics Corridor'],
    majorCorridors: ['I-5 (Exit 137)', 'Pacific Hwy E (SR-99)', '54th Ave E', 'Valley Ave E'],
    transferStation: 'City of Tacoma Recovery & Transfer Center',
    donationPartners: ['Tacoma Goodwill', 'Rescue Mission Tacoma']
  },
  'fircrest': {
    cityName: 'Fircrest',
    county: 'Pierce County',
    zipCodes: ['98466'],
    coords: [47.2384, -122.5085],
    wikidataUri: 'https://www.wikidata.org/wiki/Q852585',
    neighborhoods: ['Whittier', 'Center St Corridor', 'Regents Blvd Area', 'Wapato Hills Border'],
    majorCorridors: ['Regents Blvd', 'Center St', 'Orchard St', 'SR-16'],
    transferStation: 'City of Tacoma Recovery & Transfer Center',
    donationPartners: ['Tacoma Goodwill', 'St. Vincent de Paul']
  },
  'gig-harbor': {
    cityName: 'Gig Harbor',
    county: 'Pierce County',
    zipCodes: ['98332', '98335'],
    coords: [47.3293, -122.5801],
    wikidataUri: 'https://www.wikidata.org/wiki/Q852587',
    neighborhoods: ['Downtown Waterfront', 'Uptown', 'Canterwood', 'Wollochet Bay', 'Rosedale', 'Fox Island Border'],
    majorCorridors: ['SR-16', 'Borgen Blvd', 'Olympic Dr NW', 'Point Fosdick Dr NW'],
    transferStation: 'Pierce County Purdy Transfer Station',
    donationPartners: ['Gig Harbor Goodwill', 'FISH Food Bank & Thrift']
  },
  'lakewood': {
    cityName: 'Lakewood',
    county: 'Pierce County',
    zipCodes: ['98496', '98497', '98498', '98499'],
    coords: [47.1718, -122.5185],
    wikidataUri: 'https://www.wikidata.org/wiki/Q852592',
    neighborhoods: ['Lakewood Towne Center', 'Oakbrook', 'Tillicum', 'Steilacoom Lake', 'American Lake', 'Lake City'],
    majorCorridors: ['I-5 (Exit 125/127)', 'Lakewood Dr SW', 'Gravelly Lake Dr SW', 'Bridgeport Way SW'],
    transferStation: 'Pierce County Hidden Valley Transfer Station',
    donationPartners: ['Lakewood Goodwill', 'St. Vincent de Paul Lakewood']
  },
  'puyallup': {
    cityName: 'Puyallup',
    county: 'Pierce County',
    zipCodes: ['98371', '98372', '98373', '98374', '98375'],
    coords: [47.1854, -122.2929],
    wikidataUri: 'https://www.wikidata.org/wiki/Q852603',
    neighborhoods: ['Downtown Puyallup', 'South Hill', 'Shaw Road', 'Meridian Corridors', 'Meeker', 'Valley Green'],
    majorCorridors: ['SR-512', 'Meridian Ave E (SR-161)', 'River Rd (SR-167)', 'Shaw Rd E', '39th Ave SW'],
    transferStation: 'Pierce County Hidden Valley Transfer Station & Prairie Ridge Transfer Station',
    donationPartners: ['Puyallup Valley Goodwill', 'St. Francis House Puyallup']
  },
  'ruston': {
    cityName: 'Ruston',
    county: 'Pierce County',
    zipCodes: ['98407'],
    coords: [47.2976, -122.5115],
    wikidataUri: 'https://www.wikidata.org/wiki/Q852606',
    neighborhoods: ['Point Ruston Waterfront', 'Winnifred St District', 'Point Defiance Gateway'],
    majorCorridors: ['Ruston Way', 'N Pearl St (SR-163)', '51st St'],
    transferStation: 'City of Tacoma Recovery & Transfer Center',
    donationPartners: ['Tacoma Goodwill', 'Tacoma Rescue Mission']
  },
  'sumner': {
    cityName: 'Sumner',
    county: 'Pierce County',
    zipCodes: ['98390'],
    coords: [47.2032, -122.2407],
    wikidataUri: 'https://www.wikidata.org/wiki/Q852611',
    neighborhoods: ['Historic Downtown Sumner', 'Valley Industrial District', 'Orting Valley Border', 'Salmon Creek'],
    majorCorridors: ['SR-410', 'SR-167', 'Main St', 'Valley Ave E', 'East Valley Hwy'],
    transferStation: 'Pierce County Prairie Ridge Transfer Station',
    donationPartners: ['Sumner Goodwill', 'St. Francis House']
  },
  'university-place': {
    cityName: 'University Place',
    county: 'Pierce County',
    zipCodes: ['98466', '98467'],
    coords: [47.2368, -122.5376],
    wikidataUri: 'https://www.wikidata.org/wiki/Q852615',
    neighborhoods: ['Chambers Bay', 'Sunset Beach', 'Beckonridge', 'Cirque Park', 'Homestead'],
    majorCorridors: ['Bridgeport Way W', '27th St W', 'Grandview Dr W', 'Cirque Dr W'],
    transferStation: 'City of Tacoma Recovery & Transfer Center',
    donationPartners: ['Tacoma Goodwill', 'St. Vincent de Paul']
  },
  'south-seattle': {
    cityName: 'South Seattle',
    county: 'King County',
    zipCodes: ['98108', '98118', '98144', '98178'],
    coords: [47.5458, -122.2923],
    wikidataUri: 'https://www.wikidata.org/wiki/Q5083',
    neighborhoods: ['Columbia City', 'Beacon Hill', 'Rainier Valley', 'Georgetown', 'Seward Park', 'Rainier Beach'],
    majorCorridors: ['I-5', 'Rainier Ave S', 'Martin Luther King Jr Way S', 'Airport Way S'],
    transferStation: 'Seattle South Transfer Station (S Kenyon St)',
    donationPartners: ['Seattle Goodwill Central Store', 'St. Vincent de Paul Georgetown']
  }
};

export function resolveMunicipality(cityOrZip: string): MunicipalityMeta | null {
  const normalized = cityOrZip.toLowerCase().trim().replace(/\s+/g, '-');
  if (AUTHORIZED_MUNICIPALITIES[normalized]) {
    return AUTHORIZED_MUNICIPALITIES[normalized];
  }
  for (const meta of Object.values(AUTHORIZED_MUNICIPALITIES)) {
    if (meta.cityName.toLowerCase() === cityOrZip.toLowerCase()) {
      return meta;
    }
    if (meta.zipCodes.includes(cityOrZip)) {
      return meta;
    }
  }
  return null;
}

export interface NearbyMunicipality {
  slug: string;
  cityName: string;
  county: 'King County' | 'Pierce County';
  distanceMiles: number;
  corridor?: string;
}

/**
 * Calculates physically adjacent municipalities using the Haversine distance formula
 * to establish a coherent internal linking mesh for local SEO & PageRank distribution.
 */
export function getNearbyMunicipalities(currentSlug: string, limit: number = 4): NearbyMunicipality[] {
  const normalized = currentSlug.toLowerCase().trim().replace(/^junk-removal-/, '').replace(/-wa$/, '');
  const current = AUTHORIZED_MUNICIPALITIES[normalized];
  if (!current) return [];

  const [lat1, lon1] = current.coords;
  const R = 3958.8; // Earth's radius in miles

  return Object.entries(AUTHORIZED_MUNICIPALITIES)
    .filter(([slug]) => slug !== normalized)
    .map(([slug, meta]) => {
      const [lat2, lon2] = meta.coords;
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distanceMiles = Math.round(R * c * 10) / 10;
      return {
        slug,
        cityName: meta.cityName,
        county: meta.county,
        distanceMiles,
        corridor: meta.majorCorridors?.[0]
      };
    })
    .sort((a, b) => a.distanceMiles - b.distanceMiles)
    .slice(0, limit);
}

/**
 * Resolves or dynamically synthesizes structured NeighborhoodEntity array with postalCode & centroid coordinates
 */
export function getNeighborhoodEntities(meta: MunicipalityMeta): NeighborhoodEntity[] {
  if (meta.neighborhoodEntities && meta.neighborhoodEntities.length > 0) {
    return meta.neighborhoodEntities;
  }
  if (!meta.neighborhoods || meta.neighborhoods.length === 0) {
    return [];
  }
  const defaultZip = meta.zipCodes[0] || '98001';
  return meta.neighborhoods.map((name, idx) => ({
    name,
    postalCode: meta.zipCodes[idx % meta.zipCodes.length] || defaultZip,
    coords: meta.coords
  }));
}

/**
 * Searches for a matching neighborhood entity by name or postal code within a municipality
 */
export function resolveNeighborhoodEntity(
  query: string,
  meta?: MunicipalityMeta | null
): NeighborhoodEntity | null {
  if (!meta) return null;
  const entities = getNeighborhoodEntities(meta);
  const normalized = query.toLowerCase().trim();
  
  // Direct or partial name match
  const nameMatch = entities.find(e => e.name.toLowerCase() === normalized || normalized.includes(e.name.toLowerCase()));
  if (nameMatch) return nameMatch;

  // Postal code match
  const zipMatch = entities.find(e => e.postalCode === normalized);
  if (zipMatch) return zipMatch;

  return null;
}


