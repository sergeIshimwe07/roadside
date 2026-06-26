import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onPlaceSelect: (place: { address: string; latitude: number; longitude: number }) => void;
  onOpenChange?: (open: boolean) => void;
  placeholder?: string;
}

type Prediction = google.maps.places.AutocompletePrediction;

let placesLoader: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
  if (!apiKey) {
    return Promise.reject(new Error("Missing VITE_GOOGLE_MAPS_API_KEY"));
  }
  if (!placesLoader) {
    setOptions({ key: apiKey, libraries: ["places"] });
    placesLoader = Promise.all([importLibrary("places"), importLibrary("geocoding")]).then(() => undefined);
  }
  return placesLoader;
}

export default function AddressAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  onOpenChange,
  placeholder = "Search for an address...",
}: AddressAutocompleteProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const onChangeRef = useRef(onChange);
  const onPlaceSelectRef = useRef(onPlaceSelect);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const requestSeq = useRef(0);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [suggestions, setSuggestions] = useState<Prediction[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const setSuggestionsOpenAndNotify = (nextOpen: boolean) => {
    setSuggestionsOpen((current) => {
      if (current !== nextOpen) {
        onOpenChange?.(nextOpen);
      }
      return nextOpen;
    });
  };

  useEffect(() => {
    onChangeRef.current = onChange;
    onPlaceSelectRef.current = onPlaceSelect;
  });

  const query = useMemo(() => value.trim(), [value]);

  const updateDropdownPosition = () => {
    const input = inputRef.current;
    if (!input) return;
    const rect = input.getBoundingClientRect();
    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width,
      zIndex: 99999,
    });
  };

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled) return;
        autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
        geocoderRef.current = new google.maps.Geocoder();
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || !suggestionsOpen) return;

    updateDropdownPosition();

    const onWindowChange = () => updateDropdownPosition();
    window.addEventListener("resize", onWindowChange);
    window.addEventListener("scroll", onWindowChange, true);

    return () => {
      window.removeEventListener("resize", onWindowChange);
      window.removeEventListener("scroll", onWindowChange, true);
    };
  }, [ready, suggestionsOpen, suggestions.length]);

  useEffect(() => {
    if (!ready) return;

        if (query.length < 3) {
      setSuggestions([]);
      setSuggestionsOpenAndNotify(false);
      setLoadingSuggestions(false);
      return;
    }

    const service = autocompleteServiceRef.current;
    if (!service) return;

    const seq = ++requestSeq.current;
    setLoadingSuggestions(true);

    const timeoutId = window.setTimeout(() => {
      service.getPlacePredictions({ input: query }, (predictions, status) => {
        if (seq !== requestSeq.current) return;
        setLoadingSuggestions(false);

        if (
          status !== google.maps.places.PlacesServiceStatus.OK ||
          !predictions?.length
        ) {
          setSuggestions([]);
          setSuggestionsOpenAndNotify(false);
          return;
        }

        setSuggestions(predictions);
        setSuggestionsOpenAndNotify(true);
        updateDropdownPosition();
      });
    }, 180);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [query, ready]);

  useEffect(() => {
    // Use pointerdown in capture phase so this sees the event before other handlers
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      // If target is inside the input wrapper or the dropdown portal, keep suggestions open
      if (!target) return;
      if (wrapperRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setSuggestionsOpenAndNotify(false);
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, []);

  const selectPrediction = (prediction: Prediction) => {
    const geocoder = geocoderRef.current;
    requestSeq.current += 1;
    setSuggestionsOpenAndNotify(false);
    setSuggestions([]);
    onChangeRef.current(prediction.description);

    if (!geocoder) return;

    geocoder.geocode({ placeId: prediction.place_id }, (results, status) => {
      if (status !== google.maps.GeocoderStatus.OK || !results?.[0]) return;
      const result = results[0];
      const location = result.geometry.location;
      onChangeRef.current(result.formatted_address || prediction.description);
      onPlaceSelectRef.current({
        address: result.formatted_address || prediction.description,
        latitude: location.lat(),
        longitude: location.lng(),
      });
    });
  };

  if (loadError) {
    return (
      <div className="space-y-1" ref={wrapperRef}>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        <p className="text-xs text-muted-foreground">
          Google Places unavailable. Add VITE_GOOGLE_MAPS_API_KEY to enable address suggestions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1" ref={wrapperRef}>
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setSuggestionsOpenAndNotify(true);
        }}
        onFocus={() => {
          if (suggestions.length > 0) setSuggestionsOpenAndNotify(true);
          updateDropdownPosition();
        }}
        placeholder={ready ? placeholder : "Loading address search..."}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />
      <p className="text-xs text-muted-foreground">
        Start typing to see address suggestions. Selecting one updates the map location.
      </p>
      {suggestionsOpen && suggestions.length > 0 && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[99999] pointer-events-none">
              <div
                ref={dropdownRef}
                style={dropdownStyle}
                className="pointer-events-auto max-h-72 overflow-auto rounded-md border border-border bg-popover text-popover-foreground shadow-lg"
              >
                {loadingSuggestions && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">Searching...</div>
                )}
                {suggestions.map((prediction) => (
                  <div
                    key={prediction.place_id}
                    className={cn(
                      "block w-full border-b border-border px-3 py-2 text-left last:border-b-0",
                      "hover:bg-accent focus:bg-accent focus:outline-none"
                    )}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      selectPrediction(prediction);
                    }}
                  >
                    <div className="text-sm font-medium">{prediction.structured_formatting.main_text}</div>
                    <div className="text-xs text-muted-foreground">
                      {prediction.structured_formatting.secondary_text}
                    </div>
                  </div>
                ))}
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
