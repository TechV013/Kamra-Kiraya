"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

export const dynamic = "force-dynamic";

function BrowseContent() {
  const searchParams = useSearchParams();

  const city = searchParams.get("city");
  const search = searchParams.get("search");

  return (
    <div>
      {/* PUT YOUR FULL OLD BROWSE PAGE JSX HERE */}
      <h1>Browse Rooms</h1>
      <p>City: {city}</p>
      <p>Search: {search}</p>
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <BrowseContent />
    </Suspense>
  );
}
