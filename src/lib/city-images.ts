const CITY_IMAGES: Record<string, string[]> = {
  "delhi": [
    "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&q=80",
    "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&q=80",
  ],
  "mumbai": [
    "https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=800&q=80",
    "https://images.unsplash.com/photo-1590073242678-70ee3fc28f8e?w=800&q=80",
  ],
  "bangalore": [
    "https://images.unsplash.com/photo-1596178060671-7a80dc8055f6?w=800&q=80",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
  ],
  "hyderabad": [
    "https://images.unsplash.com/photo-1596178060817-f0f8f8e1f591?w=800&q=80",
    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80",
  ],
  "pune": [
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
  ],
  "kolkata": [
    "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
  ],
  "chennai": [
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
  ],
  "jaipur": [
    "https://images.unsplash.com/photo-1599661046289-e31897846e41?w=800&q=80",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
  ],
};

const FALLBACK = "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80";

const LANDMARK_IMAGES: Record<string, string[]> = {
  "delhi": [
    "https://images.unsplash.com/photo-1594660351155-0237adc1d71a?w=800&q=80",
    "https://images.unsplash.com/photo-1593001872117-79e3be9a4d08?w=800&q=80",
    "https://images.unsplash.com/photo-1604772659841-5ed8e32adc98?w=800&q=80",
  ],
  "mumbai": [
    "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800&q=80",
    "https://images.unsplash.com/photo-1590073242678-70ee3fc28f8e?w=800&q=80",
    "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=800&q=80",
  ],
  "bangalore": [
    "https://images.unsplash.com/photo-1596178060671-7a80dc8055f6?w=800&q=80",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
    "https://images.unsplash.com/photo-1600456899121-68eda5709357?w=800&q=80",
  ],
  "hyderabad": [
    "https://images.unsplash.com/photo-1621243804936-775306a8f1e3?w=800&q=80",
    "https://images.unsplash.com/photo-1621243410832-8e0f1354754d?w=800&q=80",
  ],
  "kolkata": [
    "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80",
    "https://images.unsplash.com/photo-1593001872117-79e3be9a4d08?w=800&q=80",
  ],
  "chennai": [
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
    "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800&q=80",
  ],
  "pune": [
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80",
    "https://images.unsplash.com/photo-1621243410832-8e0f1354754d?w=800&q=80",
  ],
  "jaipur": [
    "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=800&q=80",
    "https://images.unsplash.com/photo-1577756853939-e55e71208d02?w=800&q=80",
  ],
  "goa": [
    "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&q=80",
    "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800&q=80",
  ],
  "varanasi": [
    "https://images.unsplash.com/photo-1566837945700-30057527ade0?w=800&q=80",
    "https://images.unsplash.com/photo-1593001872117-79e3be9a4d08?w=800&q=80",
  ],
  "amritsar": [
    "https://images.unsplash.com/photo-1577756853939-e55e71208d02?w=800&q=80",
    "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&q=80",
  ],
  "shimla": [
    "https://images.unsplash.com/photo-1616949755613-4e7d15938eb1?w=800&q=80",
    "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&q=80",
  ],
  "manali": [
    "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=800&q=80",
    "https://images.unsplash.com/photo-1585409677983-0f6c41ca9c6b?w=800&q=80",
  ],
  "rishikesh": [
    "https://images.unsplash.com/photo-1591711656800-7419e2fce71b?w=800&q=80",
    "https://images.unsplash.com/photo-1585409677983-0f6c41ca9c6b?w=800&q=80",
  ],
};

export function getCityImages(city?: string | null): string[] {
  if (!city) return [FALLBACK];
  const key = city.toLowerCase().trim();
  for (const [name, images] of Object.entries(CITY_IMAGES)) {
    if (key.includes(name) || name.includes(key)) {
      return images;
    }
  }
  return [FALLBACK];
}

export function getCityLandmarkImages(city?: string | null): string[] {
  if (!city) return [FALLBACK];
  const key = city.toLowerCase().trim();
  for (const [name, images] of Object.entries(LANDMARK_IMAGES)) {
    if (key.includes(name) || name.includes(key)) {
      return images;
    }
  }
  return [FALLBACK];
}

export function getCityFallbackImage(city?: string | null): string {
  return getCityLandmarkImages(city)[0];
}

export function getCityImagesBatch(cities: string[]): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const city of cities) {
    result[city] = getCityLandmarkImages(city);
  }
  return result;
}
