// Input validation for the subscriptions API. Hand-written to avoid extra dependencies.

export type SubscriptionInput = {
  serviceId: string;
  name?: string;
  startDate: string; // YYYY-MM-DD
  amount: number;
  currency: string;
  monthly?: boolean;
};

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; field: string; error: string };

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const CURRENCY_RE = /^[A-Z]{3}$/;
const ID_RE = /^[A-Za-z0-9-]{1,64}$/;
// eslint-disable-next-line no-control-regex
const CONTROL_RE = /[\u0000-\u001f\u007f]/;
const MAX_TEXT = 100;
const MAX_AMOUNT = 1_000_000_000;

export function isValidId(id: unknown): id is string {
  return typeof id === 'string' && ID_RE.test(id);
}

/** Strict YYYY-MM-DD that is also a real calendar date (rejects 2026-02-30). */
export function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const m = DATE_RE.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
}

function isText(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    value.length <= MAX_TEXT &&
    !CONTROL_RE.test(value)
  );
}

type FieldCheck = { check: (v: unknown) => boolean; error: string; required: boolean };

const FIELDS: Record<keyof SubscriptionInput, FieldCheck> = {
  serviceId: { check: isText, error: `must be a non-empty string up to ${MAX_TEXT} chars`, required: true },
  name: { check: isText, error: `must be a non-empty string up to ${MAX_TEXT} chars`, required: false },
  startDate: { check: isValidDate, error: 'must be a valid date in YYYY-MM-DD format', required: true },
  amount: {
    check: (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= MAX_AMOUNT,
    error: `must be a number between 0 and ${MAX_AMOUNT}`,
    required: true,
  },
  currency: { check: (v) => typeof v === 'string' && CURRENCY_RE.test(v), error: 'must be a 3-letter code like EUR', required: true },
  monthly: { check: (v) => typeof v === 'boolean', error: 'must be a boolean', required: false },
};

/**
 * Validates a request body and returns only the known fields.
 * Unknown fields (including id and userId) are dropped.
 * With partial=true (PATCH) required fields may be missing, but present ones are still checked.
 */
export function validateSubscription(body: unknown, partial: false): ValidationResult<SubscriptionInput>;
export function validateSubscription(body: unknown, partial: true): ValidationResult<Partial<SubscriptionInput>>;
export function validateSubscription(
  body: unknown,
  partial: boolean,
): ValidationResult<Partial<SubscriptionInput>> {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { ok: false, field: 'body', error: 'Body must be a JSON object' };
  }
  const input = body as Record<string, unknown>;
  const value: Record<string, unknown> = {};

  for (const [field, rule] of Object.entries(FIELDS)) {
    const v = input[field];
    if (v === undefined) {
      if (rule.required && !partial) return { ok: false, field, error: `${field} is required` };
      continue;
    }
    if (!rule.check(v)) return { ok: false, field, error: `${field} ${rule.error}` };
    value[field] = v;
  }

  return { ok: true, value: value as Partial<SubscriptionInput> };
}
