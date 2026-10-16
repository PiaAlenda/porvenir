import { useState, useRef, useEffect } from "react"
import Home from "@/pages/Home"
import CareerDetail from "@/pages/CareerDetail"
import About from "@/pages/About"
import Location from "@/pages/Location"
import Admin from "@/pages/Admin"
import Login from "@/pages/Login"
import FloatingNav from "@/components/layout/FloatingNav"
import { SiteConfigProvider } from "@/siteConfig"
import { hasAdminSession, subscribeAdminSession } from "@/lib/adminSession"

type ViewName = "home" | "detail" | "about" | "location" | "admin" | "login"

interface ViewState {
    name: ViewName
    params?: { id: string }
}

const resolveHashView = (): ViewState => {
    if (window.location.hash === "#login") return { name: "login" }
    if (window.location.hash === "#admin") return hasAdminSession() ? { name: "admin" } : { name: "login" }
    return { name: "home" }
}

function App() {
  const [view, setView] = useState<ViewState>(resolveHashView);
  const [programSelection, setProgramSelection] = useState<{ id: string; modality: "virtual" | "presencial" } | null>(null);
  const [activeNavId, setActiveNavId] = useState<string | null>(null);
  const savedScrollY = useRef<number>(0);

  useEffect(() => {
    const onHashChange = () => {
      setView(resolveHashView());
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  /*
   * Si la sesión se cae desde el panel (venció y no se pudo renovar), la
   * pantalla de login es la que tiene que salir, con su aviso. Sin esto el
   * panel quedaba en blanco mostrando "No autorizado" mientras el resto del
   * sitio seguía funcionando normal.
   */
  useEffect(
    () =>
      subscribeAdminSession(() => {
        if (!hasAdminSession()) {
          history.replaceState(null, "", "#login");
          setView({ name: "login" });
        }
      }),
    [],
  );

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
    history.replaceState(null, "", window.location.pathname);
    setProgramSelection(null);
    setActiveNavId(null);
    setView({ name: "home" });
    window.scrollTo(0, 0);
  };

  const navigateToLogin = () => {
    history.replaceState(null, "", "#login");
    setActiveNavId(null);
    setView({ name: "login" });
    window.scrollTo(0, 0);
  };

  const handleLoginSuccess = () => {
    history.replaceState(null, "", "#admin");
    setView({ name: "admin" });
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

  const handleGlobalNavigate = (viewName: "home" | "about" | "location" | "login") => {
    if (viewName === "home") navigateHome();
    else if (viewName === "about") navigateToAbout();
    else if (viewName === "location") navigateToLocation();
    else if (viewName === "login") navigateToLogin();
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

  const showNav = view.name !== "detail" && view.name !== "admin" && view.name !== "login";

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
            onNavigateHome={navigateHome} 
            onNavigateToDetail={navigateToDetail} 
            onNavigateToAbout={navigateToAbout}
            onNavigateToLocation={navigateToLocation}
            onNavigateToLogin={navigateToLogin}
            initialSelection={programSelection}
            onProgramSelectionChange={(id) => setActiveNavId(id ? programNavId(id) : null)}
          />
        )}
        {view.name === "detail" && (
          <CareerDetail 
            careerId={view.params!.id} 
            onBack={() => navigateToPrograms(view.params!.id)}
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
        {view.name === "login" && (
          <Login onSuccess={handleLoginSuccess} onBack={navigateHome} />
        )}
      </div>
    </SiteConfigProvider>
  )
}

export default App