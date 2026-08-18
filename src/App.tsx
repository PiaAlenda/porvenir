import { useState, useRef } from "react"
import Home from "@/pages/Home"
import CareerDetail from "@/pages/CareerDetail"
import About from "@/pages/About"
import Location from "@/pages/Location"
import FloatingNav from "@/components/layout/FloatingNav"

function App() {
  const [view, setView] = useState<{ name: "home" | "detail" | "about" | "location"; params?: any }>({
    name: "home",
  });
  const [programSelection, setProgramSelection] = useState<{ id: string; modality: "virtual" | "presencial" } | null>(null);
  const savedScrollY = useRef<number>(0);

  const navigateToDetail = (id: string) => {
    savedScrollY.current = window.scrollY;
    setView({ name: "detail", params: { id } });
    window.scrollTo(0, 0);
  };

  const navigateToAbout = () => {
    setView({ name: "about" });
    window.scrollTo(0, 0);
  };

  const navigateToLocation = () => {
    setView({ name: "location" });
    window.scrollTo(0, 0);
  };

  const navigateHome = () => {
    setProgramSelection(null);
    setView({ name: "home" });
    window.scrollTo(0, 0);
  };

  const navigateToPrograms = (careerId: string) => {
    const category = careerId.startsWith("bach") || careerId.includes("adultos") ? "bach" : "tec";
    setProgramSelection({ id: category, modality: "presencial" });
    setView({ name: "home" });
    const scrollTarget = savedScrollY.current;
    savedScrollY.current = 0;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({ top: scrollTarget, behavior: "instant" });
      });
    });
  };

  const handleGlobalNavigate = (viewName: "home" | "about" | "location") => {
    if (viewName === "home") navigateHome();
    else if (viewName === "about") navigateToAbout();
    else if (viewName === "location") navigateToLocation();
  };

  const handleScrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleNavToProgram = (category: string, modality: "virtual" | "presencial") => {
    setProgramSelection({ id: category, modality });
    if (view.name !== "home") {
      setView({ name: "home" });
    }
  };

  return (
    <div className="App min-h-screen bg-white">
      {/* Componente de Navegación Global */}
      {view.name !== "detail" && (
        <FloatingNav 
          currentView={view.name} 
          onNavigate={handleGlobalNavigate}
          onScrollToSection={handleScrollToSection}
          onNavigateToProgram={handleNavToProgram}
        />
      )}

      {view.name === "home" && (
        <Home 
          onNavigateToDetail={navigateToDetail} 
          onNavigateToAbout={navigateToAbout}
          onNavigateToLocation={navigateToLocation}
          initialSelection={programSelection}
        />
      )}
      {view.name === "detail" && (
        <CareerDetail 
          careerId={view.params?.id} 
          onBack={() => navigateToPrograms(view.params?.id)}
          onBackToForm={() => {
            navigateHome();
            setTimeout(() => document.getElementById("inscripciones")?.scrollIntoView({ behavior: "smooth" }), 200);
          }}
        />
      )}
      {view.name === "about" && (
        <About onBack={navigateHome} />
      )}
      {view.name === "location" && (
        <Location onBack={navigateHome} />
      )}
    </div>
  )
}

export default App