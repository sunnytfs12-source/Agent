import { useState, useEffect } from 'react';

const DAYS   = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

function pad(n: number) { return String(n).padStart(2, '0'); }

export function DigitalClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hh  = pad(now.getHours());
  const mm  = pad(now.getMinutes());
  const ss  = pad(now.getSeconds());
  const day = DAYS[now.getDay()];
  const dd  = pad(now.getDate());
  const mon = MONTHS[now.getMonth()];
  const yr  = now.getFullYear();
  // Blink colon every second
  const colon = now.getSeconds() % 2 === 0 ? ':' : ' ';

  return (
    <div className="flex flex-col items-end leading-none select-none">
      {/* Time row — monospace digital look */}
      <div
        className="font-mono text-sm font-bold tracking-widest tabular-nums text-indigo-600 dark:text-indigo-400"
        style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '0.08em' }}
      >
        {hh}
        <span className="opacity-60">{colon}</span>
        {mm}
        <span className="opacity-60">{colon}</span>
        {ss}
      </div>
      {/* Date row */}
      <div className="mt-0.5 font-mono text-[9px] font-semibold tracking-widest text-slate-400 dark:text-slate-500">
        {day}&nbsp;{dd}&nbsp;{mon}&nbsp;{yr}
      </div>
    </div>
  );
}
