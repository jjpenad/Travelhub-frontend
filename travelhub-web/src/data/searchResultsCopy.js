/**
 * Textos parametrizables para la vista de resultados (fuera de componentes de presentación).
 */
export const searchResultsCopy = {
  toolbar: {
    filtersToolbarLabel: "Filtros rápidos",
    summaryLead: "128 alojamientos en Santorini",
    filterPrice: "Precio",
    filterRating: "Calificación",
    filterAmenities: "Amenidades",
    filterMap: "Mapa",
    sortLabel: "Ordenar resultados",
    sortBestMatch: "Mejor coincidencia",
    sortPriceLow: "Precio: menor a mayor",
    sortPriceHigh: "Precio: mayor a menor",
    sortRating: "Valoración de huéspedes",
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
    propertyType: "Tipo de propiedad",
    propertyTypeOptions: [
      { key: "hotel", label: "Hotel" },
      { key: "villa", label: "Villa" },
      { key: "resort", label: "Resort" },
      { key: "hostel", label: "Hostal" },
      { key: "apartment", label: "Apartamento" },
    ],
    amenities: "Amenidades",
    amenityOptions: [
      { key: "pool", label: "Piscina", icon: "🏊" },
      { key: "wifi", label: "WiFi", icon: "📶" },
      { key: "breakfast", label: "Desayuno", icon: "🍳" },
      { key: "spa", label: "Spa", icon: "🧖" },
      { key: "parking", label: "Parqueadero", icon: "🅿️" },
      { key: "gym", label: "Gimnasio", icon: "🏋️" },
    ],
    guestRating: "Calificación de huéspedes",
    guestRatingOptions: [
      { value: "any", label: "Cualquier calificación" },
      { value: "9", label: "Excelente (9+)" },
      { value: "8", label: "Muy bueno (8+)" },
      { value: "7", label: "Bueno (7+)" },
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
