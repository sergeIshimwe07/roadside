import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Phone, Wrench, Heart, BedDouble } from "lucide-react";

const categoryIcons: Record<string, typeof Wrench> = {
  garage: Wrench,
  clinic: Heart,
  lodge: BedDouble,
};

const categoryColors: Record<string, string> = {
  garage: "bg-blue-500/20 text-blue-400",
  clinic: "bg-red-500/20 text-red-400",
  lodge: "bg-green-500/20 text-green-400",
};

interface CallRecord {
  id: string;
  service_name: string;
  service_phone: string;
  service_category: string;
  created_at: string;
}

export default function CallHistory() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const { data: calls = [], isLoading } = useQuery({
    queryKey: ["call-history", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("call_history")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as CallRecord[]) || [];
    },
  });

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Call History</h1>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : calls.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">No calls yet</p>
        ) : (
          <div className="space-y-2">
            {calls.map((call) => {
              const Icon = categoryIcons[call.service_category] || Wrench;
              const color = categoryColors[call.service_category] || categoryColors.garage;
              return (
                <div key={call.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <div className={`rounded-md p-1.5 ${color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{call.service_name}</p>
                    <p className="text-xs text-muted-foreground">{call.service_phone}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">
                      {new Date(call.created_at).toLocaleDateString("en-GB")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(call.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })}
                    </p>
                  </div>
                  <Button size="icon" variant="ghost" asChild>
                    <a href={`tel:${call.service_phone}`}>
                      <Phone className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
