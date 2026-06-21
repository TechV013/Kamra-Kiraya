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

export function getCityFallbackImage(city?: string | null): string {
  return getCityImages(city)[0];
}
