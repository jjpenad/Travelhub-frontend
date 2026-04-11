/**
 * Helpers para la vista de detalle de hotel (galería, copy).
 */

export function buildGalleryThumbs(hotel, displayName) {
  if (!hotel?.image) {
    return [];
  }
  const sep = hotel.image.includes("?") ? "&" : "?";
  return [0, 1, 2].map((i) => ({
    src: `${hotel.image}${sep}w=480&h=${280 + i * 24}&fit=crop&auto=format&q=82`,
    alt: `${displayName} — ${i + 1}`,
  }));
}

export function buildDescriptionText(hotelName, location) {
  const place = location ?? "Santorini";
  return `Welcome to ${hotelName}. Nestled above the Aegean in ${place}, this property offers refined spaces, panoramic terraces, and warm Greek hospitality. Unwind by the pool, savor breakfast with a view, and explore the island at your own pace. Each stay is designed for comfort, from attentive service to well-appointed rooms.`;
}
