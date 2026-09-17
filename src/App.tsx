import { useState, useRef, useEffect } from "react"
import Home from "@/pages/Home"
import CareerDetail from "@/pages/CareerDetail"
import About from "@/pages/About"
import Location from "@/pages/Location"
import Admin from "@/pages/Admin"
import FloatingNav from "@/components/layout/FloatingNav"
import { SiteConfigProvider } from "@/siteConfig"

type ViewName = "home" | "detail" | "about" | "location" | "admin"

interface ViewState {
    name: ViewName
    params?: { id: string }
}

const initialView = (): ViewState =>
    window.location.hash === "#admin" ? { name: "admin" } : { name: "home" }

function App() {
  const [view, setView] = useState<ViewState>(initialView);
  const [programSelection, setProgramSelection] = useState<{ id: string; modality: "virtual" | "presencial" } | null>(null);
  const [activeNavId, setActiveNavId] = useState<string | null>(null);
  const [enrollCareerId, setEnrollCareerId] = useState<string | null>(null);
  const savedScrollY = useRef<number>(0);

  useEffect(() => {
    const onHashChange = () => {
      setView(window.location.hash === "#admin" ? { name: "admin" } : { name: "home" });
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigateToDetail = (id: string) => {
    savedScrollY.current = window.scrollY;
    setView({ name: "detail", params: { id } });
    window.scrollTo(0, 0);
  };

  const navigateToAbout = () => {
    setActiveNavId("about");
    setView({ name: "about" });
    window.scrollTo(0, 0);
  };

  const navigateToLocation = () => {
    setActiveNavId("location");
    setView({ name: "location" });
    window.scrollTo(0, 0);
  };

  const navigateHome = () => {
    setProgramSelection(null);
    setActiveNavId(null);
    setView({ name: "home" });
    window.scrollTo(0, 0);
  };

  const programNavId = (category: string) => (category === "tec" ? "carrera" : "cursos");

  const navigateToPrograms = (careerId: string) => {
    const category = careerId.startsWith("bach") || careerId.includes("adultos") ? "bach" : "tec";
    setProgramSelection({ id: category, modality: "presencial" });
    setActiveNavId(programNavId(category));
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
    if (sectionId === "inscripciones") setActiveNavId("inscripciones");
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleNavToProgram = (category: string, modality: "virtual" | "presencial") => {
    setProgramSelection({ id: category, modality });
    setActiveNavId(programNavId(category));
    if (view.name !== "home") {
      setView({ name: "home" });
    }
  };

  const handleBackToForm = (careerId?: string) => {
    setEnrollCareerId(careerId ?? null);
    navigateHome();
    setTimeout(() => document.getElementById("inscripciones")?.scrollIntoView({ behavior: "smooth" }), 200);
  };

  const showNav = view.name !== "detail" && view.name !== "admin";

  return (
    <SiteConfigProvider>
      <div className="App min-h-screen bg-white">
        {/* Componente de Navegación Global */}
        {showNav && (
          <FloatingNav 
            currentView={view.name === "admin" ? "home" : view.name} 
            activeNavId={activeNavId}
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
            enrollCareerId={enrollCareerId}
            onProgramSelectionChange={(id) => setActiveNavId(id ? programNavId(id) : null)}
          />
        )}
        {view.name === "detail" && (
          <CareerDetail 
            careerId={view.params!.id} 
            onBack={() => navigateToPrograms(view.params!.id)}
            onBackToForm={handleBackToForm}
          />
        )}
        {view.name === "about" && (
          <About onBack={navigateHome} />
        )}
        {view.name === "location" && (
          <Location onBack={navigateHome} />
        )}
        {view.name === "admin" && (
          <Admin
            onExit={() => {
              history.replaceState(null, "", window.location.pathname);
              navigateHome();
            }}
          />
        )}
      </div>
    </SiteConfigProvider>
  )
}

export default App