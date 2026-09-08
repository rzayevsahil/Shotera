import { useState, useEffect } from 'react';
import { Download, Github, Menu, X, ChevronDown, Check } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';
import { SHOTERA_LINKS } from '../data';
import { useLatestVersion } from '../hooks/useLatestVersion';

interface HeaderProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
}

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: 'EN' },
  { code: 'az', label: 'Azərbaycan', flag: 'AZ' },
  { code: 'tr', label: 'Türkçe', flag: 'TR' },
  { code: 'ru', label: 'Русский', flag: 'RU' },
  { code: 'de', label: 'Deutsch', flag: 'DE' },
];

export function Header({ currentLang, onLanguageChange }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const latestVersion = useLatestVersion(translations[currentLang].nav.versionBadge);

  const t = translations[currentLang];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: t.nav.features, href: '#features' },
    { label: t.nav.whyShotera, href: '#why-shotera' },
    { label: t.nav.howItWorks, href: '#how-it-works' },
    { label: t.nav.shortcuts, href: '#shortcuts' },
    { label: t.nav.download, href: '#download' },
  ];

  return (
    <header
      className={`sticky top-0 z-[60] transition-all duration-200 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs'
          : 'bg-white border-b border-slate-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex items-center justify-between h-18 py-4">
          {/* Brand Logo & Name */}
          <a
            href="#"
            className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 rounded-lg py-1"
            id="header-brand-link"
          >
            <img
              src="/logo.png"
              alt="Shotera Logo"
              className="w-8 h-8 rounded-lg shadow-sm group-hover:scale-105 transition-transform object-contain"
            />
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl font-display font-semibold tracking-tight uppercase text-slate-950">Shotera</span>
              <span className="text-[10px] font-mono-code font-semibold tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase">
                {latestVersion}
              </span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-500 hover:text-slate-950 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right Actions: Lang Selector + GitHub + Download Button */}
          <div className="hidden md:flex items-center gap-3">
            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                id="language-selector-btn"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-950 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors"
                aria-expanded={langDropdownOpen}
                aria-label="Select language"
              >
                <span className="font-mono-code font-semibold text-slate-900">
                  {LANGUAGES.find((l) => l.code === currentLang)?.flag}
                </span>
                <span className="hidden lg:inline">{LANGUAGES.find((l) => l.code === currentLang)?.label}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${langDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {langDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setLangDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-100 rounded-xl shadow-xl shadow-slate-100 py-1.5 z-50 text-xs">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          onLanguageChange(lang.code);
                          setLangDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2 text-left hover:bg-slate-50 transition-colors ${
                          currentLang === lang.code ? 'font-semibold text-slate-950 bg-slate-50' : 'text-slate-600'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="font-mono-code font-bold text-slate-400">{lang.flag}</span>
                          <span>{lang.label}</span>
                        </span>
                        {currentLang === lang.code && <Check className="w-3.5 h-3.5 text-slate-950" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* GitHub Link */}
            <a
              href={SHOTERA_LINKS.repo}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-950 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-colors"
              id="header-github-btn"
            >
              <Github className="w-3.5 h-3.5 text-slate-700" />
              <span>{t.nav.github}</span>
            </a>

            {/* Primary Download CTA */}
            <a
              href="#download"
              className="inline-flex items-center gap-2 bg-slate-950 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm shadow-slate-200"
              id="header-download-cta"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t.nav.download}</span>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-950 hover:bg-slate-50 rounded-lg"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-100 bg-white px-4 pt-2 pb-6 space-y-3 shadow-lg shadow-slate-100">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-base font-medium text-slate-600 hover:text-slate-950 hover:bg-slate-50 rounded-lg"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-3">
              Language
            </div>
            <div className="grid grid-cols-2 gap-1.5 px-3">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    onLanguageChange(lang.code);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-left ${
                    currentLang === lang.code
                      ? 'bg-slate-100 text-slate-950 font-semibold border border-slate-200'
                      : 'text-slate-600 hover:bg-slate-50 border border-slate-100'
                  }`}
                >
                  <span className="font-mono-code font-bold">{lang.flag}</span>
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 px-3 flex flex-col gap-2">
            <a
              href="#download"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-slate-950 rounded-full shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>{t.nav.download}</span>
            </a>
            <a
              href={SHOTERA_LINKS.repo}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-full hover:bg-slate-50"
            >
              <Github className="w-4 h-4" />
              <span>{t.nav.github}</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
