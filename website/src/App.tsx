import { useState, useEffect } from 'react';
import { Language } from './types';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ConsolidationSection } from './components/ConsolidationSection';
import { FeatureShowcases } from './components/FeatureShowcases';
import { FeatureGrid } from './components/FeatureGrid';
import { HowItWorks } from './components/HowItWorks';
import { ShortcutsStation } from './components/ShortcutsStation';
import { DownloadSection } from './components/DownloadSection';
import { GitHubSection } from './components/GitHubSection';
import { PhilosophySection } from './components/PhilosophySection';
import { Footer } from './components/Footer';

import { ViewfinderProvider } from './context/ViewfinderContext';

export default function App() {
  const [currentLang, setCurrentLang] = useState<Language>(() => {
    // Detect user language preference or default to 'en'
    if (typeof window !== 'undefined' && window.navigator) {
      const browserLang = window.navigator.language?.toLowerCase();
      if (browserLang.startsWith('az')) return 'az';
      if (browserLang.startsWith('tr')) return 'tr';
      if (browserLang.startsWith('ru')) return 'ru';
      if (browserLang.startsWith('de')) return 'de';
    }
    return 'en';
  });

  // Keep document html lang in sync
  useEffect(() => {
    document.documentElement.lang = currentLang;
  }, [currentLang]);

  return (
    <ViewfinderProvider>
      <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans antialiased selection:bg-slate-100 selection:text-slate-900">
        <Header currentLang={currentLang} onLanguageChange={setCurrentLang} />
        <main className="grow">
          <Hero currentLang={currentLang} />
          <ConsolidationSection currentLang={currentLang} />
          <FeatureShowcases currentLang={currentLang} />
          <FeatureGrid currentLang={currentLang} />
          <HowItWorks currentLang={currentLang} />
          <ShortcutsStation currentLang={currentLang} />
          <DownloadSection currentLang={currentLang} />
          <PhilosophySection currentLang={currentLang} />
          <GitHubSection currentLang={currentLang} />
        </main>
        <Footer currentLang={currentLang} onLanguageChange={setCurrentLang} />
      </div>
    </ViewfinderProvider>
  );
}
