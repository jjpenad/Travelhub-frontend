/**
 * Textos parametrizables para la vista de resultados (fuera de componentes de presentación).
 */
export const searchResultsCopy = {
  toolbar: {
    filtersToolbarLabel: "Filtros rápidos",
    summaryLead: "128 alojamientos en Santorini",
    filterPrice: "Precio",
    filterRating: "Calificación",
    sortLabel: "Ordenar resultados",
    sortBestMatch: "Mejor coincidencia",
    sortPriceLow: "Precio: menor a mayor",
    sortPriceHigh: "Precio: mayor a menor",
  },
  sidebarTitle: "Filtros",
  sidebarPlaceholder:
    "Aquí irán los filtros (precio, estrellas, servicios…).",
  filters: {
    title: "Filtros",
    resetAll: "Reiniciar",
    priceRange: "Rango de precio",
    priceMinLabel: "Precio mínimo",
    priceMaxLabel: "Precio máximo",
    starRating: "Calificación por estrellas",
    starOptions: [
      { value: 5, label: "5 estrellas" },
      { value: 4, label: "4+ estrellas" },
      { value: 3, label: "3+ estrellas" },
    ],
    amenities: "Amenidades",
    amenityOptions: [
      { key: "pool", label: "Piscina", icon: "🏊" },
      { key: "wifi", label: "WiFi", icon: "📶" },
      { key: "breakfast_included", label: "Desayuno incluido", icon: "🍳" },
      { key: "parking", label: "Estacionamiento", icon: "🅿️" },
      { key: "air_conditioning", label: "Aire acondicionado", icon: "❄️" },
      { key: "gym", label: "Gimnasio", icon: "🏋️" },
      { key: "pets_allowed", label: "Mascotas permitidas", icon: "🐾" },
    ],
    applyFilters: "Aplicar filtros",
    activeFilters: (count) =>
      count === 1 ? "1 filtro activo" : `${count} filtros activos`,
  },
  resultsRegionLabel: "Listado de alojamientos",
  hotelCard: {
    imageAlt: (hotelName) => `Vista del alojamiento ${hotelName}`,
    ratingAria: (value) => `Valoración ${value} de 5`,
    reviews: (count) =>
      `${count.toLocaleString("es")} ${count === 1 ? "opinión" : "opiniones"}`,
    priceLabel: (amount) => `$${amount.toLocaleString("es")}`,
    perNight: "por noche",
    priceTaxNote: "impuestos no incluidos",
    bookNow: "Reservar ahora",
    refundable: "Cancelación con reembolso",
    notRefundable: "Tarifa no reembolsable",
    amenitiesMore: (n) => `+${n} más`,
  },
};
