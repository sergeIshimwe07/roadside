import { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Input } from "@/components/ui/input";

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onPlaceSelect: (place: { address: string; latitude: number; longitude: number }) => void;
  placeholder?: string;
}

let placesLoader: Promise<typeof google> | null = null;

function loadGoogleMaps(): Promise<typeof google> {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return Promise.reject(new Error("Missing VITE_GOOGLE_MAPS_API_KEY"));
  }
  if (!placesLoader) {
    const loader = new Loader({
      apiKey,
      libraries: ["places"],
    });
    placesLoader = loader.load();
  }
  return placesLoader;
}

export default function AddressAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Search for an address...",
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  const onPlaceSelectRef = useRef(onPlaceSelect);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
    onPlaceSelectRef.current = onPlaceSelect;
  });

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !inputRef.current) return;

        const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
          fields: ["formatted_address", "geometry", "name"],
        });

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          const location = place.geometry?.location;
          if (!location) return;

          const address = place.formatted_address || place.name || "";
          onChangeRef.current(address);
          onPlaceSelectRef.current({
            address,
            latitude: location.lat(),
            longitude: location.lng(),
          });
        });

        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loadError) {
    return (
      <div className="space-y-1">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        <p className="text-xs text-muted-foreground">
          Google Places unavailable. Add VITE_GOOGLE_MAPS_API_KEY to enable address suggestions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={ready ? placeholder : "Loading address search..."}
        disabled={!ready}
      />
      <p className="text-xs text-muted-foreground">
        Start typing to see address suggestions. Selecting one updates the map location.
      </p>
    </div>
  );
}
