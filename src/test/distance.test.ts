import { describe, it, expect } from "vitest";

// Copy of the Haversine function from useServices.ts
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

describe("Haversine distance calculation", () => {
  it("returns 0 for same point", () => {
    expect(getDistance(-1.2921, 36.8219, -1.2921, 36.8219)).toBe(0);
  });

  it("Nairobi to Mombasa (~440 km)", () => {
    const d = getDistance(-1.2921, 36.8219, -4.0435, 39.6682);
    expect(d).toBeGreaterThan(430);
    expect(d).toBeLessThan(450);
  });

  it("Nairobi to Nakuru (~140 km)", () => {
    const d = getDistance(-1.2921, 36.8219, -0.3031, 36.0800);
    expect(d).toBeGreaterThan(130);
    expect(d).toBeLessThan(150);
  });

  it("New York to London (~5570 km)", () => {
    const d = getDistance(40.7128, -74.006, 51.5074, -0.1278);
    expect(d).toBeGreaterThan(5550);
    expect(d).toBeLessThan(5600);
  });

  it("short distance ~1 km", () => {
    // ~1 degree latitude ≈ 111 km, so 0.009° ≈ 1 km
    const d = getDistance(-1.2921, 36.8219, -1.2831, 36.8219);
    expect(d).toBeGreaterThan(0.9);
    expect(d).toBeLessThan(1.1);
  });
});
