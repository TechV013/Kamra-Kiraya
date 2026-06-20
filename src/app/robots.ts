import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://student-room-booking-platform.onrender.com";

  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/dashboard/", "/admin-setup"] },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
