import { useState, useCallback, useRef, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useServices, Service, ServiceCategory } from "@/hooks/useServices";
import { supabase } from "@/integrations/supabase/client";
import MapView from "@/components/MapView";
import ServicePanel from "@/components/ServicePanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck, MapPin, LogOut, Lock, Phone, Loader2, CheckCircle, UserCircle, Menu, History } from "lucide-react";
import { toast } from "sonner";

export default function Index() {
  const { user, isAdmin, isSubscribed, signOut, refreshSubscription, loading: authLoading } = useAuth();
  const { position, error: geoError, loading: geoLoading } = useGeolocation();
  const [activeFilter, setActiveFilter] = useState<ServiceCategory | "all">("all");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const navigate = useNavigate();

  const { data: services = [], isLoading: servicesLoading } = useServices(
    position?.latitude,
    position?.longitude,
    activeFilter
  );

  // Payment state
  const [payPhone, setPayPhone] = useState("");
  const [paying, setPaying] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const handlePay = useCallback(async () => {
    if (!payPhone.trim()) {
      toast.error("Please enter your phone number");
      return;
    }
    setPaying(true);
    try {
      const { data, error } = await supabase.functions.invoke("momo-request-pay", {
        body: { phone: payPhone.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setPaymentDone(true);
      toast.success("Payment recorded! Activating your subscription...");
      await refreshSubscription();
    } catch (err: any) {
      toast.error(err.message || "Failed to process payment");
    } finally {
      setPaying(false);
    }
  }, [payPhone, refreshSubscription]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Paywall for non-admin, non-subscribed users
  if (!isAdmin && !isSubscribed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-6 px-6 text-center">
        <div className="rounded-full bg-primary/10 p-5">
          <Lock className="h-10 w-10 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Subscription Required</h1>
          <p className="text-muted-foreground max-w-sm">
            Access to nearby services requires an active subscription at <strong>5,000 RWF/Month</strong>.
          </p>
        </div>

        <div className="w-full max-w-sm space-y-3">
          {paymentDone ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <p className="font-medium text-green-500">Payment Recorded!</p>
              <p className="text-sm text-muted-foreground">Your subscription is now active.</p>
            </div>
          ) : (
            <>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Phone (e.g. 250780000000)"
                  value={payPhone}
                  onChange={(e) => setPayPhone(e.target.value)}
                  className="pl-10"
                  type="tel"
                />
              </div>
              <Button className="w-full" onClick={handlePay} disabled={paying}>
                {paying ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                ) : (
                  "Pay 5,000 RWF via MTN MoMo"
                )}
              </Button>
            </>
          )}
        </div>

        <Button variant="secondary" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" /> Sign Out
        </Button>
      </div>
    );
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
              onClick={() => { setMenuOpen(false); navigate("/profile"); }}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
            >
              <UserCircle className="h-4 w-4" /> Profile
            </button>
            <button
              onClick={() => { setMenuOpen(false); navigate("/call-history"); }}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
            >
              <History className="h-4 w-4" /> Call History
            </button>
            {isAdmin && (
              <button
                onClick={() => { setMenuOpen(false); navigate("/admin"); }}
                className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors text-left"
              >
                <ShieldCheck className="h-4 w-4" /> Admin
              </button>
            )}
            <div className="my-0.5 h-px bg-border" />
            <button
              onClick={() => { setMenuOpen(false); signOut(); }}
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
        selectedService={selectedService}
        onServiceSelect={setSelectedService}
        isLoading={servicesLoading}
      />
    </div>
  );
}
