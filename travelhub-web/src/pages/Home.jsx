import Navbar from "../components/layout/Navbar";
import PageContainer from "../components/layout/PageContainer";
import ExploreSection from "../components/home/ExploreSection";
import FeaturedDestinations from "../components/home/FeaturedDestinations";
import Hero from "../components/home/Hero";
import "./Home.css";

/** MVP: en true muestra la sección Explorar y Destinos destacados */
const showHomeExploreBlocks = false;

function Home() {
  return (
    <div className="home-page">
      <Navbar />
      <Hero />
      {showHomeExploreBlocks ? (
        <PageContainer>
          <ExploreSection />
          <FeaturedDestinations />
        </PageContainer>
      ) : null}
    </div>
  );
}

export default Home;
