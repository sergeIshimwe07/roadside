import { describe, it, expect } from "vitest";
import { isServiceOpenNow } from "@/lib/operatingHours";

function at(day: number, hours: number, minutes = 0): Date {
  const date = new Date(2026, 5, 15, hours, minutes);
  while (date.getDay() !== day) {
    date.setDate(date.getDate() + 1);
  }
  return date;
}

describe("isServiceOpenNow", () => {
  it("returns true when hours are missing", () => {
    expect(isServiceOpenNow(null)).toBe(true);
    expect(isServiceOpenNow("")).toBe(true);
  });

  it("handles 24/7 services", () => {
    expect(isServiceOpenNow("24/7", at(1, 3))).toBe(true);
    expect(isServiceOpenNow("Open 24 hours", at(0, 23))).toBe(true);
  });

  it("opens during Mon-Fri 8AM-6PM on Wednesday noon", () => {
    expect(isServiceOpenNow("Mon-Fri 8AM-6PM", at(3, 12))).toBe(true);
  });

  it("closes outside Mon-Fri 8AM-6PM on Wednesday night", () => {
    expect(isServiceOpenNow("Mon-Fri 8AM-6PM", at(3, 19))).toBe(false);
  });

  it("closes on Sunday for weekday hours", () => {
    expect(isServiceOpenNow("Mon-Fri 8AM-6PM", at(0, 12))).toBe(false);
  });

  it("handles 24-hour style times", () => {
    expect(isServiceOpenNow("Daily 08:00-20:00", at(6, 10))).toBe(true);
    expect(isServiceOpenNow("Daily 08:00-20:00", at(6, 21))).toBe(false);
  });

  it("handles spaced AM/PM times", () => {
    expect(isServiceOpenNow("Mon-Fri 8 AM - 6 PM", at(3, 12))).toBe(true);
    expect(isServiceOpenNow("Mon-Fri 8 AM - 6 PM", at(3, 18, 30))).toBe(false);
  });

  it("handles comma-separated days", () => {
    expect(isServiceOpenNow("Mon, Wed, Fri 9AM-5PM", at(1, 10))).toBe(true);
    expect(isServiceOpenNow("Mon, Wed, Fri 9AM-5PM", at(2, 10))).toBe(false);
    expect(isServiceOpenNow("Mon, Wed, Fri 9AM-5PM", at(3, 10))).toBe(true);
  });

  it("handles weekdays keyword", () => {
    expect(isServiceOpenNow("Weekdays 8AM-6PM", at(4, 12))).toBe(true);
    expect(isServiceOpenNow("Weekdays 8AM-6PM", at(6, 12))).toBe(false);
  });

  it("handles multiple schedules separated by semicolon", () => {
    expect(isServiceOpenNow("Mon-Fri 8AM-6PM; Sat 9AM-1PM", at(6, 10))).toBe(true);
    expect(isServiceOpenNow("Mon-Fri 8AM-6PM; Sat 9AM-1PM", at(6, 14))).toBe(false);
    expect(isServiceOpenNow("Mon-Fri 8AM-6PM; Sat 9AM-1PM", at(3, 12))).toBe(true);
  });

  it("handles lowercase times", () => {
    expect(isServiceOpenNow("Daily 8am-6pm", at(2, 11))).toBe(true);
  });
});
