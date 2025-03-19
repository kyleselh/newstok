interface RegionInfo {
  name: string;
  flag: string;
  sources: { [key: string]: string };
}

export const REGIONS: { [key: string]: RegionInfo } = {
  europe: {
    name: 'Europe',
    flag: '🇪🇺',
    sources: {
      'bbc.co.uk': 'UK 🇬🇧',
      'theguardian.com': 'UK 🇬🇧',
      'dw.com': 'Germany 🇩🇪',
      'euronews.com': 'EU 🇪🇺',
      'france24.com': 'France 🇫🇷',
      'irishtimes.com': 'Ireland 🇮🇪',
      'thelocal.fr': 'France 🇫🇷',
      'thelocal.de': 'Germany 🇩🇪',
      'thelocal.it': 'Italy 🇮🇹',
    }
  },
  asia: {
    name: 'Asia',
    flag: '🌏',
    sources: {
      'scmp.com': 'Hong Kong 🇭🇰',
      'japantimes.co.jp': 'Japan 🇯🇵',
      'straitstimes.com': 'Singapore 🇸🇬',
      'aljazeera.com': 'Qatar 🇶🇦',
      'channelnewsasia.com': 'Singapore 🇸🇬',
      'koreatimes.co.kr': 'South Korea 🇰🇷',
      'hindustantimes.com': 'India 🇮🇳',
    }
  },
  africa: {
    name: 'Africa',
    flag: '🌍',
    sources: {
      'news24.com': 'South Africa 🇿🇦',
      'africanews.com': 'Congo 🇨🇬',
      'nation.africa': 'Kenya 🇰🇪',
      'mg.co.za': 'South Africa 🇿🇦',
      'egyptindependent.com': 'Egypt 🇪🇬',
    }
  },
  latinAmerica: {
    name: 'Latin America',
    flag: '🌎',
    sources: {
      'mercopress.com': 'Uruguay 🇺🇾',
      'batimes.com.ar': 'Argentina 🇦🇷',
      'brazilnews.net': 'Brazil 🇧🇷',
    }
  },
  oceania: {
    name: 'Oceania',
    flag: '🌏',
    sources: {
      'abc.net.au': 'Australia 🇦🇺',
      'nzherald.co.nz': 'New Zealand 🇳🇿',
      'stuff.co.nz': 'New Zealand 🇳🇿',
    }
  }
};

export function getSourceInfo(domain: string): { region: string; country: string } | null {
  for (const [regionKey, regionInfo] of Object.entries(REGIONS)) {
    for (const [sourceDomain, country] of Object.entries(regionInfo.sources)) {
      if (domain.includes(sourceDomain)) {
        return {
          region: `${regionInfo.flag} ${regionInfo.name}`,
          country: country
        };
      }
    }
  }
  return null;
}