/** Strip non-digits and return digit count. */
export function phoneDigitCount(phone: string): number {
  return phone.replace(/\D/g, "").length;
}

/** Phone must contain only digits (optional leading +) and at least 10 digits. */
export function isValidPhone(phone: string): boolean {
  const trimmed = phone.trim();
  if (!trimmed) return false;
  if (!/^\+?\d+$/.test(trimmed)) return false;
  return phoneDigitCount(trimmed) >= 10;
}

/** Keep only digits in phone input. */
export function sanitizePhoneInput(value: string): string {
  return value.replace(/\D/g, "");
}

export const PHONE_VALIDATION_MESSAGE =
  "Phone number must be numeric and at least 10 digits";
