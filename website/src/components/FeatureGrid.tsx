import { useRef, useEffect } from 'react';
import { Crop, PenTool, ZoomIn, Video, Cpu, Sparkles } from 'lucide-react';
import { motion, useInView } from 'motion/react';
import { Language } from '../types';
import { translations } from '../translations';
import { FEATURE_CATEGORIES } from '../data';
import { useViewfinder } from '../context/ViewfinderContext';
import { dustRevealVariants, scaleUpVariants } from '../utils/animations';

interface FeatureGridProps {
  currentLang: Language;
}

export function FeatureGrid({ currentLang }: FeatureGridProps) {
  const t = translations[currentLang];
  const ref = useRef(null);
  const isInView = useInView(ref, { margin: "-40% 0px -40% 0px" });
  const { activeTarget, setActiveTarget } = useViewfinder();

  useEffect(() => {
    if (isInView) setActiveTarget('grid');
  }, [isInView, setActiveTarget]);

  const getIcon = (id: string) => {
    switch (id) {
      case 'capture': return <Crop className="w-5 h-5 text-slate-950" />;
      case 'explain': return <PenTool className="w-5 h-5 text-slate-950" />;
      case 'present': return <ZoomIn className="w-5 h-5 text-slate-950" />;
      case 'record': return <Video className="w-5 h-5 text-slate-950" />;
      case 'smarter': return <Cpu className="w-5 h-5 text-slate-950" />;
      default: return <Sparkles className="w-5 h-5 text-slate-950" />;
    }
  };

  return (
    <section className="py-24 bg-slate-50 border-t border-slate-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        
        {/* Header Section */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <motion.div
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={dustRevealVariants}
            className="inline-flex items-center px-3.5 py-1 bg-white border border-slate-200 rounded-full text-[11px] font-bold tracking-wider text-slate-500 uppercase shadow-2xs mb-4"
          >
            <span>{t.matrix.eyebrow}</span>
          </motion.div>
          <motion.h2
            custom={1}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={dustRevealVariants}
            className="text-3xl sm:text-4xl lg:text-5xl font-display font-semibold tracking-tight text-slate-950 mb-4"
          >
            {t.matrix.title}
          </motion.h2>
          <motion.p
            custom={2}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={dustRevealVariants}
            className="text-base text-slate-600 leading-relaxed"
          >
            {t.matrix.subtitle}
          </motion.p>
        </div>

        {/* Categories Grid */}
        <div className="relative" ref={ref}>
          {activeTarget === 'grid' && (
            <motion.div
              layoutId="global-viewfinder"
              className="absolute -inset-4 md:-inset-6 ring-2 ring-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.4)] rounded-[2rem] pointer-events-none z-50"
            />
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
            {t.matrix.categories.map((category, idx) => (
              <motion.div
                custom={idx + 3} // Staggered delay based on index
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={scaleUpVariants}
                key={category.id}
                className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                      {getIcon(category.id)}
                    </div>
                    <h3 className="text-base font-semibold text-slate-950">{category.title}</h3>
                  </div>

                  <div className="space-y-4">
                    {category.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="space-y-1">
                        <div className="text-xs font-semibold text-slate-950 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-950 shrink-0" />
                          <span>{item.title}</span>
                        </div>
                        <p className="text-xs text-slate-500 pl-3.5 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

