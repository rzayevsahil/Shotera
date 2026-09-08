import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ViewfinderTarget = 'hero' | 'consolidation' | 'features-1' | 'features-2' | 'features-3' | 'features-4' | 'features-5' | 'features-6' | 'grid' | 'howitworks' | 'shortcuts' | 'download' | 'github';

interface ViewfinderContextType {
  activeTarget: ViewfinderTarget;
  setActiveTarget: (target: ViewfinderTarget) => void;
}

const ViewfinderContext = createContext<ViewfinderContextType | null>(null);

export function ViewfinderProvider({ children }: { children: ReactNode }) {
  const [activeTarget, setActiveTarget] = useState<ViewfinderTarget>('hero');

  return (
    <ViewfinderContext.Provider value={{ activeTarget, setActiveTarget }}>
      {children}
    </ViewfinderContext.Provider>
  );
}

export function useViewfinder() {
  const context = useContext(ViewfinderContext);
  if (!context) {
    throw new Error('useViewfinder must be used within a ViewfinderProvider');
  }
  return context;
}
