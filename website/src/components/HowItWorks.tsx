import { useRef, useEffect } from 'react';
import { Crop, PenTool, Share2 } from 'lucide-react';
import { motion, useInView } from 'motion/react';
import { Language } from '../types';
import { translations } from '../translations';
import { useViewfinder } from '../context/ViewfinderContext';
import { dustRevealVariants } from '../utils/animations';

interface HowItWorksProps {
  currentLang: Language;
}

export function HowItWorks({ currentLang }: HowItWorksProps) {
  const t = translations[currentLang];
  const ref = useRef(null);
  const isInView = useInView(ref, { margin: "-40% 0px -40% 0px" });
  const { activeTarget, setActiveTarget } = useViewfinder();

  useEffect(() => {
    if (isInView) setActiveTarget('howitworks');
  }, [isInView, setActiveTarget]);

  const steps = [
    {
      num: t.howItWorks.step1.num,
      title: t.howItWorks.step1.title,
      desc: t.howItWorks.step1.desc,
      icon: Crop,
    },
    {
      num: t.howItWorks.step2.num,
      title: t.howItWorks.step2.title,
      desc: t.howItWorks.step2.desc,
      icon: PenTool,
    },
    {
      num: t.howItWorks.step3.num,
      title: t.howItWorks.step3.title,
      desc: t.howItWorks.step3.desc,
      icon: Share2,
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-white overflow-hidden">
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
            <span>{t.howItWorks.eyebrow}</span>
          </motion.div>
          <motion.h2
            custom={1}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={dustRevealVariants}
            className="text-3xl sm:text-4xl lg:text-5xl font-display font-semibold tracking-tight text-slate-950 mb-4"
          >
            {t.howItWorks.title}
          </motion.h2>
          <motion.p
            custom={2}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={dustRevealVariants}
            className="text-base text-slate-600 leading-relaxed"
          >
            {t.howItWorks.subtitle}
          </motion.p>
        </div>

        <div className="relative max-w-5xl mx-auto" ref={ref}>
          {activeTarget === 'howitworks' && (
            <motion.div
              layoutId="global-viewfinder"
              className="absolute -inset-4 md:-inset-6 ring-2 ring-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.4)] rounded-[2rem] pointer-events-none z-50"
            />
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <motion.div
                  custom={idx + 3} // Staggered delay based on index
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  variants={dustRevealVariants}
                  key={idx}
                  className="relative p-8 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between shadow-xs"
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <span className="font-mono-code text-2xl font-bold text-slate-950">
                        {step.num}
                      </span>
                      <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-950 flex items-center justify-center border border-slate-200">
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                    </div>
                    <h3 className="text-base font-semibold text-slate-950 mb-2">{step.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

