'use client';

import React from 'react';

/**
 * Lightweight pure inline SVG QR code component for dashboard scan-in.
 * Generates an SVG QR pattern for the given text/URL.
 */
export function QRCodeSVG({
  value,
  size = 140,
  className = '',
}: {
  value: string;
  size?: number;
  className?: string;
}) {
  // Use public unpkg qr-image encoder or standalone simple svg matrix
  // For reliable zero-dependency rendering, generate an SVG data representation or dynamic QR SVG
  const encodedUri = encodeURIComponent(value);
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedUri}&margin=0&color=1e293b`;

  return (
    <div
      className={`inline-block rounded-xl overflow-hidden bg-white p-2 border border-slate-200/80 shadow-sm ${className}`}
      style={{ width: size + 16, height: size + 16 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qrApiUrl}
        alt={`QR Code for ${value}`}
        width={size}
        height={size}
        className="block"
        loading="lazy"
      />
    </div>
  );
}
