import { Language } from '../types';
import { translations } from '../translations';

interface PhilosophySectionProps {
  currentLang: Language;
}

export function PhilosophySection({ currentLang }: PhilosophySectionProps) {
  const t = translations[currentLang];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-12 text-center">
        <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-6">
          <span>{t.philosophy.eyebrow}</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-semibold tracking-tight text-slate-950 mb-8">
          {t.philosophy.title}
        </h2>

        <blockquote className="text-lg sm:text-xl font-normal text-slate-700 italic mb-8 leading-relaxed max-w-3xl mx-auto">
          {t.philosophy.quote}
        </blockquote>

        <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
          {t.philosophy.body}
        </p>
      </div>
    </section>
  );
}

