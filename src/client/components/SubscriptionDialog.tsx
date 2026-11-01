import { memo, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import DatePicker from './DatePicker';
import Modal from './forms/Modal';
import Autocomplete from './forms/Autocomplete';
import Dropdown from './forms/Dropdown';
import Listbox, { type ListboxOption } from './forms/Listbox';
import NumberInput from './forms/NumberInput';
import Button from './forms/Button';

type Currency = { code: string; name: string; symbol: string };
type Service = { id: string; name: string };

type SubscriptionDialogProps = {
  open: boolean;
  onClose: () => void;
  currency: Currency; // initial currency (from App)
  currencies: Currency[];
  subscriptions: Service[];
  mode?: 'create' | 'edit';
  initial?: {
    id: string;
    serviceId: string;
    name?: string;
    startDate: string;
    amount: number;
    currency: string;
    monthly?: boolean;
  };
  onDelete?: (id: string) => void | Promise<void>;
  onSave?: (payload: {
    id?: string; // present in edit mode
    serviceId: string;
    name?: string; // set for custom services that are not in the catalog
    startDate: string; // YYYY-MM-DD
    amount: number;
    currency: string; // code
    userId?: string;
    monthly?: boolean;
  }) => void | Promise<void>;
};

function SubscriptionDialog({
  open,
  onClose,
  currency,
  currencies,
  subscriptions,
  mode = 'create',
  initial,
  onDelete,
  onSave,
}: SubscriptionDialogProps) {
  // Always use current local date when dialog is opened
  const [date, setDate] = useState<string>(() => dayjs().format('YYYY-MM-DD'));
  const [selectedSub, setSelectedSub] = useState<string>('');
  const [query, setQuery] = useState<string>(''); // acts both as search text and custom value
  const [amount, setAmount] = useState<string>('0.00');
  const [curr, setCurr] = useState<Currency>(currency);
  const [currOpen, setCurrOpen] = useState<boolean>(false);
  const [monthly, setMonthly] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Initialize/reset values when the dialog opens or switches to another entry.
  // Deliberately keyed on initial?.id, not the object, so re-renders don't wipe user input.
  useEffect(() => {
    if (!open) return;
    setSaveError(null);
    if (mode === 'edit' && initial) {
      setDate(initial.startDate);
      setAmount((Number(initial.amount) || 0).toFixed(2));
      setCurr(currencies.find((c) => c.code === initial.currency) || currency);
      const found = subscriptions.find((s) => s.id === initial.serviceId);
      // Custom services are not in the catalog: keep the free text so it can be edited
      setSelectedSub(found ? initial.serviceId : '');
      // Old custom entries have no name: recover it from the id so re-saving keeps the same id
      setQuery(
        found?.name ||
          initial.name ||
          (initial.serviceId.startsWith('custom-') ? initial.serviceId.slice('custom-'.length) : ''),
      );
      setMonthly(Boolean(initial.monthly));
    } else {
      setDate(dayjs().format('YYYY-MM-DD'));
      setAmount('0.00');
      setCurr(currency);
      setSelectedSub('');
      setQuery('');
      setMonthly(false);
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- reset only on open / entry change
  }, [open, mode, initial?.id]);

  // Escape is handled by Modal

  async function run(action: () => void | Promise<void>, failMessage: string) {
    setBusy(true);
    setSaveError(null);
    try {
      await action();
    } catch {
      setSaveError(failMessage);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => setCurr(currency), [currency]);

  // Reset search text and close service dropdown when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery('');
      setSelectedSub('');
    }
  }, [open]);

  // No manual outside click; handled by Dropdown/Autocomplete primitives

  const filteredSubscriptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return subscriptions;
    return subscriptions.filter((s) => s.name.toLowerCase().includes(q));
  }, [subscriptions, query]);

  // Build options for primitives
  const serviceOptions: ListboxOption<Service>[] = useMemo(
    () => subscriptions.map((s) => ({ id: s.id, label: s.name, value: s })),
    [subscriptions],
  );
  const currencyOptions: ListboxOption<Currency>[] = useMemo(
    () => currencies.map((c) => ({ id: c.code, label: `${c.symbol} ${c.name}`, value: c })),
    [currencies],
  );

  function slugify(input: string): string {
    return input
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '');
  }

  const title = mode === 'edit' ? 'Edit subscription' : 'New subscription';

  return (
    <Modal open={open} onClose={onClose} title={title} zIndexBase={70}>
      <div className="flex flex-col gap-4">
        {/* Row 1: Date + Amount + Currency */}
        <div className="flex items-end gap-3">
          <div className="flex-1 min-w-[180px]">
            <DatePicker value={date} onChange={setDate} label="Start date" />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-[var(--text-muted)]">Amount</span>
              <div className="flex items-center gap-2">
                <NumberInput
                  value={amount}
                  onChange={setAmount}
                  step="0.01"
                  min="0"
                  className="flex-1 h-10"
                />
                <Dropdown
                  open={currOpen}
                  onOpenChange={setCurrOpen}
                  align="right"
                  anchor={
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="input flex h-10 items-center gap-2 px-3"
                      aria-haspopup="listbox"
                      aria-expanded={currOpen}
                      aria-controls="currency-menu-dialog"
                    >
                      <span className="text-base">{curr.symbol}</span>
                    </Button>
                  }
                >
                  <div id="currency-menu-dialog" aria-label="Select currency">
                    <Listbox
                      options={currencyOptions}
                      activeIndex={-1}
                      selectedId={curr.code}
                      onSelect={(opt) => {
                        setCurr(opt.value);
                        setCurrOpen(false);
                      }}
                    />
                  </div>
                </Dropdown>
              </div>
            </label>
          </div>
        </div>

      {/* Row 2: Service field */}
      <div className="flex flex-col gap-1 text-sm">
        <span className="text-[var(--text-muted)]">Service</span>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Autocomplete
              value={query}
              onChange={(v) => {
                setQuery(v);
                setSelectedSub('');
              }}
              options={serviceOptions}
              onSelect={(opt) => {
                setSelectedSub(opt.value.id);
                setQuery(opt.value.name);
              }}
              placeholder="Type a service or search..."
            />
          </div>
        </div>
      </div>

      {/* Row 3: Recurrence */}
      <div className="mt-1 flex items-center gap-2 text-sm">
        <input
          id="monthly"
          type="checkbox"
          className="h-4 w-4 rounded border-[var(--border)] bg-[var(--surface)] text-[var(--text)]"
          checked={monthly}
          onChange={(e) => setMonthly(e.target.checked)}
        />
        <label htmlFor="monthly" className="select-none text-[var(--text)]">
          Monthly
        </label>
      </div>

      {saveError && (
        <div
          role="alert"
          className="rounded-lg border border-red-500/40 bg-red-500/20 px-3 py-2 text-sm text-red-200"
        >
          {saveError}
        </div>
      )}

      <div className="mt-5 flex justify-end gap-2">
        {mode === 'edit' && initial && (
          <Button
            type="button"
            variant="danger"
            size="md"
            disabled={busy}
            onClick={async () => {
              if (!initial) return;
              const confirmed = window.confirm('Delete this subscription?');
              if (!confirmed) return;
              await run(() => onDelete?.(initial.id), 'Failed to delete. Please try again.');
            }}
          >
            Delete
          </Button>
        )}
        <Button
          type="button"
          size="md"
          disabled={busy}
          onClick={async () => {
            const userText = query.trim();
            const slug = slugify(userText);
            const payload = {
              id: mode === 'edit' ? initial?.id : undefined,
              serviceId: selectedSub || (slug ? `custom-${slug}` : 'custom'),
              name: selectedSub ? undefined : userText || undefined,
              startDate: date,
              amount: Number.parseFloat(amount || '0') || 0,
              currency: curr.code,
              monthly: monthly || undefined,
            };
            if (!onSave) return onClose();
            await run(() => onSave(payload), 'Failed to save. Please try again.');
          }}
          variant="primary"
        >
          Save
        </Button>
      </div>
      </div>
    </Modal>
  );
}

export default memo(SubscriptionDialog);
