import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useServices, Service, ServiceCategory } from "@/hooks/useServices";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Plus, Pencil, Trash2, MapPin, Users, Wrench, CreditCard } from "lucide-react";
import MapPicker from "@/components/MapPicker";
import { useIsMobile } from "@/hooks/use-mobile";

interface ServiceFormData {
  name: string;
  category: ServiceCategory;
  phone: string;
  address: string;
  latitude: string;
  longitude: string;
  operating_hours: string;
  is_active: boolean;
}

const emptyForm: ServiceFormData = {
  name: "", category: "garage", phone: "", address: "",
  latitude: "", longitude: "", operating_hours: "", is_active: true,
};

function ServiceForm({ form, setForm, editingId, submitting, onSubmit }: {
  form: ServiceFormData;
  setForm: (f: ServiceFormData) => void;
  editingId: string | null;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Name</Label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </div>
      <div className="space-y-2">
        <Label>Category</Label>
        <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as ServiceCategory })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="garage">Garage</SelectItem>
            <SelectItem value="clinic">Clinic</SelectItem>
            <SelectItem value="lodge">Lodge</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Phone</Label>
        <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label>Address</Label>
        <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" /> Pick Location on Map
        </Label>
        <MapPicker
          latitude={parseFloat(form.latitude)}
          longitude={parseFloat(form.longitude)}
          onChange={(lat, lng) => setForm({ ...form, latitude: String(lat), longitude: String(lng) })}
        />
        <p className="text-xs text-muted-foreground">Tap on the map to set location</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Latitude</Label>
          <Input type="number" step="any" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} required />
        </div>
        <div className="space-y-2">
          <Label>Longitude</Label>
          <Input type="number" step="any" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Operating Hours</Label>
        <Input value={form.operating_hours} onChange={(e) => setForm({ ...form, operating_hours: e.target.value })} placeholder="e.g. Mon-Fri 8AM-6PM" />
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
        <Label>Active</Label>
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Saving..." : editingId ? "Update Service" : "Add Service"}
      </Button>
    </form>
  );
}

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  subscription_active: boolean;
  subscription_expires_at: string | null;
}

function useProfiles() {
  return useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as UserProfile[]) || [];
    },
  });
}

function UsersTab() {
  const { data: profiles = [], isLoading } = useProfiles();
  const queryClient = useQueryClient();
  const [searchUsers, setSearchUsers] = useState("");

  const filteredProfiles = profiles.filter((p) =>
    (p.full_name || "").toLowerCase().includes(searchUsers.toLowerCase()) ||
    (p.phone || "").includes(searchUsers)
  );

  const toggleSubscription = async (profile: UserProfile) => {
    const newActive = !profile.subscription_active;
    const expiresAt = newActive
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { error } = await supabase
      .from("profiles")
      .update({
        subscription_active: newActive,
        subscription_expires_at: expiresAt,
      } as any)
      .eq("id", profile.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(newActive ? "Subscription activated (30 days)" : "Subscription deactivated");
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
    }
  };

  const isExpired = (p: UserProfile) =>
    p.subscription_expires_at && new Date(p.subscription_expires_at) < new Date();

  return (
    <div>
      <Input
        placeholder="Search users..."
        value={searchUsers}
        onChange={(e) => setSearchUsers(e.target.value)}
        className="mb-4 max-w-xs"
      />
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredProfiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredProfiles.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.full_name || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{p.phone || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={p.subscription_active && !isExpired(p) ? "default" : "secondary"}>
                      {p.subscription_active && !isExpired(p) ? "Active" : isExpired(p) ? "Expired" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {p.subscription_expires_at
                      ? new Date(p.subscription_expires_at).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant={p.subscription_active && !isExpired(p) ? "destructive" : "default"}
                      onClick={() => toggleSubscription(p)}
                    >
                      {p.subscription_active && !isExpired(p) ? "Deactivate" : "Activate"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

interface Payment {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  phone: string;
  status: string;
  created_at: string;
}

function PaymentsTab() {
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as Payment[]) || [];
    },
  });

  const { data: profiles = [] } = useProfiles();

  const getUserName = (userId: string) => {
    const profile = profiles.find((p) => p.user_id === userId);
    return profile?.full_name || "Unknown";
  };

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                Loading...
              </TableCell>
            </TableRow>
          ) : payments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                No payments yet
              </TableCell>
            </TableRow>
          ) : (
            payments.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{getUserName(p.user_id)}</TableCell>
                <TableCell className="text-muted-foreground">{p.phone}</TableCell>
                <TableCell>{p.amount.toLocaleString()} {p.currency}</TableCell>
                <TableCell>
                  <Badge variant={p.status === "completed" ? "default" : "secondary"}>
                    {p.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(p.created_at).toLocaleDateString()} {new Date(p.created_at).toLocaleTimeString()}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default function Admin() {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: services = [], isLoading } = useServices();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceFormData>(emptyForm);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<ServiceCategory | "all">("all");
  const [submitting, setSubmitting] = useState(false);
  const isMobile = useIsMobile();

  if (loading) return null;
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const filteredServices = services.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = filterCat === "all" || s.category === filterCat;
    return matchesSearch && matchesCat;
  });

  const openEdit = (s: Service) => {
    setEditingId(s.id);
    setForm({
      name: s.name,
      category: s.category,
      phone: s.phone || "",
      address: s.address || "",
      latitude: String(s.latitude),
      longitude: String(s.longitude),
      operating_hours: s.operating_hours || "",
      is_active: s.is_active,
    });
    setDialogOpen(true);
  };

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      name: form.name,
      category: form.category as ServiceCategory,
      phone: form.phone || null,
      address: form.address || null,
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
      operating_hours: form.operating_hours || null,
      is_active: form.is_active,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from("services").update(payload as any).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("services").insert(payload as any));
    }

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(editingId ? "Service updated" : "Service added");
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["services"] });
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this service?")) return;
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Service deleted");
      queryClient.invalidateQueries({ queryKey: ["services"] });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Dash</h1>
        </div>

        <Tabs defaultValue="services" className="space-y-4">
          <TabsList>
            <TabsTrigger value="services" className="gap-1.5">
              <Wrench className="h-4 w-4" /> Services
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5">
              <Users className="h-4 w-4" /> Users
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-1.5">
              <CreditCard className="h-4 w-4" /> Payments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="services">
            {/* Services controls */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  placeholder="Search services..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="max-w-xs"
                />
                <Select value={filterCat} onValueChange={(v) => setFilterCat(v as ServiceCategory | "all")}>
                  <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="garage">Garage</SelectItem>
                    <SelectItem value="clinic">Clinic</SelectItem>
                    <SelectItem value="lodge">Lodge</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {isMobile ? (
                <Drawer open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DrawerTrigger asChild>
                    <Button onClick={openNew}>
                      <Plus className="mr-1 h-4 w-4" /> Add Service
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent className="max-h-[85vh]">
                    <DrawerHeader>
                      <DrawerTitle>{editingId ? "Edit Service" : "Add New Service"}</DrawerTitle>
                    </DrawerHeader>
                    <div className="overflow-y-auto px-4 pb-4">
                      <ServiceForm form={form} setForm={setForm} editingId={editingId} submitting={submitting} onSubmit={handleSubmit} />
                    </div>
                  </DrawerContent>
                </Drawer>
              ) : (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={openNew}>
                      <Plus className="mr-1 h-4 w-4" /> Add Service
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingId ? "Edit Service" : "Add New Service"}</DialogTitle>
                    </DialogHeader>
                    <ServiceForm form={form} setForm={setForm} editingId={editingId} submitting={submitting} onSubmit={handleSubmit} />
                  </DialogContent>
                </Dialog>
              )}
            </div>

            {/* Services table */}
            <div className="rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredServices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No services found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredServices.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{s.category}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{s.phone || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={s.is_active ? "default" : "secondary"}>
                            {s.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={() => openEdit(s)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDelete(s.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <UsersTab />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
