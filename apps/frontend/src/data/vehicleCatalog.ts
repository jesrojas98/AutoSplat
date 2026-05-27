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
    models: ['A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'e-tron', 'Q2', 'Q3', 'Q4 e-tron', 'Q5', 'Q7', 'Q8', 'R8', 'TT'],
  },
  {
    brand: 'Alfa Romeo',
    logoSlug: 'alfaromeo',
    logoDomain: 'alfaromeo.com',
    models: ['147', '156', '159', 'Giulia', 'Giulietta', 'MiTo', 'Stelvio', 'Tonale'],
  },
  {
    brand: 'Avatr',
    logoUrls: [
      'https://commons.wikimedia.org/wiki/Special:FilePath/Avatr%20Technology%20logo.svg',
      'https://logo-teka.com/wp-content/uploads/2025/07/avatr-logo.svg',
    ],
    logoDomain: 'avatr.com',
    models: ['11', '12'],
  },
  {
    brand: 'BAIC',
    logoUrls: [
      'https://commons.wikimedia.org/wiki/Special:FilePath/BAIC%20logo.png',
      'https://commons.wikimedia.org/wiki/Special:FilePath/BAIC%20logo%20%282024%29.png',
      'https://www.carlogos.org/logo/BAIC-logo-2010-640x240.jpg',
    ],
    logoDomain: 'baicglobal.com',
    models: ['A1', 'BJ20', 'BJ40', 'BJ80', 'EU5', 'M20', 'X25', 'X35', 'X55', 'X65'],
  },
  {
    brand: 'Brilliance',
    logoUrls: [
      'https://commons.wikimedia.org/wiki/Special:FilePath/Brilliance%20Auto%20logo.svg',
      'https://www.carlogos.org/logo/Brilliance-logo-640x480.jpg',
    ],
    logoDomain: 'brillianceauto.com',
    models: ['FRV', 'H220', 'H230', 'H320', 'H530', 'V3', 'V5'],
  },
  {
    brand: 'BMW',
    logoSlug: 'bmw',
    logoDomain: 'bmw.com',
    models: ['i3', 'i4', 'iX', 'Serie 1', 'Serie 2', 'Serie 3', 'Serie 4', 'Serie 5', 'Serie 7', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'Z4'],
  },
  {
    brand: 'BYD',
    logoSlug: 'byd',
    logoUrls: [
      'https://commons.wikimedia.org/wiki/Special:FilePath/BYD%20Auto%202022%20logo.svg',
      'https://www.carlogos.org/logo/BYD-logo-2007-640x396.jpg',
    ],
    logoDomain: 'byd.com',
    models: ['Atto 3', 'Dolphin', 'Dolphin Mini', 'Han', 'King', 'Seal', 'Seal U', 'Seagull', 'Song Plus', 'Tang', 'Yuan Plus'],
  },
  {
    brand: 'Changan',
    logoUrls: [
      'https://commons.wikimedia.org/wiki/Special:FilePath/Changan%20icon.svg',
      'https://www.carlogos.org/logo/Changan-logo-2010-640x174.jpg',
    ],
    logoUrl: 'https://logo.clearbit.com/changaninternational.com',
    logoDomain: 'changaninternational.com',
    models: ['Alsvin', 'CS15', 'CS35', 'CS35 Plus', 'CS55', 'CS55 Plus', 'CS75', 'CS75 Plus', 'Eado', 'Honor', 'Hunter', 'MD201', 'UNI-K', 'UNI-T', 'X7 Plus'],
  },
  {
    brand: 'Chery',
    logoSlug: 'chery',
    logoUrls: [
      'https://commons.wikimedia.org/wiki/Special:FilePath/Chery%20logo.svg',
      'https://www.carlogos.org/logo/Chery-logo-2013-640x76.jpg',
    ],
    logoDomain: 'cheryinternational.com',
    models: ['Arrizo 3', 'Arrizo 5', 'Arrizo 6', 'Face', 'IQ', 'Tiggo 2', 'Tiggo 3', 'Tiggo 4', 'Tiggo 7', 'Tiggo 8'],
  },
  {
    brand: 'Chevrolet',
    logoSlug: 'chevrolet',
    logoDomain: 'chevrolet.com',
    models: ['Astra', 'Aveo', 'Camaro', 'Captiva', 'Cobalt', 'Colorado', 'Corsa', 'Cruze', 'D-Max', 'Equinox', 'Groove', 'Luv', 'Malibu', 'Montana', 'N300', 'Onix', 'Optra', 'Orlando', 'Sail', 'Silverado', 'Sonic', 'Spark', 'Spin', 'Suburban', 'Tahoe', 'Tracker', 'Trailblazer', 'Traverse'],
  },
  {
    brand: 'Citroën',
    logoSlug: 'citroen',
    logoDomain: 'citroen.com',
    models: ['Berlingo', 'C-Elysée', 'C3', 'C3 Aircross', 'C4', 'C4 Cactus', 'C4 Picasso', 'C5', 'C5 Aircross', 'Jumper', 'Jumpy', 'Xsara Picasso'],
  },
  {
    brand: 'Cupra',
    logoSlug: 'cupra',
    logoUrls: [
      'https://commons.wikimedia.org/wiki/Special:FilePath/Cupra%20symbol.svg',
      'https://commons.wikimedia.org/wiki/Special:FilePath/Cupra.svg',
      'https://cdn.jsdelivr.net/npm/simple-icons/icons/cupra.svg',
    ],
    logoDomain: 'cupraofficial.com',
    models: ['Ateca', 'Born', 'Formentor', 'León', 'Terramar'],
  },
  {
    brand: 'Daewoo',
    logoSlug: 'daewoo',
    logoUrls: [
      'https://commons.wikimedia.org/wiki/Special:FilePath/Logo%20wordmark%20DAEWOO%20Motors%20%282002-2016%29.svg',
      'https://commons.wikimedia.org/wiki/Special:FilePath/Daewoo-motor-logo.jpg',
    ],
    logoDomain: 'daewoo.com',
    models: ['Espero', 'Kalos', 'Lanos', 'Leganza', 'Matiz', 'Nubira', 'Racer', 'Tacuma'],
  },
  {
    brand: 'Daihatsu',
    logoSlug: 'daihatsu',
    logoUrls: [
      'https://commons.wikimedia.org/wiki/Special:FilePath/Daihatsu%20logo%201998.svg',
      'https://commons.wikimedia.org/wiki/Special:FilePath/Daihatsu%20logo.png',
    ],
    logoDomain: 'daihatsu.com',
    models: ['Applause', 'Charade', 'Feroza', 'Gran Max', 'Sirion', 'Terios'],
  },
  {
    brand: 'Deepal',
    logoUrls: [
      'https://commons.wikimedia.org/wiki/Special:FilePath/Deepal%20logo.svg',
      'https://logo-teka.com/wp-content/uploads/2025/06/deepal-logo.svg',
    ],
    logoDomain: 'deepal.com',
    models: ['G318', 'S05', 'S07', 'SL03'],
  },
  {
    brand: 'DFSK',
    logoUrls: [
      'https://commons.wikimedia.org/wiki/Special:FilePath/Dongfeng%20Sokon%20%28DFSK%29%20logo.svg',
      'https://www.carlogos.org/logo/DFSK-logo-640x400.jpg',
    ],
    logoDomain: 'dfsk.com',
    models: ['500', '560', '580', 'C31', 'C32', 'C35', 'C37', 'Glory 580', 'K01', 'K05', 'K07', 'K07S', 'Refritruck'],
  },
  {
    brand: 'Dongfeng',
    logoUrls: [
      'https://commons.wikimedia.org/wiki/Special:FilePath/Dongfeng%20Motor%20logo.svg',
      'https://www.carlogos.org/logo/Dongfeng-logo-2016-640x300.jpg',
    ],
    logoDomain: 'dongfeng-global.com',
    models: ['Aeolus AX7', 'A30', 'DF6', 'DFM AX4', 'DFM AX7', 'Joyear X3', 'Joyear X5', 'Joyear X7', 'Rich 6', 'S500'],
  },
  {
    brand: 'DS',
    logoSlug: 'dsautomobiles',
    logoDomain: 'dsautomobiles.com',
    models: ['DS 3', 'DS 3 Crossback', 'DS 4', 'DS 5', 'DS 7', 'DS 7 Crossback', 'DS 9'],
  },
  {
    brand: 'Dodge',
    logoSlug: 'dodge',
    logoUrls: [
      'https://www.carlogos.org/car-logos/dodge-logo-2010-download.png',
      'https://www.carlogos.org/logo/Ram-logo-2009-640x400.jpg',
    ],
    logoDomain: 'dodge.com',
    models: ['Caliber', 'Challenger', 'Charger', 'Dakota', 'Dart', 'Durango', 'Journey', 'Neon', 'Ram'],
  },
  {
    brand: 'Exeed',
    logoUrls: [
      'https://commons.wikimedia.org/wiki/Special:FilePath/Exeed%20logo.png',
      'https://logo-teka.com/wp-content/uploads/2025/07/exeed-logo.svg',
    ],
    logoDomain: 'exeedinternational.com',
    models: ['LX', 'RX', 'TXL', 'VX'],
  },
  {
    brand: 'Fiat',
    logoSlug: 'fiat',
    logoDomain: 'fiat.com',
    models: ['500', 'Adventure', 'Argo', 'Bravo', 'Cronos', 'Doblo', 'Fiorino', 'Grande Punto', 'Idea', 'Mobi', 'Palio', 'Panda', 'Pulse', 'Punto', 'Qubo', 'Siena', 'Strada', 'Tipo', 'Uno'],
  },
  {
    brand: 'Ford',
    logoSlug: 'ford',
    logoDomain: 'ford.com',
    models: ['Bronco', 'EcoSport', 'Edge', 'Escape', 'Everest', 'Expedition', 'Explorer', 'F-150', 'F-250', 'Fiesta', 'Focus', 'Fusion', 'Ka', 'Maverick', 'Mustang', 'Ranger', 'Territory', 'Transit'],
  },
  {
    brand: 'Foton',
    logoUrls: [
      'https://commons.wikimedia.org/wiki/Special:FilePath/Foton%20Motor%20logo.svg',
      'https://www.carlogos.org/logo/Foton-logo-640x361.jpg',
    ],
    logoDomain: 'foton-global.com',
    models: ['Aumark', 'Gratour', 'Midi', 'Sauvana', 'TM3', 'TM5', 'Toano', 'Tunland', 'View'],
  },
  {
    brand: 'GAC',
    logoUrls: [
      'https://www.carlogos.org/logo/GAC-Group-logo-640x125.jpg',
      'https://commons.wikimedia.org/wiki/Special:FilePath/%D7%9C%D7%95%D7%92%D7%95%20%D7%A9%D7%9C%20%D7%A7%D7%91%D7%95%D7%A6%D7%AA%20GAC.png',
    ],
    logoUrl: 'https://logo.clearbit.com/gacmotor.com',
    logoDomain: 'gacmotor.com',
    models: ['Emkoo', 'Empow', 'GS3', 'GS4', 'GS5', 'GS8', 'M8'],
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
    models: ['Azkarra', 'Coolray', 'Emgrand', 'EX7', 'Geometry C', 'GX3 Pro', 'Monjaro', 'Okavango', 'Starray'],
  },
  {
    brand: 'Great Wall',
    logoUrls: [
      'https://commons.wikimedia.org/wiki/Special:FilePath/GWM%202025%20logo.svg',
      'https://www.carlogos.org/logo/Great-Wall-logo-2007-640x550.jpg',
    ],
    logoUrl: 'https://logo.clearbit.com/gwm-global.com',
    logoDomain: 'gwm-global.com',
    models: ['Deer', 'Florid', 'M4', 'Poer', 'Voleex C10', 'Wingle 3', 'Wingle 5', 'Wingle 6', 'Wingle 7'],
  },
  {
    brand: 'Haval',
    logoUrls: [
      'https://www.carlogos.org/logo/Haval-logo-640x112.jpg',
      'https://logo.clearbit.com/haval-global.com',
    ],
    logoUrl: 'https://logo.clearbit.com/haval-global.com',
    logoDomain: 'haval-global.com',
    models: ['Dargo', 'H2', 'H3', 'H5', 'H6', 'H7', 'Jolion', 'M6'],
  },
  {
    brand: 'Honda',
    logoSlug: 'honda',
    logoDomain: 'honda.com',
    models: ['Accord', 'City', 'Civic', 'CR-V', 'CR-Z', 'Fit', 'HR-V', 'Insight', 'Odyssey', 'Pilot', 'Ridgeline', 'WR-V'],
  },
  {
    brand: 'Hyundai',
    logoSlug: 'hyundai',
    logoDomain: 'hyundai.com',
    models: ['Accent', 'Atos', 'Azera', 'Creta', 'Elantra', 'Eon', 'Exter', 'Galloper', 'Grand i10', 'H-1', 'H100', 'i10', 'i20', 'i30', 'Ioniq', 'Ioniq 5', 'Kona', 'Palisade', 'Santa Fe', 'Sonata', 'Staria', 'Tucson', 'Venue', 'Veracruz', 'Verna'],
  },
  {
    brand: 'Isuzu',
    logoSlug: 'isuzu',
    logoUrls: [
      'https://commons.wikimedia.org/wiki/Special:FilePath/Isuzu.svg',
      'https://cdn.jsdelivr.net/npm/simple-icons/icons/isuzu.svg',
    ],
    logoDomain: 'isuzu.com',
    models: ['D-Max', 'MU-X', 'NPR', 'NQR'],
  },
  {
    brand: 'JAC',
    logoUrls: [
      'https://www.carlogos.org/logo/JAC-Motors-logo-2016-640x244.jpg',
      'https://logo.clearbit.com/jac.com.cn',
    ],
    logoUrl: 'https://logo.clearbit.com/jac.com.cn',
    logoDomain: 'jac.com.cn',
    models: ['JS2', 'JS3', 'JS4', 'JS6', 'JS8', 'J2', 'J3', 'J4', 'Refine', 'S1', 'S2', 'S3', 'S5', 'Sunray', 'T6', 'T8', 'T9', 'X200'],
  },
  {
    brand: 'Jaguar',
    logoSlug: 'jaguar',
    logoDomain: 'jaguar.com',
    models: ['E-Pace', 'F-Pace', 'F-Type', 'I-Pace', 'XE', 'XF', 'XJ', 'X-Type'],
  },
  {
    brand: 'Jaecoo',
    logoUrls: [
      'https://commons.wikimedia.org/wiki/Special:FilePath/Jaecoo%20wordmark.svg',
      'https://logo-teka.com/wp-content/uploads/2025/07/jaecoo-logo.svg',
    ],
    logoDomain: 'jaecoo.com',
    models: ['J5', 'J6', 'J7', 'J8'],
  },
  {
    brand: 'Jeep',
    logoSlug: 'jeep',
    logoDomain: 'jeep.com',
    models: ['Cherokee', 'Commander', 'Compass', 'Gladiator', 'Grand Cherokee', 'Patriot', 'Renegade', 'Wrangler'],
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
    models: ['Dashing', 'T1', 'T2', 'X70', 'X70 Plus', 'X70S', 'X90', 'X90 Plus'],
  },
  {
    brand: 'Kaiyi',
    logoUrls: [
      'https://commons.wikimedia.org/wiki/Special:FilePath/Kaiyi%20logo.png',
      'https://logo-teka.com/wp-content/uploads/2025/07/kaiyi-logo.svg',
    ],
    logoDomain: 'kaiyiglobal.com',
    models: ['E5', 'X3', 'X3 Pro', 'X7', 'X7 Kunlun'],
  },
  {
    brand: 'Kia',
    logoSlug: 'kia',
    logoDomain: 'kia.com',
    models: ['Carens', 'Carnival', 'Cerato', 'EV3', 'EV5', 'EV6', 'EV9', 'Frontier', 'K3', 'K5', 'Mohave', 'Morning', 'Niro', 'Optima', 'Picanto', 'Rio', 'Seltos', 'Soluto', 'Sonet', 'Sorento', 'Soul', 'Sportage'],
  },
  {
    brand: 'Land Rover',
    logoSlug: 'landrover',
    logoDomain: 'landrover.com',
    models: ['Defender', 'Discovery', 'Discovery Sport', 'Freelander', 'Range Rover', 'Range Rover Evoque', 'Range Rover Sport', 'Range Rover Velar'],
  },
  {
    brand: 'Leapmotor',
    logoUrls: [
      'https://commons.wikimedia.org/wiki/Special:FilePath/Leapmotor%20logo%20en.svg',
      'https://logo-teka.com/wp-content/uploads/2026/04/leapmotor-sign-logo.svg',
    ],
    logoDomain: 'leapmotor.com',
    models: ['C10', 'C11', 'T03'],
  },
  {
    brand: 'Lexus',
    logoSlug: 'lexus',
    logoUrls: [
      'https://commons.wikimedia.org/wiki/Special:FilePath/Lexus%20logo.svg',
      'https://cdn.jsdelivr.net/npm/simple-icons/icons/lexus.svg',
    ],
    logoDomain: 'lexus.com',
    models: ['CT', 'ES', 'GS', 'GX', 'IS', 'LBX', 'LS', 'LX', 'NX', 'RX', 'UX'],
  },
  {
    brand: 'Lifan',
    logoUrls: [
      'https://commons.wikimedia.org/wiki/Special:FilePath/Lifan%20Technology%28Group%29%20Co.%20Ltd%20logo.png',
      'https://commons.wikimedia.org/wiki/Special:FilePath/Livan%20Automotive%20logo.svg',
      'https://www.carlogos.org/logo/Lifan-logo-640x456.jpg',
    ],
    logoDomain: 'lifanmotors.net',
    models: ['320', '520', '620', 'Foison', 'MyWay', 'X50', 'X60', 'X70'],
  },
  {
    brand: 'Lincoln',
    logoSlug: 'lincoln',
    logoUrls: [
      'https://commons.wikimedia.org/wiki/Special:FilePath/Logo%20Lincoln.svg',
      'https://cdn.jsdelivr.net/npm/simple-icons/icons/lincoln.svg',
    ],
    logoDomain: 'lincoln.com',
    models: ['Aviator', 'Corsair', 'MKC', 'MKS', 'MKX', 'MKZ', 'Nautilus', 'Navigator'],
  },
  {
    brand: 'Mazda',
    logoSlug: 'mazda',
    logoDomain: 'mazda.com',
    models: ['2', '3', '5', '6', 'BT-50', 'CX-3', 'CX-30', 'CX-5', 'CX-50', 'CX-60', 'CX-70', 'CX-9', 'CX-90', 'MX-5'],
  },
  {
    brand: 'Mahindra',
    logoUrls: [
      'https://commons.wikimedia.org/wiki/Special:FilePath/Mahindra%20Rise%20New%20Logo.svg',
      'https://www.carlogos.org/logo/Mahindra-logo-2012-640x276.jpg',
    ],
    logoDomain: 'mahindra.com',
    models: ['Bolero', 'KUV100', 'Pik Up', 'Scorpio', 'Thar', 'XUV300', 'XUV500', 'XUV700'],
  },
  {
    brand: 'Maxus',
    logoUrls: [
      'https://www.carlogos.org/logo/Maxus-logo-2014-640x550.jpg',
      'https://www.carlogos.org/logo/Maxus-logo-2014-1920x1080.png',
      'https://logo-teka.com/wp-content/uploads/2025/06/maxus-logo.svg',
    ],
    logoDomain: 'saicmaxus.com',
    models: ['D60', 'D90', 'Euniq 5', 'Euniq 6', 'G10', 'G50', 'MIFA 9', 'T60', 'T70', 'T90', 'V80'],
  },
  {
    brand: 'Mercedes-Benz',
    logoSlug: 'mercedes',
    logoDomain: 'mercedes-benz.com',
    models: ['Clase A', 'Clase B', 'Clase C', 'Clase E', 'Clase G', 'Clase S', 'CLA', 'CLC', 'CLK', 'CLS', 'EQA', 'EQB', 'EQC', 'EQE', 'EQS', 'GLA', 'GLB', 'GLC', 'GLE', 'GLK', 'GLS', 'ML', 'Sprinter', 'Viano', 'Vito'],
  },
  {
    brand: 'MG',
    logoSlug: 'mg',
    logoDomain: 'mgmotor.eu',
    models: ['3', '5', '6', 'GT', 'HS', 'Marvel R', 'MG4', 'MG6', 'MG7', 'One', 'RX5', 'ZS', 'ZX'],
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
    models: ['ASX', 'Eclipse Cross', 'Galant', 'L200', 'Lancer', 'Mirage', 'Montero', 'Outlander', 'Pajero', 'Xpander'],
  },
  {
    brand: 'Nissan',
    logoSlug: 'nissan',
    logoDomain: 'nissan-global.com',
    models: ['Altima', 'Frontier', 'Juke', 'Kicks', 'Leaf', 'March', 'Murano', 'Navara', 'Note', 'NP300', 'Pathfinder', 'Qashqai', 'Sentra', 'Terrano', 'Tiida', 'Versa', 'X-Trail'],
  },
  {
    brand: 'Opel',
    logoSlug: 'opel',
    logoDomain: 'opel.com',
    models: ['Astra', 'Combo', 'Corsa', 'Crossland', 'Grandland', 'Insignia', 'Meriva', 'Mokka', 'Vivaro', 'Zafira'],
  },
  {
    brand: 'Omoda',
    logoUrls: [
      'https://commons.wikimedia.org/wiki/Special:FilePath/Omoda%20wordmark.svg',
      'https://logo-teka.com/wp-content/uploads/2025/07/omoda-logo.svg',
    ],
    logoDomain: 'omodaauto.com',
    models: ['C5', 'E5', 'Omoda 5', 'Omoda 7', 'Omoda 9'],
  },
  {
    brand: 'Peugeot',
    logoSlug: 'peugeot',
    logoDomain: 'peugeot.com',
    models: ['107', '108', '2008', '206', '207', '208', '3008', '301', '307', '308', '407', '508', '5008', 'Boxer', 'Expert', 'Partner', 'Rifter', 'Traveller'],
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
    models: ['Arkana', 'Captur', 'Clio', 'Duster', 'Fluence', 'Kangoo', 'Koleos', 'Kwid', 'Laguna', 'Logan', 'Megane', 'Oroch', 'Sandero', 'Scenic', 'Symbol'],
  },
  {
    brand: 'RAM',
    logoSlug: 'ram',
    logoDomain: 'ramtrucks.com',
    models: ['700', '1000', '1500', '2500', '3500', 'Promaster', 'Rampage'],
  },
  {
    brand: 'SEAT',
    logoSlug: 'seat',
    logoDomain: 'seat.com',
    models: ['Alhambra', 'Altea', 'Arona', 'Ateca', 'Córdoba', 'Ibiza', 'León', 'Tarraco', 'Toledo'],
  },
  {
    brand: 'Seres',
    logoUrls: [
      'https://commons.wikimedia.org/wiki/Special:FilePath/Logo%20Seres%20Group.svg',
      'https://commons.wikimedia.org/wiki/Special:FilePath/Seres%20Automobile%20%282023%29%20Logo.png',
      'https://logo-teka.com/wp-content/uploads/2025/07/seres-logo.svg',
    ],
    logoDomain: 'seresauto.com',
    models: ['3', '5', '7', 'SF5'],
  },
  {
    brand: 'Soueast',
    logoUrls: [
      'https://commons.wikimedia.org/wiki/Special:FilePath/Soueast%20Logo.png',
      'https://logo-teka.com/wp-content/uploads/2025/07/soueast-logo.svg',
    ],
    logoDomain: 'soueast-motor.com',
    models: ['DX3', 'DX5', 'DX7', 'S06', 'S07', 'S09'],
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
    models: ['Actyon', 'Korando', 'Kyron', 'Musso', 'Rexton', 'Stavic', 'Tivoli', 'XLV'],
  },
  {
    brand: 'SWM',
    logoUrls: [
      'https://commons.wikimedia.org/wiki/Special:FilePath/SWM%20Motors%20logo.svg',
      'https://logo-teka.com/wp-content/uploads/2025/06/swm-motors-logo.svg',
      'https://www.swm-usa.com/wp-content/uploads/2020/06/SWM-Made-in-Italy-Logo.png',
    ],
    logoDomain: 'swm-motors.com',
    models: ['G01', 'G01F', 'G05', 'X7'],
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
    models: ['Alto', 'Baleno', 'Celerio', 'Ciaz', 'Dzire', 'Ertiga', 'Fronx', 'Grand Nomade', 'Grand Vitara', 'Ignis', 'Jimny', 'Kizashi', 'S-Cross', 'Spresso', 'Swift', 'SX4', 'Vitara', 'XL7'],
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
    models: ['4Runner', 'Auris', 'Avanza', 'C-HR', 'Camry', 'Corolla', 'Corolla Cross', 'Etios', 'FJ Cruiser', 'Fortuner', 'Hiace', 'Hilux', 'Land Cruiser', 'Prado', 'Prius', 'Raize', 'RAV4', 'Rush', 'Urban Cruiser', 'Yaris', 'Yaris Cross'],
  },
  {
    brand: 'Volkswagen',
    logoSlug: 'volkswagen',
    logoDomain: 'volkswagen.com',
    models: ['Amarok', 'Atlas', 'Beetle', 'Bora', 'Caddy', 'CrossFox', 'Fox', 'Golf', 'Gol', 'Jetta', 'Nivus', 'Passat', 'Polo', 'Saveiro', 'T-Cross', 'Taos', 'Tiguan', 'Touareg', 'Transporter', 'Virtus', 'Voyage'],
  },
  {
    brand: 'Volvo',
    logoSlug: 'volvo',
    logoDomain: 'volvocars.com',
    models: ['C30', 'C40', 'EX30', 'S40', 'S60', 'S90', 'V40', 'V60', 'XC40', 'XC60', 'XC70', 'XC90'],
  },
]
