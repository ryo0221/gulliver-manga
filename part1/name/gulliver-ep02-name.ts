/**
 * ガリヴァー旅行記 第2話「綱渡りの宮廷」のネーム（fiction-manga@1.3.0 ネーム、話ごと）。
 *
 * 第1話のネーム（gulliver-ep01-name.ts）と同じ組み立て：脚本 gm1-script-lines@script-v1 の第2話の行を、
 * ページとコマへ順に割り当て、Design 原稿（漫画ワークスペース）とコマ表にする。コマごとに 3D の舞台で
 * 人物とカメラを置き（stage/ep02-stage.json、src/gulliver-ep02-stage.demo.ts）、カメラの絵をコマに敷く。
 * 構図・間・めくりは AI の提案で、採否は作者。
 */
import {
  buildEpisodeName,
  CITY_WALL,
  G,
  L,
  native,
  panelTable,
  type NamePage,
  type Stand,
  type StageInput,
} from './gulliver-ep01-name';

// カメラの立つ台（第2話）。mm は台の上面の地面からの高さ。
/** 都の西の丘（創作）：都の全体を見下ろす。再現の地図 SM-02 に丘は無く、高さは創作。 */
export const HILL: Stand = { on: '都の西の丘（創作：3,000 mm）', mm: 3000 };
/** 大通りの家の屋根の棟（F105 の家：3階建て 750 mm と屋根、創作）。 */
export const ROOF: Stand = { on: '大通りの家の屋根の上（F105 の3階建ての家、創作：750 mm）', mm: 750 };
/** 王宮の囲いの壁（本文：2フィート、610 mm）。 */
export const PALACE_WALL: Stand = { on: '王宮の囲いの壁（本文：2フィート、610 mm）', mm: 610 };
/** 奥の宮殿の上の階の床（F105 の奥の宮殿：窓の敷居 3.8 フィート、床は創作で 914 mm）。 */
// The palace room's floor: a 250 mm dais at the window inside F105 (the stage's 'dais'; the cameras stand on it).
export const ROYAL_FLOOR: Stand = { on: '奥の宮殿の窓辺の段（F105 の中、創作：250 mm）', mm: 250 };
/** 座ったガリヴァーの目の高さ（3D の体 F107 で座った形：地面から約 950 mm）。 */
const SEATED_EYE = 950;

export const EP02_NAME: NamePage[] = [
  // SC-006 綱渡り（5ページ）
  {
    scene: 'SC-006',
    turn: '扉。題と、手のひらの上の芸で大きさの違いを最初に見せる（AR-05）。',
    tiers: [
      {
        h: 7,
        panels: [
          {
            take: 1,
            shot: '大引き',
            cam: L('神殿の前の地面から、座るガリヴァーの手のひらの上で芸をする小人たちを見上げる'),
            art: '扉。神殿の前に座るガリヴァー。差し出した手のひらの上で、小人たちが芸を見せる。',
            size: true,
            title: 'ガリヴァー旅行記　第2話「綱渡りの宮廷」',
          },
        ],
      },
      {
        h: 3,
        panels: [
          {
            take: 1,
            shot: '引き',
            cam: L('神殿の前の広場の端から、座るガリヴァーと見物の宮廷を'),
            art: '半年後。左足首の鎖。神殿の前に並ぶ宮廷の人々。',
            size: true,
          },
        ],
      },
    ],
  },
  {
    scene: 'SC-006',
    tiers: [
      {
        h: 4,
        panels: [{ take: 1, shot: '中', cam: L('糸の脇の地面から、糸の上で跳ねる廷臣たちを横から'), art: '地上12インチに張った細い糸。その上で跳ねる廷臣たち。' }],
      },
      {
        h: 3,
        panels: [
          { take: 1, shot: '引き', cam: L('皇帝の座の後ろから、糸と廷臣と、奥に座るガリヴァーを'), art: '皇帝の前の綱渡り。奥に座って見るガリヴァー。', size: true, w: 1.3 },
          { take: 1, shot: '寄り', cam: L('糸の上の廷臣の足もと', 300), art: '細い糸を踏む靴。', w: 0.7 },
        ],
      },
      {
        h: 3,
        panels: [{ take: 0, shot: '中', cam: G('座ったガリヴァーの目から、手もとの小さな芸を見下ろす', SEATED_EYE), art: '見下ろすと、糸も廷臣も指ほどの大きさ。' }],
      },
    ],
  },
  {
    scene: 'SC-006',
    tiers: [
      { h: 5, panels: [{ take: 1, shot: '中', cam: L('糸の下の地面から、誰よりも高く跳ぶ痩せた男を見上げる'), art: '痩せた長身の男（フリムナップ）が、誰よりも高く跳ぶ。' }] },
      {
        h: 4,
        panels: [
          { take: 1, shot: '中', cam: L('見物の廷臣たちの間から'), art: '拍手してはやす廷臣たち。' },
          { take: 1, shot: '寄り', cam: L('着地したフリムナップの顔'), art: '着地したフリムナップ。冷ややかな顔。' },
        ],
      },
    ],
  },
  {
    scene: 'SC-006',
    tiers: [
      {
        h: 4,
        panels: [{ take: 1, shot: '中', cam: L('糸の脇の地面から、落ちる男と、差し出される巨大な指を'), art: '跳び損ねて落ちる男。ガリヴァーの指がとっさに受け止める。', size: true }],
      },
      {
        h: 3,
        panels: [
          { take: 1, shot: '寄り', cam: G('座ったガリヴァーの顔を正面から', SEATED_EYE), art: '叫ぶガリヴァー。' },
          { take: 0, shot: '寄り', cam: L('指先の高さから、指の上で目を回す男を', 250), art: '指先の上で、目を回す男。', size: true },
        ],
      },
      { h: 3, panels: [{ take: 1, shot: '中', cam: L('皇帝の横から、棒を跳び越す廷臣と、くぐる廷臣を'), art: '皇帝が棒を水平に持つ。跳び越す者、くぐる者。' }] },
    ],
  },
  {
    scene: 'SC-006',
    tiers: [
      { h: 4, panels: [{ take: 1, shot: '中', cam: L('皇帝を正面から'), art: '三色の絹糸を掲げる皇帝。' }] },
      { h: 3, panels: [{ take: 0, shot: '寄り', cam: L('勝った廷臣たちの腰'), art: '腰に青・赤・緑の絹糸を巻く勝者たち。' }] },
      { h: 3, panels: [{ take: 1, shot: '引き', cam: L('広場の端から、芸を見下ろすガリヴァーと宮廷を'), art: '芸を見下ろすガリヴァーと宮廷。', size: true }] },
    ],
  },
  // SC-007 解放の条件（5ページ）
  {
    scene: 'SC-007',
    turn: 'めくると評議の間。',
    tiers: [
      { h: 5, panels: [{ take: 1, shot: '引き', cam: L('評議の間の入口から、長い卓と皇帝と大臣たちを'), art: '宮廷の評議。長い卓、玉座の皇帝、並ぶ大臣たち。腕を組む太った男。' }] },
      {
        h: 3,
        panels: [
          { take: 1, shot: '中', cam: L('卓の端から、玉座の皇帝を'), art: '決を採る皇帝。' },
          { take: 0, shot: '寄り', cam: L('腕を組んで座るボルゴラムを'), art: '陰気な顔の太った男、ボルゴラム。' },
        ],
      },
      { h: 3, panels: [{ take: 1, shot: '寄り', cam: L('ボルゴラムを正面から'), art: '卓を叩いて反対するボルゴラム。' }] },
    ],
  },
  {
    scene: 'SC-007',
    tiers: [
      { h: 4, panels: [{ take: 1, shot: '中', cam: L('卓の向かいから、帳簿を広げるフリムナップを'), art: '帳簿を広げるフリムナップ。' }] },
      {
        h: 3,
        panels: [
          { take: 0, shot: '寄り', cam: L('皇帝の顔'), art: '思案する皇帝。' },
          { take: 1, shot: '中', cam: L('卓の向こうから、立ち上がる皇帝を'), art: '立ち上がって決める皇帝。' },
        ],
      },
      {
        h: 3,
        panels: [{ take: 1, shot: '引き', cam: L('神殿の前の地面から、座るガリヴァーと、その前に立つボルゴラムの一行を'), art: '長い羊皮紙を持って、ガリヴァーの前に来るボルゴラムの一行。', size: true }],
      },
    ],
  },
  {
    scene: 'SC-007',
    tiers: [
      { h: 4, panels: [{ take: 1, shot: '中', cam: L('ボルゴラムの肩越しに、見下ろすガリヴァーを'), art: '羊皮紙を広げるボルゴラム。見下ろすガリヴァー。', size: true }] },
      {
        h: 3,
        panels: [
          { take: 1, shot: '寄り', cam: L('羊皮紙を読むボルゴラムを正面から'), art: '条文を読み上げるボルゴラム。' },
          { take: 1, shot: '寄り', cam: L('羊皮紙を読むボルゴラムの横顔'), art: '読み続けるボルゴラム。' },
        ],
      },
      { h: 3, panels: [{ take: 1, shot: '中', cam: G('座ったガリヴァーの目から、足もとのボルゴラムを見下ろす', SEATED_EYE), art: '足もとで、ひときわ声を張るボルゴラム。' }] },
    ],
  },
  {
    scene: 'SC-007',
    tiers: [
      { h: 6, panels: [{ take: 1, shot: '引き', cam: L('神殿の前の地面から、誓いの姿勢のガリヴァーの全身を'), art: '右足を左手で持ち、右手の中指を頭の頂に、親指を右耳の先に当てて誓うガリヴァー。', size: true }] },
      {
        h: 4,
        panels: [
          { take: 1, shot: '寄り', cam: L('ガリヴァーの足もとから、真剣な顔を見上げる'), art: '奇妙な姿勢のまま、真剣な顔。', size: true },
          { take: 0, shot: '寄り', cam: L('見物の廷臣たちを'), art: '笑いをこらえる廷臣たち。' },
        ],
      },
    ],
  },
  {
    scene: 'SC-007',
    tiers: [
      { h: 4, panels: [{ take: 1, shot: '寄り', cam: L('左足首の鎖の留め金を', 60), art: '外れる鎖の留め金。' }] },
      { h: 3, panels: [{ take: 1, shot: '中', cam: L('外れた鎖の向こうに、背を向けて去るボルゴラムを'), art: '外れた鎖。面白くなさそうに背を向けるボルゴラム。' }] },
      { h: 3, panels: [{ take: 1, shot: '寄り', cam: L('去るボルゴラムの顔'), art: '吐き捨てるボルゴラム。' }] },
    ],
  },
  // SC-008 都と王宮（6ページ）
  {
    scene: 'SC-008',
    turn: 'めくると都ミルデンドウの全景。',
    tiers: [
      {
        h: 6,
        panels: [{ take: 1, shot: '大引き', cam: L('都の西の丘の上から、城壁に囲まれた都と、西の門の前に立つガリヴァーを', HILL), art: '都ミルデンドウ。一辺500フィートの正方形の城壁。西の門の前に立つガリヴァー。', size: true }],
      },
      { h: 4, panels: [{ take: 1, shot: '中', cam: L('都の城壁の上から、門へ近づくガリヴァーを', CITY_WALL), art: '門へ近づくガリヴァー。城壁の上の見張り。', size: true }] },
    ],
  },
  {
    scene: 'SC-008',
    tiers: [
      { h: 4, panels: [{ take: 1, shot: '中', cam: L('大通りの脇から、家へ逃げ込む民と、近づく巨大な靴を'), art: '家に逃げ込む民。大通りの向こうに巨大な靴。', size: true }] },
      { h: 4, panels: [{ take: 1, shot: '引き', cam: L('大通りの先から、横向きに歩くガリヴァーと屋根の上の見物人を'), art: '上着の裾を押さえ、大通りを横向きに慎重に歩くガリヴァー。屋根や窓の見物人。', size: true }] },
      { h: 3, panels: [{ take: 1, shot: '寄り', cam: L('家の屋根の上から、すれすれを通る脚を', ROOF), art: '屋根すれすれを通る脚。短い胴着だけの姿。', size: true }] },
    ],
  },
  {
    scene: 'SC-008',
    tiers: [
      { h: 5, panels: [{ take: 1, shot: '引き', cam: L('城壁の内側の道から、城壁をまたぐガリヴァーを見上げる'), art: '城壁をまたぐガリヴァー。', size: true }] },
      { h: 5, panels: [{ take: 1, shot: '寄り', cam: L('道に下ろされる巨大な靴を'), art: '道に下ろされる靴。跳ねる民。', size: true }] },
    ],
  },
  {
    scene: 'SC-008',
    tiers: [
      { h: 5, panels: [{ take: 1, shot: '大引き', cam: L('王宮の囲いの壁の上から、外庭と二つの内庭を', PALACE_WALL), art: '都の真ん中の王宮。40フィート四方の外庭と、その内の二つの庭。' }] },
      { h: 5, panels: [{ take: 1, shot: '引き', cam: L('外庭の地面から、腰掛けを足場に建物をまたぐガリヴァーを'), art: '高さ5フィートの腰掛けを二つ足場にして、内庭の建物をまたぐガリヴァー。', size: true }] },
    ],
  },
  {
    scene: 'SC-008',
    tiers: [
      { h: 5, panels: [{ take: 1, shot: '中', cam: L('奥の宮殿の上の階の部屋から、窓いっぱいの巨大な目と、驚く王子たちを', ROYAL_FLOOR), art: '窓いっぱいに覗き込む目。驚く王子たち。笑って手を差し出す皇后。', size: true }] },
      {
        h: 4,
        panels: [
          { take: 1, shot: '寄り', cam: L('部屋の中から、皇后を正面から', ROYAL_FLOOR), art: '手を差し出して迎える皇后。' },
          { take: 0, shot: '寄り', cam: L('部屋の奥から、窓の外の巨大な目を', ROYAL_FLOOR), art: '窓の外で、目がやわらかく笑う。', size: true },
        ],
      },
    ],
  },
  {
    scene: 'SC-008',
    tiers: [
      { h: 5, panels: [{ take: 1, shot: '寄り', cam: L('窓の脇から、皇后の手とガリヴァーの唇を', ROYAL_FLOOR), art: '皇后の小さな手に、そっと口づけするガリヴァー。', size: true }] },
      { h: 5, panels: [{ take: 1, shot: '大引き', cam: L('都の西の丘の上から、夕日の都と、王宮に寝そべるガリヴァーを', HILL), art: '夕日の都。王宮の内庭に寝そべるガリヴァー。', size: true }] },
    ],
  },
];

const VERSION = 'name-ep02-v1';
const REASON = 'ガリヴァー旅行記 第2話のネーム（fiction-manga@1.3.0 ネーム、3D の舞台で組んだ AI の提案）';

export async function buildGulliverEp02Name(stage?: StageInput) {
  const build = buildEpisodeName(2, EP02_NAME, stage);
  return {
    build,
    artifacts: [
      await native('design', 'gm1-ep02-name', '第2話「綱渡りの宮廷」ネーム（16ページ）', build.content, VERSION, REASON),
      await native('data', 'gm1-ep02-name-panels', '第2話 ネームのコマ表', panelTable(build.records, EP02_NAME, stage?.data), VERSION, REASON),
    ],
  };
}

