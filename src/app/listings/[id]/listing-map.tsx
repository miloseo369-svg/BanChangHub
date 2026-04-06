"use client";

import { MapPin } from "lucide-react";

export default function ListingMap({
  lat,
  lng,
  title,
}: {
  lat: number;
  lng: number;
  title: string;
}) {
  // Use OpenStreetMap embed (no API key required)
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.005}%2C${lat - 0.005}%2C${lng + 0.005}%2C${lat + 0.005}&layer=mapnik&marker=${lat}%2C${lng}`;
  const linkUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
        <MapPin size={14} className="text-teal-600" />
        <h3 className="text-sm font-bold text-slate-800">ตำแหน่งที่ตั้ง</h3>
      </div>
      <div className="relative aspect-[16/9]">
        <iframe
          src={mapUrl}
          className="h-full w-full border-0"
          loading="lazy"
          title={`แผนที่ ${title}`}
        />
      </div>
      <a
        href={linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-1.5 border-t border-slate-100 py-2.5 text-xs font-medium text-teal-600 hover:bg-slate-50"
      >
        <MapPin size={12} />
        เปิดแผนที่ขนาดใหญ่
      </a>
    </div>
  );
}
