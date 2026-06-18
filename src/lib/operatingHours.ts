const DAY_INDEX: Record<string, number> = {
  sun: 0,
  sunday: 0,
  mon: 1,
  monday: 1,
  tue: 2,
  tues: 2,
  tuesday: 2,
  wed: 3,
  wednesday: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
};

const TIME_TOKEN =
  "(?:\\d{1,2}(?::\\d{2})?\\s*(?:A\\.?M\\.?|P\\.?M\\.?)?|\\d{1,2}:\\d{2})";

export const OPERATING_HOURS_EXAMPLES = [
  "Mon-Fri 8AM-6PM",
  "Mon-Sat 8:00-18:00",
  "Daily 6AM-10PM",
  "Mon, Wed, Fri 9AM-5PM",
  "Weekdays 8AM-6PM; Sat 9AM-1PM",
  "24/7",
] as const;

export const OPERATING_HOURS_HINT =
  "Use day(s) plus open-close times. Separate multiple schedules with a semicolon (;).";

function parseTimeToMinutes(value: string): number | null {
  const normalized = value.trim().toUpperCase().replace(/\./g, "");
  const match = normalized.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const meridiem = match[3];

  if (minutes < 0 || minutes > 59) return null;

  if (meridiem) {
    if (hours < 1 || hours > 12) return null;
    if (meridiem === "PM" && hours !== 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
  } else if (hours > 23) {
    return null;
  }

  return hours * 60 + minutes;
}

function expandDayToken(token: string): number[] {
  const key = token.trim().toLowerCase();
  if (key in DAY_INDEX) return [DAY_INDEX[key]];
  return [];
}

function expandDayRange(daysPart: string): number[] {
  const normalized = daysPart.trim().toLowerCase();

  if (
    normalized.includes("daily") ||
    normalized.includes("everyday") ||
    normalized.includes("every day") ||
    normalized.includes("all days")
  ) {
    return [0, 1, 2, 3, 4, 5, 6];
  }

  if (normalized === "weekday" || normalized === "weekdays") {
    return [1, 2, 3, 4, 5];
  }

  if (normalized === "weekend" || normalized === "weekends") {
    return [0, 6];
  }

  const days: number[] = [];
  const segments = normalized.split(",").map((s) => s.trim());

  for (const segment of segments) {
    const rangeMatch = segment.match(/^([a-z]+)\s*-\s*([a-z]+)$/);
    if (rangeMatch) {
      const start = DAY_INDEX[rangeMatch[1]];
      const end = DAY_INDEX[rangeMatch[2]];
      if (start === undefined || end === undefined) continue;
      if (start <= end) {
        for (let d = start; d <= end; d++) days.push(d);
      } else {
        for (let d = start; d <= 6; d++) days.push(d);
        for (let d = 0; d <= end; d++) days.push(d);
      }
      continue;
    }

    days.push(...expandDayToken(segment));
  }

  return [...new Set(days)];
}

interface HoursRule {
  days: number[];
  open: number;
  close: number;
}

function extractTimeRange(segment: string): { daysPart: string; open: string; close: string } | null {
  const normalized = segment.trim().replace(/\s+/g, " ");
  const match = normalized.match(
    new RegExp(`^(.+?)\\s+(${TIME_TOKEN})\\s*-\\s*(${TIME_TOKEN})\\s*$`, "i")
  );
  if (!match) return null;
  return { daysPart: match[1].trim(), open: match[2], close: match[3] };
}

function parseRule(segment: string): HoursRule | null {
  const range = extractTimeRange(segment);
  if (!range) return null;

  const days = expandDayRange(range.daysPart);
  const open = parseTimeToMinutes(range.open);
  const close = parseTimeToMinutes(range.close);
  if (!days.length || open === null || close === null) return null;

  return { days, open, close };
}

function splitRules(text: string): string[] {
  return text
    .split(/\s*;\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function isOpenForRule(rule: HoursRule, day: number, minutes: number): boolean {
  if (!rule.days.includes(day)) return false;
  if (rule.open === rule.close) return false;
  if (rule.open < rule.close) {
    return minutes >= rule.open && minutes < rule.close;
  }
  return minutes >= rule.open || minutes < rule.close;
}

/** Returns true when current time falls within parsed operating hours. */
export function isServiceOpenNow(
  operatingHours: string | null | undefined,
  now: Date = new Date()
): boolean {
  if (!operatingHours?.trim()) return true;

  const text = operatingHours.trim();
  const lower = text.toLowerCase();
  if (
    lower.includes("24/7") ||
    lower.includes("24 hours") ||
    lower.includes("always open") ||
    lower === "open 24 hours"
  ) {
    return true;
  }

  const rules = splitRules(text)
    .map((segment) => parseRule(segment))
    .filter((rule): rule is HoursRule => rule !== null);

  if (!rules.length) return true;

  const day = now.getDay();
  const minutes = now.getHours() * 60 + now.getMinutes();
  return rules.some((rule) => isOpenForRule(rule, day, minutes));
}
