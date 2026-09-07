import { Github, ExternalLink, GitBranch, Shield, Heart } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';
import { SHOTERA_LINKS } from '../data';

interface GitHubSectionProps {
  currentLang: Language;
}

export function GitHubSection({ currentLang }: GitHubSectionProps) {
  const t = translations[currentLang];

  return (
    <section className="py-20 bg-slate-50 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 shadow-xs flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 text-center md:text-left">
            <div className="inline-flex items-center px-3.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              <span>{t.github.eyebrow}</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-950">
              {t.github.title}
            </h3>
            <p className="text-sm text-slate-600 max-w-xl leading-relaxed">
              {t.github.subtitle}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-500 justify-center md:justify-start">
              <span className="flex items-center gap-1.5 font-mono-code text-slate-600">
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                <span>MIT License</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <GitBranch className="w-3.5 h-3.5 text-slate-400" />
                <span>Active Development</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <Heart className="w-3.5 h-3.5 text-slate-400" />
                <span>Community Driven</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full sm:w-auto shrink-0">
            <a
              href={SHOTERA_LINKS.repo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-xs font-semibold text-white bg-slate-950 hover:bg-slate-800 rounded-xl shadow-xs transition-all tracking-wide"
            >
              <Github className="w-4 h-4" />
              <span>{t.github.viewRepo}</span>
            </a>
            <a
              href={SHOTERA_LINKS.issues}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-2xs"
            >
              <span>{t.github.reportIssue}</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

