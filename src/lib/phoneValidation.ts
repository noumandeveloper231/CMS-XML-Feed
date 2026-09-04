import { US_AREA_CODES } from "./usAreaCodes";

/** Format as (XXX) XXX-XXXX — same mask as CMS CustomFieldRenderer. */
export function formatPhoneNumber(input: string): string {
  const cleaned = input.replace(/\D/g, "").substring(0, 10);
  if (cleaned.length >= 6) {
    return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
  }
  if (cleaned.length >= 3) {
    return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3)}`;
  }
  if (cleaned.length > 0) {
    return `(${cleaned}`;
  }
  return cleaned;
}

/**
 * Same rules as CMS `isValidUSPhoneNumber`:
 * - exactly 10 digits
 * - area code first digit 2–9
 * - area code in US_AREA_CODES
 * - exchange (digits 4–6) first digit 2–9
 * - display must match (XXX) XXX-XXXX when fully entered
 */
export function isValidUSPhoneNumber(phoneNumber: string): boolean {
  const cleaned = phoneNumber.replace(/\D/g, "");
  if (cleaned.length !== 10) return false;
  if (parseInt(cleaned[0], 10) < 2) return false;
  const areaCode = cleaned.substring(0, 3);
  if (!US_AREA_CODES.includes(areaCode)) return false;
  // Exchange NXX — first digit 2-9 (NANP)
  if (parseInt(cleaned[3], 10) < 2) return false;
  return true;
}

export function isCompletePhoneFormat(phoneNumber: string): boolean {
  return /^\(\d{3}\) \d{3}-\d{4}$/.test(phoneNumber.trim());
}

/** US ZIP: 12345 or 12345-6789 */
export function isValidUSZip(zip: string): boolean {
  return /^\d{5}(-\d{4})?$/.test(zip.trim());
}
