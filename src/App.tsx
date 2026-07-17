import { useState } from "react"
import Home from "@/pages/Home"
import CareerDetail from "@/pages/CareerDetail"
import About from "@/pages/About"
import Location from "@/pages/Location"
import FloatingNav from "@/components/layout/FloatingNav"

function App() {
  const [view, setView] = useState<{ name: "home" | "detail" | "about" | "location"; params?: any }>({
    name: "home",
  });

  const navigateToDetail = (id: string) => {
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
    setView({ name: "home" });
    window.scrollTo(0, 0);
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

  return (
    <div className="App min-h-screen bg-white">
      {/* Componente de Navegación Global */}
      {view.name !== "detail" && (
        <FloatingNav 
          currentView={view.name} 
          onNavigate={handleGlobalNavigate}
          onScrollToSection={handleScrollToSection}
        />
      )}

      {view.name === "home" && (
        <Home 
          onNavigateToDetail={navigateToDetail} 
          onNavigateToAbout={navigateToAbout}
          onNavigateToLocation={navigateToLocation}
        />
      )}
      {view.name === "detail" && (
        <CareerDetail 
          careerId={view.params?.id} 
          onBack={navigateHome} 
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