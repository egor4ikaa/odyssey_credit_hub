'use client';

interface EventItem {
  id: string;
  type: string;
  message: string;
  createdAt: string;
}

const TYPE_STYLE: Record<string, string> = {
  INFO: 'bg-slate-400',
  CHECK: 'bg-sky-500',
  SCORE: 'bg-violet-500',
  DECISION: 'bg-emerald-500',
  ACTION: 'bg-brand-500'
};

export function Timeline({ events }: { events: EventItem[] }) {
  return (
    <ol className="relative space-y-5 border-l-2 border-brand-100 pl-6">
      {events.map((e) => (
        <li key={e.id} className="relative">
          <span className={`absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border-2 border-white ${TYPE_STYLE[e.type] ?? 'bg-slate-300'} shadow`} />
          <div className="text-xs text-gray-400">
            {new Date(e.createdAt).toLocaleString('ru-RU')}
          </div>
          <div className="mt-0.5 text-sm leading-relaxed text-gray-700">{e.message}</div>
        </li>
      ))}
    </ol>
  );
}
