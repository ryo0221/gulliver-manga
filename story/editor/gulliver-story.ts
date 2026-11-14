/**
 * ガリヴァー旅行記（全4部・24話）の「筋と構成」を、Editor Platform のネイティブ資料として組み立てる。
 * 工程定義 fiction-manga@1.1.0 の「筋と構成」（作品全体で一度）の成果物。
 *
 * 作るもの
 * - 筋の台帳（Structured Data, Story Timeline tl1）: 全4部の出来事 EV、参加者、因果（cause）。第1部は
 *   gulliver-part1.ts の出来事をそのまま使い、第2〜4部の EV-21〜EV-67 を足す。
 * - シーンカード（Structured Data, tl1）: SC-001〜SC-076。各シーンが出来事と人物を引用する。
 * - 構成図（Structured Data, tl1）: 24話への提示順（occurrence）。SC-001（序の厩）は第24話で再び出す。
 * - 筋と伏線（Structured Data）: 筋 PL-01〜PL-04 と伏線 FS-01〜FS-08（張るシーンと回収するシーン）。
 * - 24話の筋立て（Document）: 話ごとの題、あらすじ、シーン、本文の章。
 * - 人物表（Structured Data）: 第1部の CH-01〜CH-10 と、第2〜4部の仮の人物 CH-11〜CH-29。
 *
 * editor-platform の作業ツリーで apps/artifact-host/src/creative/story-board/ に置いて使う（commit しない）。
 */
import { contentHash, type Artifact } from '@editor-platform/artifact-core';
import { createDocument, type DocumentBlock } from '@editor-platform/document/model';
import type { StructuredData } from '@editor-platform/structured-data/model';
import { buildF0Sample } from '../timeline/sample';
import { readWorkspaceLinks, type CreativeWorkspaceLinksV2 } from '../workspace/model';
import { characterSheet, ledgerRows, PART1_EVENTS, type LedgerEvent } from './gulliver-part1';

const stamp = '2026-11-14T00:00:00.000Z';
const P = 'gms-';
const VERSION = 'story-v1';

async function native(kind: string, id: string, name: string, content: unknown) {
  const artifact: Artifact<unknown> = {
    schemaVersion: 1,
    id,
    name,
    kind,
    provenance: { source: 'created' },
    draft: { baseVersionId: VERSION, updatedAt: stamp, content: structuredClone(content) },
    versions: [
      {
        artifactId: id,
        versionId: VERSION,
        parentVersionId: null,
        schemaVersion: 1,
        createdAt: stamp,
        createdBy: null,
        reason: 'ガリヴァー旅行記 筋と構成（fiction-manga@1.1.0 筋と構成）',
        content,
        contentHash: await contentHash(content),
      },
    ],
  };
  return artifact;
}

// ---------------------------------------------------------------- 仮の人物（第2〜4部）
/** 第2〜4部の人物。名前と初めて出る話だけ。詳しい欄は各部の「人物」の工程で埋める。 */
export const PROVISIONAL_PEOPLE: [id: string, name: string, first: string][] = [
  ['CH-11', '農夫（ガリヴァーを拾った主人）', '7話、麦畑'],
  ['CH-12', 'グラムダルクリッチ（農夫の娘、9歳）', '7話、農夫の家'],
  ['CH-13', 'ブロブディンナグの王妃', '8話、買い取り'],
  ['CH-14', 'ブロブディンナグの王', '10話、謁見'],
  ['CH-15', '王妃の小人', '9話、宮廷'],
  ['CH-16', 'トマス・ウィルコックス船長', '12話、海上'],
  ['CH-17', 'ウィリアム・ロビンソン船長', '13話、出航'],
  ['CH-18', 'オランダ人の海賊', '13話、海賊'],
  ['CH-19', 'ラピュータ王', '13話、空の島'],
  ['CH-20', 'ムノーディ卿', '15話、荒れない領地'],
  ['CH-21', 'グラブダブドリッブの領主（魔術師）', '16話、死者の晩餐'],
  ['CH-22', 'ラグナグ王', '17話、床を舐める'],
  ['CH-23', 'ストラルドブラグ（死なない人々）', '17話、老いの現実'],
  ['CH-24', 'ラガードの学士院の企画者たち', '15話、学士院'],
  ['CH-25', '主人の馬（灰色の馬）', '19話、岸'],
  ['CH-26', '栗毛の小馬（召使い）', '20話、言葉'],
  ['CH-27', 'ヤフー', '19話、岸'],
  ['CH-28', 'ペドロ・デ・メンデス船長', '23話、ポルトガル船'],
  ['CH-29', '反乱した船員たち', '19話、反乱'],
  ['CH-30', 'リリパットの群衆と役人（群）', '1話、縛られた目覚め'],
  ['CH-31', 'ブレフスキュの使節（群）', '4話、和平の使節'],
];

function storyCharacters(): StructuredData {
  const sheet = characterSheet();
  const blank = Object.fromEntries(sheet.columns.map((c) => [c.id, c.type === 'relation' ? null : '']));
  return {
    ...sheet,
    rows: [
      ...sheet.rows,
      ...PROVISIONAL_PEOPLE.map(([id, name, first]) => ({
        id,
        values: { ...blank, 'ch.name': name, 'ch.first': first, 'ch.change': '（仮）各部の人物の工程で埋める' },
      })),
    ],
  };
}

// ---------------------------------------------------------------- 第2〜4部の出来事
const day = (d: number) => ({ kind: 'day' as const, day: d });
const range = (start: number, end: number) => ({ kind: 'range' as const, start, end });
/**
 * 時計 CL-1（ユリウス暦、1699-05-04 = 0 日）。本文の日付は相対日に直した値。日付の無い出来事は、
 * 前後の日付のある出来事の間の範囲に置く。
 */
export const LATER_EVENTS: LedgerEvent[] = [
  // 第2部 ブロブディンナグ（第2篇）
  { id: 'EV-21', label: 'アドベンチャー号でダウンズから出航（1702-06-20）', time: day(1143), who: ['CH-01', 'CH-10'] },
  {
    id: 'EV-22',
    label: '上陸した仲間に置き去りにされ、巨人の麦畑で農夫に拾われる（1703-06-17）',
    time: day(1505),
    who: ['CH-01', 'CH-11'],
    cause: ['EV-21'],
  },
  { id: 'EV-23', label: '農夫の食卓に上り、寝台で鼠と戦う', time: range(1505, 1506), who: ['CH-01', 'CH-11', 'CH-12'] },
  {
    id: 'EV-24',
    label: 'グラムダルクリッチに世話され、市場の宿で見世物にされる',
    time: range(1506, 1566),
    who: ['CH-01', 'CH-11', 'CH-12'],
  },
  {
    id: 'EV-25',
    label: '都ロルブルグルドへの旅で毎日見世物にされ、痩せ衰える（1703-08-17〜10-26）',
    time: range(1566, 1636),
    who: ['CH-01', 'CH-11', 'CH-12'],
    cause: ['EV-24'],
  },
  {
    id: 'EV-26',
    label: '王妃に買い取られ、グラムダルクリッチも宮廷に残る',
    time: range(1636, 1700),
    who: ['CH-01', 'CH-11', 'CH-12', 'CH-13'],
    cause: ['EV-25'],
  },
  {
    id: 'EV-27',
    label: '王妃の小人に骨の髄へ押し込まれ、蜂の群れと剣で戦う',
    time: range(1640, 2290),
    who: ['CH-01', 'CH-13', 'CH-15'],
  },
  { id: 'EV-31', label: '猿に屋根の上へさらわれ、助け出される', time: range(1640, 2290), who: ['CH-01', 'CH-12'] },
  { id: 'EV-28', label: '五度の謁見で、王に英国の議会と法と戦争を誇らしげに語る', time: range(1640, 2290), who: ['CH-01', 'CH-14'] },
  {
    id: 'EV-29',
    label: '王が英国人を「地を這う小さな嫌らしい虫」と断じる',
    time: range(1640, 2290),
    who: ['CH-01', 'CH-14'],
    cause: ['EV-28'],
  },
  {
    id: 'EV-30',
    label: '火薬の作り方を差し出し、王に恐れと嫌悪で断られる',
    time: range(1640, 2290),
    who: ['CH-01', 'CH-14'],
    cause: ['EV-29'],
  },
  { id: 'EV-32', label: '旅に使う小さな箱の部屋を作ってもらう', time: range(1640, 2290), who: ['CH-01', 'CH-13'] },
  {
    id: 'EV-33',
    label: '海辺への旅で、鷲に箱ごとさらわれ、海へ落ちる（逃げてから約9か月で帰国）',
    time: range(2290, 2340),
    who: ['CH-01', 'CH-12'],
    cause: ['EV-32'],
  },
  {
    id: 'EV-34',
    label: 'ウィルコックス船長の船に拾われ、持ち帰った品で話を信じてもらう',
    time: range(2290, 2340),
    who: ['CH-01', 'CH-16'],
    cause: ['EV-33'],
  },
  {
    id: 'EV-35',
    label: 'ダウンズに着き、家族と家が小さく見える（1706-06-03）',
    time: day(2587),
    who: ['CH-01', 'CH-10'],
    cause: ['EV-34'],
  },
  // 第3部 ラピュータ、バルニバービ、ラグナグ、グラブダブドリッブ、日本（第3篇）
  { id: 'EV-36', label: 'ホープウェル号で出航（1706-08-05）', time: day(2650), who: ['CH-01', 'CH-10', 'CH-17'] },
  { id: 'EV-37', label: 'フォート・セント・ジョージに着く（1707-04-11）', time: day(2899), who: ['CH-01', 'CH-17'] },
  {
    id: 'EV-38',
    label: '海賊に捕まり、同じキリスト教徒のオランダ人の進言で小舟に流される',
    time: range(2990, 3080),
    who: ['CH-01', 'CH-18'],
    cause: ['EV-37'],
  },
  {
    id: 'EV-39',
    label: '空飛ぶ島ラピュータに引き上げられる',
    time: range(2995, 3090),
    who: ['CH-01', 'CH-19'],
    cause: ['EV-38'],
  },
  {
    id: 'EV-40',
    label: '王と廷臣が数学と音楽に夢中で、叩き役なしには話も聞けない',
    time: range(3000, 3210),
    who: ['CH-01', 'CH-19'],
  },
  {
    id: 'EV-41',
    label: '島が反乱の町の上に止まり、日と雨を断って従わせようとする',
    time: range(3000, 3210),
    who: ['CH-01', 'CH-19'],
  },
  { id: 'EV-42', label: 'ラピュータを降り、下の国バルニバービへ（1708-02-16）', time: day(3210), who: ['CH-01', 'CH-19'] },
  { id: 'EV-43', label: 'ムノーディ卿の、昔のやり方で栄える領地を見る', time: range(3210, 3240), who: ['CH-01', 'CH-20'] },
  {
    id: 'EV-44',
    label: 'ラガードの学士院で、胡瓜から日光を取る研究と言葉を作る枠を見る',
    time: range(3210, 3240),
    who: ['CH-01', 'CH-24'],
  },
  {
    id: 'EV-45',
    label: 'グラブダブドリッブで死者を呼び出し、歴史の書き換えを知る',
    time: range(3240, 3275),
    who: ['CH-01', 'CH-21'],
  },
  { id: 'EV-46', label: 'ラグナグに着く（1708-04-21）', time: day(3275), who: ['CH-01'] },
  { id: 'EV-47', label: '王の前へ床を舐めて這い進む', time: range(3275, 3655), who: ['CH-01', 'CH-22'] },
  {
    id: 'EV-48',
    label: '死なない人ストラルドブラグに憧れ、その老いの現実を知る',
    time: range(3275, 3655),
    who: ['CH-01', 'CH-22', 'CH-23'],
  },
  { id: 'EV-49', label: 'ラグナグを発つ（1709-05-06）', time: day(3655), who: ['CH-01', 'CH-22'] },
  {
    id: 'EV-50',
    label: '日本の長崎に着き、オランダ人として踏絵を免れる（1709-06-09）',
    time: day(3689),
    who: ['CH-01'],
    cause: ['EV-49'],
  },
  { id: 'EV-51', label: 'ダウンズに着き、家族のもとへ帰る（1710-04-10）', time: day(3994), who: ['CH-01', 'CH-10'] },
  // 第4部 フウイヌム国（第4篇）
  { id: 'EV-52', label: '船長としてアドベンチャー号で出航（1710-09-07）', time: day(4144), who: ['CH-01', 'CH-10', 'CH-29'] },
  {
    id: 'EV-53',
    label: '雇い入れた船員が海賊になり、船長室に閉じ込められる',
    time: range(4144, 4388),
    who: ['CH-01', 'CH-29'],
    cause: ['EV-52'],
  },
  {
    id: 'EV-54',
    label: '見知らぬ岸に置き去りにされる（1711-05-09）',
    time: day(4388),
    who: ['CH-01', 'CH-29'],
    cause: ['EV-53'],
  },
  {
    id: 'EV-55',
    label: 'ヤフーの群れに襲われ、灰色の馬に助けられる',
    time: day(4388),
    who: ['CH-01', 'CH-25', 'CH-27'],
    cause: ['EV-54'],
  },
  { id: 'EV-56', label: '主人の家で言葉を学ぶ', time: range(4388, 4500), who: ['CH-01', 'CH-25', 'CH-26'] },
  {
    id: 'EV-57',
    label: '寝ている姿を小馬に見られ、服が体の一部でないことを打ち明ける',
    time: range(4400, 4600),
    who: ['CH-01', 'CH-25', 'CH-26'],
  },
  {
    id: 'EV-58',
    label: '主人に英国の戦争の理由、法律家、金を語る',
    time: range(4500, 5400),
    who: ['CH-01', 'CH-25'],
  },
  {
    id: 'EV-59',
    label: '主人が英国人とヤフーを比べ、理性を悪用するヤフーだと結ぶ',
    time: range(4500, 5400),
    who: ['CH-01', 'CH-25'],
    cause: ['EV-58'],
  },
  {
    id: 'EV-60',
    label: '水浴び中に雌のヤフーに抱きつかれ、自分がヤフーだと認める',
    time: range(4500, 5600),
    who: ['CH-01', 'CH-26', 'CH-27'],
  },
  {
    id: 'EV-61',
    label: '会議の決定で、国を出るよう主人に告げられる',
    time: range(5600, 5750),
    who: ['CH-01', 'CH-25'],
    cause: ['EV-59', 'EV-60'],
  },
  {
    id: 'EV-62',
    label: 'ヤフーの皮で小舟を作る',
    time: range(5600, 5766),
    who: ['CH-01', 'CH-26'],
    cause: ['EV-61'],
  },
  { id: 'EV-63', label: '国を発つ（1715-02-15）', time: day(5766), who: ['CH-01', 'CH-25', 'CH-26'], cause: ['EV-62'] },
  {
    id: 'EV-64',
    label: 'ポルトガル船に見つかり、ペドロ船長に連れ戻される',
    time: range(5768, 5790),
    who: ['CH-01', 'CH-28'],
    cause: ['EV-63'],
  },
  { id: 'EV-65', label: 'リスボンに着く（1715-11-05）', time: day(6029), who: ['CH-01', 'CH-28'] },
  {
    id: 'EV-66',
    label: '英国の家に着き、妻の口づけに気を失う（1715-12-05）',
    time: day(6059),
    who: ['CH-01', 'CH-10'],
  },
  {
    id: 'EV-67',
    label: '馬を二頭買い、毎日厩で語り合って暮らす（帰国から約5年、手記を書く）',
    time: range(6059, 7885),
    who: ['CH-01', 'CH-10'],
    cause: ['EV-66'],
  },
];

// ---------------------------------------------------------------- 24話とシーン
type Scene = { id: string; label: string; ev: string[]; cast: string[] };
type Episode = { n: number; title: string; chapters: string; summary: string; scenes: Scene[] };
const sc = (id: string, label: string, ev: string[], cast: string[]): Scene => ({ id, label, ev, cast });

export const EPISODES: Episode[] = [
  // 第1部 リリパット
  {
    n: 1,
    title: '人の山',
    chapters: '序、第1篇第1〜2章',
    summary:
      '序：馬と話す老いたガリヴァー（約5年後）。そこから時を戻し、出航、難破、浜で小人たちに縛られて目覚め、運搬機で古い神殿へ運ばれて鎖につながれるまで。',
    scenes: [
      sc('SC-001', '序：厩で二頭の馬に話しかける男', ['EV-67'], ['CH-01', 'CH-10']),
      sc('SC-002', '妻に見送られてブリストルを出る', ['EV-01'], ['CH-01', 'CH-10']),
      sc('SC-003', '嵐で難破し、ひとり浜へ泳ぎ着く', ['EV-02'], ['CH-01']),
      sc('SC-004', '目覚めると全身を縛られ、胸の上を小人が歩く', ['EV-03'], ['CH-01']),
      sc('SC-005', '運搬機で都の外の神殿へ運ばれ、鎖につながれる', ['EV-04'], ['CH-01', 'CH-02']),
    ],
  },
  {
    n: 2,
    title: '綱渡りの宮廷',
    chapters: '第1篇第3〜4章',
    summary: '綱渡りで官職を争う宮廷を見る。渋るボルゴラムを前に解放の条件に署名して自由を得、城壁をまたいで都と王宮を覗く。',
    scenes: [
      sc('SC-006', '綱渡りと棒の跳び越しで官職を争う廷臣たち', ['EV-08'], ['CH-01', 'CH-02', 'CH-04']),
      sc('SC-007', 'ボルゴラムが渋る解放の条件に署名する', ['EV-05'], ['CH-01', 'CH-02', 'CH-04', 'CH-06']),
      sc('SC-008', '城壁をまたぎ、王宮の内庭を覗き込む', ['EV-06'], ['CH-01', 'CH-03']),
    ],
  },
  {
    n: 3,
    title: '卵の端',
    chapters: '第1篇第4〜5章',
    summary:
      'レルドレサルが、かかとの高さの党派と、卵をどちらの端から割るかで始まった戦争を説く。ガリヴァーは海峡を渡ってブレフスキュの艦隊を引いて来る。',
    scenes: [
      sc('SC-009', 'レルドレサルが二つの党派と卵の戦争を説く', ['EV-07'], ['CH-01', 'CH-05']),
      sc('SC-010', '海峡を歩いて渡り、50本の綱で艦隊を引く', ['EV-10'], ['CH-01']),
      sc('SC-011', '凱旋し、ナルダックの位を授かる', ['EV-09'], ['CH-01', 'CH-02', 'CH-06']),
    ],
  },
  {
    n: 4,
    title: '火事',
    chapters: '第1篇第5章',
    summary:
      '皇帝はブレフスキュを属州にせよと命じ、ガリヴァーは断る。和平の使節に会い、王宮の火事を尿で消して皇后の恨みを買う。',
    scenes: [
      sc('SC-012', '自由な民を奴隷にする道具にはならない、と断る', ['EV-11'], ['CH-01', 'CH-02', 'CH-04']),
      sc('SC-013', 'ブレフスキュの使節に会い、訪問を約束する', ['EV-19'], ['CH-01', 'CH-02', 'CH-31']),
      sc('SC-014', '夜の王宮の火事を尿で消す', ['EV-12'], ['CH-01', 'CH-03']),
    ],
  },
  {
    n: 5,
    title: '慈悲の刑',
    chapters: '第1篇第7章',
    summary:
      '秘密の会議で弾劾が決まり、友レルドレサルの「慈悲」で両目を潰す刑になる。夜の訪問者がそれを知らせ、ガリヴァーはブレフスキュへ逃れる。',
    scenes: [
      sc('SC-015', '秘密の会議：死罪の代わりに両目を潰す「慈悲」', ['EV-20'], ['CH-02', 'CH-04', 'CH-05', 'CH-06']),
      sc('SC-016', '夜、輿で来た有力者が弾劾状を読み上げる', ['EV-13'], ['CH-01', 'CH-08']),
      sc('SC-017', '海峡を渡ってブレフスキュへ逃れる', ['EV-14'], ['CH-01', 'CH-07']),
    ],
  },
  {
    n: 6,
    title: '小さな牛',
    chapters: '第1篇第8章',
    summary:
      '流れ着いたボートを見つけ、ブレフスキュの皇帝に助けられて出帆する。拾ったビドル船長は小さな牛を見て話を信じる。家族のもとへ帰るが、2か月しかいない。',
    scenes: [
      sc('SC-018', '沖に流れ着いたボートを見つける', ['EV-15'], ['CH-01']),
      sc('SC-019', '寛大な皇帝に見送られて出帆する', ['EV-16'], ['CH-01', 'CH-07']),
      sc('SC-020', 'ビドル船長がポケットの小さな牛を見て信じる', ['EV-17'], ['CH-01', 'CH-09']),
      sc('SC-021', '家に着くが、2か月でまた海へ出たくなる', ['EV-18'], ['CH-01', 'CH-10']),
    ],
  },
  // 第2部 ブロブディンナグ
  {
    n: 7,
    title: '麦畑の巨人',
    chapters: '第2篇第1章',
    summary: '再び海へ。置き去りにされた浜の先は巨人の国で、麦畑で農夫に拾われる。食卓に上がり、寝台で鼠と戦う。',
    scenes: [
      sc('SC-022', 'ダウンズからまた海へ出る', ['EV-21'], ['CH-01', 'CH-10']),
      sc('SC-023', '仲間に置き去りにされ、麦畑で巨人の農夫に摘まみ上げられる', ['EV-22'], ['CH-01', 'CH-11']),
      sc('SC-024', '食卓の上を歩き、寝台で犬ほどの鼠と戦う', ['EV-23'], ['CH-01', 'CH-11', 'CH-12']),
    ],
  },
  {
    n: 8,
    title: '見世物',
    chapters: '第2篇第2〜3章',
    summary: '娘グラムダルクリッチに世話されながら、市場と都への旅で見世物にされて痩せ衰える。農夫は彼を王妃に売る。',
    scenes: [
      sc('SC-025', 'グラムダルクリッチが人形の寝台を作り、言葉を教える', ['EV-24'], ['CH-01', 'CH-12']),
      sc('SC-026', '都への旅、毎日の見世物で痩せていく', ['EV-25'], ['CH-01', 'CH-11', 'CH-12']),
      sc('SC-027', '王妃に買い取られ、グラムダルクリッチを残してもらう', ['EV-26'], ['CH-01', 'CH-11', 'CH-12', 'CH-13']),
    ],
  },
  {
    n: 9,
    title: '宮廷の虫',
    chapters: '第2篇第3〜5章',
    summary: '王妃の小人に嫉妬され、骨の髄へ押し込まれる。蜂と剣で戦い、猿に屋根へさらわれる。小さな人間としての宮廷の日々。',
    scenes: [
      sc('SC-028', '王妃の小人に骨の髄へ押し込まれ、蜂と剣で戦う', ['EV-27'], ['CH-01', 'CH-13', 'CH-15']),
      sc('SC-029', '猿に赤子のように抱かれて屋根へ', ['EV-31'], ['CH-01', 'CH-12']),
    ],
  },
  {
    n: 10,
    title: '王の問い',
    chapters: '第2篇第6章',
    summary:
      '五度の謁見で、ガリヴァーは英国の議会と法と戦争を誇らしげに語る。王は質問を重ね、最後に英国人を「地を這う小さな嫌らしい虫」と断じる。',
    scenes: [
      sc('SC-030', '王の手の上で、英国の議会と法と戦争を誇らしげに語る', ['EV-28'], ['CH-01', 'CH-14']),
      sc('SC-031', '王が書き留めた質問を一つずつ返す', ['EV-28'], ['CH-01', 'CH-14']),
      sc('SC-032', '「地を這う小さな嫌らしい虫」', ['EV-29'], ['CH-01', 'CH-14']),
    ],
  },
  {
    n: 11,
    title: '火薬',
    chapters: '第2篇第7〜8章',
    summary:
      '名誉を取り戻そうと火薬の作り方を差し出すが、王は恐れと嫌悪で断る。旅に使う箱の部屋を作ってもらい、病んだグラムダルクリッチと海辺へ向かう。',
    scenes: [
      sc('SC-033', '火薬の作り方を差し出し、王に断られる', ['EV-30'], ['CH-01', 'CH-14']),
      sc('SC-034', '旅に使う箱の部屋を作ってもらう', ['EV-32'], ['CH-01', 'CH-13']),
      sc('SC-035', 'グラムダルクリッチと海辺の旅へ', ['EV-33'], ['CH-01', 'CH-12']),
    ],
  },
  {
    n: 12,
    title: '鷲の箱',
    chapters: '第2篇第8章',
    summary:
      '鷲に箱ごとさらわれて海へ落ち、ウィルコックス船長に拾われる。持ち帰った品で話を信じてもらう。家に帰ると、家族も家も小さく見える。',
    scenes: [
      sc('SC-036', '鷲に箱ごとさらわれ、海へ落ちる', ['EV-33'], ['CH-01']),
      sc('SC-037', '持ち帰った品で、ウィルコックス船長が話を信じる', ['EV-34'], ['CH-01', 'CH-16']),
      sc('SC-038', '家に着くと、妻も娘も家も小さく見える', ['EV-35'], ['CH-01', 'CH-10']),
    ],
  },
  // 第3部 ラピュータほか
  {
    n: 13,
    title: '空の島',
    chapters: '第3篇第1〜2章',
    summary:
      'また海へ。海賊に捕まり、同じキリスト教徒のオランダ人の進言で小舟に流される。漂う先の空に島が浮かび、鎖で引き上げられる。',
    scenes: [
      sc('SC-039', 'ホープウェル号で出航する', ['EV-36'], ['CH-01', 'CH-10', 'CH-17']),
      sc('SC-040', 'フォート・セント・ジョージから商いの船へ', ['EV-37'], ['CH-01', 'CH-17']),
      sc('SC-041', 'オランダ人の海賊の進言で、小舟で流される', ['EV-38'], ['CH-01', 'CH-18']),
      sc('SC-042', '空に浮かぶ島から鎖が下りてくる', ['EV-39'], ['CH-01', 'CH-19']),
    ],
  },
  {
    n: 14,
    title: '叩き役',
    chapters: '第3篇第2〜3章',
    summary: '王も廷臣も数学と音楽に夢中で、叩き役に耳と口を叩かれないと話も聞けない。島は反乱の町の上に止まり、日と雨を断つ。',
    scenes: [
      sc('SC-043', '叩き役に口と耳を叩かれて話す人々', ['EV-40'], ['CH-01', 'CH-19']),
      sc('SC-044', '島が反乱の町の上に止まる', ['EV-41'], ['CH-01', 'CH-19']),
      sc('SC-045', '島を降り、下の国へ', ['EV-42'], ['CH-01', 'CH-19']),
    ],
  },
  {
    n: 15,
    title: '学士院',
    chapters: '第3篇第4〜6章',
    summary: 'ムノーディ卿の昔ながらの領地だけが栄える。ラガードの学士院では、胡瓜から日光を取る研究や、言葉を作る枠を見る。',
    scenes: [
      sc('SC-046', '荒れた国で、ムノーディ卿の領地だけが実る', ['EV-43'], ['CH-01', 'CH-20']),
      sc('SC-047', '胡瓜から日光を取る研究', ['EV-44'], ['CH-01', 'CH-24']),
      sc('SC-048', '言葉を作る枠を回す学生たち', ['EV-44'], ['CH-01', 'CH-24']),
    ],
  },
  {
    n: 16,
    title: '死者の晩餐',
    chapters: '第3篇第7〜8章',
    summary: 'グラブダブドリッブの領主は死者を呼び出せる。ガリヴァーは古の英雄と学者に会い、歴史が書き換えられてきたことを知る。',
    scenes: [
      sc('SC-049', '魔術師の館で、死者が給仕する晩餐', ['EV-45'], ['CH-01', 'CH-21']),
      sc('SC-050', '呼び出した死者たちが語る、書き換えられた歴史', ['EV-45'], ['CH-01', 'CH-21']),
    ],
  },
  {
    n: 17,
    title: '死なない人',
    chapters: '第3篇第9〜10章',
    summary: 'ラグナグで王の前へ床を舐めて這い進む。死なない人ストラルドブラグがいると聞いて憧れるが、その老いの現実を見る。',
    scenes: [
      sc('SC-051', 'ラグナグに着く', ['EV-46'], ['CH-01']),
      sc('SC-052', '王の前へ床を舐めて這い進む', ['EV-47'], ['CH-01', 'CH-22']),
      sc('SC-053', '死なずに生きるなら、と夢を語る', ['EV-48'], ['CH-01', 'CH-22']),
      sc('SC-054', 'ストラルドブラグの老いの現実', ['EV-48'], ['CH-01', 'CH-23']),
    ],
  },
  {
    n: 18,
    title: '長崎',
    chapters: '第3篇第11章',
    summary: 'ラグナグを発ち、日本の長崎へ。オランダ人として踏絵を免れ、オランダ船で英国へ帰る。家族と暮らすのは5か月だけ。',
    scenes: [
      sc('SC-055', 'ラグナグを発つ', ['EV-49'], ['CH-01', 'CH-22']),
      sc('SC-056', '長崎で、オランダ人として踏絵を免れる', ['EV-50'], ['CH-01']),
      sc('SC-057', '家族のもとへ帰る', ['EV-51'], ['CH-01', 'CH-10']),
    ],
  },
  // 第4部 フウイヌム国
  {
    n: 19,
    title: '反乱',
    chapters: '第4篇第1章',
    summary:
      '船長として出航するが、雇った船員が海賊になり、見知らぬ岸に置き去りにされる。獣じみた人間ヤフーに襲われ、灰色の馬に助けられる。',
    scenes: [
      sc('SC-058', '船長として出航する', ['EV-52'], ['CH-01', 'CH-10', 'CH-29']),
      sc('SC-059', '雇った船員が反乱を起こす', ['EV-53'], ['CH-01', 'CH-29']),
      sc('SC-060', '見知らぬ岸に置き去りにされる', ['EV-54'], ['CH-01', 'CH-29']),
      sc('SC-061', 'ヤフーの群れと、助けに来た灰色の馬', ['EV-55'], ['CH-01', 'CH-25', 'CH-27']),
    ],
  },
  {
    n: 20,
    title: '服という皮',
    chapters: '第4篇第2〜3章',
    summary: '主人の家で言葉を学ぶ。ヤフーとの違いは服だけだと思われていたが、小馬に寝姿を見られ、服の秘密を打ち明ける。',
    scenes: [
      sc('SC-062', '主人の家で言葉を学ぶ', ['EV-56'], ['CH-01', 'CH-25', 'CH-26']),
      sc('SC-063', '寝姿を見られ、服が体の一部でないと打ち明ける', ['EV-57'], ['CH-01', 'CH-25', 'CH-26']),
    ],
  },
  {
    n: 21,
    title: '戦争の理由',
    chapters: '第4篇第4〜7章',
    summary:
      '主人に英国の戦争の理由と法律家と金を語る。主人は英国人を、理性をわずかに持ってそれを悪用するヤフーだと結ぶ。',
    scenes: [
      sc('SC-064', '戦争の理由を語る（パンが肉か、肉がパンか）', ['EV-58'], ['CH-01', 'CH-25']),
      sc('SC-065', '法律家と金を語る', ['EV-58'], ['CH-01', 'CH-25']),
      sc('SC-066', '主人が英国人とヤフーを比べる', ['EV-59'], ['CH-01', 'CH-25']),
    ],
  },
  {
    n: 22,
    title: 'ヤフーの証',
    chapters: '第4篇第8〜10章',
    summary: '水浴びの最中に雌のヤフーに抱きつかれ、自分がヤフーだと認めざるを得ない。会議の決定で、主人は国を出るよう告げる。',
    scenes: [
      sc('SC-067', '水浴びの最中に雌のヤフーに抱きつかれる', ['EV-60'], ['CH-01', 'CH-26', 'CH-27']),
      sc('SC-068', '会議の決定を主人が告げる', ['EV-61'], ['CH-01', 'CH-25']),
    ],
  },
  {
    n: 23,
    title: '皮の舟',
    chapters: '第4篇第10〜11章',
    summary:
      'ヤフーの皮で小舟を作り、主人の蹄に口づけして国を発つ。ポルトガル船に連れ戻されるが、親切なペドロ船長にも耐えられない。',
    scenes: [
      sc('SC-069', 'ヤフーの皮で小舟を作る', ['EV-62'], ['CH-01', 'CH-26']),
      sc('SC-070', '主人の蹄に口づけし、国を発つ', ['EV-63'], ['CH-01', 'CH-25', 'CH-26']),
      sc('SC-071', 'ポルトガル船に連れ戻される', ['EV-64'], ['CH-01', 'CH-28']),
      sc('SC-072', 'リスボン、ペドロ船長の家', ['EV-65'], ['CH-01', 'CH-28']),
    ],
  },
  {
    n: 24,
    title: '厩',
    chapters: '第4篇第11〜12章',
    summary:
      '家に着き、妻の口づけに気を失う。馬を二頭買い、厩で毎日語り合う（第1話の序に戻る）。最後に、人間の高慢だけは許せないと結ぶ。',
    scenes: [
      sc('SC-073', '妻の口づけに気を失う', ['EV-66'], ['CH-01', 'CH-10']),
      sc('SC-074', '結び：高慢なヤフーだけは我慢できない', ['EV-67'], ['CH-01']),
    ],
  },
];
/** 第24話で SC-001（序の厩）をもう一度出す位置：SC-073 の後、SC-074 の前。 */
export const REPRISE = { scene: 'SC-001', episode: 24, after: 'SC-073' };

// ---------------------------------------------------------------- 筋と伏線
type Plot = { id: string; kind: 'plotline' | 'setup'; label: string; theme: string; setup: string[]; payoff: string[]; note: string };
export const PLOTS: Plot[] = [
  {
    id: 'PL-01',
    kind: 'plotline',
    label: '大きさの物差し：巨人から虫へ、そして人と同じ大きさの国へ',
    theme: 'TH-01',
    setup: ['SC-004', 'SC-008'],
    payoff: ['SC-023', 'SC-038', 'SC-061'],
    note: '各話の最初のページに両者が入る引きのコマ（AR-05）。帰郷のたびに目の物差しが狂う。',
  },
  {
    id: 'PL-02',
    kind: 'plotline',
    label: '理性の自負と風刺：宮廷、学士院、英国',
    theme: 'TH-02',
    setup: ['SC-006', 'SC-009'],
    payoff: ['SC-030', 'SC-043', 'SC-048', 'SC-064'],
    note: '笑いとして描き、説教にしない。最初は他国を笑うガリヴァーが、最後は英国を笑われる側になる。',
  },
  {
    id: 'PL-03',
    kind: 'plotline',
    label: '帰郷の苦さ：帰るたびに家族から遠くなる',
    theme: 'TH-03',
    setup: ['SC-021'],
    payoff: ['SC-038', 'SC-057', 'SC-073'],
    note: '2か月で海へ戻る（6話）→家族が小さく見える（12話）→5か月で海へ戻る（18話）→妻の口づけに気を失う（24話）。',
  },
  {
    id: 'PL-04',
    kind: 'plotline',
    label: '傷んでいく青い上着',
    theme: 'AR-06',
    setup: ['SC-002'],
    payoff: ['SC-024', 'SC-041', 'SC-063', 'SC-069'],
    note: '金の縁取りなし・真鍮のボタン。部ごとに傷み、第4部では服が「皮」として話の鍵になる。',
  },
  {
    id: 'FS-01',
    kind: 'setup',
    label: '序の厩：馬に話しかける男は誰か',
    theme: 'TH-03',
    setup: ['SC-001'],
    payoff: ['SC-074'],
    note: '第1話の序を第24話で同じ構図のまま再び出す（構成図の OC-076）。',
  },
  {
    id: 'FS-02',
    kind: 'setup',
    label: '戦争の理由はいつも愚かしい',
    theme: 'TH-02',
    setup: ['SC-009'],
    payoff: ['SC-030', 'SC-064'],
    note: '卵の端（3話）を笑ったガリヴァーが、英国の戦争を誇り（10話）、馬に理由を語って恥じる（21話）。',
  },
  {
    id: 'FS-03',
    kind: 'setup',
    label: '火薬：差し出した力を断られる',
    theme: 'TH-02',
    setup: ['SC-033'],
    payoff: ['SC-064'],
    note: '王が断った火薬（11話）を、21話で大砲の話として馬に語る。',
  },
  {
    id: 'FS-04',
    kind: 'setup',
    label: '「地を這う小さな嫌らしい虫」',
    theme: 'TH-02',
    setup: ['SC-032'],
    payoff: ['SC-066', 'SC-074'],
    note: '王の断定（10話）を、主人の馬が同じ結論で繰り返し（21話）、最後はガリヴァー自身の言葉になる（24話）。',
  },
  {
    id: 'FS-05',
    kind: 'setup',
    label: '旅に使う箱の部屋',
    theme: 'TH-01',
    setup: ['SC-034'],
    payoff: ['SC-036'],
    note: '11話で作った箱が、12話で鷲にさらわれる器になる。',
  },
  {
    id: 'FS-06',
    kind: 'setup',
    label: '持ち帰った証拠で話を信じてもらう',
    theme: 'TH-01',
    setup: ['SC-020'],
    payoff: ['SC-037'],
    note: '小さな牛（6話）と、巨人の国の品（12話）。第4部では証拠を持ち帰らない（帰ったこと自体が証になる）。',
  },
  {
    id: 'FS-07',
    kind: 'setup',
    label: '同じ仲間の方が残酷',
    theme: 'TH-02',
    setup: ['SC-041'],
    payoff: ['SC-059'],
    note: '同じキリスト教徒のオランダ人に流され（13話）、自分が雇った英国の船員に裏切られる（19話）。',
  },
  {
    id: 'FS-08',
    kind: 'setup',
    label: 'ヤフーとの違いは服だけ',
    theme: 'TH-02',
    setup: ['SC-061', 'SC-063'],
    payoff: ['SC-067', 'SC-069'],
    note: '服を脱げばヤフーと同じ（20話）。水浴びで雌のヤフーに抱きつかれ（22話）、ヤフーの皮で舟を作る（23話）。',
  },
];

function plotData(): StructuredData {
  const order = new Map<string, number>();
  for (const e of EPISODES) for (const s of e.scenes) order.set(s.id, e.n);
  const eps = (ids: string[]) => [...new Set(ids.map((id) => order.get(id)))].map((n) => `${n}話`).join('、');
  return {
    schemaVersion: 2,
    columns: [
      { id: 'pl.kind', name: '種類', type: 'select', options: ['plotline', 'setup'], required: true },
      { id: 'pl.label', name: '筋・伏線', type: 'text', required: true },
      { id: 'pl.theme', name: 'テーマ', type: 'text' },
      { id: 'pl.setup', name: '張るシーン', type: 'text' },
      { id: 'pl.setupEp', name: '張る話', type: 'text' },
      { id: 'pl.payoff', name: '回収するシーン', type: 'text' },
      { id: 'pl.payoffEp', name: '回収する話', type: 'text' },
      { id: 'pl.note', name: '覚え書き', type: 'text' },
    ],
    rows: PLOTS.map((p) => ({
      id: p.id,
      values: {
        'pl.kind': p.kind,
        'pl.label': p.label,
        'pl.theme': p.theme,
        'pl.setup': p.setup.join('、'),
        'pl.setupEp': eps(p.setup),
        'pl.payoff': p.payoff.join('、'),
        'pl.payoffEp': eps(p.payoff),
        'pl.note': p.note,
      },
    })),
  };
}

// ---------------------------------------------------------------- 24話の筋立て（Document）
const PARTS = [
  { first: 1, name: '第1部 リリパット', ratio: '住人は約146 mm（1/12）' },
  { first: 7, name: '第2部 ブロブディンナグ', ratio: '住人は約21 m（12倍）' },
  { first: 13, name: '第3部 ラピュータほか', ratio: '人と同じ大きさ' },
  { first: 19, name: '第4部 フウイヌム国', ratio: '馬と人' },
];
function outline() {
  const blocks: DocumentBlock[] = [];
  let n = 0;
  const id = () => `so-${String(++n).padStart(3, '0')}`;
  const h = (level: number, text: string) =>
    blocks.push({ ...createDocument().blocks[0], id: id(), type: 'heading', level, text });
  const p = (text: string) => blocks.push({ ...createDocument().blocks[1], id: id(), type: 'paragraph', text });
  h(1, 'ガリヴァー旅行記 筋と構成（全4部・24話）');
  p(
    '典拠は Project Gutenberg #829 の英語原文。時計は CL-1（ユリウス暦、1699-05-04 の出航を0日）。出来事は筋の台帳、シーンはシーンカード、話への並びは構成図、筋と伏線は「筋と伏線」の表にある。',
  );
  p(
    '提示順は本文の時の順に従う。例外は一つだけ：第1話の序で、約5年後に厩で馬と話すガリヴァーを見せ、第24話で同じシーンを再び出して閉じる（FS-01）。',
  );
  for (const part of PARTS) {
    h(2, `${part.name}（${part.first}〜${part.first + 5}話）・${part.ratio}`);
    for (const e of EPISODES.filter((e) => e.n >= part.first && e.n < part.first + 6)) {
      h(3, `第${e.n}話「${e.title}」（${e.chapters}）`);
      p(e.summary);
      const scenes = e.scenes.map((s) => `${s.id} ${s.label}`);
      if (e.n === REPRISE.episode) scenes.splice(scenes.findIndex((s) => s.startsWith(REPRISE.after)) + 1, 0, `${REPRISE.scene}（再び）序の厩`);
      p(`シーン：${scenes.join(' ／ ')}`);
    }
  }
  h(2, '筋と伏線');
  for (const pl of PLOTS) p(`${pl.id} ${pl.label}：${pl.note}`);
  return { ...createDocument(), blocks };
}

// ---------------------------------------------------------------- 組み立て
export async function buildGulliverStory() {
  const f0 = await buildF0Sample();
  const byId = new Map(f0.artifacts.map((a) => [a.id, a]));
  const schemaOf = (id: string) => (byId.get(id)!.draft.content as StructuredData).columns;
  const ids = {
    story: `${P}story`,
    world: `${P}world-settings`,
    ledger: `${P}ledger`,
    scenes: `${P}scenes`,
    composition: `${P}composition`,
    characters: `${P}characters`,
    plot: `${P}plot`,
    outline: `${P}outline`,
  };
  const ref = (a: Artifact<unknown>) => ({ 'tl1.ref.artifact': a.id, 'tl1.ref.version': VERSION, 'tl1.ref.hash': a.versions[0].contentHash });

  const world = await native('data', ids.world, '全4部 世界線と時計', {
    schemaVersion: 2,
    columns: schemaOf('world-S'),
    rows: [
      { id: 'CL-1', values: { 'tl1.row': 'clock', 'tl1.label': 'ユリウス暦（旧暦）、1699-05-04 ブリストル出航を0日とする相対日' } },
      { id: 'WL-A', values: { 'tl1.row': 'worldline', 'tl1.label': '本文の世界', 'tl1.clock': 'CL-1' } },
    ],
  } satisfies StructuredData);
  const ledger = await native('data', ids.ledger, '全4部 筋の台帳（WL-A）', {
    schemaVersion: 2,
    columns: schemaOf('story-ledger-A'),
    rows: ledgerRows([...PART1_EVENTS, ...LATER_EVENTS]),
  } satisfies StructuredData);
  const characters = await native('data', ids.characters, '全4部 人物表（第2〜4部は仮）', storyCharacters());

  const sceneRows: StructuredData['rows'] = [];
  for (const e of EPISODES)
    for (const s of e.scenes) {
      sceneRows.push({ id: s.id, values: { 'tl1.row': 'scene', 'tl1.label': s.label } });
      for (const ev of s.ev)
        sceneRows.push({
          id: `${s.id}.cite.${ev}`,
          values: { 'tl1.row': 'cite', 'tl1.subject': s.id, ...ref(ledger), 'tl1.ref.item': ev, 'tl1.ref.facet': 'whole' },
        });
      for (const ch of s.cast)
        sceneRows.push({
          id: `${s.id}.cast.${ch}`,
          values: { 'tl1.row': 'cite', 'tl1.subject': s.id, ...ref(characters), 'tl1.ref.item': ch, 'tl1.ref.facet': 'whole' },
        });
    }
  const scenes = await native('data', ids.scenes, '全4部 シーンカード', {
    schemaVersion: 2,
    columns: schemaOf('scene-cards-A'),
    rows: sceneRows,
  } satisfies StructuredData);

  const occ: StructuredData['rows'] = [];
  for (const e of EPISODES) {
    const list = e.scenes.map((s) => ({ s, reprise: false }));
    if (e.n === REPRISE.episode) {
      const first = EPISODES[0].scenes.find((s) => s.id === REPRISE.scene)!;
      list.splice(list.findIndex((x) => x.s.id === REPRISE.after) + 1, 0, { s: first, reprise: true });
    }
    list.forEach(({ s, reprise }, i) =>
      occ.push({
        id: reprise ? `OC-${REPRISE.scene.slice(3)}-R` : `OC-${s.id.slice(3)}`,
        values: {
          'tl1.row': 'occurrence',
          'tl1.label': `「${e.title}」${s.id}${reprise ? '（再び）' : ''}`,
          'tl1.order': e.n * 100 + (i + 1) * 10,
          'tl1.part': `第${e.n}話`,
          ...ref(scenes),
          'tl1.ref.item': s.id,
        },
      }),
    );
  }
  const composition = await native('data', ids.composition, '全4部 構成図（24話の提示順）', {
    schemaVersion: 2,
    columns: schemaOf('composition-S'),
    rows: occ,
  } satisfies StructuredData);

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
      sceneCards: [ids.scenes],
    },
    occurrenceLinks: [],
  }) as CreativeWorkspaceLinksV2;

  const artifacts = [
    await native('document', ids.outline, '全4部 24話の筋立て', outline()),
    world,
    ledger,
    scenes,
    composition,
    await native('data', ids.plot, '全4部 筋と伏線', plotData()),
    characters,
  ];
  return { artifacts, links };
}
