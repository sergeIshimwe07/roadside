import { useMemo, useState } from "react";
import { Service, ServiceCategory } from "@/hooks/useServices";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { isServiceOpenNow } from "@/lib/operatingHours";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Phone, Navigation, ChevronUp, ChevronDown, Wrench, Heart, BedDouble, Search } from "lucide-react";

const categoryConfig: Record<ServiceCategory, { label: string; icon: typeof Wrench; color: string }> = {
  garage: { label: "Garage", icon: Wrench, color: "bg-blue-500/20 text-blue-400" },
  clinic: { label: "Clinic", icon: Heart, color: "bg-red-500/20 text-red-400" },
  lodge: { label: "Lodge", icon: BedDouble, color: "bg-green-500/20 text-green-400" },
};

const filters: { value: ServiceCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "garage", label: "Garage" },
  { value: "clinic", label: "Clinic" },
  { value: "lodge", label: "Lodge" },
];

interface ServicePanelProps {
  services: (Service & { distance: number })[];
  activeFilter: ServiceCategory | "all";
  onFilterChange: (filter: ServiceCategory | "all") => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedService: Service | null;
  onServiceSelect: (service: Service | null) => void;
  isLoading: boolean;
}

export default function ServicePanel({
  services,
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  selectedService,
  onServiceSelect,
  isLoading,
}: ServicePanelProps) {
  const { user: currentUser } = useAuth();
  const [expanded, setExpanded] = useState(true);

  const filteredServices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return services;
    return services.filter(
      (service) =>
        service.name.toLowerCase().includes(query) ||
        (service.address || "").toLowerCase().includes(query) ||
        (service.phone || "").includes(query)
    );
  }, [services, searchQuery]);

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 z-10 rounded-t-2xl bg-card border-t border-border transition-all duration-300 ${
        expanded ? "max-h-[60vh]" : "max-h-16"
      }`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-center py-3"
      >
        {expanded ? (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="flex flex-col px-4 pb-4" style={{ maxHeight: "calc(60vh - 48px)" }}>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => onFilterChange(f.value)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeFilter === f.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-accent"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : filteredServices.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                {searchQuery.trim() ? "No services match your search" : "No services found nearby"}
              </p>
            ) : (
              <div className="space-y-2">
                {filteredServices.map((service) => {
                  const config = categoryConfig[service.category];
                  const Icon = config.icon;
                  const isSelected = selectedService?.id === service.id;
                  const isOpen = service.is_active && isServiceOpenNow(service.operating_hours);

                  return (
                    <div
                      key={service.id}
                      onClick={() => onServiceSelect(isSelected ? null : service)}
                      className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`rounded-md p-1.5 ${config.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold">{service.name}</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className="text-xs py-0">
                                {config.label}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {service.distance.toFixed(1)} km
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            isOpen
                              ? "border-green-500/30 text-green-400"
                              : "border-red-500/30 text-red-400"
                          }`}
                        >
                          {isOpen ? "Open" : "Closed"}
                        </Badge>
                      </div>

                      {isSelected && (
                        <div className="mt-3 space-y-2 border-t border-border pt-3">
                          {service.address && (
                            <p className="text-xs text-muted-foreground">{service.address}</p>
                          )}
                          {service.operating_hours && (
                            <p className="text-xs text-muted-foreground">
                              Hours: {service.operating_hours}
                            </p>
                          )}
                          <div className="flex gap-2">
                            {service.phone && (
                              <Button
                                size="sm"
                                className="flex-1"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (currentUser) {
                                    await supabase.from("call_history").insert({
                                      user_id: currentUser.id,
                                      service_id: service.id,
                                      service_name: service.name,
                                      service_phone: service.phone!,
                                      service_category: service.category,
                                    });
                                  }
                                  window.location.href = `tel:${service.phone}`;
                                }}
                              >
                                <Phone className="mr-1 h-3 w-3" />
                                Call
                              </Button>
                            )}
                            <Button size="sm" variant="outline" asChild className="flex-1">
                              <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${service.latitude},${service.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Navigation className="mr-1 h-3 w-3" />
                                Directions
                              </a>
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
