import fs from 'node:fs';
import path from 'node:path';
import type {
  FiveElement,
  HanjaMeaningSense,
  HanjaRecord,
  NormalizedSurnameProfile,
  RepoMetadata,
  SurnameEntry,
} from '../src/types/naming.ts';

const DATA_ROOT = path.resolve(process.cwd(), 'data', 'luckybridge');

function parseCsv(content: string): Array<Record<string, string>> {
  const clean = content.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < clean.length; i += 1) {
    const ch = clean[i];
    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\r') {
      // ignore CR
    } else if (ch === '\n') {
      row.push(field);
      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((cell) => cell.length > 0)) {
      rows.push(row);
    }
  }

  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim());
  const records: Array<Record<string, string>> = [];
  for (let r = 1; r < rows.length; r += 1) {
    const values = rows[r];
    const obj: Record<string, string> = {};
    for (let c = 0; c < headers.length; c += 1) {
      obj[headers[c]] = (values[c] ?? '').trim();
    }
    records.push(obj);
  }
  return records;
}

function readCsvFile(relPath: string): Array<Record<string, string>> {
  const fullPath = path.join(DATA_ROOT, relPath);
  if (!fs.existsSync(fullPath)) return [];
  return parseCsv(fs.readFileSync(fullPath, 'utf8'));
}

function readJsonFile<T>(relPath: string): T {
  const fullPath = path.join(DATA_ROOT, relPath);
  return JSON.parse(fs.readFileSync(fullPath, 'utf8')) as T;
}

// Kangxi radical #1..#214 traditional resource five-element classification (부수 기준 자원오행 참고)
const RADICAL_ELEMENT_MAP: Record<number, FiveElement> = {
  // 목 (Wood): 乙, 人(생명/성장 일부), 木, 竹, 艸, 禾, 米, 瓜, 耒, 糸, 羽, 角, 羊, 虎, 龍...
  5: '목', 24: '목', 29: '목', 45: '목', 65: '목', 75: '목', 88: '목',
  97: '목', 100: '목', 115: '목', 118: '목', 119: '목', 120: '목', 123: '목',
  124: '목', 127: '목', 131: '목', 140: '목', 141: '목', 142: '목', 148: '목',
  152: '목', 153: '목', 165: '목', 177: '목', 178: '목', 194: '목', 198: '목',
  199: '목', 200: '목', 206: '목', 212: '목',

  // 화 (Fire): 日, 火, 心, 目, 光/儿, 巾, 戈, 弓, 丹, 丙, 炎, 赤, 走, 足, 馬, 鳥, 飛, 日, 曰...
  16: '화', 19: '화', 21: '화', 23: '화', 25: '화', 26: '화', 30: '화',
  36: '화', 50: '화', 56: '화', 57: '화', 61: '화', 62: '화', 72: '화',
  73: '화', 86: '화', 94: '화', 99: '화', 108: '화', 109: '화', 110: '화',
  113: '화', 125: '화', 132: '화', 135: '화', 143: '화', 145: '화', 147: '화',
  149: '화', 155: '화', 156: '화', 157: '화', 159: '화', 162: '화', 169: '화',
  175: '화', 180: '화', 183: '화', 187: '화', 196: '화', 202: '화', 203: '화',
  207: '화',

  // 토 (Earth): 一, 土, 士, 大, 女, 子, 宀, 寸, 山, 工, 己, 广, 玉, 瓦, 田, 穴, 石, 示, 邑, 阜, 里, 黃...
  1: '토', 2: '토', 4: '토', 8: '토', 12: '토', 13: '토', 14: '토',
  27: '토', 31: '토', 32: '토', 33: '토', 37: '토', 38: '토', 40: '토',
  41: '토', 44: '토', 46: '토', 48: '토', 49: '토', 52: '토', 53: '토',
  54: '토', 60: '토', 63: '토', 95: '토', 96: '토', 98: '토', 101: '토',
  102: '토', 103: '토', 104: '토', 105: '토', 106: '토', 112: '토', 114: '토',
  116: '토', 121: '토', 128: '토', 129: '토', 130: '토', 133: '토', 134: '토',
  136: '토', 138: '토', 150: '토', 154: '토', 160: '토', 163: '토', 166: '토',
  170: '토', 176: '토', 181: '토', 184: '토', 185: '토', 186: '토', 188: '토',
  189: '토', 197: '토', 201: '토', 208: '토',

  // 금 (Metal): 刀, 力, 匕, 十, 卜, 斤, 金, 辛, 矢, 矛, 玉(일부), 酉, 長, 門, 隹, 音, 齒, 齊...
  6: '금', 9: '금', 10: '금', 18: '금', 20: '금', 22: '금', 28: '금',
  42: '금', 51: '금', 55: '금', 58: '금', 64: '금', 66: '금', 67: '금',
  68: '금', 69: '금', 70: '금', 74: '금', 76: '금', 77: '금', 78: '금',
  79: '금', 87: '금', 89: '금', 90: '금', 91: '금', 92: '금', 93: '금',
  111: '금', 117: '금', 122: '금', 126: '금', 139: '금', 146: '금', 151: '금',
  158: '금', 161: '금', 164: '금', 167: '금', 168: '금', 171: '금', 172: '금',
  174: '금', 179: '금', 190: '금', 191: '금', 192: '금', 193: '금', 210: '금',
  211: '금',

  // 수 (Water): 丶, 二, 亠, 冫, 几, 口(일부), 水, 雨, 魚, 舟, 風, 黑, 龜...
  3: '수', 7: '수', 11: '수', 15: '수', 17: '수', 34: '수', 35: '수',
  39: '수', 43: '수', 47: '수', 59: '수', 71: '수', 80: '수', 81: '수',
  82: '수', 83: '수', 84: '수', 85: '수', 107: '수', 137: '수', 144: '수',
  173: '수', 182: '수', 195: '수', 204: '수', 205: '수', 209: '수',
  213: '수', 214: '수',
};

// Traditional Kangxi radical wonhoek extra-stroke adjustments when abbreviated in left/top position
const RADICAL_WONHOEK_ADJUSTMENTS: Array<{
  radicalNo: number;
  label: string;
  delta: number;
  note: string;
}> = [
  { radicalNo: 85, label: '氵→水', delta: 1, note: '삼수변(3획)을 원획 水(4획)로 산정하는 전통 원획 보정' },
  { radicalNo: 64, label: '扌→手', delta: 1, note: '재방변(3획)을 원획 手(4획)로 산정하는 전통 원획 보정' },
  { radicalNo: 61, label: '忄→心', delta: 1, note: '심방변(3획)을 원획 心(4획)로 산정하는 전통 원획 보정' },
  { radicalNo: 94, label: '犭→犬', delta: 1, note: '개사슴록변(3획)을 원획 犬(4획)로 산정하는 전통 원획 보정' },
  { radicalNo: 96, label: '王→玉', delta: 1, note: '구슬옥변(4획)을 원획 玉(5획)로 산정하는 전통 원획 보정' },
  { radicalNo: 113, label: '礻→示', delta: 1, note: '보일시변(4획)을 원획 示(5획)로 산정하는 전통 원획 보정' },
  { radicalNo: 145, label: '衤→衣', delta: 1, note: '옷의변(5획)을 원획 衣(6획)로 산정하는 전통 원획 보정' },
  { radicalNo: 140, label: '艹→艸', delta: 3, note: '초두머리(3획)를 원획 艸(6획)로 산정하는 전통 원획 보정' },
  { radicalNo: 162, label: '辶→辵', delta: 4, note: '책받침(3획)을 원획 辵(7획)로 산정하는 전통 원획 보정' },
  { radicalNo: 163, label: '阝(우)→邑', delta: 4, note: '우부방(3획)을 원획 邑(7획)으로 산정하는 전통 원획 보정' },
  { radicalNo: 170, label: '阝(좌)→阜', delta: 5, note: '좌부방(3획)을 원획 阜(8획)로 산정하는 전통 원획 보정' },
];

const WONHOEK_DELTA_BY_RADICAL = new Map<number, number>(
  RADICAL_WONHOEK_ADJUSTMENTS.map((item) => [item.radicalNo, item.delta])
);

const TABOO_HANJA_NOTES: Record<string, string> = {
  悲: '전통 작명에서 슬픔의 뜻을 피해 비선호 한자로 분류',
  淚: '눈물 뜻으로 개명·작명 시 피하는 경향',
  病: '질병 의미로 인명 비추천 한자',
  死: '죽음 의미로 인명 비추천 한자',
  貧: '가난 의미로 인명 비추천 한자',
  孤: '고독 의미로 전통 성명학 불용한자 참고',
  獨: '외로울 독으로 전통 성명학 불용한자 참고',
  恨: '한탄 의미로 인명 비추천 한자',
  苦: '괴로울 고로 인명 비추천 한자',
  難: '어려울 난으로 인명 비추천 한자',
  愁: '근심 수로 인명 비추천 한자',
  哀: '슬플 애로 인명 비추천 한자',
  怨: '원망할 원으로 인명 비추천 한자',
  亡: '망할 망으로 인명 비추천 한자',
  敗: '패할 패로 인명 비추천 한자',
  凶: '흉할 흉으로 인명 비추천 한자',
  殺: '죽일 살로 인명 비추천 한자',
  毒: '독 독으로 인명 비추천 한자',
  惡: '악할 악으로 인명 비추천 한자',
  賤: '천할 천으로 인명 비추천 한자',
  愚: '어리석을 우로 인명 비추천 한자',
  虛: '빌 허로 전통 불용한자 참고',
  暗: '어두울 암으로 인명 비추천 한자',
  寒: '찰 한으로 전통 불용한자 참고',
  梅: '전통 불용한자 참고(일부 학파 한정, 현대 선호도 혼재)',
  蘭: '전통 불용한자 참고(일부 학파 한정, 현대는 길상 한자로도 다수 사용)',
  菊: '전통 불용한자 참고(일부 학파 한정)',
  雪: '눈 설(전통 불용한자 참고 vs 현대 어감 선호 혼재)',
  露: '이슬 로(전통 불용한자 참고)',
  霜: '서리 상(전통 불용한자 참고)',
  枝: '가지 지(전통 불용한자 참고)',
  葉: '잎 엽(전통 불용한자 참고)',
  夏: '일부 구학파 불용한자 참고(현대에는 보편적 인명 한자로 널리 사용)',
  秋: '일부 구학파 불용한자 참고(현대에는 보편적 인명 한자로 널리 사용)',
  冬: '일부 구학파 불용한자 참고',
};

// Curated resource element overrides for well-known naming characters where semantic meaning is stronger than radical alone
const SEMANTIC_ELEMENT_OVERRIDES: Record<string, FiveElement> = {
  徐: '토', // 부수 彳 + 여유/서행(또는 금 발음), 참고용
  宇: '토',
  宙: '토',
  安: '토',
  恩: '토',
  允: '토',
  有: '토',
  祐: '토',
  佑: '토',
  均: '토',
  圭: '토',
  坤: '토',
  城: '토',
  基: '토',
  培: '토',
  聖: '토',
  延: '토',
  俊: '화',
  智: '화',
  知: '화',
  夏: '화',
  炫: '화',
  煥: '화',
  熙: '화',
  輝: '화',
  彬: '목',
  林: '목',
  樹: '목',
  秀: '목',
  榮: '목',
  賢: '목',
  建: '목',
  權: '목',
  東: '목',
  松: '목',
  河: '수',
  海: '수',
  潤: '수',
  淳: '수',
  泳: '수',
  泰: '수',
  漢: '수',
  浩: '수',
  洙: '수',
  準: '수',
  敏: '수',
  玟: '토',
  珉: '토',
  瑞: '금',
  珍: '화',
  眞: '금',
  正: '금',
  成: '금',
  承: '금',
  善: '금',
  宣: '금',
  世: '금',
  修: '금',
  現: '토',
  憲: '화',
  赫: '화',
  玄: '수',
  元: '목',
  原: '목',
  源: '수',
  園: '토',
  媛: '화',
  妍: '수',
  演: '수',
  然: '화',
  悅: '화',
  仁: '금',
  忍: '화',
  雅: '목',
  亞: '토',
  兒: '금',
  藝: '목',
  禮: '화',
  叡: '토',
  預: '토',
  羽: '토',
  雨: '수',
  友: '토',
  優: '토',
};

const EXTRA_POPULAR_NAMING_HANJA = [
  '潤', '胤', '律', '溫', '抒', '辰', '晉', '健', '旻', '民',
  '斌', '皓', '昊', '鎬', '峻', '濬', '浚', '勳', '薰', '誠',
  '晟', '星', '貞', '晶', '靜', '廷', '庭', '政', '珠', '柱',
  '周', '志', '芝', '池', '燦', '昌', '暢', '採', '彩', '采',
  '哲', '澈', '淸', '晴', '兌', '澤', '荷', '賀', '翰', '韓',
  '喜', '希', '姬', '惠', '慧', '孝', '曉', '暉', '桓', '晃',
  '永', '英', '映', '詠', '盈', '寧', '裕', '諭', '柔', '悠',
  '兪', '惟', '維', '義', '誼', '怡', '利', '伊', '施', '時',
  '詩', '始', '仙', '璇', '顯', '鉉', '衡', '亨', '炯', '馨',
  '湖', '虎', '好', '和', '華', '禾', '環', '完', '婉', '莞',
  '賓', '盛', '昇', '勝', '丞', '錫', '碩', '序', '舒', '曙',
  '棲', '敍', '晏', '淵', '蓮', '緣', '豫', '悟', '梧', '玉',
  '旺', '容', '勇', '龍', '禹', '遠', '月', '偉', '緯', '儒',
  '銀', '殷', '宜', '印', '一', '逸', '慈', '材', '在', '載',
  '宰', '才', '典', '全', '定', '情', '精', '濟', '兆', '朝',
  '宗', '鍾', '朱', '主', '駿', '振', '鎭', '讚', '贊', '天',
  '川', '初', '忠', '治', '學', '弘', '洪', '花', '歡', '休',
];

export const POPULAR_NAMING_HANJA_SET = new Set<string>([
  ...Object.keys(SEMANTIC_ELEMENT_OVERRIDES),
  ...EXTRA_POPULAR_NAMING_HANJA,
]);

export interface LoadedKnowledgeBase {
  hanjaList: HanjaRecord[];
  hanjaByChar: Map<string, HanjaRecord>;
  hanjaByReading: Map<string, HanjaRecord[]>;
  surnameSeo: SurnameEntry;
  surnames: NormalizedSurnameProfile[];
  surnameByHanja: Map<string, NormalizedSurnameProfile>;
  disambiguationNotes: Array<{
    hangul: string;
    hanjaForms: string[];
    relationType: string;
    notes: string;
  }>;
  datasetStats: Record<string, unknown>;
  pronunciationHeuristics: Array<Record<string, string>>;
  clanHistoryRows: Array<Record<string, string>>;
  yongsinMethods: Array<Record<string, string>>;
  elementRelations: Array<Record<string, string>>;
  tenGodMap: Map<string, string>; // "dayStem|targetStem" -> tenGod
  hiddenStemsMap: Map<string, Array<{ stem: string; hangul: string; element: FiveElement; role: string }>>;
  twelveStagesMap: Map<string, string>; // "stem|branch" -> stage
  stemsInfo: Map<string, { hangul: string; hanja: string; yinYang: '양' | '음'; element: FiveElement }>;
  branchesInfo: Map<string, { hangul: string; hanja: string; yinYang: '양' | '음'; element: FiveElement; zodiac: string }>;
  stemCombos: Array<{ s1: string; s2: string; name: string; element: string }>;
  branchClashes: Array<{ b1: string; b2: string; relation: string }>;
  branchSixCombos: Array<{ b1: string; b2: string; relation: string }>;
  branchThreeCombos: Array<{ b1: string; b2: string; b3: string; element: string }>;
  branchDirectionalCombos: Array<{ b1: string; b2: string; b3: string; element: string }>;
  branchPunishments: Array<{ b1: string; b2: string; b3?: string; label: string }>;
  branchHarms: Array<{ b1: string; b2: string }>;
  branchDestructions: Array<{ b1: string; b2: string }>;
  dstRules: Array<{ fromYear: number; toYear: number; startRule: string; endRule: string; save: string }>;
  stdTimeHistory: Array<{ start: string; end: string; meridian: string; utcOffset: string; notes: string }>;
  kasiTerms2026: Array<{ year: number; term: string; month: number; day: number; hour: number; minute: number }>;
  kasiTerms2027: Array<{ year: number; term: string; month: number; day: number; hour: number; minute: number }>;
}

function parseMeaningMap(raw: string): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  if (!raw) return result;
  const parts = raw.split(' | ');
  for (const part of parts) {
    const idx = part.indexOf(':');
    if (idx === -1) continue;
    const reading = part.slice(0, idx).trim();
    const meanings = part
      .slice(idx + 1)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (reading) {
      result[reading] = meanings;
    }
  }
  return result;
}

let cachedKB: LoadedKnowledgeBase | null = null;

export function getKnowledgeBase(forceReload = false): LoadedKnowledgeBase {
  if (cachedKB && !forceReload) {
    return cachedKB;
  }

  const enrichedRows = readCsvFile('hanja/enriched/hanja-master-enriched.csv');
  const meaningSenseRows = readCsvFile('hanja/semantics/meaning-senses.csv');
  const curatedNamingRows = readCsvFile('hanja/semantics/naming-meaning-curated.csv');
  const concernCuratedRows = readCsvFile('hanja/semantics/sense-concern-curated.csv');

  // Index curated naming glosses & concern notes by (hanja|reading|senseOrder)
  const curatedByKey = new Map<string, Record<string, string>>();
  for (const r of curatedNamingRows) {
    if (r.hanja && r.legal_reading && r.sense_order) {
      curatedByKey.set(`${r.hanja}|${r.legal_reading}|${r.sense_order}`, r);
    }
  }
  const concernByKey = new Map<string, Record<string, string>>();
  for (const r of concernCuratedRows) {
    if (r.hanja && r.reading && r.sense_order) {
      concernByKey.set(`${r.hanja}|${r.reading}|${r.sense_order}`, r);
    }
  }

  // Group all documented meaning senses by (hanja -> reading -> HanjaMeaningSense[])
  const sensesByCharAndReading = new Map<string, Record<string, HanjaMeaningSense[]>>();
  for (const r of meaningSenseRows) {
    const h = r.hanja;
    const rd = r.legal_reading;
    if (!h || !rd || !r.raw_sense) continue;
    const key = `${h}|${rd}|${r.sense_order}`;
    const cur = curatedByKey.get(key);
    const con = concernByKey.get(key);

    const senseObj: HanjaMeaningSense = {
      senseId: r.sense_id || `${r.codepoint}-${rd}-${r.sense_order}`,
      senseOrder: Number(r.sense_order || 1),
      rawSense: r.raw_sense,
      glossCore: r.gloss_core || r.raw_sense,
      ...(cur
        ? {
            senseClass: cur.naming_use_class,
            recommendedForName: cur.primary_name_explanation_allowed === 'true',
            editorialGloss: cur.interpretation_template || undefined,
          }
        : {}),
      ...(con
        ? {
            concernType: con.concern_type,
            concernLevel: con.concern_level,
            concernNote: con.notes || undefined,
          }
        : {}),
    };

    let byReading = sensesByCharAndReading.get(h);
    if (!byReading) {
      byReading = {};
      sensesByCharAndReading.set(h, byReading);
    }
    if (!byReading[rd]) {
      byReading[rd] = [];
    }
    byReading[rd].push(senseObj);
  }
  for (const byReading of sensesByCharAndReading.values()) {
    for (const arr of Object.values(byReading)) {
      arr.sort((a, b) => a.senseOrder - b.senseOrder);
    }
  }

  const hanjaList: HanjaRecord[] = [];
  const hanjaByChar = new Map<string, HanjaRecord>();
  const hanjaByReading = new Map<string, HanjaRecord[]>();

  for (const row of enrichedRows) {
    const hanja = row.hanja;
    if (!hanja) continue;

    const legalReadings = (row.legal_readings || '')
      .split('·')
      .map((s) => s.trim())
      .filter(Boolean);
    const meaningByReading = parseMeaningMap(row.meaning_by_reading || '');
    const firstReading = legalReadings[0] || '';
    const primaryMeaning =
      (firstReading && meaningByReading[firstReading]?.join(', ')) ||
      Object.values(meaningByReading)[0]?.join(', ') ||
      '';

    const kangxiRadicalNo = row.kangxi_radical_no ? Number(row.kangxi_radical_no) : null;
    const residualStrokes = row.residual_strokes ? Number(row.residual_strokes) : null;
    const unihanTotalStrokes = row.unihan_total_strokes ? Number(row.unihan_total_strokes) : null;

    let wonhoekStrokes: number | null = unihanTotalStrokes;
    let wonhoekEstimated = false;
    if (unihanTotalStrokes !== null && kangxiRadicalNo !== null) {
      const delta = WONHOEK_DELTA_BY_RADICAL.get(kangxiRadicalNo) ?? 0;
      if (delta > 0 && residualStrokes !== null) {
        wonhoekStrokes = unihanTotalStrokes + delta;
        wonhoekEstimated = true;
      }
    }

    const semanticOverride = SEMANTIC_ELEMENT_OVERRIDES[hanja];
    const radicalElement =
      kangxiRadicalNo !== null ? RADICAL_ELEMENT_MAP[kangxiRadicalNo] ?? null : null;
    const resourceElement = semanticOverride ?? radicalElement;
    const resourceElementBasis = semanticOverride
      ? '전통 작명 자의·부수 보정 참고값'
      : radicalElement
      ? `강희자전 부수(#${kangxiRadicalNo}) 기준 참고값`
      : '자원오행 미분류';

    const sensesByReading = sensesByCharAndReading.get(hanja);
    const hasSemanticCaution = Boolean(
      sensesByReading &&
        Object.values(sensesByReading).some((arr) =>
          arr.some((s) => Boolean(s.concernLevel) || s.senseClass === 'caution_other_dictionary_sense')
        )
    );

    const record: HanjaRecord = {
      hanja,
      unicode: row.unicode || '',
      codepoint: row.codepoint || '',
      legalReadings,
      meaningByReading,
      ...(sensesByReading ? { sensesByReading } : {}),
      primaryMeaning,
      kangxiRadicalNo,
      residualStrokes,
      unihanTotalStrokes,
      wonhoekStrokes,
      wonhoekEstimated,
      resourceElement,
      resourceElementBasis,
      yinYangWonhoek:
        wonhoekStrokes !== null ? (wonhoekStrokes % 2 === 1 ? '양' : '음') : null,
      yinYangTechnical:
        unihanTotalStrokes !== null ? (unihanTotalStrokes % 2 === 1 ? '양' : '음') : null,
      legalDataStatus: row.legal_data_status || '',
      meaningDataStatus: row.meaning_data_status || '',
      strokeDataStatus: row.stroke_data_status || '',
      finalLegalVerificationRequired: row.final_legal_verification_required === 'YES',
      tabooWarning: TABOO_HANJA_NOTES[hanja] || null,
      hasSemanticCaution,
      isPopularNaming: POPULAR_NAMING_HANJA_SET.has(hanja),
    };

    hanjaList.push(record);
    hanjaByChar.set(hanja, record);
    for (const r of legalReadings) {
      const arr = hanjaByReading.get(r);
      if (arr) {
        arr.push(record);
      } else {
        hanjaByReading.set(r, [record]);
      }
    }
  }

  const surnameSeo = readJsonFile<SurnameEntry>('surnames/entries/徐.json');
  const datasetStats = readJsonFile<Record<string, unknown>>('meta/dataset-stats.json');
  const pronunciationHeuristics = readCsvFile('surnames/pronunciation-heuristics.csv');
  const clanHistoryRows = readCsvFile('surnames/clan-history.csv');
  const surnameCsvRows = readCsvFile('surnames/surnames.csv');
  const pronProfileRows = readCsvFile('surnames/pronunciation-profiles.csv');
  const disambigCsvRows = readCsvFile('surnames/hangul-hanja-disambiguation.csv');

  const ONSET_ELEMENT_MAP: Record<string, FiveElement> = {
    ㄱ: '목', ㄲ: '목', ㅋ: '목',
    ㄴ: '화', ㄷ: '화', ㄸ: '화', ㄹ: '화', ㅌ: '화',
    ㅇ: '토', ㅎ: '토',
    ㅅ: '금', ㅆ: '금', ㅈ: '금', ㅉ: '금', ㅊ: '금',
    ㅁ: '수', ㅂ: '수', ㅃ: '수', ㅍ: '수',
  };

  const pronProfileById = new Map<string, Record<string, string>>();
  for (const r of pronProfileRows) {
    if (r.surname_id) pronProfileById.set(r.surname_id, r);
  }
  const surnameCsvByHanja = new Map<string, Record<string, string>>();
  for (const r of surnameCsvRows) {
    if (r.hanja) surnameCsvByHanja.set(r.hanja, r);
  }

  const disambiguationNotes = disambigCsvRows
    .filter((r) => r.hangul)
    .map((r) => ({
      hangul: r.hangul,
      hanjaForms: (r.hanja_forms || '').split('|').map((s) => s.trim()).filter(Boolean),
      relationType: r.relation_type || '',
      notes: r.notes || '',
    }));

  const entriesDir = path.join(DATA_ROOT, 'surnames', 'entries');
  const surnames: NormalizedSurnameProfile[] = [];
  const surnameByHanja = new Map<string, NormalizedSurnameProfile>();

  if (fs.existsSync(entriesDir)) {
    const entryFiles = fs
      .readdirSync(entriesDir)
      .filter((f) => f.endsWith('.json') && !f.endsWith('-strokes.json'));

    for (const fileName of entryFiles) {
      const raw = JSON.parse(
        fs.readFileSync(path.join(entriesDir, fileName), 'utf8')
      ) as Record<string, unknown>;
      const id = String(raw.surname_id || '');
      const identity = (raw.identity || {}) as Record<string, unknown>;
      const hangul = String(identity.hangul || '');
      const hanja = String(identity.hanja || '');
      if (!hangul || !hanja) continue;

      const charMeta = (raw.character_metadata || {}) as Record<string, unknown>;
      const census = (raw.census_2015 || {}) as Record<string, unknown>;
      const pron = (raw.pronunciation || {}) as Record<string, unknown>;
      const rom = (raw.romanization || {}) as Record<string, unknown>;
      const strokePolicy = (raw.stroke_policy || {}) as Record<string, unknown>;
      const namingPolicy = (raw.naming_policy || {}) as Record<string, string>;
      const verification = (raw.verification || {}) as Record<string, unknown>;

      const csvRow = surnameCsvByHanja.get(hanja);
      const pronCsv = pronProfileById.get(id);
      const hanjaRec = hanjaByChar.get(hanja);

      const dictionaryGloss = Array.isArray(charMeta.dictionary_glosses)
        ? charMeta.dictionary_glosses
            .map((g: unknown) =>
              typeof g === 'object' && g !== null && 'value' in g
                ? String((g as { value: unknown }).value)
                : ''
            )
            .filter(Boolean)
            .join('; ')
        : String(charMeta.dictionary_gloss || csvRow?.dictionary_gloss || '');

      const technicalTotalStrokes = Number(
        charMeta.technical_total_strokes ?? csvRow?.technical_total_strokes ?? hanjaRec?.unihanTotalStrokes ?? 0
      );
      const wonhoekStrokes = hanjaRec?.wonhoekStrokes ?? technicalTotalStrokes;

      const onset = String(pron.onset || pronCsv?.onset || '');
      const soundElement: FiveElement = ONSET_ELEMENT_MAP[onset] ?? '토';
      const resourceElement: FiveElement | null =
        hanjaRec?.resourceElement ?? (hanja === '徐' ? '토' : null);

      const clansSummaryObj = raw.clans_2015_summary as Record<string, unknown> | undefined;
      const clansRaw = Array.isArray(clansSummaryObj?.rows)
        ? clansSummaryObj.rows
        : Array.isArray(raw.clans_2015)
        ? raw.clans_2015
        : Array.isArray(raw.representative_clans_2015)
        ? raw.representative_clans_2015
        : [];
      const clans = clansRaw.map((c: unknown) => {
        const obj = c as Record<string, unknown>;
        const pct =
          obj.share_of_surname_percent !== undefined
            ? Number(obj.share_of_surname_percent)
            : obj.share_percent !== undefined
            ? Number(obj.share_percent)
            : undefined;
        return {
          bongwan: String(obj.bongwan || ''),
          population: Number(obj.population || 0),
          sharePercent: pct !== undefined ? Number(pct.toFixed(1)) : undefined,
          isAggregate: Boolean(obj.is_aggregate),
        };
      });

      const clanHistoryObj = raw.clan_history as Record<string, unknown> | undefined;
      const genealogyRaw = Array.isArray(raw.genealogy_research)
        ? raw.genealogy_research
        : Array.isArray(clanHistoryObj?.verified_or_sourced)
        ? clanHistoryObj.verified_or_sourced
        : [];
      const genealogyNotes = genealogyRaw.map((g: unknown) => {
        const obj = g as Record<string, unknown>;
        const personRaw = obj.person;
        let personStr: string | undefined;
        if (typeof personRaw === 'string') {
          personStr = personRaw;
        } else if (typeof personRaw === 'object' && personRaw !== null) {
          const pObj = personRaw as Record<string, unknown>;
          personStr = [pObj.hangul, pObj.hanja ? `(${pObj.hanja})` : ''].filter(Boolean).join('');
        }
        return {
          bongwan: String(obj.bongwan || ''),
          claim: String(obj.claim || obj.type || ''),
          person: personStr || undefined,
          evidenceLevel: obj.evidence_level ? String(obj.evidence_level) : undefined,
        };
      });

      const rank2015 = Number(
        census.rank ?? census.rank_among_hanja_distinguished_surnames ?? csvRow?.rank_2015 ?? 99
      );
      const profile: NormalizedSurnameProfile = {
        surnameId: id,
        hangul,
        hanja,
        codepoint: String(identity.codepoint || csvRow?.codepoint || ''),
        dictionaryGloss,
        radical: String(charMeta.radical || csvRow?.radical || ''),
        technicalTotalStrokes,
        wonhoekStrokes,
        population2015: Number(census.population ?? csvRow?.population_2015 ?? 0),
        sharePercent2015: Number(census.share_percent ?? csvRow?.population_share_percent_2015 ?? 0),
        rank2015,
        romanizationRuleForm: String(rom.rule_form || csvRow?.romanization_rule_form || ''),
        romanizationNote: String(rom.note || ''),
        syllableShape: String(pron.syllable_shape || pronCsv?.syllable_shape || 'CV') === 'CVC' ? 'CVC' : 'CV',
        onset,
        nucleus: String(pron.nucleus || pronCsv?.nucleus || ''),
        coda: pron.coda ? String(pron.coda) : pronCsv?.coda ? pronCsv.coda : null,
        soundElement,
        resourceElement,
        pronunciationNote: String(pron.note || pronCsv?.notes || ''),
        strokeRule: String(strokePolicy.rule || ''),
        namingPolicy,
        clans,
        genealogyNotes,
        verificationStatus: String(
          verification.identity_status || csvRow?.verification_status || 'verified'
        ),
      };

      surnames.push(profile);
      surnameByHanja.set(hanja, profile);
    }
  }
  surnames.sort((a, b) => a.rank2015 - b.rank2015);
  const yongsinMethods = readCsvFile('myeongri/용신_방법론_카탈로그.csv');
  const elementRelations = readCsvFile('rules/오행_상생상극.csv');

  const tenGodRows = readCsvFile('myeongri/십성_천간100.csv');
  const tenGodMap = new Map<string, string>();
  for (const r of tenGodRows) {
    if (r.day_stem && r.other_stem) {
      tenGodMap.set(`${r.day_stem}|${r.other_stem}`, r.ten_god || '');
    }
  }

  const hiddenRows = readCsvFile('myeongri/지장간.csv');
  const hiddenStemsMap = new Map<
    string,
    Array<{ stem: string; hangul: string; element: FiveElement; role: string }>
  >();
  for (const r of hiddenRows) {
    if (!r.branch) continue;
    const arr = hiddenStemsMap.get(r.branch) || [];
    arr.push({
      stem: r.hidden_stem,
      hangul: r.hidden_stem_hangul,
      element: r.element as FiveElement,
      role: r.role,
    });
    hiddenStemsMap.set(r.branch, arr);
  }

  const stageRows = readCsvFile('myeongri/십이운성_화토동궁.csv');
  const twelveStagesMap = new Map<string, string>();
  for (const r of stageRows) {
    if (r.day_stem && r.branch) {
      twelveStagesMap.set(`${r.day_stem}|${r.branch}`, r.twelve_stage || '');
    }
  }

  const stemsRows = readCsvFile('myeongri/천간.csv');
  const stemsInfo = new Map<
    string,
    { hangul: string; hanja: string; yinYang: '양' | '음'; element: FiveElement }
  >();
  for (const r of stemsRows) {
    stemsInfo.set(r.hanja, {
      hangul: r.hangul,
      hanja: r.hanja,
      yinYang: r.yin_yang as '양' | '음',
      element: r.element as FiveElement,
    });
  }

  const branchesRows = readCsvFile('myeongri/지지.csv');
  const branchesInfo = new Map<
    string,
    { hangul: string; hanja: string; yinYang: '양' | '음'; element: FiveElement; zodiac: string }
  >();
  for (const r of branchesRows) {
    branchesInfo.set(r.hanja, {
      hangul: r.hangul,
      hanja: r.hanja,
      yinYang: r.yin_yang as '양' | '음',
      element: r.element as FiveElement,
      zodiac: r.zodiac,
    });
  }

  const stemCombos = readCsvFile('myeongri/천간합.csv').map((r) => ({
    s1: r.stem1,
    s2: r.stem2,
    name: r.name,
    element: r.traditional_transform_element,
  }));

  const branchClashes = readCsvFile('myeongri/지지충.csv').map((r) => ({
    b1: r.branch1,
    b2: r.branch2,
    relation: r.relation,
  }));

  const branchSixCombos = readCsvFile('myeongri/지지육합.csv').map((r) => ({
    b1: r.branch1,
    b2: r.branch2,
    relation: r.relation,
  }));

  const branchThreeCombos = readCsvFile('myeongri/지지삼합.csv').map((r) => ({
    b1: r.branch1,
    b2: r.branch2,
    b3: r.branch3,
    element: r.result_element,
  }));

  const branchDirectionalCombos = readCsvFile('myeongri/지지방합.csv').map((r) => ({
    b1: r.branch1,
    b2: r.branch2,
    b3: r.branch3,
    element: r.result_element,
  }));

  const branchPunishments = readCsvFile('myeongri/지지형.csv').map((r) => ({
    b1: r.branch1,
    b2: r.branch2,
    b3: r.branch3 || undefined,
    label: r.traditional_label,
  }));

  const branchHarms = readCsvFile('myeongri/지지해.csv').map((r) => ({
    b1: r.branch1,
    b2: r.branch2,
  }));

  const branchDestructions = readCsvFile('myeongri/지지파.csv').map((r) => ({
    b1: r.branch1,
    b2: r.branch2,
  }));

  const dstRules = readCsvFile('time/대한민국_DST_rules.csv').map((r) => ({
    fromYear: Number(r.from_year),
    toYear: Number(r.to_year),
    startRule: r.start_rule,
    endRule: r.end_rule,
    save: r.save,
  }));

  const stdTimeHistory = readCsvFile('time/대한민국_표준시_역사.csv').map((r) => ({
    start: r.start,
    end: r.end,
    meridian: r.standard_meridian,
    utcOffset: r.utc_offset,
    notes: r.notes,
  }));

  const kasiTerms2026 = readCsvFile('time/2026_24절기_KASI.csv').map((r) => ({
    year: Number(r.year),
    term: r.term,
    month: Number(r.month),
    day: Number(r.day),
    hour: Number(r.hour),
    minute: Number(r.minute),
  }));

  const kasiTerms2027 = readCsvFile('time/2027_24절기_KASI.csv').map((r) => ({
    year: Number(r.year),
    term: r.term,
    month: Number(r.month),
    day: Number(r.day),
    hour: Number(r.hour),
    minute: Number(r.minute),
  }));

  cachedKB = {
    hanjaList,
    hanjaByChar,
    hanjaByReading,
    surnameSeo,
    surnames,
    surnameByHanja,
    disambiguationNotes,
    datasetStats,
    pronunciationHeuristics,
    clanHistoryRows,
    yongsinMethods,
    elementRelations,
    tenGodMap,
    hiddenStemsMap,
    twelveStagesMap,
    stemsInfo,
    branchesInfo,
    stemCombos,
    branchClashes,
    branchSixCombos,
    branchThreeCombos,
    branchDirectionalCombos,
    branchPunishments,
    branchHarms,
    branchDestructions,
    dstRules,
    stdTimeHistory,
    kasiTerms2026,
    kasiTerms2027,
  };

  return cachedKB;
}

export function getRepoMetadata(): RepoMetadata {
  const kb = getKnowledgeBase();
  return {
    datasetStats: kb.datasetStats,
    surnameSeo: kb.surnameSeo,
    surnames: kb.surnames,
    disambiguationNotes: kb.disambiguationNotes,
    pronunciationHeuristics: kb.pronunciationHeuristics,
    clanHistoryRows: kb.clanHistoryRows,
    yongsinMethods: kb.yongsinMethods,
    elementRelations: kb.elementRelations,
    hanjaCount: kb.hanjaList.length,
    readingCount: kb.hanjaByReading.size,
  };
}

export function applyCustomHanjaOverrides(overrides: Array<Partial<HanjaRecord> & { hanja: string }>) {
  const kb = getKnowledgeBase();
  let updated = 0;
  for (const item of overrides) {
    const existing = kb.hanjaByChar.get(item.hanja);
    if (existing) {
      if (item.wonhoekStrokes !== undefined) {
        existing.wonhoekStrokes = item.wonhoekStrokes;
        existing.wonhoekEstimated = false;
        existing.yinYangWonhoek =
          item.wonhoekStrokes !== null ? (item.wonhoekStrokes % 2 === 1 ? '양' : '음') : null;
      }
      if (item.resourceElement !== undefined) {
        existing.resourceElement = item.resourceElement;
        existing.resourceElementBasis = item.resourceElementBasis || '사용자 동기화 규칙';
      }
      if (item.primaryMeaning) {
        existing.primaryMeaning = item.primaryMeaning;
      }
      if (item.tabooWarning !== undefined) {
        existing.tabooWarning = item.tabooWarning;
      }
      updated += 1;
    }
  }
  return updated;
}
