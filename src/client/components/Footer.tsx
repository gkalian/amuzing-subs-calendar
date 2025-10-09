import { memo, useMemo } from 'react';

function getCurrentYear(): number {
  return new Date().getFullYear();
}

function Footer() {
  const year = useMemo(getCurrentYear, []);
  return (
    <footer className="w-full text-center text-slate-200 text-[9pt] mt-auto mb-[5px]">
      Amuzing Subscriptions Calendar © {year}
    </footer>
  );
}

export default memo(Footer);
