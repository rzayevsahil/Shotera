import { useRef, useEffect } from 'react';
import { Download, ExternalLink, HardDrive, Cpu, CheckCircle2, FileArchive, Laptop } from 'lucide-react';
import { motion, useInView } from 'motion/react';
import { Language } from '../types';
import { translations } from '../translations';
import { SHOTERA_LINKS } from '../data';
import { useViewfinder } from '../context/ViewfinderContext';
import { dustRevealVariants } from '../utils/animations';

interface DownloadSectionProps {
  currentLang: Language;
}

export function DownloadSection({ currentLang }: DownloadSectionProps) {
  const t = translations[currentLang];
  const ref = useRef(null);
  const isInView = useInView(ref, { margin: "-40% 0px -40% 0px" });
  const { activeTarget, setActiveTarget } = useViewfinder();

  useEffect(() => {
    if (isInView) setActiveTarget('download');
  }, [isInView, setActiveTarget]);

  return (
    <section id="download" className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <motion.div
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={dustRevealVariants}
            className="inline-flex items-center px-3.5 py-1 bg-slate-50 border border-slate-200 rounded-full text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-4"
          >
            <span>{t.download.eyebrow}</span>
          </motion.div>
          <motion.h2
            custom={1}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={dustRevealVariants}
            className="text-3xl sm:text-4xl lg:text-5xl font-display font-semibold tracking-tight text-slate-950 mb-4"
          >
            {t.download.title}
          </motion.h2>
          <motion.p
            custom={2}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={dustRevealVariants}
            className="text-base text-slate-600 leading-relaxed"
          >
            {t.download.subtitle}
          </motion.p>
        </div>

        {/* Download Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          {/* Card 1: Windows Setup Installer */}
          <motion.div
            custom={3}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={dustRevealVariants}
            className="p-8 sm:p-10 rounded-3xl border border-slate-950 bg-white shadow-xl flex flex-col justify-between relative" ref={ref}
          >
            {activeTarget === 'download' && (
              <motion.div
                layoutId="global-viewfinder"
                className="absolute inset-0 ring-2 ring-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.4)] rounded-3xl pointer-events-none z-50"
              />
            )}
            <div className="absolute top-5 right-5 bg-slate-950 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider z-10">
              {t.download.recommended}
            </div>
            
            <div className="relative z-10">
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
                {t.download.windowsInstallerFeatures.map((feat, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-slate-950 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <a
              href={SHOTERA_LINKS.latestRelease}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 text-xs font-semibold text-white bg-slate-950 hover:bg-slate-800 rounded-xl shadow-xs transition-all tracking-wide relative z-10"
            >
              <Download className="w-4 h-4" />
              <span>{t.download.downloadExeBtn}</span>
            </a>
          </motion.div>

          {/* Card 2: Portable Zip Archive */}
          <motion.div
            custom={4}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={dustRevealVariants}
            className="p-8 sm:p-10 rounded-3xl border border-slate-200 bg-slate-50 shadow-xs flex flex-col justify-between"
          >
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
                {t.download.windowsPortableFeatures.map((feat, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-slate-950 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <a
              href={SHOTERA_LINKS.releases}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 text-xs font-semibold text-slate-950 bg-white hover:bg-slate-100 rounded-xl transition-all border border-slate-200 shadow-2xs tracking-wide"
            >
              <Download className="w-4 h-4" />
              <span>{t.download.downloadZipBtn}</span>
            </a>
          </motion.div>
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
        <motion.div
          custom={5}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={dustRevealVariants}
          className="max-w-4xl mx-auto rounded-2xl border border-slate-100 bg-slate-50 p-6"
        >
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
        </motion.div>
      </div>
    </section>
  );
}

