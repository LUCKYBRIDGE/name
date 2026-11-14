import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { GoogleGenAI } from '@google/genai';
import {
  applyCustomHanjaOverrides,
  getKnowledgeBase,
  getRepoMetadata,
} from './server/dataLoader.ts';
import { analyzeSaju } from './server/sajuEngine.ts';
import { evaluateName, recommendNamesWithMeta } from './server/namingEngine.ts';
import type {
  BirthInput,
  FiveElement,
  HanjaRecord,
  NameCandidateRequest,
  NameEvaluation,
  SajuAnalysisResult,
  StrokeMethodId,
} from './src/types/naming.ts';

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  // Warm up LUCKYBRIDGE/name dataset in memory
  const kb = getKnowledgeBase();
  console.log(
    `[knowledge-base] Loaded ${kb.hanjaList.length} legal Hanja (${kb.hanjaByReading.size} readings) & Surname ${kb.surnameSeo.identity.hanja}`
  );

  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/meta', (_req, res) => {
    res.json(getRepoMetadata());
  });

  app.get('/api/hanja/search', (req, res) => {
    const reading = String(req.query.reading || '').trim();
    const query = String(req.query.q || '').trim();
    const element = String(req.query.element || '').trim() as FiveElement | '';
    const maxStrokes = req.query.maxStrokes ? Number(req.query.maxStrokes) : 40;
    const excludeTaboo = req.query.excludeTaboo === 'true';
    const popularOnly = req.query.popularOnly === 'true';
    const limit = Math.min(Number(req.query.limit) || 60, 200);

    let pool: HanjaRecord[] = [];
    if (reading) {
      pool = kb.hanjaByReading.get(reading) || [];
    } else if (query) {
      pool = kb.hanjaList;
    } else {
      pool = kb.hanjaList.filter((h) => Boolean(h.primaryMeaning));
    }

    const filtered = pool.filter((item) => {
      if (excludeTaboo && item.tabooWarning) return false;
      if (popularOnly && !item.isPopularNaming) return false;
      if (element && item.resourceElement !== element) return false;
      const strokes = item.wonhoekStrokes ?? item.unihanTotalStrokes ?? 0;
      if (strokes > maxStrokes) return false;
      if (query) {
        const matchChar = item.hanja.includes(query);
        const matchReading = item.legalReadings.some((r) => r.includes(query));
        const matchMeaning = item.primaryMeaning.includes(query);
        const matchAllMeanings = Object.values(item.meaningByReading).some((arr) =>
          arr.some((m) => m.includes(query))
        );
        if (!matchChar && !matchReading && !matchMeaning && !matchAllMeanings) return false;
      }
      return true;
    });

    // Prefer popular everyday naming Hanja, verified meanings, exact matches, and practical stroke counts
    const sorted = [...filtered].sort((a, b) => {
      const aExactChar = query && a.hanja === query ? 1 : 0;
      const bExactChar = query && b.hanja === query ? 1 : 0;
      if (aExactChar !== bExactChar) return bExactChar - aExactChar;

      const aPop = a.isPopularNaming ? 1 : 0;
      const bPop = b.isPopularNaming ? 1 : 0;
      if (aPop !== bPop) return bPop - aPop;

      const aHasMeaning = a.primaryMeaning ? 1 : 0;
      const bHasMeaning = b.primaryMeaning ? 1 : 0;
      if (aHasMeaning !== bHasMeaning) return bHasMeaning - aHasMeaning;

      if (query) {
        const aExactRead = a.legalReadings.includes(query) ? 1 : 0;
        const bExactRead = b.legalReadings.includes(query) ? 1 : 0;
        if (aExactRead !== bExactRead) return bExactRead - aExactRead;
      }

      const aS = a.wonhoekStrokes ?? a.unihanTotalStrokes ?? 99;
      const bS = b.wonhoekStrokes ?? b.unihanTotalStrokes ?? 99;
      return aS - bS;
    });

    res.json({
      total: sorted.length,
      items: sorted.slice(0, limit),
    });
  });

  app.post('/api/saju/analyze', (req, res) => {
    try {
      const input = req.body as BirthInput;
      const result = analyzeSaju(input);
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : '사주 계산 중 오류가 발생했습니다.';
      res.status(400).json({ error: message });
    }
  });

  app.post('/api/naming/evaluate', (req, res) => {
    try {
      const body = req.body as {
        surnameHangul?: string;
        surnameHanja?: string;
        surnameStrokeOverride: number | null;
        strokeMethod: StrokeMethodId;
        hangul1: string;
        hanja1: string;
        hangul2: string;
        hanja2: string;
        saju?: SajuAnalysisResult | null;
      };
      const result = evaluateName(body);
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : '이름 감정 중 오류가 발생했습니다.';
      res.status(400).json({ error: message });
    }
  });

  app.post('/api/naming/recommend', (req, res) => {
    try {
      const body = req.body as {
        request: NameCandidateRequest;
        saju?: SajuAnalysisResult | null;
      };
      const result = recommendNamesWithMeta(body.request, body.saju);
      res.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : '이름 후보 추천 중 오류가 발생했습니다.';
      res.status(400).json({ error: message });
    }
  });

  app.post('/api/repo/sync', async (req, res) => {
    try {
      const body = req.body as {
        mode: 'github' | 'custom_overrides';
        overrides?: Array<Partial<HanjaRecord> & { hanja: string }>;
      };

      if (body.mode === 'custom_overrides' && Array.isArray(body.overrides)) {
        const updatedCount = applyCustomHanjaOverrides(body.overrides);
        res.json({
          ok: true,
          message: `사용자 규칙 ${updatedCount}건을 메모리에 반영했습니다.`,
          meta: getRepoMetadata(),
        });
        return;
      }

      // Live refresh key metadata files from public LUCKYBRIDGE/name GitHub repo
      const filesToSync = [
        {
          url: 'https://raw.githubusercontent.com/LUCKYBRIDGE/name/main/data/surnames/entries/%E5%BE%90.json',
          dest: 'surnames/entries/徐.json',
        },
        {
          url: 'https://raw.githubusercontent.com/LUCKYBRIDGE/name/main/data/surnames/surnames.csv',
          dest: 'surnames/surnames.csv',
        },
        {
          url: 'https://raw.githubusercontent.com/LUCKYBRIDGE/name/main/data/surnames/pronunciation-profiles.csv',
          dest: 'surnames/pronunciation-profiles.csv',
        },
        {
          url: 'https://raw.githubusercontent.com/LUCKYBRIDGE/name/main/data/surnames/hangul-hanja-disambiguation.csv',
          dest: 'surnames/hangul-hanja-disambiguation.csv',
        },
        {
          url: 'https://raw.githubusercontent.com/LUCKYBRIDGE/name/main/data/meta/dataset-stats.json',
          dest: 'meta/dataset-stats.json',
        },
        {
          url: 'https://raw.githubusercontent.com/LUCKYBRIDGE/name/main/data/surnames/pronunciation-heuristics.csv',
          dest: 'surnames/pronunciation-heuristics.csv',
        },
        {
          url: 'https://raw.githubusercontent.com/LUCKYBRIDGE/name/main/data/surnames/clans-core-2015.csv',
          dest: 'surnames/clans-core-2015.csv',
        },
        {
          url: 'https://raw.githubusercontent.com/LUCKYBRIDGE/name/main/data/hanja/semantics/naming-meaning-curated.csv',
          dest: 'hanja/semantics/naming-meaning-curated.csv',
        },
        {
          url: 'https://raw.githubusercontent.com/LUCKYBRIDGE/name/main/data/hanja/semantics/sense-concern-curated.csv',
          dest: 'hanja/semantics/sense-concern-curated.csv',
        },
        {
          url: 'https://raw.githubusercontent.com/LUCKYBRIDGE/name/main/data/time/2026_24%EC%A0%88%EA%B8%B0_KASI.csv',
          dest: 'time/2026_24절기_KASI.csv',
        },
        {
          url: 'https://raw.githubusercontent.com/LUCKYBRIDGE/name/main/data/time/2027_24%EC%A0%88%EA%B8%B0_KASI.csv',
          dest: 'time/2027_24절기_KASI.csv',
        },
      ];

      let synced = 0;
      for (const f of filesToSync) {
        const resp = await fetch(f.url);
        if (resp.ok) {
          const text = await resp.text();
          const target = path.resolve(process.cwd(), 'data', 'luckybridge', f.dest);
          fs.mkdirSync(path.dirname(target), { recursive: true });
          fs.writeFileSync(target, text, 'utf8');
          synced += 1;
        }
      }

      getKnowledgeBase(true);
      res.json({
        ok: true,
        message: `GitHub LUCKYBRIDGE/name 저장소에서 ${synced}개 핵심 기준 파일을 최신화했습니다.`,
        meta: getRepoMetadata(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '저장소 동기화 중 오류가 발생했습니다.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/naming/interpret', async (req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(400).json({
        error: 'GEMINI_API_KEY가 설정되어 있지 않습니다. Settings > Secrets 패널에서 API 키를 확인해 주세요.',
      });
      return;
    }

    try {
      const {
        appMode,
        saju,
        currentName,
        candidateName,
        customNotes,
        reasonForRenaming,
      } = req.body as {
        appMode?: 'analyze' | 'naming';
        saju: SajuAnalysisResult | null;
        currentName: NameEvaluation | null;
        candidateName: NameEvaluation;
        customNotes?: string;
        reasonForRenaming?: string;
      };

      const surnameChar = candidateName.characters?.[0];
      const surnameProfile = surnameChar?.hanja
        ? kb.surnameByHanja.get(surnameChar.hanja)
        : undefined;

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const isNewNaming = appMode === 'naming';
      const systemInstruction = `당신은 'LUCKYBRIDGE/name' 저장소의 정통 성명학·데이터 원칙을 따르며, 전문 용어를 누구나 이해하기 쉬운 일상 한국어로 풀어 설명하는 성명학 전문 상담가입니다.
반드시 다음 원칙을 지키세요:
1. '확인된 사실'(발음, 사전적 뜻, 제공된 획수/법적 미러 상태)과 '전통 성명학 해석'(81수리, 음양오행, 용신 보완)과 '미확인/추가 확인 사항'(대법원 최종 조회 필요, 학파별 차이)을 명확히 분리하여 서술합니다.
2. '원격·형격·이격·정격', '용신', '발음오행', '자원오행', '음양' 같은 전문 용어를 쓸 때마다 괄호나 바로 다음 문장으로 일상적인 쉬운 뜻(예: 초년운, 균형을 잡아주는 기운, 부를 때의 소리 흐름 등)을 꼭 풀어서 설명하세요.
3. 성씨('${surnameChar?.hangul || ''}(${surnameChar?.hanja || ''})')의 사전적 훈을 이름자의 길흉이나 부정적 의미 점수로 감점하지 않습니다.
4. 서로 다른 학파(원획법/필획법, 억부/조후, 발음오행 초성법/정음법)를 하나의 단순 점수로 합산하지 마세요.
5. 제공된 계산 수치(획수, 81수리, 오행)를 절대 임의로 바꾸지 말고 그대로 인용하세요.
6. 한자의 여러 사전 뜻(다중 의미)을 다룰 때는 현재 이름의 독음에 해당하는 뜻만 다루며, 긍정적 작명 의도뿐 아니라 같은 독음 내 주의·비추천 사전 뜻이 있다면 숨기지 않고 투명하게 안내하되 글자를 무조건 배제하지 마세요.
7. 출생 시각이 미입력(3주) 상태이거나 출생 전 후보 탐색인 경우 시주 확정을 유보하고 출생 후 최종 확정 절차를 안내하며, 의료적 사유보다 사주를 우선해 출산 일정을 조정하도록 권하지 마세요.
8. 과장된 미신적 단정('무조건 대박', '운명이 바뀐다')을 피하고, 따뜻하고 명확한 어조로 안내하세요.`;

      const promptPayload = {
        mode: isNewNaming ? '새 이름 작명 (2026 기준)' : '내 이름 사주분석 및 개명 검토',
        reasonForRenaming:
          reasonForRenaming ||
          (isNewNaming
            ? '신생아·새 이름 작명 및 사주 오행 균형 맞춤'
            : '전반적인 사주 보완 및 개명 검토'),
        surnameInfo: surnameProfile
          ? {
              hangul: surnameProfile.hangul,
              hanja: surnameProfile.hanja,
              dictionaryGloss: surnameProfile.dictionaryGloss,
              syllableShape: surnameProfile.syllableShape,
              pronunciationNote: surnameProfile.pronunciationNote,
              namingPolicy: surnameProfile.namingPolicy,
            }
          : {
              hangul: surnameChar?.hangul || '',
              hanja: surnameChar?.hanja || '',
              policy: kb.surnameSeo.naming_policy,
            },
        sajuSummary: saju
          ? {
              solarDate: saju.solarDateLabel,
              lunarDate: saju.lunarDateLabel,
              pillarCount: saju.pillars.length,
              pillars: saju.pillars.map((p) => `${p.label}:${p.stem}${p.branch}(${p.stemElement}/${p.branchElement})`),
              dayMaster: saju.dayMaster,
              elementCounts: saju.elementCounts,
              missingElements: saju.missingElements,
              dayMasterStrength: saju.dayMasterStrength,
              eokbuYongsinCandidates: saju.eokbuYongsinCandidates,
              johuNote: saju.johuNote,
            }
          : '사주 정보 미입력',
        currentName: currentName
          ? {
              hangul: currentName.fullHangul,
              hanja: currentName.fullHanja,
              numerologyGrids: currentName.numerology.grids.map((g) => `${g.name}:${g.reduced81}(${g.grade})`),
              yinYang: currentName.yinYangPattern.labels,
              pronunciation: currentName.pronunciationElements.harmonyLabel,
              resourceElements: currentName.resourceAlignment.elements,
            }
          : '비교 기준 이름 미입력',
        candidateName: {
          hangul: candidateName.fullHangul,
          hanja: candidateName.fullHanja,
          romanized: candidateName.romanized,
          characters: candidateName.characters.map((c) => ({
            role: c.role,
            hangul: c.hangul,
            hanja: c.hanja,
            meaning: c.meaning,
            editorialMeaningGloss: c.editorialMeaningGloss,
            semanticNotice: c.semanticNotice,
            readingSenses: c.readingSenses?.map((s) => `${s.senseOrder}.${s.rawSense}`),
            strokesUsed: c.strokesUsed,
            soundElement: c.soundElement,
            resourceElement: c.resourceElement,
          })),
          numerologyGrids: candidateName.numerology.grids.map((g) => `${g.name}:${g.reduced81}(${g.title}, ${g.grade})`),
          yinYang: candidateName.yinYangPattern.labels,
          pronunciation: candidateName.pronunciationElements.harmonyLabel,
          resourceAlignment: candidateName.resourceAlignment,
          usabilityNotes: candidateName.usability.notes,
        },
        userCustomNotes: customNotes || '',
      };

      const section3Title = isNewNaming
        ? '[3. 사주 보완 및 성명학 4격·음양·소리 분석]'
        : '[3. 기존 이름과 비교한 성명학 변화 (수리·음양·소리·사주 보완)]';

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `다음 데이터를 바탕으로 성명학에 익숙하지 않은 분도 단번에 이해할 수 있도록 쉽고 친절한 문장으로 아래 순서에 맞춰 해설해 주세요.
[1. 한눈에 보는 핵심 요약 (3줄)]
[2. 확인된 사실과 분석 기준]
${section3Title}
[4. 한자 뜻·실생활 어감 및 부르기 편함]
[5. 학파별 유의점 및 신고 전 최종 확인 사항]

${JSON.stringify(promptPayload, null, 2)}`,
        config: {
          systemInstruction,
        },
      });

      res.json({
        interpretation: response.text || '해설을 생성하지 못했습니다.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI 해설 생성 중 오류가 발생했습니다.';
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
