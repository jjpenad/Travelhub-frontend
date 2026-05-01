import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { buildGalleryThumbs } from "../../utils/hotelDetailHelpers";
import "./HotelGallery.css";

/**
 * Galería: imagen principal + 3 miniaturas.
 */
function HotelGallery({ hotel }) {
  const { t } = useTranslation();

  const displayName = useMemo(
    () => hotel?.name ?? t("hotelDetail.aboutHotelFallback"),
    [hotel?.name, t],
  );

  const main = useMemo(() => {
    if (!hotel?.image) return null;
    return {
      src: hotel.image,
      alt: t("hotelDetail.galleryMainAlt", { name: displayName }),
    };
  }, [hotel, displayName, t]);

  if (!hotel?.image) {
    return null;
  }

  const thumbs = buildGalleryThumbs(hotel, displayName);

  const list = Array.isArray(thumbs) ? thumbs.slice(0, 3) : [];
  while (list.length < 3 && main?.src) {
    list.push({ src: main.src, alt: main.alt ?? "" });
  }

  return (
    <section className="gallery" aria-label={t("hotelDetail.galleryAria")}>
      <div className="gallery__main">
        {main?.src ? (
          <img
            className="gallery__img gallery__img--main"
            src={main.src}
            alt={main.alt ?? ""}
            loading="lazy"
            width={800}
            height={400}
          />
        ) : null}
      </div>

      <div className="gallery__side">
        <div className="gallery__thumbs">
          {list.map((item, index) => (
            <div key={`${item.src}-${index}`} className="gallery__thumb">
              {item.src ? (
                <img
                  className="gallery__img gallery__img--thumb"
                  src={item.src}
                  alt={item.alt ?? ""}
                  loading="lazy"
                  width={400}
                  height={220}
                />
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HotelGallery;
