import { Crop, ZoomIn, PenTool, ScanText, Video, Timer, Check, ArrowRight } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';

interface ConsolidationSectionProps {
  currentLang: Language;
}

export function ConsolidationSection({ currentLang }: ConsolidationSectionProps) {
  const t = translations[currentLang];

  const tools = [
    {
      icon: Crop,
      name: t.whyShotera.items[0].name,
      replaces: t.whyShotera.items[0].replaced,
      desc: t.whyShotera.items[0].desc,
      hotkey: 'Ctrl+Shift+S',
    },
    {
      icon: ZoomIn,
      name: t.whyShotera.items[1].name,
      replaces: t.whyShotera.items[1].replaced,
      desc: t.whyShotera.items[1].desc,
      hotkey: 'Ctrl+1 / Ctrl+4',
    },
    {
      icon: PenTool,
      name: t.whyShotera.items[2].name,
      replaces: t.whyShotera.items[2].replaced,
      desc: t.whyShotera.items[2].desc,
      hotkey: 'Auto in Editor',
    },
    {
      icon: ScanText,
      name: t.whyShotera.items[3].name,
      replaces: t.whyShotera.items[3].replaced,
      desc: t.whyShotera.items[3].desc,
      hotkey: 'OCR Extraction',
    },
    {
      icon: Video,
      name: t.whyShotera.items[4].name,
      replaces: t.whyShotera.items[4].replaced,
      desc: t.whyShotera.items[4].desc,
      hotkey: 'Ctrl+5',
    },
    {
      icon: Timer,
      name: t.whyShotera.items[5].name,
      replaces: t.whyShotera.items[5].replaced,
      desc: t.whyShotera.items[5].desc,
      hotkey: 'Ctrl+3',
    },
  ];

  return (
    <section id="why-shotera" className="py-24 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <div className="inline-flex items-center px-3.5 py-1 bg-slate-50 border border-slate-200 rounded-full text-[11px] font-bold tracking-wider text-slate-500 uppercase">
            {t.whyShotera.eyebrow}
          </div>
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-slate-950">
            {t.whyShotera.title}
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            {t.whyShotera.subtitle}
          </p>
        </div>

        {/* The Consolidation Matrix Card */}
        <div className="max-w-6xl mx-auto bg-slate-50/50 rounded-3xl sm:rounded-[36px] border border-slate-100 p-6 sm:p-10 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool, idx) => {
              const Icon = tool.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl border border-slate-200/70 bg-white hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-900 border border-slate-200 flex items-center justify-center group-hover:bg-slate-950 group-hover:text-white transition-colors">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="font-mono-code text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {tool.hotkey}
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-slate-950 mb-1.5">{tool.name}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">{tool.desc}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 line-through truncate max-w-[140px]">
                      {tool.replaces}
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-slate-950">
                      <Check className="w-3.5 h-3.5 text-slate-950" />
                      <span>Shotera</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Consolidated Efficiency Banner */}
          <div className="mt-8 pt-2">
            <div className="bg-slate-950 text-white rounded-2xl p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl shadow-slate-200">
              <div className="flex items-center gap-4">
                <img
                  src="/logo.png"
                  alt="Shotera Logo"
                  className="w-10 h-10 rounded-xl object-contain shadow-md border border-white/20"
                />
                <div className="text-left">
                  <div className="text-base font-semibold text-white">
                    One Unified Background Process
                  </div>
                  <div className="text-xs text-slate-400">
                    ~40MB RAM footprint • Zero background telemetry • Instant global hotkey hook
                  </div>
                </div>
              </div>

              <a
                href="#download"
                className="inline-flex items-center gap-2 px-6 py-3 text-xs font-semibold text-slate-950 bg-white hover:bg-slate-100 rounded-xl transition-colors whitespace-nowrap shadow-sm"
              >
                <span>Download Unified App</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
