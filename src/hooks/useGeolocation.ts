import { useState, useEffect } from "react";

interface Position {
  latitude: number;
  longitude: number;
}

// Fallback: Nairobi, Kenya
const DEFAULT_POSITION: Position = { latitude: -1.2921, longitude: 36.8219 };

export function useGeolocation() {
  const [position, setPosition] = useState<Position | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setPosition(DEFAULT_POSITION);
      setError("Geolocation not supported, using default location");
      setLoading(false);
      return;
    }

    const timeoutFallback = setTimeout(() => {
      if (!position) {
        setPosition(DEFAULT_POSITION);
        setError("Location timed out, using default location");
        setLoading(false);
      }
    }, 5000);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timeoutFallback);
        setPosition({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setLoading(false);
      },
      () => {
        clearTimeout(timeoutFallback);
        setPosition(DEFAULT_POSITION);
        setError("Location unavailable, using default location");
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
    );

    return () => clearTimeout(timeoutFallback);
  }, []);

  return { position, error, loading };
}
