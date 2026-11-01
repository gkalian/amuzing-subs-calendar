import { memo } from 'react';

const year = new Date().getFullYear();

function Footer() {
  return (
    <footer className="w-full text-center text-slate-300 text-[11pt] mt-auto mb-[5px]">
      Amuzing Subscriptions Calendar © {year}
    </footer>
  );
}

export default memo(Footer);
