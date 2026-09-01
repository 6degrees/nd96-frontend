// Client-side validation is for user experience only — Laravel repeats all of it.
// The booth is a browser, and a browser can be manipulated (spec §5).

export const NAME_MIN = 2;
export const BODY_MIN = 10;
export const MIN_SIGNATURE_POINTS = 20;

export interface Limits {
  nameMax: number;
  bodyMax: number;
}

export const DEFAULT_LIMITS: Limits = { nameMax: 40, bodyMax: 180 };

/** Returns an i18n error key, or null when valid. */
export function validateName(raw: string, limits: Limits = DEFAULT_LIMITS): string | null {
  const name = raw.trim();
  if (name.length < NAME_MIN) return 'booth.errors.nameShort';
  if (name.length > limits.nameMax) return 'booth.errors.nameLong';
  return null;
}

/** Returns an i18n error key, or null when valid. */
export function validateBody(raw: string, limits: Limits = DEFAULT_LIMITS): string | null {
  const body = raw.trim();
  if (body.length < BODY_MIN) return 'booth.errors.bodyShort';
  if (body.length > limits.bodyMax) return 'booth.errors.bodyLong';
  return null;
}

/** A stray tap is not a signature. */
export function validateSignature(pointCount: number, isEmpty: boolean): string | null {
  if (isEmpty || pointCount < MIN_SIGNATURE_POINTS) return 'booth.errors.signature';
  return null;
}
