import { useState } from 'react';
import { Keyboard, Sliders, Check } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';
import { SHORTCUTS_DATA } from '../data';

interface ShortcutsStationProps {
  currentLang: Language;
}

export function ShortcutsStation({ currentLang }: ShortcutsStationProps) {
  const t = translations[currentLang];
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeShortcutTriggered, setActiveShortcutTriggered] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: t.shortcuts.categories.all },
    { id: 'capture', label: t.shortcuts.categories.capture },
    { id: 'zoom', label: t.shortcuts.categories.zoom },
    { id: 'record', label: t.shortcuts.categories.record },
    { id: 'timer', label: t.shortcuts.categories.timer },
  ];

  const filteredShortcuts =
    selectedCategory === 'all'
      ? SHORTCUTS_DATA
      : SHORTCUTS_DATA.filter((s) => s.category === selectedCategory);

  const handleTrigger = (id: string) => {
    setActiveShortcutTriggered(id);
    setTimeout(() => setActiveShortcutTriggered(null), 2000);
  };

  return (
    <section id="shortcuts" className="py-24 bg-slate-50 border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="inline-flex items-center px-3.5 py-1 bg-white border border-slate-200 rounded-full text-[11px] font-bold tracking-wider text-slate-500 uppercase shadow-2xs mb-4">
            <span>{t.shortcuts.eyebrow}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-slate-950 mb-4">
            {t.shortcuts.title}
          </h2>
          <p className="text-base text-slate-600 leading-relaxed">
            {t.shortcuts.subtitle}
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedCategory === cat.id
                  ? 'bg-slate-950 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-950 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Shortcuts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {filteredShortcuts.map((shortcut) => {
            const isTriggered = activeShortcutTriggered === shortcut.id;
            return (
              <div
                key={shortcut.id}
                onClick={() => handleTrigger(shortcut.id)}
                className={`p-6 rounded-2xl border transition-all cursor-pointer bg-white flex flex-col justify-between select-none shadow-xs ${
                  isTriggered
                    ? 'border-slate-950 ring-2 ring-slate-950/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    {/* Keys Badge */}
                    <div className="flex items-center gap-1.5">
                      {shortcut.keys.map((k, i) => (
                        <kbd
                          key={i}
                          className="font-mono-code text-xs font-semibold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>

                    {isTriggered && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-950 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-300">
                        <Check className="w-3 h-3" />
                        <span>Triggered</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-semibold text-slate-950 mb-1">{shortcut.action}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{shortcut.description}</p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="capitalize">{shortcut.category} mode</span>
                  <span className="text-slate-950 font-medium">Click to test</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Customization Note Footer */}
        <div className="mt-12 max-w-2xl mx-auto text-center">
          <p className="text-xs text-slate-500 flex items-center justify-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span>{t.shortcuts.customizableNote}</span>
          </p>
        </div>
      </div>
    </section>
  );
}

