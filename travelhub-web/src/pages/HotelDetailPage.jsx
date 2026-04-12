import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import BookingWidget from "../components/hotel/BookingWidget";
import GuestReviews from "../components/hotel/GuestReviews";
import HotelDescription from "../components/hotel/HotelDescription";
import HotelGallery from "../components/hotel/HotelGallery";
import HotelHeader from "../components/hotel/HotelHeader";
import Navbar from "../components/layout/Navbar";
import PageContainer from "../components/layout/PageContainer";
import { mockHotels } from "../data/mockHotels";
import "./HotelDetailPage.css";

function HotelDetailContent({ hotel }) {
  const [selectedRoom, setSelectedRoom] = useState(
    () => hotel.availableRooms?.[0] ?? "",
  );

  const displayName = hotel.name;

  return (
    <div className="hotel-detail-page">
      <Navbar />
      <PageContainer>
        <div
          className="hotel-detail"
          data-selected-room={selectedRoom}
        >
          <nav className="hotel-detail__breadcrumb" aria-label="Migas de pan">
            <ol className="hotel-detail__breadcrumb-list">
              <li className="hotel-detail__breadcrumb-item">
                <Link className="hotel-detail__breadcrumb-link" to="/">
                  Inicio
                </Link>
              </li>
              <li className="hotel-detail__breadcrumb-item">
                <Link className="hotel-detail__breadcrumb-link" to="/search">
                  Grecia
                </Link>
              </li>
              <li className="hotel-detail__breadcrumb-item">
                <Link className="hotel-detail__breadcrumb-link" to="/search">
                  Santorini
                </Link>
              </li>
              <li
                className="hotel-detail__breadcrumb-item hotel-detail__breadcrumb-item--current"
                aria-current="page"
              >
                {displayName}
              </li>
            </ol>
          </nav>

          <div className="hotel-detail__layout">
            <div className="hotel-detail__main-content">
              <div className="hotel-detail__main-stack">
                {hotel.image ? (
                  <div className="hotel-detail__gallery">
                    <HotelGallery hotel={hotel} totalPhotos={48} />
                  </div>
                ) : null}

                <HotelHeader hotel={hotel} />

                <HotelDescription hotel={hotel} />

                <GuestReviews hotel={hotel} />
              </div>
            </div>

            <aside
              className="hotel-detail__booking-sidebar"
              aria-label="Reserva"
            >
              <BookingWidget
                hotel={hotel}
                nights={5}
                selectedRoom={selectedRoom}
                onSelectedRoomChange={setSelectedRoom}
                availableRooms={hotel.availableRooms ?? []}
              />
            </aside>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}

function HotelDetailPage() {
  const { hotelId: hotelIdParam } = useParams();
  const hotelId = hotelIdParam ? decodeURIComponent(hotelIdParam) : "";
  const hotel = mockHotels.find((h) => h.id === hotelId);

  if (!hotel) {
    return (
      <div className="hotel-detail-page">
        <Navbar />
        <PageContainer>
          <div className="hotel-detail hotel-detail--not-found">
            <h1 className="hotel-detail__not-found-title">Hotel not found</h1>
            <p className="hotel-detail__not-found-text">
              No listing matches this URL. Check the link or return to search.
            </p>
            <Link className="hotel-detail__not-found-link" to="/search">
              Back to results
            </Link>
          </div>
        </PageContainer>
      </div>
    );
  }

  return <HotelDetailContent key={hotel.id} hotel={hotel} />;
}

export default HotelDetailPage;
