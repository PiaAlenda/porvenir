import { useState, useRef, useEffect } from "react"
import Home from "@/pages/Home"
import CareerDetail from "@/pages/CareerDetail"
import About from "@/pages/About"
import Location from "@/pages/Location"
import Admin from "@/pages/Admin"
import Login from "@/pages/Login"
import Privacy from "@/pages/Privacy"
import Terms from "@/pages/Terms"
import Accessibility from "@/pages/Accessibility"
import Contact from "@/pages/Contact"
import CookieBanner from "@/components/layout/CookieBanner"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/features/home/Footer"
import { SiteConfigProvider } from "@/siteConfig"
import { hasAdminSession, subscribeAdminSession } from "@/lib/adminSession"

type ViewName = "home" | "detail" | "about" | "location" | "admin" | "login" | "privacy" | "terms" | "accessibility" | "contact"

interface ViewState {
    name: ViewName
    params?: { id: string }
}

const INFO_HASHES: Record<string, ViewName> = {
    "#privacidad": "privacy",
    "#terminos": "terms",
    "#accesibilidad": "accessibility",
    "#contacto": "contact",
}

const resolveHashView = (): ViewState => {
    const info = INFO_HASHES[window.location.hash]
    if (info) return { name: info }
    if (window.location.hash === "#login") return { name: "login" }
    if (window.location.hash === "#admin") return hasAdminSession() ? { name: "admin" } : { name: "login" }
    return { name: "home" }
}

function App() {
  const [view, setView] = useState<ViewState>(resolveHashView);
  const [programSelection, setProgramSelection] = useState<{ id: string; modality: "virtual" | "presencial" } | null>(null);
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
    setView({ name: "about" });
    window.scrollTo(0, 0);
  };

  const navigateToLocation = () => {
    setView({ name: "location" });
    window.scrollTo(0, 0);
  };

  const navigateHome = () => {
    history.replaceState(null, "", window.location.pathname);
    setProgramSelection(null);
    setView({ name: "home" });
    window.scrollTo(0, 0);
  };

  const navigateToLogin = () => {
    history.replaceState(null, "", "#login");
    setView({ name: "login" });
    window.scrollTo(0, 0);
  };

  const handleLoginSuccess = () => {
    history.replaceState(null, "", "#admin");
    setView({ name: "admin" });
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

  const navigateToProgram = (id: string, modality: "virtual" | "presencial") => {
    setProgramSelection({ id, modality });
    setView({ name: "home" });
  };

  const scrollToOffer = () => {
    const scroll = () =>
      document.getElementById("academic-offer-section")?.scrollIntoView({ behavior: "smooth" });
    if (view.name === "home") {
      scroll();
    } else {
      history.replaceState(null, "", window.location.pathname);
      setView({ name: "home" });
      setTimeout(scroll, 150);
    }
  };

  const showChrome = view.name !== "admin";

  return (
    <SiteConfigProvider>
      <div className="App min-h-screen bg-white">
        {showChrome && (
          <Navbar
            showSearchBanner={view.name === "home"}
            onNavigateHome={navigateHome}
            onNavigateToProgram={navigateToProgram}
            onNavigateToAbout={navigateToAbout}
            onNavigateToLocation={navigateToLocation}
            onNavigateToLogin={navigateToLogin}
            onNavigateToDetail={navigateToDetail}
            onScrollToSection={scrollToOffer}
          />
        )}

        {view.name === "home" && (
          <Home
            onNavigateToDetail={navigateToDetail}
            onNavigateToAbout={navigateToAbout}
            initialSelection={programSelection}
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
        {view.name === "privacy" && <Privacy onBack={navigateHome} />}
        {view.name === "terms" && <Terms onBack={navigateHome} />}
        {view.name === "accessibility" && <Accessibility onBack={navigateHome} />}
        {view.name === "contact" && <Contact onBack={navigateHome} />}
        {view.name === "login" && (
          <Login onSuccess={handleLoginSuccess} onBack={navigateHome} />
        )}
        {showChrome && (
          <Footer onNavigateAbout={navigateToAbout} onNavigateToOffer={scrollToOffer} />
        )}
        <CookieBanner hidden={view.name === "admin" || view.name === "login"} />
      </div>
    </SiteConfigProvider>
  )
}

export default App