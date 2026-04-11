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
    alt: `${displayName} — foto ${i + 1}`,
  }));
}

export function buildDescriptionText(hotelName, location) {
  const place = location ?? "Santorini";
  return `Te damos la bienvenida a ${hotelName}. Frente al Egeo en ${place}, este alojamiento ofrece espacios refinados, terrazas panorámicas y la cálida hospitalidad griega. Relájate junto a la piscina, disfruta del desayuno con vistas y explora la isla a tu ritmo. Cada estancia está pensada para el confort, con un servicio atento y habitaciones bien equipadas.`;
}
