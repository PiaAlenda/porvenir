import { useCallback, useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/features/home/Hero";
import EducationalOffer from "@/components/features/home/EducationalOffer";
import InfoForm from "@/components/features/home/InfoForm";
import Footer from "@/components/features/home/Footer";

interface HomeProps {
  onNavigateHome?: () => void;
  onNavigateToDetail: (id: string) => void;
  onNavigateToAbout: () => void;
  onNavigateToLocation: () => void;
  onNavigateToLogin?: () => void;
  onBack?: () => void;
  initialSelection?: { id: string; modality: "virtual" | "presencial" } | null;
  enrollCareerId?: string | null;
  onProgramSelectionChange?: (id: string | null) => void;
}

const Home = ({ onNavigateHome, onNavigateToDetail, onNavigateToAbout, onNavigateToLocation, onNavigateToLogin, initialSelection, enrollCareerId, onProgramSelectionChange }: HomeProps) => {
  const [selectedProgram, setSelectedProgram] = useState<{
    id: string;
    modality: "virtual" | "presencial";
  } | null>(initialSelection ?? null);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Home - Obreros del Porvenir";
    return () => {
      document.title = "Obreros del Porvenir - Escuela Superior de Comercio N° 44";
    };
  }, []);

  const handleSelectProgram = useCallback((id: string | null, modality?: "virtual" | "presencial") => {
    setSelectedProgram(id && modality ? { id, modality } : null);
    onProgramSelectionChange?.(id);
  }, [onProgramSelectionChange]);

  return (
    <div className="Home">
      <Navbar
        onNavigateHome={onNavigateHome}
        onNavigateToProgram={handleSelectProgram}
        onNavigateToAbout={onNavigateToAbout}
        onNavigateToLocation={onNavigateToLocation}
        onNavigateToLogin={onNavigateToLogin}
        onNavigateToDetail={onNavigateToDetail}
        onScrollToSection={(sectionId) => {
          const el = document.getElementById(sectionId);
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }}
      />
      <Hero onNavigateAbout={onNavigateToAbout} />
      <div id="academic-offer-section">
        <div id="virtual" className="absolute -mt-20" />
        <div id="presencial" className="absolute -mt-20" />
        <EducationalOffer
          onViewDetail={onNavigateToDetail}
          activeSelection={selectedProgram}
          onSelectProgram={handleSelectProgram}
        />
      </div>

      <InfoForm careerId={enrollCareerId} />
      <Footer />
    </div>
  );
};

export default Home;