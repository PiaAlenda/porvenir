import { useCallback, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import Hero from "@/components/features/home/Hero";
import EducationalOffer from "@/components/features/home/EducationalOffer";
import Programs from "@/components/features/home/Programs";
import InfoForm from "@/components/features/home/InfoForm";
import Footer from "@/components/features/home/Footer";


interface HomeProps {
  onNavigateToDetail: (id: string) => void;
  onNavigateToAbout: () => void;
  onNavigateToLocation: () => void;
  onBack?: () => void;
  initialSelection?: { id: string; modality: "virtual" | "presencial" } | null;
}

const Home = ({ onNavigateToDetail, onNavigateToAbout, onNavigateToLocation, initialSelection }: HomeProps) => {
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
  }, []);

  return (
    <div className="Home">
      <Hero
        onNavigateAbout={onNavigateToAbout}
        onNavigateLocation={onNavigateToLocation}
        onNavigateToProgram={handleSelectProgram}
      />
      <div id="academic-offer-section">
        <div id="virtual" className="absolute -mt-20" />
        <div id="presencial" className="absolute -mt-20" />
        <EducationalOffer
          onSelectProgram={handleSelectProgram}
          activeSelection={selectedProgram}
        />
      </div>

      <AnimatePresence initial={false}>
        {selectedProgram && (
          <Programs
            selection={selectedProgram}
            onViewDetail={onNavigateToDetail}
          />
        )}
      </AnimatePresence>

      <InfoForm />
      <Footer />
    </div>
  );
};

export default Home;