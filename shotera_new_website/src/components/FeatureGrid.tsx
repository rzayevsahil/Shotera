import { Crop, PenTool, ZoomIn, Video, Cpu, Sparkles } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';
import { FEATURE_CATEGORIES } from '../data';

interface FeatureGridProps {
  currentLang: Language;
}

export function FeatureGrid({ currentLang }: FeatureGridProps) {
  const t = translations[currentLang];

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Crop':
        return <Crop className="w-5 h-5 text-slate-950" />;
      case 'PenTool':
        return <PenTool className="w-5 h-5 text-slate-950" />;
      case 'ZoomIn':
        return <ZoomIn className="w-5 h-5 text-slate-950" />;
      case 'Video':
        return <Video className="w-5 h-5 text-slate-950" />;
      case 'Cpu':
        return <Cpu className="w-5 h-5 text-slate-950" />;
      default:
        return <Sparkles className="w-5 h-5 text-slate-950" />;
    }
  };

  return (
    <section className="py-24 bg-slate-50 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center px-3.5 py-1 bg-white border border-slate-200 rounded-full text-[11px] font-bold tracking-wider text-slate-500 uppercase shadow-2xs mb-4">
            <span>{t.matrix.eyebrow}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-slate-950 mb-4">
            {t.matrix.title}
          </h2>
          <p className="text-base text-slate-600 leading-relaxed">
            {t.matrix.subtitle}
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURE_CATEGORIES.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                    {getIcon(category.iconName)}
                  </div>
                  <h3 className="text-base font-semibold text-slate-950">{category.title}</h3>
                </div>

                <div className="space-y-4">
                  {category.items.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="text-xs font-semibold text-slate-950 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-950 shrink-0" />
                        <span>{item.title}</span>
                      </div>
                      <p className="text-xs text-slate-500 pl-3.5 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

