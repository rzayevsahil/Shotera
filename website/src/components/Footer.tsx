import { Github, Globe } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';
import { SHOTERA_LINKS } from '../data';
import { useLatestVersion } from '../hooks/useLatestVersion';

interface FooterProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
}

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'az', label: 'Azərbaycan' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'ru', label: 'Русский' },
  { code: 'de', label: 'Deutsch' },
];

export function Footer({ currentLang, onLanguageChange }: FooterProps) {
  const t = translations[currentLang];
  const latestVersion = useLatestVersion(t.nav.versionBadge);

  return (
    <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-900 py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-slate-900">
          {/* Brand & Description */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <img
                src="./logo.png"
                alt="Shotera Logo"
                className="w-8 h-8 rounded-lg object-contain shadow-sm"
              />
              <span className="font-semibold text-white tracking-tight text-base">Shotera</span>
              <span className="text-[10px] font-mono-code bg-slate-900 text-slate-400 px-2 py-0.5 rounded-full border border-slate-800">
                {latestVersion}
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              {t.footer.desc}
            </p>
            <div className="text-[11px] text-slate-500">
              {t.footer.builtFor}
            </div>
          </div>

          {/* Links Column 1: Product */}
          <div className="md:col-span-2 space-y-3">
            <div className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
              {t.footer.product}
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  {t.nav.features}
                </a>
              </li>
              <li>
                <a href="#why-shotera" className="hover:text-white transition-colors">
                  {t.nav.whyShotera}
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  {t.nav.howItWorks}
                </a>
              </li>
              <li>
                <a href="#shortcuts" className="hover:text-white transition-colors">
                  {t.nav.shortcuts}
                </a>
              </li>
            </ul>
          </div>

          {/* Links Column 2: Resources & Download */}
          <div className="md:col-span-2 space-y-3">
            <div className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
              {t.footer.resources}
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#download" className="hover:text-white transition-colors">
                  {t.download.windowsInstaller}
                </a>
              </li>
              <li>
                <a href="#download" className="hover:text-white transition-colors">
                  {t.download.windowsPortable}
                </a>
              </li>
              <li>
                <a
                  href={SHOTERA_LINKS.releases}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  {t.footer.releaseNotes}
                </a>
              </li>
            </ul>
          </div>

          {/* Links Column 3: Open Source & Language */}
          <div className="md:col-span-3 space-y-3">
            <div className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
              {t.footer.openSource}
            </div>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href={SHOTERA_LINKS.repo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>{t.footer.githubRepo}</span>
                </a>
              </li>
              <li>
                <a
                  href={SHOTERA_LINKS.issues}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  {t.footer.issueTracker}
                </a>
              </li>
            </ul>

            {/* Language Switcher in Footer */}
            <div className="pt-3">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-2">
                <Globe className="w-3.5 h-3.5" />
                <span>{t.footer.languages}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => onLanguageChange(lang.code)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-mono-code transition-colors ${
                      currentLang === lang.code
                        ? 'bg-white text-slate-950 font-semibold shadow-2xs'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>{t.footer.copyright}</div>
          <div className="flex items-center gap-1">
            <span>Crafted by Sahil Rzayev for speed and clarity.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

