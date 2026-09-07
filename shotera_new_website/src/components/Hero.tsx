import { Download, Github, ShieldCheck, Zap } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';
import { SHOTERA_LINKS } from '../data';
import { ShoteraAppWindow } from './ShoteraAppWindow';

interface HeroProps {
  currentLang: Language;
}

export function Hero({ currentLang }: HeroProps) {
  const t = translations[currentLang];

  return (
    <section className="relative pt-10 pb-20 md:pt-16 md:pb-28 overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        {/* Hero Copy Center */}
        <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16 space-y-6">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center px-3.5 py-1 bg-slate-50 border border-slate-200 rounded-full text-[11px] font-bold tracking-wider text-slate-500 uppercase">
            {t.hero.eyebrow}
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-slate-950 leading-[1.08]">
            {t.hero.headline}{' '}
            <span className="text-slate-400 italic font-normal">
              {t.hero.headlineHighlight}
            </span>
          </h1>

          {/* Supporting Text */}
          <p className="text-base sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
            {t.hero.supporting}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <a
              href="#download"
              className="w-full sm:w-auto flex items-center justify-center gap-3 bg-slate-950 text-white px-8 py-4 rounded-xl font-medium shadow-xl shadow-slate-200 hover:bg-slate-800 active:bg-black transition-all group"
              id="hero-download-btn"
            >
              <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
              <span>{t.hero.downloadBtn}</span>
            </a>

            <a
              href={SHOTERA_LINKS.repo}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
              id="hero-github-btn"
            >
              <Github className="w-4 h-4 text-slate-700" />
              <span>{t.hero.githubBtn}</span>
            </a>
          </div>

          {/* Compatibility & Specs line */}
          <div className="text-xs font-mono-code text-slate-400 pt-1">
            {t.hero.compatibility}
          </div>

          {/* Trust Value Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs font-medium text-slate-600">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-800" />
              <span>{t.hero.trustPills.openSource}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-800" />
              <span>{t.hero.trustPills.privacy}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200">
              <Zap className="w-3.5 h-3.5 text-slate-800" />
              <span>{t.hero.trustPills.lightweight}</span>
            </span>
          </div>
        </div>

        {/* Outer Minimalist Showcase Container */}
        <div className="max-w-5xl mx-auto relative">
          <div className="bg-slate-50 rounded-3xl sm:rounded-[40px] border border-slate-100 p-3 sm:p-8 shadow-2xl relative z-10">
            <ShoteraAppWindow />
          </div>
          <div className="hidden sm:block absolute -bottom-4 -right-4 w-full h-full bg-slate-100/70 rounded-[44px] -z-10" />
        </div>
      </div>
    </section>
  );
}
