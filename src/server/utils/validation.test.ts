import { describe, expect, it } from 'vitest';
import { isValidDate, isValidId, validateSubscription } from './validation.js';

const valid = {
  serviceId: 'netflix',
  startDate: '2026-11-02',
  amount: 9.99,
  currency: 'EUR',
};

describe('isValidDate', () => {
  it.each(['2026-01-31', '2024-02-29', '2026-12-01'])('accepts %s', (d) => {
    expect(isValidDate(d)).toBe(true);
  });

  it.each(['2026-02-30', '2025-02-29', '2026-13-01', '2026-1-1', '26-01-01', '/../../tmp/x', '', 20260101])(
    'rejects %s',
    (d) => {
      expect(isValidDate(d)).toBe(false);
    },
  );
});

describe('isValidId', () => {
  it('accepts uuid', () => {
    expect(isValidId('febce145-3919-429c-be20-2c5dae405f31')).toBe(true);
  });
  it.each(['', '../etc', 'a b', 'x'.repeat(65), 'id;rm'])('rejects %j', (id) => {
    expect(isValidId(id)).toBe(false);
  });
});

describe('validateSubscription', () => {
  it('accepts a full body and drops unknown fields, id and userId', () => {
    const r = validateSubscription({ ...valid, id: 'evil', userId: 'other', extra: 1 }, false);
    expect(r).toEqual({ ok: true, value: valid });
  });

  it('keeps optional name and monthly', () => {
    const r = validateSubscription({ ...valid, serviceId: 'custom-яндекс-плюс', name: 'Яндекс Плюс', monthly: true }, false);
    expect(r.ok && r.value).toMatchObject({ name: 'Яндекс Плюс', monthly: true });
  });

  it.each([null, undefined, 'text', [valid], 42])('rejects non-object body %j', (body) => {
    expect(validateSubscription(body, false)).toMatchObject({ ok: false, field: 'body' });
  });

  it.each(['serviceId', 'startDate', 'amount', 'currency'])('requires %s on create', (field) => {
    const body: Record<string, unknown> = { ...valid };
    delete body[field];
    expect(validateSubscription(body, false)).toMatchObject({ ok: false, field });
  });

  it.each([
    ['serviceId', ''],
    ['serviceId', '   '],
    ['serviceId', 'x'.repeat(101)],
    ['serviceId', 'a\nb'],
    ['name', 42],
    ['startDate', '2026-02-30'],
    ['startDate', '/../../tmp/x'],
    ['amount', '9.99'],
    ['amount', -1],
    ['amount', Number.NaN],
    ['amount', Infinity],
    ['currency', 'eur'],
    ['currency', 'EURO'],
    ['monthly', 'yes'],
  ])('rejects %s = %j', (field, v) => {
    expect(validateSubscription({ ...valid, [field]: v }, false)).toMatchObject({ ok: false, field });
  });

  it('allows partial body on update but still checks present fields', () => {
    expect(validateSubscription({ amount: 15 }, true)).toEqual({ ok: true, value: { amount: 15 } });
    expect(validateSubscription({ id: 'other' }, true)).toEqual({ ok: true, value: {} });
    expect(validateSubscription({ startDate: 'bad' }, true)).toMatchObject({ ok: false, field: 'startDate' });
  });
});
