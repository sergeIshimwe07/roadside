import { useState, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, LogOut, Phone, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { isValidPhone, sanitizePhoneInput, PHONE_VALIDATION_MESSAGE } from "@/lib/phone";

export default function Payment() {
  const { user, isAdmin, isSubscribed, signOut, refreshSubscription, loading, accessLoading } =
    useAuth();
  const [payPhone, setPayPhone] = useState("");
  const [paying, setPaying] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);

  const handlePay = useCallback(async () => {
    if (!isValidPhone(payPhone)) {
      toast.error(PHONE_VALIDATION_MESSAGE);
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to process payment";
      toast.error(message);
    } finally {
      setPaying(false);
    }
  }, [payPhone, refreshSubscription]);

  if (loading || accessLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (isAdmin || isSubscribed || paymentDone) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-6 px-6 text-center">
      <div className="rounded-full bg-primary/10 p-5">
        <Lock className="h-10 w-10 text-primary" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Subscription Required</h1>
        <p className="text-muted-foreground max-w-sm">
          Access to nearby services requires an active subscription at{" "}
          <strong>5,000 RWF/Month</strong>.
        </p>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Phone (e.g. 250780000000)"
            value={payPhone}
            onChange={(e) => setPayPhone(sanitizePhoneInput(e.target.value))}
            className="pl-10"
            type="tel"
            inputMode="numeric"
          />
        </div>
        <Button className="w-full" onClick={handlePay} disabled={paying}>
          {paying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
            </>
          ) : (
            "Pay 5,000 RWF via MTN MoMo"
          )}
        </Button>
      </div>

      <Button variant="secondary" onClick={signOut}>
        <LogOut className="mr-2 h-4 w-4" /> Sign Out
      </Button>
    </div>
  );
}
