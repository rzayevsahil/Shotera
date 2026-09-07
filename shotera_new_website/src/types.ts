export type Language = 'en' | 'az' | 'tr' | 'ru' | 'de';

export interface ShortcutItem {
  id: string;
  keys: string[];
  action: string;
  category: 'capture' | 'zoom' | 'record' | 'timer';
  description: string;
}

export interface FeatureCategory {
  id: string;
  title: string;
  iconName: string;
  items: {
    title: string;
    description: string;
    badge?: string;
  }[];
}

export interface TranslationStrings {
  nav: {
    features: string;
    howItWorks: string;
    shortcuts: string;
    whyShotera: string;
    download: string;
    github: string;
    versionBadge: string;
  };
  hero: {
    eyebrow: string;
    headline: string;
    headlineHighlight: string;
    supporting: string;
    downloadBtn: string;
    githubBtn: string;
    compatibility: string;
    trustPills: {
      openSource: string;
      privacy: string;
      lightweight: string;
    };
  };
  whyShotera: {
    eyebrow: string;
    title: string;
    subtitle: string;
    beforeTitle: string;
    afterTitle: string;
    items: {
      name: string;
      replaced: string;
      desc: string;
    }[];
  };
  showcases: {
    capture: {
      tag: string;
      title: string;
      desc: string;
      points: string[];
    };
    annotation: {
      tag: string;
      title: string;
      desc: string;
      points: string[];
    };
    zoom: {
      tag: string;
      title: string;
      desc: string;
      points: string[];
    };
    record: {
      tag: string;
      title: string;
      desc: string;
      points: string[];
    };
    ocr: {
      tag: string;
      title: string;
      desc: string;
      points: string[];
    };
    timer: {
      tag: string;
      title: string;
      desc: string;
      points: string[];
    };
  };
  matrix: {
    eyebrow: string;
    title: string;
    subtitle: string;
  };
  howItWorks: {
    eyebrow: string;
    title: string;
    subtitle: string;
    step1: { num: string; title: string; desc: string };
    step2: { num: string; title: string; desc: string };
    step3: { num: string; title: string; desc: string };
  };
  shortcuts: {
    eyebrow: string;
    title: string;
    subtitle: string;
    customizableNote: string;
    categories: {
      all: string;
      capture: string;
      zoom: string;
      record: string;
      timer: string;
    };
  };
  download: {
    eyebrow: string;
    title: string;
    subtitle: string;
    windowsInstaller: string;
    windowsInstallerDesc: string;
    windowsPortable: string;
    windowsPortableDesc: string;
    viewReleases: string;
    systemRequirements: string;
    reqWindows: string;
    reqRam: string;
    reqStorage: string;
    licenseTitle: string;
    licenseDesc: string;
  };
  github: {
    eyebrow: string;
    title: string;
    subtitle: string;
    viewRepo: string;
    reportIssue: string;
    starsNote: string;
  };
  philosophy: {
    eyebrow: string;
    title: string;
    quote: string;
    body: string;
  };
  footer: {
    desc: string;
    product: string;
    resources: string;
    openSource: string;
    copyright: string;
    builtFor: string;
  };
}
