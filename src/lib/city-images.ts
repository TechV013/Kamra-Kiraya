const ROOM_IMAGES: Record<string, string[]> = {
  "delhi": [
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
  ],
  "mumbai": [
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80",
    "https://images.unsplash.com/photo-1564078516393-cf04bd96a897?w=800&q=80",
    "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800&q=80",
  ],
  "bangalore": [
    "https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=800&q=80",
    "https://images.unsplash.com/photo-1615571022219-eb45cf7faa36?w=800&q=80",
    "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800&q=80",
  ],
  "hyderabad": [
    "https://images.unsplash.com/photo-1590490359683-658d3d23f972?w=800&q=80",
    "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800&q=80",
    "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800&q=80",
  ],
  "pune": [
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80",
  ],
  "kolkata": [
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
    "https://images.unsplash.com/photo-1564078516393-cf04bd96a897?w=800&q=80",
    "https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=800&q=80",
  ],
  "chennai": [
    "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80",
    "https://images.unsplash.com/photo-1615571022219-eb45cf7faa36?w=800&q=80",
    "https://images.unsplash.com/photo-1590490359683-658d3d23f972?w=800&q=80",
  ],
  "jaipur": [
    "https://images.unsplash.com/photo-1564078516393-cf04bd96a897?w=800&q=80",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80",
  ],
  "goa": [
    "https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=800&q=80",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
  ],
  "varanasi": [
    "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800&q=80",
    "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=800&q=80",
    "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80",
  ],
  "amritsar": [
    "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800&q=80",
    "https://images.unsplash.com/photo-1615571022219-eb45cf7faa36?w=800&q=80",
    "https://images.unsplash.com/photo-1564078516393-cf04bd96a897?w=800&q=80",
  ],
  "shimla": [
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
  ],
  "manali": [
    "https://images.unsplash.com/photo-1590490359683-658d3d23f972?w=800&q=80",
    "https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=800&q=80",
    "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800&q=80",
  ],
  "rishikesh": [
    "https://images.unsplash.com/photo-1615571022219-eb45cf7faa36?w=800&q=80",
    "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80",
    "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800&q=80",
  ],
  "sikar": [
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
  ],
};

const FALLBACK = "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80";

export function getCityImages(city?: string | null): string[] {
  if (!city) return [FALLBACK];
  const key = city.toLowerCase().trim();
  for (const [name, images] of Object.entries(ROOM_IMAGES)) {
    if (key.includes(name) || name.includes(key)) {
      return images;
    }
  }
  return [FALLBACK];
}

export function getCityFallbackImage(city?: string | null): string {
  return getCityImages(city)[0];
}

export function getCityImagesBatch(cities: string[]): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const city of cities) {
    result[city] = getCityImages(city);
  }
  return result;
}
