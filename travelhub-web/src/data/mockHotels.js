import i18n from "../i18n";

/**
 * Datos invariantes (marca, precios, imágenes).
 * Etiquetas visibles salen de locales demoHotels, clave id con guiones bajos en lugar de guiones medios del id.
 */
export const MOCK_HOTEL_SEEDS = [
  {
    id: "hotel-mystique",
    name: "Mystique",
    rating: 4.9,
    reviewsCount: 1284,
    price: 489,
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
    isRefundable: true,
  },
  {
    id: "hotel-vedema",
    name: "Vedema",
    rating: 4.8,
    reviewsCount: 942,
    price: 356,
    image:
      "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80",
    isRefundable: true,
  },
  {
    id: "hotel-katikies",
    name: "Katikies",
    rating: 4.95,
    reviewsCount: 2103,
    price: 612,
    image:
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
    isRefundable: false,
  },
  {
    id: "hotel-canaves-oia",
    name: "Canaves Oia",
    rating: 4.85,
    reviewsCount: 876,
    price: 540,
    image:
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80",
    isRefundable: true,
  },
  {
    id: "hotel-grace",
    name: "Grace Santorini",
    rating: 4.75,
    reviewsCount: 654,
    price: 425,
    image:
      "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80",
    isRefundable: true,
  },
  {
    id: "hotel-andronis",
    name: "Andronis Luxury Suites",
    rating: 4.82,
    reviewsCount: 1530,
    price: 398,
    image:
      "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&q=80",
    isRefundable: false,
  },
];

function demoHotelsI18nKey(hotelId) {
  return String(hotelId).replace(/-/g, "_");
}

function readDemoUiPack(hotelId) {
  const k = demoHotelsI18nKey(hotelId);
  const pack = i18n.t(`demoHotels.${k}`, { returnObjects: true });
  if (!pack || typeof pack !== "object" || Array.isArray(pack)) {
    return null;
  }
  const amenities = Array.isArray(pack.amenities) ? pack.amenities.filter(Boolean) : [];
  const availableRooms = Array.isArray(pack.availableRooms)
    ? pack.availableRooms.filter(Boolean)
    : [];
  const location =
    typeof pack.location === "string" && pack.location.trim() !== ""
      ? pack.location.trim()
      : null;
  return { location, amenities, availableRooms };
}

/**
 * Hoteles de demo con ubicación, amenidades y tipos de habitación según idioma activo de i18n.
 * @returns {object[]}
 */
export function getLocalizedMockHotels() {
  void i18n.resolvedLanguage;
  return MOCK_HOTEL_SEEDS.map((seed) => {
    const ui = readDemoUiPack(seed.id);
    return {
      ...seed,
      location: ui?.location ?? "",
      amenities: ui?.amenities?.length ? ui.amenities : [],
      availableRooms: ui?.availableRooms?.length ? ui.availableRooms : [],
    };
  });
}

export default getLocalizedMockHotels;
