import { Download, ExternalLink, HardDrive, Cpu, CheckCircle2, FileArchive, Laptop } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';
import { SHOTERA_LINKS } from '../data';

interface DownloadSectionProps {
  currentLang: Language;
}

export function DownloadSection({ currentLang }: DownloadSectionProps) {
  const t = translations[currentLang];

  return (
    <section id="download" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center px-3.5 py-1 bg-slate-50 border border-slate-200 rounded-full text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-4">
            <span>{t.download.eyebrow}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-slate-950 mb-4">
            {t.download.title}
          </h2>
          <p className="text-base text-slate-600 leading-relaxed">
            {t.download.subtitle}
          </p>
        </div>

        {/* Download Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          {/* Card 1: Windows Setup Installer */}
          <div className="p-8 sm:p-10 rounded-3xl border border-slate-950 bg-white shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-5 right-5 bg-slate-950 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Recommended
            </div>

            <div>
              <div className="w-12 h-12 rounded-2xl bg-slate-950 text-white flex items-center justify-center mb-6 shadow-xs">
                <Laptop className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-slate-950 mb-2">
                {t.download.windowsInstaller}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                {t.download.windowsInstallerDesc}
              </p>

              <div className="space-y-3 mb-8 text-xs text-slate-600">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-slate-950 shrink-0" />
                  <span>Windows 10 / 11 (64-bit Architecture)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-slate-950 shrink-0" />
                  <span>Automatic background updates & system tray</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-slate-950 shrink-0" />
                  <span>Instant global hotkey registration</span>
                </div>
              </div>
            </div>

            <a
              href={SHOTERA_LINKS.latestRelease}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 text-xs font-semibold text-white bg-slate-950 hover:bg-slate-800 rounded-xl shadow-xs transition-all tracking-wide"
            >
              <Download className="w-4 h-4" />
              <span>Download Shotera (.exe)</span>
            </a>
          </div>

          {/* Card 2: Portable Zip Archive */}
          <div className="p-8 sm:p-10 rounded-3xl border border-slate-200 bg-slate-50 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white text-slate-950 flex items-center justify-center mb-6 border border-slate-200">
                <FileArchive className="w-6 h-6 text-slate-800" />
              </div>
              <h3 className="text-xl font-semibold text-slate-950 mb-2">
                {t.download.windowsPortable}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                {t.download.windowsPortableDesc}
              </p>

              <div className="space-y-3 mb-8 text-xs text-slate-600">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-slate-950 shrink-0" />
                  <span>Zero installation or registry writes</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-slate-950 shrink-0" />
                  <span>Runs from USB flash drive or network folder</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-slate-950 shrink-0" />
                  <span>Self-contained configuration file</span>
                </div>
              </div>
            </div>

            <a
              href={SHOTERA_LINKS.releases}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 text-xs font-semibold text-slate-950 bg-white hover:bg-slate-100 rounded-xl transition-all border border-slate-200 shadow-2xs tracking-wide"
            >
              <Download className="w-4 h-4" />
              <span>Download Portable (.zip)</span>
            </a>
          </div>
        </div>

        {/* View All Releases Link */}
        <div className="text-center mb-14">
          <a
            href={SHOTERA_LINKS.releases}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-950 transition-colors"
          >
            <span>{t.download.viewReleases}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* System Requirements & Security Specs */}
        <div className="max-w-4xl mx-auto rounded-2xl border border-slate-100 bg-slate-50 p-6">
          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-4">
            {t.download.systemRequirements}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-2.5">
              <Laptop className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{t.download.reqWindows}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Cpu className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{t.download.reqRam}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <HardDrive className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{t.download.reqStorage}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

