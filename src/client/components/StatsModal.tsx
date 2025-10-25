import CategoryPieChart, { type PieDatum } from './CategoryPieChart';
import Modal from './forms/Modal';

type StatsModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  data: PieDatum[];
  currencySymbol?: string;
};

export default function StatsModal({ open, onClose, title, data, currencySymbol }: StatsModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <CategoryPieChart data={data} />
        <div className="flex-1 min-w-[180px] max-h-[360px] overflow-auto">
          {data.length === 0 && (
            <div className="text-sm text-[var(--text-muted)]">No data for this month</div>
          )}
          {data.map((d, idx) => (
            <div key={d.label} className="flex items-center justify-between gap-3 py-1">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded"
                  style={{ backgroundColor: `hsl(${(idx * 57) % 360}deg 70% 55%)` }}
                  aria-hidden
                />
                <span>{d.label}</span>
              </div>
              <span className="font-medium">
                {d.value.toFixed(2)} {currencySymbol}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
