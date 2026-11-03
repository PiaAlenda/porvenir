import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import Hero from "@/components/features/home/Hero";
import EducationalOffer from "@/components/features/home/EducationalOffer";
// El formulario queda debajo del pliegue y trae libphonenumber: se baja aparte.
const InfoForm = lazy(() => import("@/components/features/home/InfoForm"));

interface HomeProps {
  onNavigateToDetail: (id: string) => void;
  onNavigateToAbout: () => void;
  initialSelection?: { id: string; modality: "virtual" | "presencial" } | null;
}

const Home = ({ onNavigateToDetail, onNavigateToAbout, initialSelection }: HomeProps) => {
  const [selectedProgram, setSelectedProgram] = useState<{
    id: string;
    modality: "virtual" | "presencial";
  } | null>(initialSelection ?? null);

  // El navbar global puede pedir una categoría estando ya en Home.
  useEffect(() => {
    if (initialSelection) setSelectedProgram(initialSelection);
  }, [initialSelection]);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Home - Obreros del Porvenir";
    return () => {
      document.title = "Obreros del Porvenir - Escuela Técnica de Capacitación Laboral N° 917";
    };
  }, []);

  const handleSelectProgram = useCallback((id: string | null, modality?: "virtual" | "presencial") => {
    setSelectedProgram(id && modality ? { id, modality } : null);
  }, []);

  return (
    <div className="Home">
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

      <Suspense fallback={<section id="inscripciones" className="min-h-[80vh] bg-white" />}>
        <InfoForm />
      </Suspense>
    </div>
  );
};

export default Home;