import i18n from "../i18n";

/** Miniaturas de galería (alt traducibles). */
export function buildGalleryThumbs(hotel, displayName) {
  if (!hotel?.image) {
    return [];
  }
  const sep = hotel.image.includes("?") ? "&" : "?";
  return [0, 1, 2].map((i) => ({
    src: `${hotel.image}${sep}w=480&h=${280 + i * 24}&fit=crop&auto=format&q=82`,
    alt: i18n.t("hotelDetail.galleryThumbAlt", { name: displayName, n: i + 1 }),
  }));
}
