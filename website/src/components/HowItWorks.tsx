import { Crop, PenTool, Share2 } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

interface HowItWorksProps {
  currentLang: Language;
}

export function HowItWorks({ currentLang }: HowItWorksProps) {
  const t = translations[currentLang];

  const steps = [
    {
      num: t.howItWorks.step1.num,
      title: t.howItWorks.step1.title,
      desc: t.howItWorks.step1.desc,
      icon: Crop,
    },
    {
      num: t.howItWorks.step2.num,
      title: t.howItWorks.step2.title,
      desc: t.howItWorks.step2.desc,
      icon: PenTool,
    },
    {
      num: t.howItWorks.step3.num,
      title: t.howItWorks.step3.title,
      desc: t.howItWorks.step3.desc,
      icon: Share2,
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center px-3.5 py-1 bg-slate-50 border border-slate-200 rounded-full text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-4">
            <span>{t.howItWorks.eyebrow}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-slate-950 mb-4">
            {t.howItWorks.title}
          </h2>
          <p className="text-base text-slate-600 leading-relaxed">
            {t.howItWorks.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="relative p-8 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-mono-code text-2xl font-bold text-slate-950">
                      {step.num}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-950 flex items-center justify-center border border-slate-200">
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                  </div>
                  <h3 className="text-base font-semibold text-slate-950 mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

