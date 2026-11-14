export type FiveElement = '목' | '화' | '토' | '금' | '수';
export type YinYang = '양' | '음';
export type StrokeMethodId = 'wonhoek_kangxi' | 'unihan_technical';
export type ZiHourMethod = 'midnight' | 'late_zi';
export type LuckGrade = '대길' | '길' | '반길반흉' | '흉';
export type AppMode = 'analyze' | 'naming';

export interface HanjaMeaningSense {
  senseId: string;
  senseOrder: number;
  rawSense: string;
  glossCore: string;
  senseClass?: string;
  recommendedForName?: boolean;
  editorialGloss?: string;
  concernType?: string;
  concernLevel?: string;
  concernNote?: string;
}

export interface HanjaRecord {
  hanja: string;
  unicode: string;
  codepoint: string;
  legalReadings: string[];
  meaningByReading: Record<string, string[]>;
  sensesByReading?: Record<string, HanjaMeaningSense[]>;
  primaryMeaning: string;
  kangxiRadicalNo: number | null;
  residualStrokes: number | null;
  unihanTotalStrokes: number | null;
  wonhoekStrokes: number | null;
  wonhoekEstimated: boolean;
  resourceElement: FiveElement | null;
  resourceElementBasis: string;
  yinYangWonhoek: YinYang | null;
  yinYangTechnical: YinYang | null;
  legalDataStatus: string;
  meaningDataStatus: string;
  strokeDataStatus: string;
  finalLegalVerificationRequired: boolean;
  tabooWarning: string | null;
  hasSemanticCaution?: boolean;
  isPopularNaming?: boolean;
}

export interface SurnameEntry {
  surname_id: string;
  identity: {
    hangul: string;
    hanja: string;
    unicode_hex: string;
    codepoint: string;
    reading: string;
    role: string;
  };
  character_metadata: {
    dictionary_glosses: Array<{ value: string; source_id: string }>;
    radical: string;
    technical_total_strokes: number;
    technical_stroke_note: string;
    sources: string[];
  };
  census_2015: {
    reference_date: string;
    population: number;
    male: number;
    female: number;
    share_percent: number;
    rank_among_hanja_distinguished_surnames: number;
  };
  clans_2015: Array<{
    bongwan: string;
    population: number;
    male: number;
    female: number;
    share_percent: number;
    is_aggregate?: boolean;
  }>;
  romanization: {
    rule_form: string;
    note: string;
  };
  naming_policy: Record<string, string>;
  pronunciation: {
    syllable: string;
    onset: string;
    nucleus: string;
    coda: string | null;
    syllable_shape: string;
    boundary_profile: string;
    note: string;
  };
  stroke_policy: {
    technical_reference_count: number;
    numerology_default_count: number | null;
    rule: string;
  };
  clan_history: {
    verified_or_sourced: Array<{
      bongwan: string;
      type: string;
      person?: string;
      hanja?: string;
      source_ids: string[];
    }>;
    note: string;
  };
}

export interface NormalizedSurnameProfile {
  surnameId: string;
  hangul: string;
  hanja: string;
  codepoint: string;
  dictionaryGloss: string;
  radical: string;
  technicalTotalStrokes: number;
  wonhoekStrokes: number;
  population2015: number;
  sharePercent2015: number;
  rank2015: number;
  romanizationRuleForm: string;
  romanizationNote: string;
  syllableShape: 'CV' | 'CVC';
  onset: string;
  nucleus: string;
  coda: string | null;
  soundElement: FiveElement;
  resourceElement: FiveElement | null;
  pronunciationNote: string;
  strokeRule: string;
  namingPolicy: Record<string, string>;
  clans: Array<{
    bongwan: string;
    population: number;
    sharePercent?: number;
    isAggregate?: boolean;
  }>;
  genealogyNotes: Array<{
    bongwan: string;
    claim: string;
    person?: string;
    evidenceLevel?: string;
  }>;
  verificationStatus: string;
}

export interface RepoMetadata {
  datasetStats: Record<string, unknown>;
  surnameSeo: SurnameEntry;
  surnames: NormalizedSurnameProfile[];
  disambiguationNotes: Array<{
    hangul: string;
    hanjaForms: string[];
    relationType: string;
    notes: string;
  }>;
  pronunciationHeuristics: Array<Record<string, string>>;
  clanHistoryRows: Array<Record<string, string>>;
  yongsinMethods: Array<Record<string, string>>;
  elementRelations: Array<Record<string, string>>;
  hanjaCount: number;
  readingCount: number;
}

export interface BirthInput {
  calendarType: 'solar' | 'lunar';
  isLeapMonth: boolean;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  timeUnknown: boolean;
  gender: 'male' | 'female' | 'unspecified';
  useTrueSolarTime: boolean;
  longitudeOffsetMinutes: number; // -32 for Seoul 127.0E vs 135E
  ziHourMethod: ZiHourMethod;
  birthplace: string;
}

export interface SajuPillar {
  label: string; // 년주, 월주, 일주, 시주
  stem: string;
  stemHangul: string;
  stemElement: FiveElement;
  stemYinYang: YinYang;
  stemTenGod: string;
  branch: string;
  branchHangul: string;
  branchElement: FiveElement;
  branchYinYang: YinYang;
  branchTenGod: string;
  hiddenStems: Array<{
    stem: string;
    hangul: string;
    element: FiveElement;
    role: string;
    tenGod: string;
  }>;
  twelveStage: string;
}

export interface SajuAnalysisResult {
  normalizedIsoLocal: string;
  historicalTimeNote: string;
  utcOffsetApplied: string;
  dstApplied: boolean;
  trueSolarTimeApplied: boolean;
  adjustedTimeLabel: string;
  solarDateLabel: string;
  lunarDateLabel: string;
  pillars: SajuPillar[];
  dayMaster: {
    stem: string;
    hangul: string;
    element: FiveElement;
    yinYang: YinYang;
  };
  elementCounts: Record<FiveElement, number>;
  hiddenWeightedCounts: Record<FiveElement, number>;
  missingElements: FiveElement[];
  excessElements: FiveElement[];
  dayMasterStrength: '신강' | '중화' | '신약';
  strengthNote: string;
  eokbuYongsinCandidates: FiveElement[];
  johuNote: string;
  interactions: string[];
  boundaryWarnings: string[];
  alternateBoundaryNote: string | null;
}

export interface NumerologyGrid {
  key: 'won' | 'hyeong' | 'i' | 'jeong';
  name: string;
  period: string;
  formula: string;
  value: number;
  reduced81: number;
  title: string;
  grade: LuckGrade;
  summary: string;
}

export interface NameCharacterEvaluation {
  role: 'surname' | 'given1' | 'given2';
  hangul: string;
  hanja: string;
  meaning: string;
  strokesUsed: number | null;
  unihanStrokes: number | null;
  wonhoekStrokes: number | null;
  wonhoekEstimated: boolean;
  yinYang: YinYang | null;
  soundElement: FiveElement | null;
  resourceElement: FiveElement | null;
  legalReadings: string[];
  readingSenses?: HanjaMeaningSense[];
  editorialMeaningGloss?: string | null;
  semanticNotice?: string | null;
  semanticRiskLevel?: 'none' | 'low' | 'medium' | 'high';
  tabooWarning: string | null;
  radicalNo: number | null;
}

export interface NameEvaluation {
  fullHangul: string;
  fullHanja: string;
  givenHangul: string;
  givenHanja: string;
  romanized: string;
  strokeMethod: StrokeMethodId;
  surnameStrokeOverride: number | null;
  characters: NameCharacterEvaluation[];
  numerology: {
    available: boolean;
    unavailableReason: string | null;
    grids: NumerologyGrid[];
    goodCount: number;
  };
  yinYangPattern: {
    labels: string;
    isBalanced: boolean;
    note: string;
  };
  pronunciationElements: {
    elements: Array<FiveElement | null>;
    relations: Array<{ from: FiveElement; to: FiveElement; relation: '상생' | '비화' | '상극' }>;
    harmonyLabel: string;
    note: string;
  };
  resourceAlignment: {
    elements: Array<FiveElement | null>;
    matchesYongsin: boolean;
    matchedElements: FiveElement[];
    note: string;
  };
  usability: {
    syllableRepetitionFlag: boolean;
    boundaryAssimilationNote: string;
    legalStatusLabel: string;
    tabooWarnings: string[];
    totalStrokeLoad: number | null;
    notes: string[];
  };
}

export interface NameCandidateRequest {
  surnameHangul?: string;
  surnameHanja?: string;
  hangul1?: string;
  hangul2?: string;
  fixedHanja1?: string;
  fixedHanja2?: string;
  preferredHangul?: string[];
  preferredHanja?: string[];
  targetElements: FiveElement[];
  strokeMethod: StrokeMethodId;
  surnameStrokeCount: number | null;
  requireAllFourGood: boolean;
  requireSoundHarmony: boolean;
  maxStrokesPerChar: number;
  excludeTaboo: boolean;
  avoidSurnameRepetition: boolean;
  limit: number;
}

export interface NameRecommendResponse {
  items: NameEvaluation[];
  relaxedNotice?: string | null;
  resolvedPatternLabel?: string;
}

export type StudioTab = 'saju' | 'studio' | 'compare' | 'hanja' | 'sync';

export interface SavedWorkspaceProfile {
  schemaVersion: 'luckybridge-workspace-v2';
  id: string;
  title: string;
  savedAt: string;
  appMode: AppMode;
  activeTab: StudioTab;
  surname: {
    hangul: string;
    hanja: string;
    strokeOverride: number | null;
  };
  strokeMethod: StrokeMethodId;
  birthInput: BirthInput;
  sajuResult: SajuAnalysisResult | null;
  currentName: {
    hangul1: string;
    hanja1: string;
    hangul2: string;
    hanja2: string;
  };
  namingConfig: {
    studioMode: 'recommend' | 'manual';
    targetElements: FiveElement[];
    recHangul1: string;
    recHangul2: string;
    recFixedHanja1: string;
    recFixedHanja2: string;
    preferredInput: string;
    manHangul1: string;
    manHanja1: string;
    manHangul2: string;
    manHanja2: string;
    requireAllFourGood: boolean;
    requireSoundHarmony: boolean;
    excludeTaboo: boolean;
    avoidSurnameRepetition: boolean;
    maxStrokesPerChar: number;
  };
  selectedCandidate: NameEvaluation | null;
  savedCandidates: NameEvaluation[];
  reasonForAnalysis: string;
  customNotes: string;
}
