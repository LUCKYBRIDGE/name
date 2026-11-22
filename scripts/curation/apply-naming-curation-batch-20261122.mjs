import fs from "node:fs";
import { parseCsv, toCsv } from "../build/lib/csv.mjs";

const root=new URL("../../", import.meta.url);
const senses=parseCsv(fs.readFileSync(new URL("data/hanja/semantics/meaning-senses.csv",root),"utf8")).rows;
const targetUrl=new URL("data/hanja/semantics/naming-meaning-curated.csv",root);
const parsed=parseCsv(fs.readFileSync(targetUrl,"utf8"));
const existing=parsed.rows;
const keys=new Set(existing.map(r=>`${r.hanja}|${r.legal_reading}|${r.sense_order}`));

const D=[
["玟","민","옥돌 민","preferred_name_sense","옥돌처럼 귀하고 단단한 가치를 지닌 사람이라는 방향으로 풀 수 있음"],
["珉","민","아름다운돌 민","preferred_name_sense","아름다운 돌이라는 뜻을 중심으로 귀하고 아름다운 가치를 지닌 사람이라는 방향으로 풀 수 있음"],
["珉","민","옥돌 민","preferred_name_sense","옥돌처럼 귀하고 단단한 가치를 지닌 사람이라는 방향으로 풀 수 있음"],
["眞","진","참 진","preferred_name_sense","참되고 진실한 사람이라는 방향으로 풀 수 있음"],
["正","정","바를 정","preferred_name_sense","바르고 곧은 기준을 지닌 사람이라는 방향으로 풀 수 있음"],
["正","정","분별할 정","usable_name_sense","옳고 그름을 분별하는 사람이라는 방향으로 풀 수 있음"],
["成","성","이룰 성","preferred_name_sense","뜻한 바를 이루어 가는 사람이라는 방향으로 풀 수 있음"],
["成","성","화목할 성","preferred_name_sense","사람들과 화목하게 어울리는 삶을 바라는 방향으로 풀 수 있음"],
["承","승","받들 승","usable_name_sense","소중한 뜻과 가치를 받들어 이어 가는 사람이라는 방향으로 풀 수 있음"],
["承","승","이을 승","preferred_name_sense","좋은 뜻과 가치를 이어 가는 사람이라는 방향으로 풀 수 있음"],
["承","승","도울 승","preferred_name_sense","다른 이를 돕고 함께하는 사람이라는 방향으로 풀 수 있음"],
["善","선","착할 선","preferred_name_sense","착하고 선한 품성을 지닌 사람이라는 방향으로 풀 수 있음"],
["宣","선","베풀 선","preferred_name_sense","좋은 뜻을 널리 베푸는 사람이라는 방향으로 풀 수 있음"],
["世","세","세상 세","usable_name_sense","세상과 더불어 살아가는 사람이라는 방향으로 풀 수 있음"],
["修","수","닦을 수","preferred_name_sense","자신을 꾸준히 닦고 성장하는 사람이라는 방향으로 풀 수 있음"],
["修","수","옳게할 수","preferred_name_sense","바르고 옳게 행하는 사람이라는 방향으로 풀 수 있음"],
["修","수","정리할 수","usable_name_sense","일과 생각을 잘 정돈하는 사람이라는 방향으로 풀 수 있음"],
["現","현","나타날 현","usable_name_sense","자신의 좋은 역량과 뜻을 드러내는 사람이라는 방향으로 풀 수 있음"],
["現","현","옥빛 현","preferred_name_sense","옥빛처럼 맑고 귀한 모습을 바라는 방향으로 풀 수 있음"],
["憲","헌","법 헌","usable_name_sense","원칙과 기준을 소중히 여기는 사람이라는 방향으로 풀 수 있음"],
["憲","헌","표준될 헌","preferred_name_sense","바른 기준이 되는 사람이라는 방향으로 풀 수 있음"],
["憲","헌","기뻐할 헌","preferred_name_sense","기쁨을 알고 나누는 사람이라는 방향으로 풀 수 있음"],
["赫","혁","빛날 혁","preferred_name_sense","밝게 빛나는 재능과 모습을 펼치기를 바라는 방향으로 풀 수 있음"],
["赫","혁","성할 혁","preferred_name_sense","힘차고 번성하는 모습을 바라는 방향으로 풀 수 있음"],
["赫","혁","밝을 혁","preferred_name_sense","밝고 환한 사람이라는 방향으로 풀 수 있음"],
["玄","현","하늘 현","usable_name_sense","하늘이라는 뜻을 중심으로 넓고 깊은 마음을 바라는 방향으로 풀 수 있음"],
["玄","현","고요할 현","preferred_name_sense","고요하고 침착한 마음을 지닌 사람이라는 방향으로 풀 수 있음"],
["元","원","으뜸 원","preferred_name_sense","으뜸이 되는 역량과 품성을 지향하는 방향으로 풀 수 있음"],
["元","원","착하고 어질 원","preferred_name_sense","착하고 어진 품성을 지닌 사람이라는 방향으로 풀 수 있음"],
["原","원","근본 원","preferred_name_sense","근본과 바탕을 소중히 여기는 사람이라는 방향으로 풀 수 있음"],
["源","원","근원 원","preferred_name_sense","좋은 가치의 근원이 되는 사람이라는 방향으로 풀 수 있음"],
["源","원","샘 원","usable_name_sense","샘처럼 맑고 끊임없이 솟아나는 힘을 바라는 방향으로 풀 수 있음"],
["源","원","계속할 원","preferred_name_sense","좋은 뜻을 꾸준히 이어 가는 사람이라는 방향으로 풀 수 있음"],
["園","원","동산 원","usable_name_sense","동산이라는 뜻을 중심으로 평온하고 넉넉한 공간의 이미지를 담는 방향으로 풀 수 있음"],
["媛","원","아리따운 여자 원","preferred_name_sense","아름답고 단정한 모습을 바라는 방향으로 풀 수 있음"],
["演","연","펼칠 연","preferred_name_sense","재능과 뜻을 널리 펼치는 사람이라는 방향으로 풀 수 있음"],
["演","연","통할 연","preferred_name_sense","사람과 뜻이 잘 통하는 사람이라는 방향으로 풀 수 있음"],
["演","연","윤택할 연","preferred_name_sense","삶을 윤택하게 가꾸는 사람이라는 방향으로 풀 수 있음"],
["演","연","넓힐 연","preferred_name_sense","배움과 가능성을 넓혀 가는 사람이라는 방향으로 풀 수 있음"],
["然","연","그러할 연","usable_name_sense","있는 그대로의 이치와 자연스러움을 담는 방향으로 풀 수 있음"],
["然","연","허락할 연","usable_name_sense","받아들이고 허락하는 뜻을 중심으로 포용의 의미를 담는 방향으로 풀 수 있음"],
["悅","열","즐거울 열","preferred_name_sense","즐거움을 알고 나누는 사람이라는 방향으로 풀 수 있음"],
["悅","열","기뻐할 열","preferred_name_sense","기쁨이 함께하는 삶을 바라는 방향으로 풀 수 있음"],
["仁","인","어질 인","preferred_name_sense","어진 마음으로 사람을 대하는 사람이라는 방향으로 풀 수 있음"],
["雅","아","아담할 아","preferred_name_sense","단정하고 품위 있는 모습을 바라는 방향으로 풀 수 있음"],
["藝","예","재주 예","preferred_name_sense","재능과 기예를 잘 펼치는 사람이라는 방향으로 풀 수 있음"],
["藝","예","극진할 예","preferred_name_sense","일과 사람을 극진히 대하는 마음을 바라는 방향으로 풀 수 있음"],
["藝","예","심을 예","usable_name_sense","좋은 뜻과 재능을 심고 가꾸는 사람이라는 방향으로 풀 수 있음"],
["禮","례","예도 례","preferred_name_sense","예의를 알고 바르게 행동하는 사람이라는 방향으로 풀 수 있음"],
["禮","예","예도 례","preferred_name_sense","예의를 알고 바르게 행동하는 사람이라는 방향으로 풀 수 있음"],
["禮","예","인사 례","usable_name_sense","사람을 공손히 대하고 예를 갖추는 사람이라는 방향으로 풀 수 있음"],
["叡","예","밝을 예","preferred_name_sense","밝은 지혜와 판단력을 지닌 사람이라는 방향으로 풀 수 있음"],
["叡","예","어질 예","preferred_name_sense","어진 품성을 지닌 사람이라는 방향으로 풀 수 있음"],
["羽","우","깃 우","usable_name_sense","깃이라는 뜻을 중심으로 가볍고 자유롭게 뜻을 펼치는 모습을 바라는 방향으로 풀 수 있음"],
["雨","우","비 우","usable_name_sense","비라는 뜻을 중심으로 생명과 세상을 적시는 이미지를 담는 방향으로 풀 수 있음"],
["友","우","벗 우","preferred_name_sense","좋은 벗이 되고 사람들과 우정을 나누는 사람이라는 방향으로 풀 수 있음"],
["友","우","합할 우","preferred_name_sense","사람들과 잘 어울리고 화합하는 사람이라는 방향으로 풀 수 있음"],
["胤","윤","이을 윤","preferred_name_sense","좋은 뜻과 가치를 이어 가는 사람이라는 방향으로 풀 수 있음"],
["胤","윤","익힐 윤","usable_name_sense","배움과 능력을 꾸준히 익히는 사람이라는 방향으로 풀 수 있음"],
["律","률","법 률","preferred_name_sense","원칙과 질서를 지키는 사람이라는 방향으로 풀 수 있음"],
["律","율","법 률","preferred_name_sense","원칙과 질서를 지키는 사람이라는 방향으로 풀 수 있음"],
["律","율","지을 률","usable_name_sense","질서 있게 만들고 세워 가는 사람이라는 방향으로 풀 수 있음"],
["溫","온","따뜻할 온","preferred_name_sense","따뜻한 마음을 지닌 사람이라는 방향으로 풀 수 있음"],
["溫","온","부드러울 온","preferred_name_sense","부드럽고 온화한 품성을 지닌 사람이라는 방향으로 풀 수 있음"],
["辰","신","날 신","usable_name_sense","날과 때의 뜻을 중심으로 소중한 시간을 살아가는 의미를 담는 방향으로 풀 수 있음"],
["辰","진","날 진","usable_name_sense","날과 때의 뜻을 중심으로 소중한 시간을 살아가는 의미를 담는 방향으로 풀 수 있음"],
["健","건","굳셀 건","preferred_name_sense","굳세고 건강한 힘을 지닌 사람이라는 방향으로 풀 수 있음"],
["健","건","병 없을 건","preferred_name_sense","건강하고 평안한 삶을 바라는 방향으로 풀 수 있음"],
["旻","민","하늘 민","preferred_name_sense","하늘처럼 넓은 마음을 바라는 방향으로 풀 수 있음"],
["旻","민","가을하늘 민","preferred_name_sense","맑은 가을하늘처럼 맑고 넓은 모습을 바라는 방향으로 풀 수 있음"],
["民","민","백성 민","usable_name_sense","사람들과 더불어 살아가는 마음을 담는 방향으로 풀 수 있음"],
["斌","빈","빛날 빈","preferred_name_sense","밝게 빛나는 재능과 모습을 펼치기를 바라는 방향으로 풀 수 있음"],
["斌","빈","문채날 빈","preferred_name_sense","문채와 재능이 돋보이는 사람이라는 방향으로 풀 수 있음"],
["皓","호","흴 호","usable_name_sense","흰빛의 맑고 깨끗한 이미지를 담는 방향으로 풀 수 있음"],
["皓","호","깨끗할 호","preferred_name_sense","깨끗하고 맑은 품성을 지닌 사람이라는 방향으로 풀 수 있음"],
["昊","호","하늘 호","preferred_name_sense","하늘처럼 넓고 큰 마음을 바라는 방향으로 풀 수 있음"],
["昊","호","큰 모양 호","preferred_name_sense","크고 넉넉한 기상을 지닌 사람이라는 방향으로 풀 수 있음"],
["昊","호","여름하늘 호","usable_name_sense","여름하늘처럼 밝고 넓은 모습을 바라는 방향으로 풀 수 있음"],
["峻","준","높을 준","preferred_name_sense","높은 뜻과 기준을 지향하는 사람이라는 방향으로 풀 수 있음"],
["濬","준","깊을 준","preferred_name_sense","생각과 배움이 깊은 사람이라는 방향으로 풀 수 있음"],
["浚","준","깊을 준","preferred_name_sense","생각과 배움이 깊은 사람이라는 방향으로 풀 수 있음"],
["勳","훈","공 훈","preferred_name_sense","좋은 공과 성취를 이루는 사람이라는 방향으로 풀 수 있음"],
["薰","훈","향풀 훈","usable_name_sense","향풀의 향기로운 이미지를 중심으로 좋은 향기를 남기는 사람이라는 방향으로 풀 수 있음"],
["誠","성","미쁠 성","preferred_name_sense","믿음직하고 성실한 사람이라는 방향으로 풀 수 있음"],
["誠","성","공경할 성","preferred_name_sense","사람을 공경하는 마음을 지닌 사람이라는 방향으로 풀 수 있음"],
["誠","성","살필 성","usable_name_sense","일과 사람을 세심하게 살피는 사람이라는 방향으로 풀 수 있음"],
["誠","성","진실 성","preferred_name_sense","진실하고 정직한 사람이라는 방향으로 풀 수 있음"],
["誠","성","정성 성","preferred_name_sense","정성을 다하는 사람이라는 방향으로 풀 수 있음"],
["晟","성","밝을 성","preferred_name_sense","밝고 환한 사람이라는 방향으로 풀 수 있음"],
["晟","성","햇살 퍼질 성","preferred_name_sense","햇살처럼 밝은 기운을 널리 펼치는 사람이라는 방향으로 풀 수 있음"],
["星","성","별 성","preferred_name_sense","별처럼 빛나는 꿈과 재능을 지닌 사람이라는 방향으로 풀 수 있음"],
["貞","정","곧을 정","preferred_name_sense","곧고 바른 마음을 지닌 사람이라는 방향으로 풀 수 있음"],
["貞","정","굳을 정","preferred_name_sense","굳은 뜻과 신념을 지닌 사람이라는 방향으로 풀 수 있음"],
["晶","정","수정 정","usable_name_sense","수정처럼 맑고 투명한 이미지를 담는 방향으로 풀 수 있음"],
["晶","정","맑을 정","preferred_name_sense","맑고 깨끗한 마음을 지닌 사람이라는 방향으로 풀 수 있음"],
["晶","정","빛날 정","preferred_name_sense","밝게 빛나는 모습을 바라는 방향으로 풀 수 있음"],
["靜","정","고요할 정","preferred_name_sense","고요하고 침착한 마음을 지닌 사람이라는 방향으로 풀 수 있음"],
["靜","정","조용할 정","preferred_name_sense","차분하고 안정된 품성을 지닌 사람이라는 방향으로 풀 수 있음"],
["靜","정","쉴 정","usable_name_sense","쉼과 여유를 알고 균형 있게 살아가는 사람이라는 방향으로 풀 수 있음"],
["靜","정","편안할 정","preferred_name_sense","편안하고 평온한 삶을 바라는 방향으로 풀 수 있음"],
["廷","정","바를 정","preferred_name_sense","바르고 곧은 기준을 지닌 사람이라는 방향으로 풀 수 있음"],
["廷","정","곧을 정","preferred_name_sense","곧은 뜻을 지닌 사람이라는 방향으로 풀 수 있음"],
["庭","정","뜰 정","usable_name_sense","뜰처럼 편안하고 열린 공간의 이미지를 담는 방향으로 풀 수 있음"],
["庭","정","곧을 정","preferred_name_sense","곧고 바른 품성을 지닌 사람이라는 방향으로 풀 수 있음"]
];

const rows=[...existing];
for(const [hanja,reading,raw,useClass,interpretation] of D){
  const match=senses.filter(s=>s.hanja===hanja && s.legal_reading===reading && s.raw_sense===raw);
  if(match.length!==1) throw new Error(`sense lookup mismatch: ${hanja}/${reading}/${raw} -> ${match.length}`);
  const s=match[0];
  const key=`${hanja}|${reading}|${s.sense_order}`;
  if(keys.has(key)) continue;
  rows.push({
    hanja,
    unicode:String(s.codepoint||"").replace(/^U\+/,""),
    legal_reading:reading,
    sense_order:s.sense_order,
    raw_sense:raw,
    naming_use_class:useClass,
    primary_name_explanation_allowed:"true",
    interpretation_template:interpretation,
    interpretation_status:"editorial_paraphrase_from_documented_sense",
    dictionary_source_id:s.meaning_source_id,
    notes:"문서화된 의미를 바탕으로 한 편집 작명 해석"
  });
  keys.add(key);
}
fs.writeFileSync(targetUrl,toCsv(parsed.header,rows),"utf8");
console.log(`curation batch applied: +${rows.length-existing.length} rows, total ${rows.length}`);
