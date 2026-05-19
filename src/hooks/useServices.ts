import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ServiceCategory = "garage" | "clinic" | "lodge";

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  phone: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  operating_hours: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function useServices(userLat?: number, userLon?: number, category?: ServiceCategory | "all") {
  return useQuery({
    queryKey: ["services", category, userLat, userLon],
    queryFn: async () => {
      let query = supabase.from("services").select("*").eq("is_active", true);
      if (category && category !== "all") {
        query = query.eq("category", category);
      }
      const { data, error } = await query;
      if (error) throw error;

      const services = (data as unknown as Service[]) || [];

      if (userLat !== undefined && userLon !== undefined) {
        return services
          .map((s) => ({ ...s, distance: getDistance(userLat, userLon, s.latitude, s.longitude) }))
          .sort((a, b) => a.distance - b.distance);
      }
      return services.map((s) => ({ ...s, distance: 0 }));
    },
  });
}
