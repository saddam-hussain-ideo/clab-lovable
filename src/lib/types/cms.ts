export interface PageSection {
  title: string;
  items: string[];
}

export interface RoadmapContent {
  body?: string;
  phases?: RoadmapPhase[];
  vision?: string;
  milestones?: any[]; // Adding support for milestones in RoadmapContent
}

export interface RoadmapPhase {
  id: string;
  name: string;
  description: string;
  htmlDescription?: string; // Adding HTML content support
  status: 'completed' | 'in-progress' | 'upcoming';
  items: string[];
}

export interface TokenomicsSection {
  name: string;
  value: number;
  amount: string;
  tabContent?: {
    purpose?: string;
    details: string[];
    ctaLink?: {
      text: string;
      url: string;
    };
  };
}

export interface TokenomicsContent {
  totalSupply: string;
  tokenType?: string;
  sections: TokenomicsSection[];
  narrativeText?: string; // Added field for the narrative text block
}

export interface HomeContent {
  hero: {
    title: string;
    subtitle: string;
    ctaText: string;
  };
  features: Array<{
    title: string;
    description: string;
    icon?: string;
  }>;
  about: {
    title: string;
    description: string;
    highlights: string[];
  };
  presale: {
    title: string;
    description: string;
    highlights: Array<{
      text: string;
    }>;
  };
  platformHighlights: Array<{
    title: string;
    description: string;
    icon: string;
  }>;
  university?: {
    title: string;
    description: string;
    highlights: string[];
    ctaText: string;
  };
}

export interface PrivacyContent {
  lastUpdated: string;
  sections: Array<{
    title: string;
    content: string;
  }>;
}

export interface TermsContent {
  lastUpdated: string;
  sections: Array<{
    title: string;
    content: string;
  }>;
}

export interface PageContent {
  id: string;
  page_id: string;
  section_id: string;
  content: RoadmapContent | TokenomicsContent | HomeContent | PrivacyContent | TermsContent;
  updated_at: string;
}
