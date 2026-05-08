import { useEffect, useMemo, useState } from 'react';
import axiosClient from '../../utils/axiosClient';

function toISODateUTC(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDaysUTC(date, days) {
  const copy = new Date(date.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function computeMaxStreak(activeByDay) {
  let current = 0;
  let best = 0;
  for (const isActive of activeByDay) {
    if (isActive) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }
  return best;
}

export default function SubmissionActivity({ days = 364 }) {
  const [countsByDate, setCountsByDate] = useState(() => new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const fetchCalendar = async () => {
      try {
        setLoading(true);
        setError('');

        const res = await axiosClient.get('/submission/calendar', {
          params: { days },
        });

        const list = res?.data?.counts || [];
        const map = new Map();
        for (const item of list) {
          if (item?.date) map.set(item.date, Number(item.count || 0));
        }

        if (!cancelled) setCountsByDate(map);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError('Failed to load submission activity');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchCalendar();
    return () => {
      cancelled = true;
    };
  }, [days]);

  const calendar = useMemo(() => {
    const today = new Date();
    const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const start = addDaysUTC(end, -(days - 1));

    const cells = [];
    let total = 0;
    let activeDays = 0;
    let max = 0;

    for (let i = 0; i < days; i += 1) {
      const d = addDaysUTC(start, i);
      const iso = toISODateUTC(d);
      const count = countsByDate.get(iso) || 0;

      total += count;
      if (count > 0) activeDays += 1;
      max = Math.max(max, count);

      cells.push({ iso, count });
    }

    const step = Math.max(1, Math.ceil(max / 4));
    const levels = cells.map((c) => {
      if (c.count <= 0) return 0;
      return Math.min(4, 1 + Math.floor((c.count - 1) / step));
    });

    const activeByDay = cells.map((c) => c.count > 0);
    const maxStreak = computeMaxStreak(activeByDay);

    return { cells, total, activeDays, maxStreak, levels, start, end };
  }, [countsByDate, days]);

  const tones = [
    'bg-slate-700/70',
    'bg-emerald-900/70',
    'bg-emerald-700/80',
    'bg-emerald-500/85',
    'bg-emerald-300',
  ];

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 shadow-xl">
        <div className="flex items-center justify-center py-10">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 shadow-xl">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Submission Activity</h2>
          <p className="text-slate-400 text-sm">
            {calendar.total} submissions in the past year
          </p>
        </div>

        <div className="flex gap-4 text-sm text-slate-400">
          <span>
            Active days: <span className="text-slate-100 font-semibold">{calendar.activeDays}</span>
          </span>
          <span>
            Max streak: <span className="text-slate-100 font-semibold">{calendar.maxStreak}</span>
          </span>
        </div>
      </div>

      {error ? (
        <div className="mt-4 alert alert-error shadow-lg">
          <div>
            <span>{error}</span>
          </div>
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <div className="grid min-w-[760px] grid-flow-col grid-rows-7 gap-1 rounded-xl bg-slate-950/40 p-4 border border-slate-700">
            {calendar.cells.map((cell, idx) => (
              <div
                key={cell.iso}
                title={`${cell.iso}: ${cell.count} submission${cell.count === 1 ? '' : 's'}`}
                className={`h-3.5 w-3.5 rounded-sm ${tones[calendar.levels[idx]]} transition-transform hover:scale-110`}
              />
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 min-w-[760px]">
            {Array.from({ length: 12 }, (_, i) => {
              const d = addDaysUTC(calendar.start, Math.floor((days - 1) * (i / 11)));
              const label = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
              return <span key={i}>{label}</span>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
