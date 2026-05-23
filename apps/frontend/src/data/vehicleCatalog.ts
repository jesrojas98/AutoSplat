export type VehicleBrand = {
  brand: string
  models: string[]
  logoSlug?: string
  logoUrl?: string
  logoUrls?: string[]
  logoDomain?: string
}

export const VEHICLE_CATALOG: VehicleBrand[] = [
  {
    brand: 'Audi',
    logoSlug: 'audi',
    logoDomain: 'audi.com',
    models: ['A1', 'A3', 'A4', 'A5', 'A6', 'Q2', 'Q3', 'Q5', 'Q7', 'Q8', 'TT'],
  },
  {
    brand: 'BMW',
    logoSlug: 'bmw',
    logoDomain: 'bmw.com',
    models: ['Serie 1', 'Serie 2', 'Serie 3', 'Serie 4', 'Serie 5', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6'],
  },
  {
    brand: 'BYD',
    logoSlug: 'byd',
    logoUrls: [
      'https://commons.wikimedia.org/wiki/Special:FilePath/BYD%20Auto%202022%20logo.svg',
      'https://www.carlogos.org/logo/BYD-logo-2007-640x396.jpg',
    ],
    logoDomain: 'byd.com',
    models: ['Dolphin', 'Han', 'Seal', 'Song Plus', 'Tang', 'Yuan Plus'],
  },
  {
    brand: 'Changan',
    logoUrls: [
      'https://commons.wikimedia.org/wiki/Special:FilePath/Changan%20icon.svg',
      'https://www.carlogos.org/logo/Changan-logo-2010-640x174.jpg',
    ],
    logoUrl: 'https://logo.clearbit.com/changaninternational.com',
    logoDomain: 'changaninternational.com',
    models: ['Alsvin', 'CS15', 'CS35', 'CS55', 'CS75', 'Hunter', 'UNI-T', 'UNI-K'],
  },
  {
    brand: 'Chery',
    logoSlug: 'chery',
    logoUrls: [
      'https://commons.wikimedia.org/wiki/Special:FilePath/Chery%20logo.svg',
      'https://www.carlogos.org/logo/Chery-logo-2013-640x76.jpg',
    ],
    logoDomain: 'cheryinternational.com',
    models: ['Arrizo 5', 'Tiggo 2', 'Tiggo 3', 'Tiggo 4', 'Tiggo 7', 'Tiggo 8'],
  },
  {
    brand: 'Chevrolet',
    logoSlug: 'chevrolet',
    logoDomain: 'chevrolet.com',
    models: ['Aveo', 'Captiva', 'Colorado', 'Cruze', 'D-Max', 'Groove', 'Montana', 'Onix', 'Optra', 'Sail', 'Silverado', 'Spark', 'Tracker', 'Trailblazer'],
  },
  {
    brand: 'Citroën',
    logoSlug: 'citroen',
    logoDomain: 'citroen.com',
    models: ['Berlingo', 'C3', 'C3 Aircross', 'C4', 'C4 Cactus', 'C5 Aircross', 'Jumpy'],
  },
  {
    brand: 'Dodge',
    logoSlug: 'dodge',
    logoUrls: [
      'https://www.carlogos.org/car-logos/dodge-logo-2010-download.png',
      'https://www.carlogos.org/logo/Ram-logo-2009-640x400.jpg',
    ],
    logoDomain: 'dodge.com',
    models: ['Challenger', 'Charger', 'Durango', 'Journey', 'Ram'],
  },
  {
    brand: 'Fiat',
    logoSlug: 'fiat',
    logoDomain: 'fiat.com',
    models: ['500', 'Argo', 'Cronos', 'Fiorino', 'Mobi', 'Pulse', 'Strada', 'Uno'],
  },
  {
    brand: 'Ford',
    logoSlug: 'ford',
    logoDomain: 'ford.com',
    models: ['Bronco', 'EcoSport', 'Edge', 'Escape', 'Explorer', 'F-150', 'Fiesta', 'Focus', 'Maverick', 'Mustang', 'Ranger', 'Territory'],
  },
  {
    brand: 'GAC',
    logoUrls: [
      'https://www.carlogos.org/logo/GAC-Group-logo-640x125.jpg',
      'https://commons.wikimedia.org/wiki/Special:FilePath/%D7%9C%D7%95%D7%92%D7%95%20%D7%A9%D7%9C%20%D7%A7%D7%91%D7%95%D7%A6%D7%AA%20GAC.png',
    ],
    logoUrl: 'https://logo.clearbit.com/gacmotor.com',
    logoDomain: 'gacmotor.com',
    models: ['Emkoo', 'GS3', 'GS4', 'GS8', 'M8'],
  },
  {
    brand: 'Geely',
    logoSlug: 'geely',
    logoUrls: [
      'https://commons.wikimedia.org/wiki/Special:FilePath/Geely%20logo.svg',
      'https://commons.wikimedia.org/wiki/Special:FilePath/Geely%20Logo%202022.svg',
      'https://www.carlogos.org/logo/Geely-logo-2014-640x370.jpg',
    ],
    logoDomain: 'global.geely.com',
    models: ['Azkarra', 'Coolray', 'Geometry C', 'Monjaro', 'Okavango'],
  },
  {
    brand: 'Great Wall',
    logoUrls: [
      'https://commons.wikimedia.org/wiki/Special:FilePath/GWM%202025%20logo.svg',
      'https://www.carlogos.org/logo/Great-Wall-logo-2007-640x550.jpg',
    ],
    logoUrl: 'https://logo.clearbit.com/gwm-global.com',
    logoDomain: 'gwm-global.com',
    models: ['Deer', 'Haval H3', 'Haval H5', 'Poer', 'Wingle 5', 'Wingle 7'],
  },
  {
    brand: 'Haval',
    logoUrls: [
      'https://www.carlogos.org/logo/Haval-logo-640x112.jpg',
      'https://logo.clearbit.com/haval-global.com',
    ],
    logoUrl: 'https://logo.clearbit.com/haval-global.com',
    logoDomain: 'haval-global.com',
    models: ['Dargo', 'H2', 'H6', 'H7', 'Jolion'],
  },
  {
    brand: 'Honda',
    logoSlug: 'honda',
    logoDomain: 'honda.com',
    models: ['Accord', 'City', 'Civic', 'CR-V', 'Fit', 'HR-V', 'Pilot', 'WR-V'],
  },
  {
    brand: 'Hyundai',
    logoSlug: 'hyundai',
    logoDomain: 'hyundai.com',
    models: ['Accent', 'Creta', 'Elantra', 'Grand i10', 'H-1', 'i10', 'i20', 'i30', 'Kona', 'Santa Fe', 'Sonata', 'Tucson', 'Venue', 'Verna'],
  },
  {
    brand: 'JAC',
    logoUrls: [
      'https://www.carlogos.org/logo/JAC-Motors-logo-2016-640x244.jpg',
      'https://logo.clearbit.com/jac.com.cn',
    ],
    logoUrl: 'https://logo.clearbit.com/jac.com.cn',
    logoDomain: 'jac.com.cn',
    models: ['JS2', 'JS3', 'JS4', 'JS6', 'S2', 'S3', 'T6', 'T8', 'X200'],
  },
  {
    brand: 'Jeep',
    logoSlug: 'jeep',
    logoDomain: 'jeep.com',
    models: ['Cherokee', 'Compass', 'Gladiator', 'Grand Cherokee', 'Patriot', 'Renegade', 'Wrangler'],
  },
  {
    brand: 'Jetour',
    logoUrls: [
      'https://commons.wikimedia.org/wiki/Special:FilePath/Jetour%20logomark.svg',
      'https://commons.wikimedia.org/wiki/Special:FilePath/Jetour%20logo.svg',
      'https://logo-teka.com/wp-content/uploads/2025/06/jetour-logo.svg',
    ],
    logoUrl: 'https://logo.clearbit.com/jetourglobal.com',
    logoDomain: 'jetourglobal.com',
    models: ['Dashing', 'T2', 'X70', 'X70 Plus', 'X90 Plus'],
  },
  {
    brand: 'Kia',
    logoSlug: 'kia',
    logoDomain: 'kia.com',
    models: ['Carens', 'Carnival', 'Cerato', 'Frontier', 'Morning', 'Niro', 'Rio', 'Seltos', 'Soluto', 'Sonet', 'Sorento', 'Soul', 'Sportage'],
  },
  {
    brand: 'Mazda',
    logoSlug: 'mazda',
    logoDomain: 'mazda.com',
    models: ['2', '3', '6', 'BT-50', 'CX-3', 'CX-30', 'CX-5', 'CX-60', 'CX-9', 'MX-5'],
  },
  {
    brand: 'Mercedes-Benz',
    logoSlug: 'mercedes',
    logoDomain: 'mercedes-benz.com',
    models: ['Clase A', 'Clase B', 'Clase C', 'Clase E', 'Clase G', 'CLA', 'GLA', 'GLB', 'GLC', 'GLE', 'Sprinter', 'Vito'],
  },
  {
    brand: 'MG',
    logoSlug: 'mg',
    logoDomain: 'mgmotor.eu',
    models: ['3', '5', 'GT', 'HS', 'Marvel R', 'MG4', 'One', 'RX5', 'ZS', 'ZX'],
  },
  {
    brand: 'Mini',
    logoSlug: 'mini',
    logoDomain: 'mini.com',
    models: ['Clubman', 'Cooper', 'Countryman'],
  },
  {
    brand: 'Mitsubishi',
    logoSlug: 'mitsubishi',
    logoDomain: 'mitsubishi-motors.com',
    models: ['ASX', 'Eclipse Cross', 'L200', 'Lancer', 'Montero', 'Outlander', 'Pajero', 'Xpander'],
  },
  {
    brand: 'Nissan',
    logoSlug: 'nissan',
    logoDomain: 'nissan-global.com',
    models: ['Juke', 'Kicks', 'March', 'Murano', 'Navara', 'Note', 'Pathfinder', 'Qashqai', 'Sentra', 'Terrano', 'Versa', 'X-Trail'],
  },
  {
    brand: 'Opel',
    logoSlug: 'opel',
    logoDomain: 'opel.com',
    models: ['Astra', 'Combo', 'Corsa', 'Crossland', 'Grandland', 'Mokka'],
  },
  {
    brand: 'Peugeot',
    logoSlug: 'peugeot',
    logoDomain: 'peugeot.com',
    models: ['2008', '208', '3008', '301', '308', '5008', 'Partner', 'Rifter', 'Traveller'],
  },
  {
    brand: 'Porsche',
    logoSlug: 'porsche',
    logoDomain: 'porsche.com',
    models: ['718', '911', 'Cayenne', 'Macan', 'Panamera', 'Taycan'],
  },
  {
    brand: 'Renault',
    logoSlug: 'renault',
    logoDomain: 'renault.com',
    models: ['Arkana', 'Captur', 'Clio', 'Duster', 'Kangoo', 'Koleos', 'Logan', 'Megane', 'Oroch', 'Sandero', 'Symbol'],
  },
  {
    brand: 'Skoda',
    logoSlug: 'skoda',
    logoDomain: 'skoda-auto.com',
    models: ['Fabia', 'Kamiq', 'Karoq', 'Kodiaq', 'Octavia', 'Scala', 'Superb'],
  },
  {
    brand: 'SsangYong',
    logoUrls: [
      'https://commons.wikimedia.org/wiki/Special:FilePath/Ssangyong%20company%20logo.svg',
      'https://commons.wikimedia.org/wiki/Special:FilePath/Ssangyong%20logo%20%28english%29.svg',
      'https://www.carlogos.org/logo/SsangYong-logo-640x422.jpg',
    ],
    logoUrl: 'https://logo.clearbit.com/kg-mobility.com',
    logoDomain: 'kg-mobility.com',
    models: ['Actyon', 'Korando', 'Musso', 'Rexton', 'Tivoli'],
  },
  {
    brand: 'Subaru',
    logoSlug: 'subaru',
    logoDomain: 'subaru.com',
    models: ['Crosstrek', 'Forester', 'Impreza', 'Legacy', 'Outback', 'WRX', 'XV'],
  },
  {
    brand: 'Suzuki',
    logoSlug: 'suzuki',
    logoDomain: 'suzuki.com',
    models: ['Alto', 'Baleno', 'Celerio', 'Ciaz', 'Dzire', 'Ertiga', 'Grand Nomade', 'Grand Vitara', 'Ignis', 'Jimny', 'S-Cross', 'Swift', 'Vitara', 'XL7'],
  },
  {
    brand: 'Tesla',
    logoSlug: 'tesla',
    logoDomain: 'tesla.com',
    models: ['Model 3', 'Model S', 'Model X', 'Model Y'],
  },
  {
    brand: 'Toyota',
    logoSlug: 'toyota',
    logoDomain: 'toyota.com',
    models: ['4Runner', 'Auris', 'Avanza', 'Camry', 'Corolla', 'Corolla Cross', 'Fortuner', 'Hilux', 'Land Cruiser', 'Prado', 'Prius', 'RAV4', 'Rush', 'Urban Cruiser', 'Yaris', 'Yaris Cross'],
  },
  {
    brand: 'Volkswagen',
    logoSlug: 'volkswagen',
    logoDomain: 'volkswagen.com',
    models: ['Amarok', 'Bora', 'Caddy', 'CrossFox', 'Golf', 'Gol', 'Jetta', 'Nivus', 'Polo', 'Saveiro', 'T-Cross', 'Taos', 'Tiguan', 'Virtus', 'Voyage'],
  },
  {
    brand: 'Volvo',
    logoSlug: 'volvo',
    logoDomain: 'volvocars.com',
    models: ['C40', 'S60', 'S90', 'V40', 'XC40', 'XC60', 'XC90'],
  },
]
