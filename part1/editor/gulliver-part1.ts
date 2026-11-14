/**
 * ガリヴァー旅行記 第1部（リリパット）の人物・世界・地図を、Editor Platform のネイティブ資料として組み立てる。
 *
 * 作るもの
 * - 人物表（Structured Data）: 人物ごとの欲求・傷・口調・関係・初登場・変えない外見。関係の列は relation 型で、
 *   Playground の Data projection「グラフ」で相関図として見られる。
 * - 世界の覚え書き（Document）: 世界の決まり、世界線と時計、世界間の移送、場所 LO-01..LO-11。
 * - 世界設定（Structured Data, Story Timeline tl1）: 時計 CL-1 と世界線 WL-A。
 * - 筋の台帳（Structured Data, Story Timeline tl1）: 第1部の出来事 EV と、人物の参加・在場。
 * - 構成図（Structured Data, Story Timeline tl1）: 提示位置はまだ無い（脚本の工程で作る）。
 * - 第1部の地図（Fiction Map）: GV1 の「リリパットとブレフスキュ」版 1 に、場所 LO と道 RT を付けたもの。
 * - 固有名詞と表記の辞書（Structured Data）: TE-01..TE-17。
 * - 物語ボード（Whiteboard）と表示条件（Structured Data）: 人物の時系列・地図・出来事カードを一枚に並べる。
 *
 * editor-platform の作業ツリーで apps/artifact-host/src/creative/story-board/ に置いて使う（demo 用、commit しない）。
 */
import { contentHash, type Artifact } from '@editor-platform/artifact-core';
import {
  createWhiteboard,
  makeWhiteboardNode,
  type WhiteboardContent,
} from '@editor-platform/whiteboard/model';
import { validateFictionMap, type FictionMapContent } from '@editor-platform/fiction-map/model';
import { createDocument, type DocumentBlock } from '@editor-platform/document/model';
import type { StructuredData } from '@editor-platform/structured-data/model';
import { buildF0Sample } from '../timeline/sample';
import { readWorkspaceLinks, type CreativeWorkspaceLinksV2 } from '../workspace/model';
import {
  createBoardSettingsData,
  boardIndividualKey,
  type BoardSettings,
  type BoardFilter,
} from './settings';

const stamp = '2026-11-14T00:00:00.000Z';
const P = 'gm1-';
export const GULLIVER_PART1_SETTINGS = `${P}board-settings`;

async function native(kind: string, id: string, name: string, content: unknown) {
  const versionId = 'part1-v1';
  const artifact: Artifact<unknown> = {
    schemaVersion: 1,
    id,
    name,
    kind,
    provenance: { source: 'created' },
    draft: { baseVersionId: versionId, updatedAt: stamp, content: structuredClone(content) },
    versions: [
      {
        artifactId: id,
        versionId,
        parentVersionId: null,
        schemaVersion: 1,
        createdAt: stamp,
        createdBy: null,
        reason: 'ガリヴァー旅行記 第1部の設定（fiction-manga@1.1.0 人物・世界と舞台）',
        content,
        contentHash: await contentHash(content),
      },
    ],
  };
  return artifact;
}

// ---------------------------------------------------------------- 人物表と相関図
type Ch = {
  id: string;
  name: string;
  desire: string;
  wound: string;
  voice: string;
  relations: string;
  first: string;
  look: string;
  change?: string;
  rel?: Partial<Record<(typeof relationColumns)[number]['id'], string>>;
};
const relationColumns = [
  { id: 'rel.serve', name: '仕える' },
  { id: 'rel.ally', name: '味方する' },
  { id: 'rel.enemy', name: '敵対する' },
  { id: 'rel.grudge', name: '恨む' },
  { id: 'rel.judge', name: '処遇を決める' },
  { id: 'rel.rescue', name: '救う' },
  { id: 'rel.spouse', name: '夫婦' },
] as const;
const people: Ch[] = [
  {
    id: 'CH-01',
    name: 'レミュエル・ガリヴァー',
    desire: '世界を見たい。家族を養う稼ぎを得たい（本文）',
    wound: '師匠ベイツの死後、医者の商売が傾き、やむなく航海に出た（本文）',
    voice: '丁寧で几帳面な手記の語り。数字と寸法を必ず言う（創作）',
    relations: '皇帝に仕える。レルドレサルと友。フリムナップとボルゴラムに憎まれる',
    first: '1話、難破と浜',
    look: '1,750 mm、青い上着（金の縁取りなし・真鍮のボタン）、茶の半ズボン、白い靴下、黒い靴（AR-06）',
    change: '皇帝の重用から弾劾へ。最後はブレフスキュへ逃れ、英国の家族のもとへ帰る',
    rel: { 'rel.serve': 'CH-02', 'rel.spouse': 'CH-10' },
  },
  {
    id: 'CH-02',
    name: 'リリパット皇帝',
    desire: 'ブレフスキュを属州にし、世界でただ一人の君主になる（本文）',
    wound: '大きな客人を持ちながら、思いどおりには使えない（推定）',
    voice: '儀礼的で尊大。宣告の文体（創作）',
    relations: 'ガリヴァーを重用し、後に処罰を決める',
    first: '1話、運搬機の後',
    look: '廷臣より爪の幅ほど背が高い。鷲鼻、オリーブ色の肌、金の兜と羽根の兜、剣（本文、色は創作）',
    change: '艦隊の功でガリヴァーを重用するが、ブレフスキュを滅ぼすことを断られてから遠ざけ、弾劾で失明の刑を決める',
    rel: { 'rel.judge': 'CH-01' },
  },
  {
    id: 'CH-03',
    name: '皇后',
    desire: '王宮と自分の居所を守る（推定）',
    wound: '自分の居室の火事を尿で消された（本文）',
    voice: '短く冷たい（創作）',
    relations: '火事の後、ガリヴァーを恨む',
    first: '2話、宮廷',
    look: '小柄、重い衣装（創作）',
    change: '火事の前は無関係。火事の後、居室を二度と使わないと誓い、ガリヴァーを恨む',
    rel: { 'rel.grudge': 'CH-01' },
  },
  {
    id: 'CH-04',
    name: 'フリムナップ（大蔵大臣）',
    desire: '国庫と自分の地位を守る（本文）',
    wound: '妻とガリヴァーの噂に嫉妬する（本文）',
    voice: '冷ややかな勘定の言葉（創作）',
    relations: 'ガリヴァーの敵。弾劾に加わる',
    first: '2話、綱渡り',
    look: '綱渡りが一番上手（本文）。痩せた長身（創作）',
    change: '最初から敵。噂への嫉妬で、弾劾に加わる',
    rel: { 'rel.enemy': 'CH-01', 'rel.serve': 'CH-02' },
  },
  {
    id: 'CH-05',
    name: 'レルドレサル（内廷の首席秘書官）',
    desire: '皇帝とガリヴァーの両方に忠実でいたい（推定）',
    wound: '友の両目を潰す案を「慈悲」として出す（本文）',
    voice: '穏やかで理屈を重ねる（創作）',
    relations: 'ガリヴァーの友。教会の対立と戦争を説く',
    first: '3話、戦争の説明',
    look: '細い目、穏やかな顔（創作）',
    change: '友として戦争の事情を説くが、弾劾では死罪の代わりに失明を出す',
    rel: { 'rel.ally': 'CH-01', 'rel.serve': 'CH-02' },
  },
  {
    id: 'CH-06',
    name: 'スカイレッシュ・ボルゴラム（海軍大将）',
    desire: '自分の武功を守る（推定）',
    wound: '艦隊を引いた手柄を外国人に奪われた（推定）',
    voice: '不機嫌で粗い（創作）',
    relations: 'ガリヴァーの一番の敵。弾劾を主導',
    first: '2話、解放の条件',
    look: '陰気な顔つき（本文）。太い体（創作）',
    change: '解放の条件の時から敵意を持ち、艦隊の後に弾劾を主導する',
    rel: { 'rel.enemy': 'CH-01', 'rel.serve': 'CH-02' },
  },
  {
    id: 'CH-07',
    name: 'ブレフスキュ皇帝',
    desire: '和平と、ガリヴァーを自国に引き留めること（推定）',
    wound: '艦隊を奪われた（本文）',
    voice: '寛大で落ち着いている（創作）',
    relations: 'ガリヴァーを迎え、引き渡しを断る',
    first: '4話、和平の使節',
    look: 'CH-02と見分けられるよう、丸い顔と銀の冠（創作）',
    change: '艦隊を奪われた敵国の君主から、ガリヴァーを迎え入れて帰国を助ける人へ',
    rel: { 'rel.rescue': 'CH-01' },
  },
  {
    id: 'CH-08',
    name: '宮廷の有力者（名は本文に無い）',
    desire: '恩を返す（本文）',
    wound: '密告が知れれば命が危ない（推定）',
    voice: '小声で急ぐ（創作）',
    relations: '夜に輿で来て、弾劾状を知らせる',
    first: '5話、夜の訪問',
    look: '頭巾で顔を隠す（創作）',
    change: '恩人として、弾劾の内容を前もって知らせる',
    rel: { 'rel.ally': 'CH-01' },
  },
  {
    id: 'CH-09',
    name: 'ジョン・ビドル船長',
    desire: '航海を終える（推定）',
    wound: 'なし',
    voice: '礼儀正しい（本文「a very civil man」）',
    relations: 'ガリヴァーを拾い、小さな牛を見て信じる',
    first: '6話、帰りの船',
    look: '中年の船乗り（創作）',
    change: '漂流者を拾い、小さな牛と羊を見てガリヴァーの話を信じる',
    rel: { 'rel.rescue': 'CH-01' },
  },
  {
    id: 'CH-10',
    name: 'メアリー（妻、旧姓バートン）',
    desire: '家族の暮らしを保つ（推定）',
    wound: '夫が航海に出続ける（推定）',
    voice: '短く実際的（創作）',
    relations: 'ガリヴァーの妻',
    first: '1話、出航の前',
    look: '地味な家着と前掛け（創作）',
    change: '出航で別れ、帰国で再会する（第1部では変わらない）',
    rel: { 'rel.spouse': 'CH-01' },
  },
];

function characterSheet(): StructuredData {
  return {
    schemaVersion: 2,
    columns: [
      { id: 'ch.name', name: '名前', type: 'text', required: true },
      { id: 'ch.desire', name: '欲求', type: 'text' },
      { id: 'ch.wound', name: '傷', type: 'text' },
      { id: 'ch.voice', name: '口調', type: 'text' },
      { id: 'ch.relations', name: '他の人物との関係', type: 'text' },
      { id: 'ch.first', name: '初めて出る場面', type: 'text' },
      { id: 'ch.look', name: '変えない外見', type: 'text' },
      { id: 'ch.change', name: '関係の変わり方', type: 'text' },
      ...relationColumns.map((c) => ({ ...c, type: 'relation' as const })),
    ],
    rows: people.map((p) => ({
      id: p.id,
      values: {
        'ch.name': p.name,
        'ch.desire': p.desire,
        'ch.wound': p.wound,
        'ch.voice': p.voice,
        'ch.relations': p.relations,
        'ch.first': p.first,
        'ch.look': p.look,
        'ch.change': p.change ?? '',
        ...Object.fromEntries(relationColumns.map((c) => [c.id, p.rel?.[c.id] ?? null])),
      },
    })),
  };
}

// ---------------------------------------------------------------- 世界の覚え書きと場所
type Place = {
  id: string;
  name: string;
  feature: string;
  description: string;
  history?: string;
};
const places: Place[] = [
  {
    id: 'LO-01',
    name: '泳ぎ着いた浜',
    feature: 'shore',
    description:
      '南西岸の浜（位置は作者の選択）。ここから内陸へ約半 mile 歩いて眠った（第1章）。1話：難破して泳ぎ着く。',
  },
  {
    id: 'LO-02',
    name: '縛られて目覚めた草地',
    feature: 'woke',
    description:
      '首都から約半 mile（本文）。短く柔らかい草。1話：縛られて目覚め、言葉の通じない交渉をする。',
  },
  {
    id: 'LO-03',
    name: '古い神殿（ガリヴァーの宿）',
    feature: 'temple',
    description:
      '西門の外 200 yards（門の向きは創作）。大門は高さ 4 feet・幅 2 feet 弱で北向き。1〜5話：鎖につながれて暮らす。',
    history:
      '国で最大の神殿だったが、殺人があって汚れたとされ、使われなくなっていた（第1章）。ガリヴァーの解放後も住まい。',
  },
  {
    id: 'LO-04',
    name: 'ミルデンドウ（首都）',
    feature: 'mildendo',
    description:
      '一辺 500 feet（152.4 m）の正方形の城壁、十字の大通り（本文）。詳しくは GV1 の地図「ミルデンドウ」。2話：城壁をまたいで入る。',
  },
  {
    id: 'LO-05',
    name: '王宮',
    feature: 'palace',
    description: '都の中心、外庭は 40 feet 四方（本文）。2話：内庭を覗く。4話：火事。',
    history:
      '火事の前：皇后の居室がある。EV-12（皇后の居室の火事）の後：居室の一角が焼け、皇后は二度と使わないと誓う。',
  },
  {
    id: 'LO-06',
    name: '北東岸の小山',
    feature: 'hillock',
    description: '海峡を望む小山（本文）。3話：望遠鏡で敵の艦隊を見る。',
  },
  {
    id: 'LO-07',
    name: '海峡',
    feature: 'channel-mid',
    description:
      '幅 800 yards（731.5 m）、中央の深さは満潮で約 6 feet（本文）。3話：艦隊を引いて歩いて渡る。',
  },
  {
    id: 'LO-08',
    name: 'ブレフスキュの艦隊の停泊地',
    feature: 'fleet',
    description: '軍艦約 50 隻と輸送船（本文）。3話：50 本の綱と鉤で引く。',
    history: 'EV-10（艦隊を引く）の前：艦隊が停泊。後：軍艦はリリパットの王の港へ移る。',
  },
  {
    id: 'LO-09',
    name: 'リリパットの王の港',
    feature: 'lilliput-port',
    description: '北東岸（位置は創作）。3話：凱旋。',
  },
  {
    id: 'LO-10',
    name: 'ブレフスキュ（首都）',
    feature: 'blefuscu-city',
    description: '国と同じ名の首都（位置は創作）。5話：亡命。6話：寛大な皇帝。',
  },
  {
    id: 'LO-11',
    name: '流れ着いたボート',
    feature: 'boat',
    description:
      'ブレフスキュ北東岸の沖約半 league（本文）。6話：帰る船を得る。',
    history: 'EV-15 で見つかり、EV-16 で浜へ曳かれて、もうここには無い。',
  },
];

function worldNotes() {
  const blocks: DocumentBlock[] = [];
  let n = 0;
  const id = () => `wn-${String(++n).padStart(3, '0')}`;
  const h = (level: number, text: string) =>
    blocks.push({ ...createDocument().blocks[0], id: id(), type: 'heading', level, text });
  const p = (text: string) =>
    blocks.push({ ...createDocument().blocks[1], id: id(), type: 'paragraph', text });
  h(1, '第1部 リリパット 世界の覚え書き');
  p(
    '典拠は Project Gutenberg #829 の英語原文（第1篇第1〜8章）。各項目に「本文」「推定」「創作」を付け、本文に無いものは創作と分かるようにする。',
  );
  h(2, '世界の決まり');
  p(
    '成り立つこと：リリパットとブレフスキュでは、人も木も動物も建物も、われわれのおよそ 1/12。住人の身長は 6 inches 弱（約 146 mm）（第1篇第1・6章）。',
  );
  p(
    '成り立つこと：ガリヴァーの食べる量は住人 1,724 人分と数学者が計算した（第1篇第3章。12 の 3 乗の 1,728 とは 4 違うが、本文の数をそのまま使う）。食事・寝床・服はこの比で描く。',
  );
  p(
    '成り立たないこと：魔法も不思議もない。大きさだけが違う世界。宮廷の綱渡り、靴のかかとの高さの党派、卵の割り方の宗派は風刺として真面目に描く（TH-02）。',
  );
  p(
    '本文に無い形（島の輪郭、建物の細部、服の色）は創作。創作は GV1 の地図と GV3 の CAD/BIM に固定してあり、それに従う。',
  );
  h(2, '世界線と時計');
  p(
    '世界線は WL-A「本文の世界」一つだけ。親の世界は無く、分岐も無い。継承する出来事の集合も無い。',
  );
  p(
    '時計は CL-1「ユリウス暦（英国の当時の暦、旧暦）。1699年5月4日（ブリストル出航）を 0 日」一つだけ。整数の相対日で数える。1700年はユリウス暦では閏年で、2月29日がある。別の時計は無いので、時計間の整数日の差も無い。',
  );
  p(
    '本文の日付と相対日：1699-05-04 出航 = 0 日。1699-11-05 難破 = 185 日。1701-09-24 ブレフスキュから出帆 = 874 日。1701-09-26 ビドル船長の船に拾われる = 876 日。1702-04-13 ダウンズ着 = 1,075 日。',
  );
  p(
    '本文の矛盾：第6章は「リリパットに 9 か月と 13 日いた」と言う（1700-08-18 = 472 日まで）。一方、第8章はブレフスキュで「約 1 か月」準備して 1701-09-24 に出帆した（到着は約 840 日）。両方を満たす日付は無い。台帳ではリリパットを出た日を 472〜840 日の範囲に置き、確定しない。',
  );
  p(
    'リリパットの暦（「皇帝の治世の 89 番目の月」「91 番目の月」）は時計として使わない。台詞にだけ出す。',
  );
  h(2, '世界間の移送');
  p(
    '第1部では世界をまたぐ移送は無い（世界線が一つ）。英国へ持ち帰る物は物語の要で、次の個体と出来事で記録する：小さな黒い牛 6 頭・雌牛 2 頭（うち雌は子を持つ）・羊 6 頭・雄羊 2 頭を、EV-16（出帆）で LO-10 から積み、EV-18（ダウンズ着）で英国へ。羊の 1 頭はネズミに殺される（第8章）。',
  );
  h(1, '場所');
  p('LO の番号は人物表・地図・台帳で共通。地図の地物は「第1部の地図」の版 1 を引く。');
  for (const place of places) {
    h(2, `${place.id} ${place.name}`);
    h(3, '説明');
    p(place.description);
    if (place.history) {
      h(3, '歴史');
      p(place.history);
    }
  }
  return { ...createDocument(), blocks };
}

// ---------------------------------------------------------------- 地図
export function part1Map(lilliput: FictionMapContent): FictionMapContent {
  const base = structuredClone(lilliput) as FictionMapContent & {
    features: Record<string, unknown>[];
  };
  const loName = new Map(places.map((p) => [p.feature, `${p.id} ${p.name}`]));
  const features = base.features
    .filter((f) => f.id !== 'engine-route' && f.id !== 'fleet-route')
    .map((f) => {
      const name = loName.get(f.id as string);
      return name ? { ...f, name } : f;
    });
  const point = (id: string, name: string, coordinates: [number, number], description: string) => ({
    id,
    layerId: 'places',
    featureKind: 'place',
    geometry: { type: 'point', coordinates },
    name,
    description,
    category: '創作',
    style: { color: '#7a3b2e', lineWidth: 1, label: true },
  });
  features.push(
    point('palace', 'LO-05 王宮', [4508.1, 4008.1], '第1篇第4章：二本の大通りが交わる都の中心。'),
    point(
      'channel-mid',
      'LO-07 海峡',
      [7932, 7432],
      '第1篇第5章：幅 800 yards。艦隊を引いて渡った所の目印（点の位置は作者の選択）。',
    ),
  );
  const routes: [string, string, string, [number, number][], string][] = [
    ['RT-01', '浜から草地へ歩いた道', 'LO-01 → LO-02', [[3370.1, 2870.1], [3939.1, 3439.1]], '内陸へ約半 mile、ガリヴァーの足で約 10 分（創作）。'],
    ['RT-02', '運搬機の道', 'LO-02 → LO-03', [[3939.1, 3439.1], [4285.5, 3639.1], [4249, 4008.1]], '約半 mile。馬 1,500 頭が引く。寝ている間に運ばれた（本文）。一晩野営して翌日の昼に着く。'],
    ['RT-03', '神殿から都へ', 'LO-03 → LO-04', [[4249, 4008.1], [4431.9, 4008.1]], '200 yards（本文）。'],
    ['RT-04', '小山から艦隊へ', 'LO-06 → LO-07 → LO-08', [[7894.9, 6676.9], [7932, 7432], [8084.5, 7584.5]], '満潮の半時間前に海へ入り、歩きと泳ぎで渡る（本文）。'],
    ['RT-05', '艦隊を引いた道', 'LO-08 → LO-09', [[8084.5, 7584.5], [7036.8, 7661.8]], '50 本の綱と鉤で引いて渡る（本文）。約 1 時間（創作）。'],
    ['RT-06', '亡命の道', 'LO-03 → LO-07 → LO-10', [[4249, 4008.1], [7036.8, 7661.8], [7932, 7432], [7864, 8279.1], [10029.1, 9529.1]], '歩きと泳ぎで海峡を渡る（本文）。'],
    ['RT-07', 'ボートを港へ曳いた道', 'LO-11 → LO-10', [[13574.5, 13074.5], [11800, 11300], [10029.1, 9529.1]], '船で曳いて港へ（本文）。'],
  ];
  for (const [id, name, cites, coordinates, note] of routes)
    features.push({
      id: id.toLowerCase(),
      layerId: 'routes',
      featureKind: 'path',
      geometry: { type: 'polyline', coordinates },
      name: `${id} ${name}`,
      description: `${cites}。${note}`,
      category: '本文',
      style: { color: id === 'RT-05' || id === 'RT-04' ? '#3b6fb5' : '#b5523b', lineWidth: 2, label: false },
    });
  const views = [
    ...base.namedViews,
    {
      id: 'northeast',
      name: '北東岸と海峡',
      extent: { minX: 6700, minY: 6300, maxX: 8700, maxY: 8500 },
      visibleLayerIds: ['land', 'political', 'routes', 'places'],
    },
  ];
  const result = validateFictionMap({ ...base, features, namedViews: views });
  if (!result.ok) throw Error('第1部の地図を検証できません：' + JSON.stringify(result));
  return result.value;
}

// ---------------------------------------------------------------- 台帳（出来事と在場）
type Ev = {
  id: string;
  label: string;
  time: { kind: 'day'; day: number } | { kind: 'range'; start: number; end: number };
  who?: string[];
  at?: { ch: string; loc: string; start: number; end: number; sure?: boolean }[];
};
const LEFT = { start: 472, end: 841 };
const events: Ev[] = [
  { id: 'EV-01', label: 'ブリストルから出航（1699-05-04）', time: { kind: 'day', day: 0 }, who: ['CH-01', 'CH-10'] },
  {
    id: 'EV-02',
    label: '嵐で難破し、浜へ泳ぎ着く（1699-11-05）',
    time: { kind: 'day', day: 185 },
    who: ['CH-01'],
    at: [{ ch: 'CH-01', loc: 'LO-01', start: 185, end: 186 }],
  },
  {
    id: 'EV-03',
    label: '縛られて目覚め、小人たちに会う',
    time: { kind: 'day', day: 186 },
    who: ['CH-01'],
    at: [{ ch: 'CH-01', loc: 'LO-02', start: 186, end: 187, sure: false }],
  },
  {
    id: 'EV-04',
    label: '運搬機で古い神殿へ運ばれ、鎖につながれる',
    time: { kind: 'day', day: 187 },
    who: ['CH-01', 'CH-02'],
    at: [{ ch: 'CH-01', loc: 'LO-03', start: 187, end: LEFT.start, sure: false }],
  },
  { id: 'EV-05', label: '解放の条件に署名し、自由を得る', time: { kind: 'range', start: 187, end: LEFT.start }, who: ['CH-01', 'CH-02', 'CH-06'] },
  {
    id: 'EV-06',
    label: '城壁をまたいでミルデンドウと王宮を見る',
    time: { kind: 'range', start: 187, end: LEFT.start },
    who: ['CH-01'],
  },
  { id: 'EV-07', label: 'レルドレサルが訪ね、二つの党派と卵の戦争を説く', time: { kind: 'range', start: 187, end: LEFT.start }, who: ['CH-01', 'CH-05'] },
  {
    id: 'EV-10',
    label: 'ブレフスキュの艦隊を引いて来る',
    time: { kind: 'range', start: 187, end: LEFT.start },
    who: ['CH-01', 'CH-02'],
  },
  { id: 'EV-11', label: 'ブレフスキュを属州にする命令を断る', time: { kind: 'range', start: 187, end: LEFT.start }, who: ['CH-01', 'CH-02'] },
  { id: 'EV-12', label: '皇后の居室の火事を消す', time: { kind: 'range', start: 187, end: LEFT.start }, who: ['CH-01', 'CH-03'] },
  { id: 'EV-13', label: '夜の訪問者が弾劾状を知らせる', time: { kind: 'range', start: 187, end: LEFT.end }, who: ['CH-01', 'CH-08'] },
  {
    id: 'EV-14',
    label: 'ブレフスキュへ逃れる',
    time: { kind: 'range', start: LEFT.start, end: LEFT.end },
    who: ['CH-01', 'CH-07'],
    at: [{ ch: 'CH-01', loc: 'LO-10', start: LEFT.end, end: 874, sure: false }],
  },
  { id: 'EV-15', label: '流れ着いたボートを見つける（到着の3日後）', time: { kind: 'range', start: LEFT.start + 3, end: LEFT.end + 3 }, who: ['CH-01'] },
  { id: 'EV-16', label: 'ブレフスキュから出帆（1701-09-24）', time: { kind: 'day', day: 874 }, who: ['CH-01', 'CH-07'] },
  { id: 'EV-17', label: 'ビドル船長の船に拾われる（1701-09-26）', time: { kind: 'day', day: 876 }, who: ['CH-01', 'CH-09'] },
  { id: 'EV-18', label: 'ダウンズに着く（1702-04-13）', time: { kind: 'day', day: 1075 }, who: ['CH-01', 'CH-10'] },
];

function ledgerRows() {
  const rows: { id: string; values: Record<string, unknown> }[] = [];
  for (const e of events) {
    rows.push({
      id: e.id,
      values: {
        'tl1.row': 'event',
        'tl1.label': e.label,
        'tl1.time.kind': e.time.kind,
        'tl1.time.start': e.time.kind === 'day' ? e.time.day : e.time.start,
        ...(e.time.kind === 'range' ? { 'tl1.time.end': e.time.end } : {}),
      },
    });
    for (const ch of e.who ?? [])
      rows.push({
        id: `${e.id}.who.${ch}`,
        values: { 'tl1.row': 'participant', 'tl1.subject': e.id, 'tl1.ind.ch': ch, 'tl1.ind.origin': 'WL-A' },
      });
    (e.at ?? []).forEach((a, i) =>
      rows.push({
        id: `${e.id}.presence.${i}`,
        values: {
          'tl1.row': 'presence',
          'tl1.subject': e.id,
          'tl1.ind.ch': a.ch,
          'tl1.ind.origin': 'WL-A',
          'tl1.loc': a.loc,
          'tl1.time.kind': 'interval',
          'tl1.time.start': a.start,
          'tl1.time.end': a.end,
          'tl1.certainty': a.sure === false ? 'uncertain' : 'confirmed',
        },
      }),
    );
  }
  return rows;
}

// ---------------------------------------------------------------- 辞書
const terms: [string, string, string, string, string][] = [
  ['TE-01', 'リリパット', 'Lilliput', '国', 'リリパット国、小人国（国名として）'],
  ['TE-02', 'ブレフスキュ', 'Blefuscu', '国・首都', 'ブレフスク'],
  ['TE-03', 'ミルデンドウ', 'Mildendo', '首都', 'ミルデンド'],
  ['TE-04', 'レミュエル・ガリヴァー', 'Lemuel Gulliver', '人物', 'ガリバー、ガリバーズ'],
  ['TE-05', 'クインバス・フレストリン（人の山）', 'Quinbus Flestrin', 'ガリヴァーの呼び名', '—'],
  ['TE-06', 'ゴルバスト・モマレム・エブラメ・グルディロ・シェフィン・モリー・ウリー・グエ', 'Golbasto Momarem Evlame Gurdilo Shefin Mully Ully Gue', 'CH-02の名', '台詞では「皇帝」。全名は宣告の場面だけ'],
  ['TE-07', 'フリムナップ', 'Flimnap', 'CH-04', 'フリンナップ'],
  ['TE-08', 'レルドレサル', 'Reldresal', 'CH-05', 'レドレサル'],
  ['TE-09', 'スカイレッシュ・ボルゴラム', 'Skyresh Bolgolam', 'CH-06', 'ボルゴラム大将（役職は「海軍大将」）'],
  ['TE-10', 'リムトク、ラルコン、バルマフ', 'Limtoc, Lalcon, Balmuff', '弾劾に加わる廷臣', '—'],
  ['TE-11', 'トラメックサン（高いかかとの党）', 'Tramecksan', '党派', '高踵党'],
  ['TE-12', 'スラメックサン（低いかかとの党）', 'Slamecksan', '党派', '低踵党'],
  ['TE-13', '大端派、小端派', 'Big-endians, Little-endians', '卵の割り方の宗派', 'ビッグエンディアン（台詞では使わない）'],
  ['TE-14', 'ハーゴ（大官）', 'Hurgo', '称号', '—'],
  ['TE-15', 'ベイツ', 'Bates', '師匠の外科医', '—'],
  ['TE-16', 'ブラストラグ（面積の単位）', 'blustrug', '単位', '—'],
  ['TE-17', 'グラムグラフ（長さの単位）', 'glumgluff', '単位', '—'],
];
function dictionary(): StructuredData {
  return {
    schemaVersion: 2,
    columns: [
      { id: 'te.text', name: '表記', type: 'text', required: true },
      { id: 'te.source', name: '原語', type: 'text' },
      { id: 'te.kind', name: '種類', type: 'text' },
      { id: 'te.ruby', name: 'ルビ', type: 'boolean' },
      { id: 'te.avoid', name: '使わない表記', type: 'text' },
    ],
    rows: terms.map(([id, text, source, kind, avoid]) => ({
      id,
      values: { 'te.text': text, 'te.source': source, 'te.kind': kind, 'te.ruby': false, 'te.avoid': avoid },
    })),
  };
}

// ---------------------------------------------------------------- 組み立て
export async function buildGulliverPart1(lilliput: FictionMapContent) {
  const f0 = await buildF0Sample();
  const byId = new Map(f0.artifacts.map((a) => [a.id, a]));
  const schemaOf = (id: string) => (byId.get(id)!.draft.content as StructuredData).columns;

  const worldSettings: StructuredData = {
    schemaVersion: 2,
    columns: schemaOf('world-S'),
    rows: [
      {
        id: 'CL-1',
        values: { 'tl1.row': 'clock', 'tl1.label': 'ユリウス暦（旧暦）、1699-05-04 ブリストル出航を0日とする相対日' },
      },
      { id: 'WL-A', values: { 'tl1.row': 'worldline', 'tl1.label': '本文の世界', 'tl1.clock': 'CL-1' } },
    ],
  };
  const ledger: StructuredData = { schemaVersion: 2, columns: schemaOf('story-ledger-A'), rows: ledgerRows() };
  const composition: StructuredData = { schemaVersion: 2, columns: schemaOf('composition-S'), rows: [] };
  const map = part1Map(lilliput);

  const ids = {
    story: `${P}story`,
    world: `${P}world-settings`,
    ledger: `${P}ledger`,
    composition: `${P}composition`,
    characters: `${P}characters`,
    notes: `${P}world-notes`,
    map: `${P}map`,
    terms: `${P}terms`,
    board: `${P}board`,
  };
  const mapArtifact = await native('fiction-map', ids.map, '第1部の地図（リリパットとブレフスキュ）', map);
  const links = readWorkspaceLinks({
    schemaVersion: 2,
    scenes: [],
    story: {
      id: ids.story,
      namespace: `ns:${ids.story}`,
      composition: ids.composition,
      worldSettings: ids.world,
      characters: ids.characters,
      ledgers: [{ world: 'WL-A', artifactId: ids.ledger }],
      sceneCards: [],
    },
    occurrenceLinks: [],
  }) as CreativeWorkspaceLinksV2;

  const board: WhiteboardContent = {
    ...createWhiteboard(),
    nodes: [
      ...[
        { id: 'timeline', x: 24, y: 24, width: 760, height: 460 },
        { id: 'map', x: 810, y: 24, width: 520, height: 460 },
        ...[0, 1, 2].map((i) => ({ id: `event-${i}`, x: 24 + i * 300, y: 510, width: 280, height: 240 })),
      ].map(({ id, ...bounds }) => ({
        ...makeWhiteboardNode('shape'),
        id,
        shape: 'rectangle' as const,
        bounds,
        text: '連動表示は物語ボードで開いてください',
        color: '#fffdf7',
      })),
      {
        ...makeWhiteboardNode('sticky'),
        id: 'author-note',
        bounds: { x: 940, y: 510, width: 390, height: 240 },
        text:
          '第1部の覚え書き\n時計 CL-1：1699-05-04 出航を0日（ユリウス暦）。\n日付が本文にある出来事だけ日を確定し、他は範囲で置く。\nリリパットを出た日は本文が矛盾する（472〜840日）。',
        color: '#fff0b6',
      },
    ],
  };
  const everyone = people.map((p) => boardIndividualKey(links.story.namespace, p.id, 'WL-A'));
  const all: BoardFilter = {
    individuals: { kind: 'all' },
    places: { kind: 'all' },
    groups: { kind: 'all' },
    time: { kind: 'point', clock: 'CL-1', value: 187 },
    includeUnknown: true,
  };
  const key = (ch: string) => boardIndividualKey(links.story.namespace, ch, 'WL-A');
  const settings: BoardSettings = {
    schemaVersion: 1,
    boardArtifactId: ids.board,
    storyId: links.story.id,
    world: 'WL-A',
    clock: 'CL-1',
    map: {
      artifactId: mapArtifact.id,
      versionId: mapArtifact.versions[0].versionId,
      contentHash: mapArtifact.versions[0].contentHash,
      view: { kind: 'named', id: 'overview' },
    },
    panels: [
      { nodeId: 'timeline', kind: 'timeline' },
      { nodeId: 'map', kind: 'map' },
      ...['EV-04', 'EV-10', 'EV-14'].map((ev, i) => ({
        nodeId: `event-${i}`,
        kind: 'event-card' as const,
        event: { artifactId: ids.ledger, itemId: ev },
      })),
    ],
    locations: places.map((p) => ({ place: { artifactId: ids.notes, itemId: p.id }, featureId: p.feature })),
    groups: [
      { id: 'court', name: 'リリパットの宮廷', individuals: ['CH-02', 'CH-03', 'CH-04', 'CH-05', 'CH-06', 'CH-08'].map(key), events: [] },
      { id: 'escape', name: '亡命と帰国', individuals: ['CH-01', 'CH-07', 'CH-09', 'CH-10'].map(key), events: [] },
    ],
    presets: [
      { id: 'all', name: '全員・神殿に着いた日', filter: all },
      { id: 'landing', name: '漂着（185日）', filter: { ...all, time: { kind: 'point', clock: 'CL-1', value: 185 } } },
      {
        id: 'blefuscu',
        name: 'ブレフスキュ（亡命から出帆）',
        filter: { ...all, time: { kind: 'point', clock: 'CL-1', value: 860 }, individuals: { kind: 'set', ids: everyone } },
      },
    ],
  };

  const artifacts = [
    await native('data', ids.characters, '第1部 人物表と相関図', characterSheet()),
    await native('document', ids.notes, '第1部 世界の覚え書きと場所', worldNotes()),
    await native('data', ids.world, '第1部 世界線と時計', worldSettings),
    await native('data', ids.ledger, '第1部 筋の台帳（WL-A）', ledger),
    await native('data', ids.composition, '第1部 構成図（提示位置はまだ無い）', composition),
    mapArtifact,
    await native('data', ids.terms, '第1部 固有名詞と表記の辞書', dictionary()),
    await native('whiteboard', ids.board, 'ガリヴァー旅行記 第1部・物語ボード', board),
    await native('data', GULLIVER_PART1_SETTINGS, 'ガリヴァー旅行記 第1部・表示条件', createBoardSettingsData(settings)),
  ];
  return { artifacts, links, settingsId: GULLIVER_PART1_SETTINGS };
}
