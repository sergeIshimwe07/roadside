import { useState, useRef, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useServices, Service, ServiceCategory } from "@/hooks/useServices";
import MapView from "@/components/MapView";
import ServicePanel from "@/components/ServicePanel";
import { Button } from "@/components/ui/button";
import { ShieldCheck, MapPin, LogOut, UserCircle, Menu, History } from "lucide-react";

export default function Index() {
  const { user, isAdmin, isSubscribed, signOut, loading: authLoading, accessLoading } = useAuth();
  const { position, error: geoError, loading: geoLoading } = useGeolocation();
  const [activeFilter, setActiveFilter] = useState<ServiceCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const navigate = useNavigate();

  const { data: services = [], isLoading: servicesLoading } = useServices(
    position?.latitude,
    position?.longitude,
    activeFilter
  );

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  if (authLoading || accessLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin && !isSubscribed) {
    return <Navigate to="/payment" replace />;
  }

  if (geoLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center">
            <MapPin className="h-8 w-8 text-primary" />
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-primary animate-pulse-ring" />
        </div>
        <p className="text-muted-foreground">Locating you...</p>
      </div>
    );
  }

  if (!position) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-4 px-4 text-center">
        <MapPin className="h-12 w-12 text-primary" />
        <h2 className="text-xl font-bold">Location Required</h2>
        <p className="text-muted-foreground max-w-sm">
          Please enable location access to find nearby services. {geoError}
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <MapView
        userLat={position.latitude}
        userLng={position.longitude}
        services={services}
        onServiceClick={setSelectedService}
      />

      <div className="absolute top-4 right-4 z-10" ref={menuRef}>
        <Button
          size="icon"
          variant="secondary"
          onClick={() => setMenuOpen(!menuOpen)}
          title="Menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 flex flex-col gap-1 rounded-lg border border-border bg-card p-1.5 shadow-lg animate-fade-in min-w-[160px]">
            <button
              onClick={() => {
                setMenuOpen(false);
                navigate("/profile");
              }}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
            >
              <UserCircle className="h-4 w-4" /> Profile
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                navigate("/call-history");
              }}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
            >
              <History className="h-4 w-4" /> Call History
            </button>
            {isAdmin && (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/admin");
                }}
                className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
              >
                <ShieldCheck className="h-4 w-4" /> Admin
              </button>
            )}
            <div className="my-0.5 h-px bg-border" />
            <button
              onClick={() => {
                setMenuOpen(false);
                signOut();
              }}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors text-left text-destructive"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        )}
      </div>

      <ServicePanel
        services={services}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedService={selectedService}
        onServiceSelect={setSelectedService}
        isLoading={servicesLoading}
      />
    </div>
  );
}
