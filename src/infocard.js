/**
 * Info card module: tabbed intelligence card with Overview / Testimony / Resources / Video.
 * Events show Overview + Video tabs.
 * Memorials show all four tabs.
 */
import { dayToDate, formatDate } from './sigmoid.js';
import { currentZoomTransform } from './map.js';

// ── Video data ────────────────────────────────────────────
// Master pool: 35 unique numbered videos.
// #1–#24 provided by project; #25–#35 verified archive sources.
// Each card type receives exactly one unique video.
// Total pool capacity: up to #100 as new testimonies are added.

const VIDEO_POOL = [
  { id: 'E65mCPirNv8', title: '#1 — Testimony Archive',                               src: 'Genocide Archive Rwanda' },
  { id: '99O698TpL7M', title: '#2 — Testimony Archive',                               src: 'Genocide Archive Rwanda' },
  { id: '0aR5KogSPds', title: '#3 — Testimony Archive',                               src: 'Genocide Archive Rwanda' },
  { id: 'H6VJyFHIklI', title: '#4 — Testimony of Josephine Murebwayire',              src: 'Genocide Archive Rwanda' },
  { id: 'P_bAj6Ql92w', title: '#5 — Testimony Archive',                               src: 'Genocide Archive Rwanda' },
  { id: 'MslanLXzx6Y', title: '#6 — Testimony of Jean de Dieu Twahirwa',              src: 'Genocide Archive Rwanda' },
  { id: '9v0xplQKifE', title: '#7 — Testimony Archive',                               src: 'Genocide Archive Rwanda' },
  { id: 'MoaeY3oARiw', title: '#8 — Testimony Archive',                               src: 'Genocide Archive Rwanda' },
  { id: 'oz_HAf81mQs', title: '#9 — Testimony Archive',                               src: 'Genocide Archive Rwanda' },
  { id: 'hON_Xls2_F8', title: '#10 — Testimony Archive',                              src: 'Genocide Archive Rwanda' },
  { id: 'bmWLMtf2I80', title: '#11 — Testimony Archive',                              src: 'Genocide Archive Rwanda' },
  { id: 'ALdBddAV5Y0', title: '#12 — Testimony Archive',                              src: 'Genocide Archive Rwanda' },
  { id: 'j5ud96coXkc', title: '#13 — Testimony Archive',                              src: 'Genocide Archive Rwanda' },
  { id: '1X-UXw7lSG0', title: '#14 — Testimony Archive',                              src: 'Genocide Archive Rwanda' },
  { id: 'N5Jm3Bx1QJM', title: '#15 — Testimony Archive',                              src: 'Genocide Archive Rwanda' },
  { id: 'Dmqpqkh3jEo', title: '#16 — Testimony Archive',                              src: 'Genocide Archive Rwanda' },
  { id: 'kQIwK8QMeYY', title: '#17 — Testimony Archive',                              src: 'Genocide Archive Rwanda' },
  { id: 'pZGjfHkgsrQ', title: '#18 — Testimony Archive',                              src: 'Genocide Archive Rwanda' },
  { id: '3oQQuwtrbbU', title: '#19 — Testimony Archive',                              src: 'Genocide Archive Rwanda' },
  { id: 'fyRwT4k74vY', title: '#20 — Testimony Archive',                              src: 'Genocide Archive Rwanda' },
  { id: 'Zp3DLhPFa80', title: '#21 — Testimony Archive',                              src: 'Genocide Archive Rwanda' },
  { id: 'j3LhR790amI', title: '#22 — Testimony Archive',                              src: 'Genocide Archive Rwanda' },
  { id: 'aLR0znGlHoA', title: '#23 — Testimony Archive',                              src: 'Genocide Archive Rwanda' },
  { id: 'y7nQjW_UV0s', title: '#24 — Testimony Archive',                              src: 'Genocide Archive Rwanda' },
  { id: 'UUAa4XntNn4', title: '#25 — Genocide Archive of Rwanda',                    src: 'Aegis Trust' },
  { id: 'zwm7R59GKnw', title: '#26 — Kwibuka20: Remembering the Genocide',           src: 'Aegis Trust' },
  { id: 'XEJ2XoIw-MM', title: '#27 — Testimony of a Genocide Survivor from Rwanda',  src: 'United Nations' },
  { id: 'veWofkpazhs', title: '#28 — Memory of Genocide: Story of Survival',         src: 'United Nations' },
  { id: 'NNHKyhzjSHw', title: '#29 — 25 Years After: Survivors Share Their Stories', src: 'Al Jazeera' },
  { id: 'TdsVgDLV7Co', title: '#30 — Tutsi Genocide Survivor: Theoneste Karenzi',    src: 'USC Shoah Foundation' },
  { id: '_alDCgIzbyg', title: '#31 — Survivor: Hiding Like a Wild Animal',           src: 'Reuters' },
  { id: '8yPzfv-QKE4', title: '#32 — What I Witnessed on My Return to Rwanda',       src: 'YouTube' },
  { id: 'NWI8ASQqz9Y', title: '#33 — 1994 Genocide Against the Tutsi in Rwanda',     src: 'USC Shoah Foundation' },
  { id: 'dQFely6oULg', title: '#34 — Testimony of Eugenie Mukeshimana',              src: 'United Nations' },
  { id: '9jeYcBhAJFw', title: '#35 — Aegis Trust: Building Peace Through Education',                src: 'Aegis Trust' },
  // ── 100 Stories | Kwibuka playlist ───────────────────────
  { id: 'yb-fXwSjFiU', title: '#36 — 7 April 1994: Killings at Christus Remera',                  src: 'Kwibuka Rwanda' },
  { id: '1F7MCZSYwD4', title: '#37 — 9 April 1994: Massacres in Gikondo',                         src: 'Kwibuka Rwanda' },
  { id: 'yMlMn2najvY', title: '#38 — 11 April 1994: Massacre of Thousands at Nyanza-Kicukiro',    src: 'Kwibuka Rwanda' },
  { id: 'IfS01vBSK_w', title: '#39 — 15 April 1994: Nyamata Catholic Church',                     src: 'Kwibuka Rwanda' },
  { id: 'TvfUTQlmxJg', title: '#40 — 15 April 1994: Nyarubuye',                                   src: 'Kwibuka Rwanda' },
  { id: 'NXKHBfsZvx4', title: '#41 — 16 April 1994: Massacres at Ntarama Catholic Church',        src: 'Kwibuka Rwanda' },
  { id: '10RoNhpiYOw', title: '#42 — 18 April 1994: Stade Gatwaro',                               src: 'Kwibuka Rwanda' },
  { id: 'YPiwoiv2UJw', title: '#43 — 19 April 1994: Shelling of Amahoro Stadium',                 src: 'Kwibuka Rwanda' },
  { id: 'FFSREdCIjj0', title: '#44 — 20 April 1994: Origins of Division',                         src: 'Kwibuka Rwanda' },
  { id: 'XztQJBfAOtk', title: '#45 — 25 April 1994: RPF Evacuates Amahoro Stadium',               src: 'Kwibuka Rwanda' },
  { id: 'FI2S3YVWXMU', title: '#46 — Aurea Mukakalisa: Surviving the Genocide against the Tutsi', src: 'Kwibuka Rwanda' },
  { id: 'dSyKG_7RmBE', title: '#47 — History of Genocide against Tutsi in Rwanda: Cyanika 1963',                          src: 'Kwibuka Rwanda' },
  // ── Kwibuka Rwanda channel ────────────────────────────────
  { id: 'PweJwxcZR-c', title: '#48 — Kwibuka Conversations | Gael Faye',                                                  src: 'Kwibuka Rwanda' },
  { id: 'SB6s8j8vLgM', title: "#49 — Kwibuka Conversations | L'histoire de l'une des milles collines",                   src: 'Kwibuka Rwanda' },
  { id: 'FOw_ffhhzQ0', title: '#50 — Kwibuka Podcast | Uruhare rw\'inzego z\'ubucamanza mu itegurwa rya Jenoside',        src: 'Kwibuka Rwanda' },
  { id: '7DBZ7SY276o', title: '#51 — Kwibuka Podcast | Uruhare rw\'intiti mu itegurwa rya Jenoside yakorewe Abatutsi',    src: 'Kwibuka Rwanda' },
  { id: 'obliDmuNTso', title: '#52 — Kwibuka Podcast | Le rôle des prisons dans la planification du Génocide',           src: 'Kwibuka Rwanda' },
  { id: 'VljzWDScojY', title: '#53 — Kwibuka Podcast | Le rôle des médias pro-gouvernementaux dans le génocide',         src: 'Kwibuka Rwanda' },
  { id: 'oAKyR9Srp_Y', title: '#54 — Kwibuka Conversations | Entendez-nous !',                                           src: 'Kwibuka Rwanda' },
  { id: 'bNfMB_gabeM', title: '#55 — Kwibuka Conversations | La Françafrique et les responsabilités françaises',         src: 'Kwibuka Rwanda' },
  { id: 'PdPL1F3BDqg', title: '#56 — Kwibuka 30 Intergenerational Dialogue | Ingaruka za Jenoside yakorewe Abatutsi',    src: 'Kwibuka Rwanda' },
  { id: 'tNHeJMEkIY8', title: "#57 — Kwibuka Conversations | Lutter contre l'impunité et l'alliance du droit",           src: 'Kwibuka Rwanda' },
  { id: 'Gl3vxDrwSSo', title: '#58 — Kwibuka Conversations | La protection de la mémoire, lutte panafricaine',           src: 'Kwibuka Rwanda' },
  { id: 'A8F3ze0Azh4', title: '#59 — Kwibuka Podcast | Le rôle des médias dans le génocide (2)',                         src: 'Kwibuka Rwanda' },
  { id: 'kNROojSDx-E', title: '#60 — Kwibuka Podcast | Le rôle des établissements publics dans le génocide',             src: 'Kwibuka Rwanda' },
  { id: 'LoqDdkYdnWk', title: '#61 — Le rôle du Président Habyarimana dans la planification du Génocide',                src: 'Kwibuka Rwanda' },
  { id: 'JlQiixDe0Oc', title: '#62 — Le rôle des intellectuels dans la planification du Génocide contre les Tutsi',      src: 'Kwibuka Rwanda' },
  { id: 'QnBQahlQqIU', title: '#63 — Kwibuka Podcast | Le rôle des prisons dans la préparation du génocide',             src: 'Kwibuka Rwanda' },
  { id: 'ZgLbdaWzapQ', title: '#64 — Kwibuka Podcast | Le rôle des Milices dans la préparation du génocide',             src: 'Kwibuka Rwanda' },
  { id: 'AN-AeKopR-A', title: '#65 — Kwibuka Podcast | Le rôle des médias indépendants dans le génocide',                src: 'Kwibuka Rwanda' },
  { id: 'wSRKS2DxaXE', title: '#66 — Kwibuka Podcast | Uruhare rw\'ubucamanza mu itegurwa rya Jenoside',                 src: 'Kwibuka Rwanda' },
  { id: 'aHCpaWX8l_I', title: '#67 — Kwibuka Podcast | Uruhare rw\'Interahamwe n\'Impuzamugambi mu ikorwa rya Jenoside', src: 'Kwibuka Rwanda' },
  { id: 'h0USxGhUmkg', title: '#68 — Uruhare rw\'amagereza mu itegurwa rya Jenoside yakorewe Abatutsi',                  src: 'Kwibuka Rwanda' },
  { id: '2PQuIpO2l-g', title: '#69 — Kwibuka Podcast | Uruhare rw\'intiti mu itegurwa rya Jenoside (2)',                  src: 'Kwibuka Rwanda' },
  { id: 'dpwKv6EhwaY', title: '#70 — Uruhare rwa Perezida Habyarimana mu itegurwa rya Jenoside yakorewe Abatutsi',       src: 'Kwibuka Rwanda' },
  { id: 'SQrbbOMgX1Y', title: '#71 — The Role of Pro-Government Media in the Planning of the Genocide against the Tutsi', src: 'Kwibuka Rwanda' },
  { id: 'ORflbBgCw-I', title: '#72 — Kwibuka Podcast | The Role of Militias in the Preparation of the Genocide',         src: 'Kwibuka Rwanda' },
  { id: '4KEng4o8T3g', title: '#73 — Kwibuka Podcast | The Role of Prisons in the Planning of the Genocide',             src: 'Kwibuka Rwanda' },
  { id: 'RYLpJL85GgA', title: '#74 — The Role of Independent Media in the Preparation of the Genocide',                  src: 'Kwibuka Rwanda' },
  { id: '4-0ySvL1WIo', title: '#75 — Kwibuka Podcast | The Role of the Justice System in the Genocide',                  src: 'Kwibuka Rwanda' },
  { id: 'Nzlo6e76vYw', title: '#76 — Kwibuka Podcast | The Role of Government Controlled Media in the Genocide',         src: 'Kwibuka Rwanda' },
  { id: '0qPVAvnL5Kk', title: '#77 — The Role of the FAR Army in the Planning and Execution of the Genocide',                                  src: 'Kwibuka Rwanda' },
  // ── Kwibuka / Rwanda TV — Ubuhamya search ─────────────────
  { id: 'g7miEoWlOT8', title: '#78 — Kwibuka32: Ubuhamya bwa Ndagijimana Samuel | Uko yarokotse Jenoside i Karongi',                         src: 'Rwanda TV' },
  { id: '0Q0VZ2AKElY', title: '#79 — Kwibuka32: Ubuhamya bwa Ruzigangabe Jean Baptiste warokotse Jenoside yakorewe Abatutsi',                 src: 'Rwanda TV' },
  { id: 'TvjvIeNYovs', title: "#80 — Kwibuka32: Ubuhamya bwa Muteteri warokokeye i Nyanza ya Kicukiro",                                      src: 'Rwanda TV' },
  { id: '81MPzdSd_Pk', title: '#81 — Ubuhamya bwa Umulisa Joseline warokokeye i Kirehe | Kwibuka31',                                          src: 'Rwanda TV' },
  { id: 'KIRvuBk-UYA', title: "#82 — Kwibuka32: Nabajije urupfu uko ngiye gupfa ruransuzugura | Ubuhamya bwa Ngiruwonsanga",                  src: 'Rwanda TV' },
  { id: '5SZb-hxaTHU', title: "#83 — Twicwaga n'abo duturanye — Ubuhamya bwa Kayitesi Denise warokokeye Kibilizi | Kwibuka31",                src: 'Rwanda TV' },
  { id: 'Kzsh8cxJ-Qo', title: "#84 — Kwibuka32: 7 Mata — Ubuhamya bw'abarokotse hirya no hino mu mujyi wa Kigali",                          src: 'Rwanda TV' },
  { id: 'MIXQ3xD22vw', title: '#85 — Kwibuka32: Rwanda TV — Igikorwa cyo kwibuka Jenoside yakorewe Abatutsi',                                src: 'Rwanda TV' },
  { id: 'kr1YCugYQxo', title: '#86 — Tinyuka: Ubuhamya bwa Claudine Niyigena wahereye ku bihumbi 12',                                        src: 'Rwanda TV' },
  { id: 'reMX_H-bhXw', title: '#87 — Kwibuka32: Remarks by President Kagame | Kigali, 7 April 2026',                                         src: 'Rwanda TV' },
  { id: 'uMbFj7peMfQ', title: '#88 — Kwibuka29: Ubuhamya bushaririye bwa Eric Mwizerwa warokokeye i Ruhanga',                                src: 'Rwanda TV' },
  { id: '-hpAeJFmbcM', title: '#89 — Kwibuka32: Yatotejwe akiri mu mashuri — Inzira yo kurokoka kwa Mukamibungo Editha | Rutsiro',           src: 'Rwanda TV' },
  { id: 'v-TlXpDxcvc', title: '#90 — Kwibuka31: Ubuhamya bwa Karangwa JMV warokokeye Jenoside yakorewe Abatutsi muri Ste Famille',           src: 'Rwanda TV' },
  { id: 'w-fMiRg0AOo', title: "#91 — Ubuhamya bwa Ruyombyana Alexis warokokeye mu Mayaga | Kwibuka31",                                       src: 'Rwanda TV' },
  { id: 'q-o4rEIRCW4', title: "#92 — Kwibuka32: Ubuhamya bw'abarokokeye i Gikondo | Tariki 9 Mata 1994",                                    src: 'Rwanda TV' },
  // ── Additional Kwibuka / Rwanda TV testimony videos ───────
  { id: 'vAWjH5CkdxA', title: '#93 — Ubuhamya bwa Kayitare Leon Pierre warokotse Jenoside yakorewe Abatutsi i Butare',                    src: 'Rwanda TV' },
  { id: 'voq5B5J8gjI', title: '#94 — Kwibuka32: Tariki 10 Mata 1994, umunsi w\'icuraburindi muri Gahanga ya Kicukiro',                    src: 'Rwanda TV' },
  { id: '3MZF-s4DGNQ', title: '#95 — Kwibuka32: Habaye muyaga na muhoro — Ubu hariho Mahoro na Munyarwanda | Minisitiri Bizimana',        src: 'Rwanda TV' },
  { id: 'W760KeGYrQQ', title: "#96 — Ubuhamya bwa Mutabazi Marc wabuze umugore n'abana babiri muri Jenoside yakorewe Abatutsi",           src: 'Rwanda TV' },
  { id: 'VAtL-emedSc', title: '#97 — Nisabiye kuraswa: Ubuhamya bwa Hodari Marie Rose warokokeye Jenoside muri ETO Kicukiro',             src: 'Rwanda TV' },
  { id: 'GtQ-MncCeuo', title: '#98 — Ubuhamya bukomeye bwa Liliane Murangwayire warokokeye i Ntarama | Kwibuka31',                        src: 'Rwanda TV' },
  { id: 'ZpmHRFcFtH4', title: '#99 — Kwibuka31: Inkuru ya Jacky | Uko yarokotse Genocide yakorewe Abatutsi 1994',                         src: 'Rwanda TV' },
  { id: 'jduYQYMP-E8', title: '#100 — Ubuhamya bwa Twayisenga muri Jenoside yakorewe Abatutsi | Twibuke Twiyubuka | Kwibuka32',           src: 'Rwanda TV' },
];

// vp(...indices) — pick any number of videos from the pool by index.
// 11 filled slots × 3 videos = 33. Remaining 2 go to m12.
// Slots m13–m31 and all event slots are empty pending more videos (goal: 100+).
const vp = (...indices) => indices.map(i => VIDEO_POOL[i]);

const MEMORIAL_VIDEOS = {
  m1:  vp(0,  1,  2),   // #1 #2 #3
  m2:  vp(3,  4,  5),   // #4 #5 #6
  m3:  vp(6,  7,  8),   // #7 #8 #9
  m4:  vp(9,  10, 11),  // #10 #11 #12
  m5:  vp(12, 13, 14),  // #13 #14 #15
  m6:  vp(15, 16, 17),  // #16 #17 #18
  m7:  vp(18, 19, 20),  // #19 #20 #21
  m8:  vp(21, 22, 23),  // #22 #23 #24
  m9:  vp(24, 25, 26),  // #25 #26 #27
  m10: vp(27, 28, 29),  // #28 #29 #30
  m11: vp(30, 31, 32),  // #31 #32 #33
  m12: vp(33, 34),      // #34 #35 — 2 videos until pool grows
  m13: vp(35, 36, 37), // #36 #37 #38
  m14: vp(38, 39, 40), // #39 #40 #41
  m15: vp(41, 42, 43), // #42 #43 #44
  m16: vp(44, 45, 46), // #45 #46 #47
  m17: vp(47, 48, 49), // #48 #49 #50
  m18: vp(50, 51, 52), // #51 #52 #53
  m19: vp(53, 54, 55), // #54 #55 #56
  m20: vp(56, 57, 58), // #57 #58 #59
  m21: vp(59, 60, 61), // #60 #61 #62
  m22: vp(62, 63, 64), // #63 #64 #65
  m23: vp(65, 66, 67), // #66 #67 #68
  m24: vp(68, 69, 70), // #69 #70 #71
  m25: vp(71, 72, 73), // #72 #73 #74
  m26: vp(74, 75, 76), // #75 #76 #77
  m27: vp(77, 78, 79), // #78 #79 #80
  m28: vp(80, 81, 82), // #81 #82 #83
  m29: vp(83, 84, 85), // #84 #85 #86
  m30: vp(86, 87, 88), // #87 #88 #89
  m31: vp(89, 90, 91), // #90 #91 #92
};

// Event province slots use unassigned pool (#93–#100) first, then Kwibuka channel
// section (#48–#77) to avoid any overlap with the early Genocide Archive testimony
// videos (#1–#35) which are exclusively reserved for memorial cards.
const EVENT_VIDEOS_BY_PROV = {
  Kigali:   vp(92, 93, 94), // #93  #94  #95
  Eastern:  vp(95, 96, 97), // #96  #97  #98
  Western:  vp(98, 99, 50), // #99  #100 #51
  Northern: vp(53, 56, 59), // #54  #57  #60
  Southern: vp(62, 65, 68), // #63  #66  #69
};

const DEFAULT_VIDEOS = vp(71, 74, 77); // #72 #75 #78 — fallback for unassigned cards

// ── Helpers ───────────────────────────────────────────────

function renderVideos(vids) {
  const vidEl = document.getElementById('icVids');
  vidEl.innerHTML = vids.map(v =>
    `<div class="ic-video-card">` +
    `<div class="ic-video-thumb" data-vid="${v.id}">` +
    `<img src="https://img.youtube.com/vi/${v.id}/mqdefault.jpg" alt="${v.title}" loading="lazy" />` +
    `<div class="ic-video-play">&#9654;</div>` +
    `</div>` +
    `<div class="ic-video-info">` +
    `<div class="ic-video-title">${v.title}</div>` +
    `<div class="ic-video-src">${v.src}</div>` +
    `</div></div>`
  ).join('');

  vidEl.querySelectorAll('.ic-video-thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      const vid = thumb.dataset.vid;
      thumb.innerHTML =
        `<iframe src="https://www.youtube.com/embed/${vid}?autoplay=1" ` +
        `frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    });
  });
}

// ── Public API ────────────────────────────────────────────

function commanderInitials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || 'RPF';
}

function renderCommanderPhoto(item) {
  function photoSlot(name, photo, roleClass, badge) {
    const inits = commanderInitials(name.replace(/^Lt\.\s*Col\.\s*/i, ''));
    const inner = photo
      ? `<img src="${photo}" alt="${name}" />`
      : `<div class="cmdr-avatar-bg"></div><div class="cmdr-initials">${inits}</div>`;
    return `<div class="cmdr-wrap ${roleClass}-wrap">` +
      `<div class="cmdr-slot ${roleClass}">` +
      `<div class="cmdr-badge">${badge}</div>` +
      inner +
      `</div>` +
      `<div class="cmdr-name">${name}</div>` +
      `</div>`;
  }

  const cmdRank = item.commanderRank || 'COL';
  const cmdSlot = photoSlot(cmdRank + ' ' + item.commander, item.commanderPhoto || '', 'slot-cmd', 'CMD');
  const depName = item.deputy || '—';
  const depSlot = photoSlot(depName, item.deputyPhoto || '', 'slot-2ic', '2IC');

  return `<div class="cmdr-pair">${cmdSlot}${depSlot}</div>`;
}

// ── Drag support ─────────────────────────────────────────
function initDrag(card) {
  if (card._dragInit) return;
  card._dragInit = true;

  const header = card.querySelector('.icard-h');
  header.addEventListener('mousedown', e => {
    if (e.target.closest('.icard-x')) return;
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startL = parseInt(card.style.left) || 0;
    const startT = parseInt(card.style.top) || 0;
    header.classList.add('dragging');
    card.style.transition = 'none';

    const onMove = e => {
      let l = startL + e.clientX - startX;
      let t = startT + e.clientY - startY;
      // Keep within viewport
      l = Math.max(0, Math.min(l, window.innerWidth - 60));
      t = Math.max(0, Math.min(t, window.innerHeight - 40));
      card.style.left = l + 'px';
      card.style.top = t + 'px';
    };
    const onUp = () => {
      header.classList.remove('dragging');
      card.style.transition = '';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}

/**
 * Show the info card for an event or memorial.
 * @param {Object} item - Event or memorial object
 * @param {number[]} screenPos - [x, y] SVG-space position within map-wrap
 */
export function showInfoCard(item, screenPos) {
  const card = document.getElementById('icard');
  card.classList.toggle('rpf-card', !!item._isRpf);
  initDrag(card);

  const mobile = window.innerWidth < 768;

  if (!mobile) {
    const wrap = document.getElementById('mapWrap');
    const rect = wrap.getBoundingClientRect();
    const cardWidth = item._isRpf ? 480 : 340;
    // Apply zoom transform so card opens at the actual rendered position
    const [zx, zy] = currentZoomTransform.apply(screenPos);
    let left = rect.left + zx + 16;
    let top = rect.top + zy - 80;
    // Clamp so card stays fully on screen
    if (left + cardWidth > window.innerWidth - 8) left = rect.left + zx - cardWidth - 16;
    if (left < 8) left = 8;
    if (top < 8) top = 8;
    if (top + 320 > window.innerHeight) top = window.innerHeight - 320;
    card.style.left = left + 'px';
    card.style.top = top + 'px';
  } else {
    card.style.left = '';
    card.style.top = '';
  }

  document.getElementById('icT').textContent = item.name;
  document.getElementById('icDt').textContent =
    item._isMemorial ? (item.est ? 'Est. ' + item.est : '—') : formatDate(dayToDate(item.day));
  const livesLabel = document.getElementById('icLvLbl');
  const livesValue = document.getElementById('icLv');
  livesLabel.textContent = item._isRpf ? 'Lives saved' : 'Lives lost';
  livesValue.classList.toggle('r', !item._isRpf);
  livesValue.classList.toggle('g', !!item._isRpf);
  livesValue.textContent = item.lives > 0 ? item.lives.toLocaleString() : 'N/A';
  document.getElementById('icTp').textContent = item.type;
  document.getElementById('icPr').textContent = item.prov;
  document.getElementById('icDs').textContent = item.desc;

  const tabs = document.getElementById('icTabs');
  const badge = document.getElementById('icBadge');
  const photo = document.getElementById('icPhoto');
  photo.innerHTML = item._isRpf ? renderCommanderPhoto(item) : '';

  // Always show tabs except for RPF operation cards; memorial-only tabs toggled per item type
  tabs.style.display = item._isRpf ? 'none' : 'flex';
  document.querySelectorAll('.mem-tab').forEach(t => {
    t.style.display = item._isMemorial ? '' : 'none';
  });

  if (item._isRpf) {
    badge.innerHTML = '<div class="ic-type-badge natl">RPF OFFENSIVE</div>';
  } else if (item._isMemorial) {
    const badgeClass = item.badge || 'regional';
    const badgeLabel = badgeClass === 'unesco' ? 'UNESCO WORLD HERITAGE'
      : badgeClass === 'natl' ? 'NATIONAL MEMORIAL' : 'REGIONAL MEMORIAL';
    badge.innerHTML = `<div class="ic-type-badge ${badgeClass}">${badgeLabel}</div>`;

    const testimony = item.testimony;
    document.getElementById('icTQ').textContent =
      testimony ? testimony.text : 'No testimony available for this site.';
    document.getElementById('icTA').textContent =
      testimony ? `— ${testimony.attribution} (Source: ${testimony.source})` : '';
    document.getElementById('icCtx').textContent = item.context || '';

    document.getElementById('icEst').textContent = item.est ? `Established: ${item.est}` : '';
    document.getElementById('icRes').innerHTML = (item.resources || []).map(r =>
      `<a href="${r.url}" target="_blank" rel="noopener" class="ic-res-link">` +
      `<span class="rl-icon">&#8594;</span>${r.label}</a>`
    ).join('');

    renderVideos(MEMORIAL_VIDEOS[item.id] || DEFAULT_VIDEOS);
  } else {
    badge.innerHTML = '';
    renderVideos(EVENT_VIDEOS_BY_PROV[item.prov] || DEFAULT_VIDEOS);
  }

  showTab('overview');
  card.classList.add('vis');
}

/**
 * Switch info card tab.
 * @param {string} tabName - 'overview' | 'testimony' | 'resources' | 'video'
 */
export function showTab(tabName) {
  document.querySelectorAll('.ic-tab').forEach(btn => {
    btn.classList.toggle('on', btn.textContent.trim().toLowerCase() === tabName);
  });
  document.querySelectorAll('.ic-pane').forEach(pane => {
    pane.classList.toggle('on', pane.id === 'pane-' + tabName);
  });
}

/**
 * Close the info card.
 */
export function closeInfoCard() {
  document.getElementById('icard').classList.remove('vis');
}

// ── Testimonies gallery pagination ───────────────────────
const T_PAGE_SIZE = 12;
let _tPage = 1;

function _renderTPage(page) {
  const total = Math.ceil(VIDEO_POOL.length / T_PAGE_SIZE);
  const start = (page - 1) * T_PAGE_SIZE;
  const slice = VIDEO_POOL.slice(start, start + T_PAGE_SIZE);
  const grid  = document.getElementById('testGrid');

  grid.innerHTML = slice.map((v, i) => {
    const num   = start + i + 1;
    const title = v.title.replace(/^#\d+\s*[—–-]\s*/, '');
    return `<div class="test-card" data-vid="${v.id}">` +
      `<div class="test-thumb">` +
      `<img src="https://img.youtube.com/vi/${v.id}/hqdefault.jpg" alt="${title}" loading="lazy" />` +
      `<div class="test-play">&#9654;</div>` +
      `<span class="test-badge">#${num}</span>` +
      `</div>` +
      `<div class="test-info">` +
      `<div class="test-ttl">${title}</div>` +
      `<div class="test-src">${v.src}</div>` +
      `</div></div>`;
  }).join('');

  grid.querySelectorAll('.test-card').forEach(card => {
    card.addEventListener('click', () => {
      const vid   = card.dataset.vid;
      const thumb = card.querySelector('.test-thumb');
      thumb.innerHTML =
        `<iframe src="https://www.youtube.com/embed/${vid}?autoplay=1" ` +
        `frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    });
  });

  document.getElementById('testPageInfo').textContent = `Page ${page} / ${total}`;
  document.getElementById('testPrev').disabled = page <= 1;
  document.getElementById('testNext').disabled = page >= total;
  grid.scrollTop = 0;
}

// ── Rwanda Tech: innovation & memory channel ─────────────
// Replace placeholder IDs with verified Rwanda tech video IDs.
const RWANDA_TECH = [
  { id: 'j5ud96coXkc', title: 'Kigali Innovation City — Building Africa\'s Silicon Valley',  org: 'Rwanda Development Board',      tag: 'Infrastructure' },
  { id: '1X-UXw7lSG0', title: 'Digital Genocide Archive — AI Testimony Analysis Project',    org: 'Genocide Archive Rwanda',       tag: 'AI & Memory' },
  { id: 'N5Jm3Bx1QJM', title: 'VR Memorial Experience — Murambi in Virtual Reality',         org: 'Kigali Tech Collective',        tag: 'VR / Immersive' },
  { id: 'bmWLMtf2I80', title: 'Smart Kigali — Drone Mapping of Memorial Sites',              org: 'Rwanda Space Agency',           tag: 'GIS & Drones' },
  { id: 'ALdBddAV5Y0', title: 'Kwibuka Digital — Online Commemoration Platform Launch',      org: 'CNLG Rwanda',                   tag: 'Digital Heritage' },
  { id: 'oz_HAf81mQs', title: 'African Leadership University — Tech for Social Justice',     org: 'ALU Rwanda',                    tag: 'Education' },
  { id: 'hON_Xls2_F8', title: 'Irembo Gov Platform — Digitizing Rwandan Public Services',   org: 'Irembo Ltd',                    tag: 'GovTech' },
  { id: 'MoaeY3oARiw', title: 'Coding Bootcamp — Training 1000 Young Rwandan Developers',   org: 'Andela Rwanda',                 tag: 'Workforce' },
];

export function renderRwandaTech() {
  const grid = document.getElementById('rtGrid');
  if (!grid) return;
  grid.innerHTML = RWANDA_TECH.map(v => `
    <div class="rt-card" data-vid="${v.id}">
      <div class="rt-thumb">
        <img src="https://img.youtube.com/vi/${v.id}/hqdefault.jpg" alt="${v.title}" loading="lazy" />
        <div class="test-play">&#9654;</div>
        <span class="rt-tag">${v.tag}</span>
      </div>
      <div class="rt-card-info">
        <div class="rt-card-title">${v.title}</div>
        <div class="rt-card-org">${v.org}</div>
      </div>
    </div>`).join('');
  grid.querySelectorAll('.rt-card').forEach(card => {
    card.addEventListener('click', () => {
      const vid = card.dataset.vid;
      const thumb = card.querySelector('.rt-thumb');
      thumb.innerHTML = `<iframe src="https://www.youtube.com/embed/${vid}?autoplay=1" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    });
  });
}

// ── Memory Keepers: diaspora community submissions ────────
// Replace placeholder video IDs with verified community submission IDs.
const MEMORY_KEEPERS = [
  { id: 'E65mCPirNv8', title: 'Kwibuka 30 — London Memorial Service 2024',         community: 'Rwandan Community UK',              country: 'United Kingdom', flag: '🇬🇧', region: 'Europe' },
  { id: '99O698TpL7M', title: 'Kwibuka 30 — Brussels Candlelight Vigil',            community: 'Association des Rwandais de Belgique', country: 'Belgium',        flag: '🇧🇪', region: 'Europe' },
  { id: '0aR5KogSPds', title: 'Kwibuka 30 — Paris Commemoration at UNESCO',        community: 'Ibuka France',                       country: 'France',          flag: '🇫🇷', region: 'Europe' },
  { id: 'H6VJyFHIklI', title: 'Never Again — New York City Memorial Walk',          community: 'Rwandan Community NYC',              country: 'United States',   flag: '🇺🇸', region: 'Americas' },
  { id: 'P_bAj6Ql92w', title: 'Kwibuka at the UN — Washington DC Ceremony',        community: 'Rwandan Diaspora USA',               country: 'United States',   flag: '🇺🇸', region: 'Americas' },
  { id: 'MslanLXzx6Y', title: 'Kwibuka 30 — Ottawa Community Gathering',           community: 'Rwandan Canadian Community',         country: 'Canada',          flag: '🇨🇦', region: 'Americas' },
  { id: '9v0xplQKifE', title: 'Kwibuka 30 — Stockholm Memorial Evening',           community: 'Rwandier i Sverige',                 country: 'Sweden',          flag: '🇸🇪', region: 'Europe' },
  { id: 'MoaeY3oARiw', title: 'Kwibuka 30 — Amsterdam Vigil & Testimony',          community: 'Rwandese Gemeenschap Nederland',     country: 'Netherlands',     flag: '🇳🇱', region: 'Europe' },
  { id: 'oz_HAf81mQs', title: 'Kwibuka 30 — Nairobi East Africa Memorial',         community: 'Rwanda Diaspora Kenya',              country: 'Kenya',           flag: '🇰🇪', region: 'Africa' },
  { id: 'hON_Xls2_F8', title: 'Kwibuka 30 — Johannesburg Community Commemoration', community: 'Rwandan Community South Africa',     country: 'South Africa',    flag: '🇿🇦', region: 'Africa' },
  { id: 'bmWLMtf2I80', title: 'Kwibuka 30 — Sydney Memorial Service',              community: 'Rwandan Community Australia',        country: 'Australia',       flag: '🇦🇺', region: 'Oceania' },
  { id: 'ALdBddAV5Y0', title: 'Kwibuka 30 — Berlin Remembrance Ceremony',          community: 'Rwandische Gemeinschaft Deutschland', country: 'Germany',         flag: '🇩🇪', region: 'Europe' },
];

export function renderMemoryKeepers() {
  const grid = document.getElementById('mkGrid');
  if (!grid) return;
  grid.innerHTML = MEMORY_KEEPERS.map(v => `
    <div class="mk-card" data-region="${v.region}" data-vid="${v.id}">
      <div class="mk-thumb">
        <img src="https://img.youtube.com/vi/${v.id}/hqdefault.jpg" alt="${v.title}" loading="lazy" />
        <div class="test-play">&#9654;</div>
        <span class="mk-country-badge">${v.flag} ${v.country}</span>
      </div>
      <div class="mk-card-info">
        <div class="mk-card-title">${v.title}</div>
        <div class="mk-card-community">${v.community}</div>
      </div>
    </div>`).join('');
  grid.querySelectorAll('.mk-card').forEach(card => {
    card.addEventListener('click', () => {
      const vid = card.dataset.vid;
      const thumb = card.querySelector('.mk-thumb');
      thumb.innerHTML = `<iframe src="https://www.youtube.com/embed/${vid}?autoplay=1" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    });
  });
}

export function openTestimoniesModal(page = 1) {
  _tPage = page;
  _renderTPage(page);
  document.getElementById('testModal').classList.add('vis');
}

export function testimoniesPrev() {
  if (_tPage > 1) { _tPage--; _renderTPage(_tPage); }
}

export function testimoniesNext() {
  const total = Math.ceil(VIDEO_POOL.length / T_PAGE_SIZE);
  if (_tPage < total) { _tPage++; _renderTPage(_tPage); }
}
