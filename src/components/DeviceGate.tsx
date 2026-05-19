import React, { useState, useEffect } from "react";
import { Tablet, Smartphone } from "lucide-react";

const MAX_WIDTH = 1024;

export default function DeviceGate({ children }: { children: React.ReactNode }) {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const check = () => setBlocked(window.innerWidth > MAX_WIDTH);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (blocked) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background gap-6 px-6 text-center">
        <div className="flex gap-4">
          <Tablet className="h-12 w-12 text-primary" />
          <Smartphone className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Mobile & Tablet Only</h1>
        <p className="text-muted-foreground max-w-sm">
          This app is designed for tablets and mobile phones. Please open it on a smaller device.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
