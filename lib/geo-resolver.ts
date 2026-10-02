export interface MunicipalityMeta {
  cityName: string;
  county: 'King County' | 'Pierce County';
  zipCodes: string[];
  coords: [number, number];
  wikidataUri: string;
}

export const AUTHORIZED_MUNICIPALITIES: Record<string, MunicipalityMeta> = {
  'federal-way': {
    cityName: 'Federal Way',
    county: 'King County',
    zipCodes: ['98001', '98003', '98023', '98063', '98093'],
    coords: [47.3223, -122.3126],
    wikidataUri: 'https://www.wikidata.org/wiki/Q852586'
  },
  'auburn': {
    cityName: 'Auburn',
    county: 'King County',
    zipCodes: ['98001', '98002', '98071', '98092'],
    coords: [47.3073, -122.2285],
    wikidataUri: 'https://www.wikidata.org/wiki/Q758414'
  },
  'kent': {
    cityName: 'Kent',
    county: 'King County',
    zipCodes: ['98030', '98031', '98032', '98035', '98042', '98064'],
    coords: [47.3809, -122.2348],
    wikidataUri: 'https://www.wikidata.org/wiki/Q852579'
  },
  'tacoma': {
    cityName: 'Tacoma',
    county: 'Pierce County',
    zipCodes: ['98402', '98403', '98404', '98405', '98406', '98407', '98408', '98409', '98416', '98418', '98421', '98422'],
    coords: [47.2529, -122.4443],
    wikidataUri: 'https://www.wikidata.org/wiki/Q202488'
  },
  'edgewood': {
    cityName: 'Edgewood',
    county: 'Pierce County',
    zipCodes: ['98371', '98372'],
    coords: [47.2504, -122.2935],
    wikidataUri: 'https://www.wikidata.org/wiki/Q852583'
  },
  'des-moines': {
    cityName: 'Des Moines',
    county: 'King County',
    zipCodes: ['98198'],
    coords: [47.4018, -122.3243],
    wikidataUri: 'https://www.wikidata.org/wiki/Q852581'
  },
  'milton': {
    cityName: 'Milton',
    county: 'Pierce County',
    zipCodes: ['98354'],
    coords: [47.2498, -122.3168],
    wikidataUri: 'https://www.wikidata.org/wiki/Q1936495'
  },
  'pacific': {
    cityName: 'Pacific',
    county: 'King County',
    zipCodes: ['98047'],
    coords: [47.2648, -122.2479],
    wikidataUri: 'https://www.wikidata.org/wiki/Q852601'
  },
  'algona': {
    cityName: 'Algona',
    county: 'King County',
    zipCodes: ['98001'],
    coords: [47.2798, -122.2501],
    wikidataUri: 'https://www.wikidata.org/wiki/Q852569'
  },
  'covington': {
    cityName: 'Covington',
    county: 'King County',
    zipCodes: ['98042'],
    coords: [47.3643, -122.0948],
    wikidataUri: 'https://www.wikidata.org/wiki/Q852580'
  },
  'maple-valley': {
    cityName: 'Maple Valley',
    county: 'King County',
    zipCodes: ['98038'],
    coords: [47.3984, -122.0498],
    wikidataUri: 'https://www.wikidata.org/wiki/Q852594'
  },
  'normandy-park': {
    cityName: 'Normandy Park',
    county: 'King County',
    zipCodes: ['98166'],
    coords: [47.4418, -122.3418],
    wikidataUri: 'https://www.wikidata.org/wiki/Q852598'
  },
  'renton': {
    cityName: 'Renton',
    county: 'King County',
    zipCodes: ['98055', '98056', '98057', '98058', '98059'],
    coords: [47.4829, -122.2171],
    wikidataUri: 'https://www.wikidata.org/wiki/Q852604'
  },
  'seatac': {
    cityName: 'SeaTac',
    county: 'King County',
    zipCodes: ['98148', '98158', '98168', '98188', '98198'],
    coords: [47.4435, -122.2961],
    wikidataUri: 'https://www.wikidata.org/wiki/Q852607'
  },
  'tukwila': {
    cityName: 'Tukwila',
    county: 'King County',
    zipCodes: ['98168', '98188'],
    coords: [47.4740, -122.2610],
    wikidataUri: 'https://www.wikidata.org/wiki/Q852614'
  },
  'bonney-lake': {
    cityName: 'Bonney Lake',
    county: 'Pierce County',
    zipCodes: ['98391'],
    coords: [47.1776, -122.1818],
    wikidataUri: 'https://www.wikidata.org/wiki/Q852572'
  },
  'fife': {
    cityName: 'Fife',
    county: 'Pierce County',
    zipCodes: ['98424'],
    coords: [47.2384, -122.3596],
    wikidataUri: 'https://www.wikidata.org/wiki/Q852584'
  },
  'fircrest': {
    cityName: 'Fircrest',
    county: 'Pierce County',
    zipCodes: ['98466'],
    coords: [47.2384, -122.5085],
    wikidataUri: 'https://www.wikidata.org/wiki/Q852585'
  },
  'gig-harbor': {
    cityName: 'Gig Harbor',
    county: 'Pierce County',
    zipCodes: ['98332', '98335'],
    coords: [47.3293, -122.5801],
    wikidataUri: 'https://www.wikidata.org/wiki/Q852587'
  },
  'lakewood': {
    cityName: 'Lakewood',
    county: 'Pierce County',
    zipCodes: ['98496', '98497', '98498', '98499'],
    coords: [47.1718, -122.5185],
    wikidataUri: 'https://www.wikidata.org/wiki/Q852592'
  },
  'puyallup': {
    cityName: 'Puyallup',
    county: 'Pierce County',
    zipCodes: ['98371', '98372', '98373', '98374', '98375'],
    coords: [47.1854, -122.2929],
    wikidataUri: 'https://www.wikidata.org/wiki/Q852603'
  },
  'ruston': {
    cityName: 'Ruston',
    county: 'Pierce County',
    zipCodes: ['98407'],
    coords: [47.2976, -122.5115],
    wikidataUri: 'https://www.wikidata.org/wiki/Q852606'
  },
  'sumner': {
    cityName: 'Sumner',
    county: 'Pierce County',
    zipCodes: ['98390'],
    coords: [47.2032, -122.2407],
    wikidataUri: 'https://www.wikidata.org/wiki/Q852611'
  },
  'university-place': {
    cityName: 'University Place',
    county: 'Pierce County',
    zipCodes: ['98466', '98467'],
    coords: [47.2368, -122.5376],
    wikidataUri: 'https://www.wikidata.org/wiki/Q852615'
  },
  'south-seattle': {
    cityName: 'South Seattle',
    county: 'King County',
    zipCodes: ['98108', '98118', '98144', '98178'],
    coords: [47.5458, -122.2923],
    wikidataUri: 'https://www.wikidata.org/wiki/Q5083'
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
