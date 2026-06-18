import events from '../data/events.json';
import { dayToDate, formatDate } from './sigmoid.js';
import { getTestimonyVideoPool } from './infocard.js';
import { loadMuseumCollection } from './wikiMuseumData.js';

const ROOM_CONFIGS = {
  origins: { x: 0, label: 'Origins 1959-1973', color: 0xb9aa91 },
  preparation: { x: 34, label: 'Preparation 1987-1993', color: 0xa99b89 },
  hundredDays: { x: 68, label: '100 Days 1994', color: 0x9b8a78 },
  testimonies: { x: 102, label: '100 Testimonies', color: 0xd8d1c8 },
};

const ROOM_WIDTH = 19.6;
const ROOM_DEPTH = 120;
const ROOM_HALF_WIDTH = ROOM_WIDTH / 2;
const ROOM_HALF_DEPTH = ROOM_DEPTH / 2;
const CAMERA_NEAR_Z = 52;
const CAMERA_FAR_Z = -45;
const CAMERA_SCREEN_Z = -38;

let THREE;
let renderer;
let scene;
let camera;
let stage;
let canvas;
let collection = { topics: [], timeline: [] };
let clickableObjects = [];
let raycaster;
let pointer;
let cameraTarget = { x: 0, y: 2.15, z: 0 };
let cameraPosition = null;
let yaw = 0;
let pitch = 0;
let radius = 1;
let dragging = false;
let dragPoint = { x: 0, y: 0 };
let resizeObserver;
let screenMesh;
let rafId;
let timelineState = { x: 48, y: 46, scale: 0.72, dragging: false, startX: 0, startY: 0 };
let selectedPayload = null;
let keydownBound = false;
let currentRoom = 'origins';

const testimonyVideos = getTestimonyVideoPool();

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function isOpen() {
  return document.body.classList.contains('museum-open');
}

function moveThroughHall(delta) {
  cameraTarget.z = clamp((cameraTarget.z ?? CAMERA_NEAR_Z) + delta, CAMERA_FAR_Z, CAMERA_NEAR_Z);
}

async function loadThree() {
  if (!THREE) THREE = await import('three');
  return THREE;
}

function setStatus(text) {
  const el = document.getElementById('museumDataStatus');
  if (el) el.textContent = text;
}

function setRoomLabel(room) {
  const label = document.getElementById('museumRoomLabel');
  if (label) label.textContent = `Gallery: ${ROOM_CONFIGS[room]?.label || room}`;
}

function wrapCanvasText(ctx, text = '', x, y, maxWidth, lineHeight, maxLines = 5) {
  const words = String(text).split(/\s+/);
  let line = '';
  let lines = 0;
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = word;
      y += lineHeight;
      lines += 1;
      if (lines >= maxLines - 1) break;
    } else {
      line = testLine;
    }
  }
  if (line) ctx.fillText(line, x, y);
}

function makeLabelTexture(title, subtitle, options = {}) {
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = 1024;
  textureCanvas.height = 640;
  const ctx = textureCanvas.getContext('2d');
  const bg = options.bg || '#11100e';
  const fg = options.fg || '#f5efe5';
  const accent = options.accent || '#c75a48';

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, textureCanvas.width, textureCanvas.height);
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, textureCanvas.width, 18);
  ctx.fillRect(50, 92, 6, 438);

  ctx.fillStyle = fg;
  ctx.font = options.titleFont || '700 56px Georgia, serif';
  wrapCanvasText(ctx, title, 86, 128, 830, options.titleLine || 66, options.titleLines || 3);
  ctx.fillStyle = 'rgba(245,239,229,.76)';
  ctx.font = options.bodyFont || '30px Arial, sans-serif';
  wrapCanvasText(ctx, subtitle, 86, 330, 830, options.bodyLine || 42, options.bodyLines || 4);
  ctx.fillStyle = 'rgba(245,239,229,.48)';
  ctx.font = '22px Arial, sans-serif';
  ctx.fillText(options.footer || 'Genocide against the Tutsi memorial archive', 86, 570);

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function makeSpotGlowTexture() {
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = 512;
  textureCanvas.height = 768;
  const ctx = textureCanvas.getContext('2d');
  const gradient = ctx.createRadialGradient(256, 210, 12, 256, 250, 340);
  gradient.addColorStop(0, 'rgba(255,244,218,.82)');
  gradient.addColorStop(0.32, 'rgba(255,231,191,.36)');
  gradient.addColorStop(0.68, 'rgba(255,220,170,.12)');
  gradient.addColorStop(1, 'rgba(255,220,170,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, textureCanvas.width, textureCanvas.height);

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeCinemaScreenTexture(video = null) {
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = 1600;
  textureCanvas.height = 900;
  const ctx = textureCanvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, textureCanvas.height);
  gradient.addColorStop(0, '#111213');
  gradient.addColorStop(0.5, '#050607');
  gradient.addColorStop(1, '#15120f');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, textureCanvas.width, textureCanvas.height);
  ctx.strokeStyle = '#b69a63';
  ctx.lineWidth = 18;
  ctx.strokeRect(18, 18, textureCanvas.width - 36, textureCanvas.height - 36);

  ctx.fillStyle = '#f3eadc';
  ctx.font = '700 58px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(video ? 'NOW PLAYING' : '100 TESTIMONIES', textureCanvas.width / 2, 360);
  ctx.font = '30px Arial, sans-serif';
  ctx.fillStyle = 'rgba(243,234,220,.72)';
  wrapCanvasText(
    ctx,
    video ? video.title : 'Select a video work from either wall. The testimony opens here on the cinema screen at the end of the hall.',
    270,
    430,
    1060,
    44,
    4
  );
  ctx.fillStyle = 'rgba(243,234,220,.5)';
  ctx.font = '22px Arial, sans-serif';
  ctx.fillText(video?.src || 'Genocide Archive Rwanda // Aegis Trust testimony wall', textureCanvas.width / 2, 720);

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function makeVideoPlacardTexture(video, index) {
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = 640;
  textureCanvas.height = 390;
  const ctx = textureCanvas.getContext('2d');
  ctx.fillStyle = '#f4efe6';
  ctx.fillRect(0, 0, textureCanvas.width, textureCanvas.height);
  ctx.fillStyle = '#5d452a';
  ctx.fillRect(0, 0, textureCanvas.width, 16);
  ctx.fillRect(0, textureCanvas.height - 16, textureCanvas.width, 16);
  ctx.fillStyle = '#1a1410';
  ctx.fillRect(34, 42, 572, 238);
  ctx.fillStyle = '#b63e2d';
  ctx.beginPath();
  ctx.moveTo(292, 128);
  ctx.lineTo(292, 194);
  ctx.lineTo(354, 161);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#231916';
  ctx.font = '700 26px Arial, sans-serif';
  wrapCanvasText(ctx, video.title.replace(/^#\d+\s+[-â€”]\s+/, ''), 42, 322, 556, 32, 2);
  ctx.fillStyle = 'rgba(35,25,22,.62)';
  ctx.font = '18px Arial, sans-serif';
  ctx.fillText(`Testimony ${index + 1} / ${testimonyVideos.length}`, 42, 368);

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function createMaterial(color, roughness = 0.68, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function addRoom(config, index) {
  const group = new THREE.Group();
  group.position.x = config.x;
  scene.add(group);

  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.62,
    metalness: 0.02,
    emissive: 0xffffff,
    emissiveIntensity: 0.18,
    side: THREE.DoubleSide,
  });
  const sideWallMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.58,
    metalness: 0.01,
    emissive: 0xffffff,
    emissiveIntensity: 0.34,
    side: THREE.DoubleSide,
  });
  const floorMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x050505,
    roughness: 0.2,
    metalness: 0.12,
    clearcoat: 0.42,
    clearcoatRoughness: 0.28,
    side: THREE.DoubleSide,
  });
  const darkTrim = createMaterial(0x24201d, 0.6, 0.05);

  const floor = new THREE.Mesh(new THREE.BoxGeometry(ROOM_WIDTH, 0.35, ROOM_DEPTH), floorMaterial);
  floor.position.set(0, -0.2, 0);
  floor.receiveShadow = true;
  group.add(floor);

  const reflectionStrip = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM_WIDTH * 0.62, ROOM_DEPTH * 0.96),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.32, depthWrite: false })
  );
  reflectionStrip.rotation.x = -Math.PI / 2;
  reflectionStrip.position.set(0, 0.005, -0.25);
  group.add(reflectionStrip);

  [-ROOM_HALF_WIDTH + 0.36, ROOM_HALF_WIDTH - 0.36].forEach(x => {
    const floorHighlight = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, ROOM_DEPTH * 0.82),
      new THREE.MeshBasicMaterial({ color: 0x202020, transparent: true, opacity: 0.16, depthWrite: false })
    );
    floorHighlight.rotation.x = -Math.PI / 2;
    floorHighlight.position.set(x, 0.012, -1.2);
    group.add(floorHighlight);
  });

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(ROOM_WIDTH, 8.5, 0.45), wallMaterial);
  backWall.position.set(0, 4.05, -ROOM_HALF_DEPTH);
  backWall.receiveShadow = true;
  group.add(backWall);

  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.45, 8.5, ROOM_DEPTH), sideWallMaterial);
  leftWall.position.set(-ROOM_HALF_WIDTH, 4.05, 0);
  leftWall.receiveShadow = true;
  group.add(leftWall);

  const rightWall = leftWall.clone();
  rightWall.position.x = ROOM_HALF_WIDTH;
  group.add(rightWall);

  const backBaseTrim = new THREE.Mesh(new THREE.BoxGeometry(ROOM_WIDTH, 0.18, 0.16), darkTrim);
  backBaseTrim.position.set(0, 0.55, -ROOM_HALF_DEPTH + 0.28);
  group.add(backBaseTrim);

  [-ROOM_HALF_WIDTH + 0.28, ROOM_HALF_WIDTH - 0.28].forEach(x => {
    const sideBaseTrim = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.18, ROOM_DEPTH), darkTrim);
    sideBaseTrim.position.set(x, 0.55, 0);
    group.add(sideBaseTrim);
  });

  [-1, 1].forEach(dir => {
    const lowerWallWash = new THREE.Mesh(
      new THREE.PlaneGeometry(ROOM_DEPTH - 2, 3.7),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.86,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    lowerWallWash.rotation.y = Math.PI / 2;
    lowerWallWash.position.set(dir * (ROOM_HALF_WIDTH - 0.24), 2.25, 0);
    group.add(lowerWallWash);
  });

  const ceilingMaterial = createMaterial(0x755c3e, 0.68, 0.04);
  ceilingMaterial.side = THREE.DoubleSide;
  [-1, 1].forEach(dir => {
    const ceilingPanel = new THREE.Mesh(
      new THREE.BoxGeometry(6.1, 0.35, ROOM_DEPTH),
      ceilingMaterial
    );
    ceilingPanel.position.set(dir * 5.25, 8.35, 0);
    group.add(ceilingPanel);
  });

  const skylightWellMaterial = createMaterial(0x8b816f, 0.7, 0.02);
  skylightWellMaterial.side = THREE.DoubleSide;
  [-1, 1].forEach(dir => {
    const skylightEdge = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.42, ROOM_DEPTH - 1.2), skylightWellMaterial);
    skylightEdge.position.set(dir * 2.28, 8.18, -0.3);
    group.add(skylightEdge);
  });

  const skylight = new THREE.Mesh(
    new THREE.BoxGeometry(4.35, 0.08, ROOM_DEPTH - 2.2),
    new THREE.MeshBasicMaterial({ color: 0xfffbef })
  );
  skylight.position.set(0, 8.08, -0.45);
  group.add(skylight);

  const leftTrack = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, ROOM_DEPTH - 3.4), createMaterial(0x050505, 0.34, 0.24));
  leftTrack.position.set(-4.7, 7.92, -0.6);
  group.add(leftTrack);
  const rightTrack = leftTrack.clone();
  rightTrack.position.x = 4.7;
  group.add(rightTrack);

  // Soft background wall-wash fill so the full length of each side wall stays lit,
  // not just where the alternating ceiling spots happen to land.
  [-1, 1].forEach(dir => {
    [-ROOM_DEPTH / 4, ROOM_DEPTH / 4].forEach(zPos => {
      const wash = new THREE.PointLight(0xfff2dc, 2.4, ROOM_DEPTH * 0.9, 1.4);
      wash.position.set(dir * (ROOM_HALF_WIDTH - 2.6), 5.2, zPos);
      group.add(wash);
    });

    [-ROOM_DEPTH / 3, 0, ROOM_DEPTH / 3].forEach(zPos => {
      const lowerWash = new THREE.PointLight(0xffffff, 3.2, ROOM_DEPTH * 0.55, 1.25);
      lowerWash.position.set(dir * (ROOM_HALF_WIDTH - 1.45), 1.95, zPos);
      group.add(lowerWash);
    });
  });

  for (let z = -ROOM_HALF_DEPTH + 8; z <= ROOM_HALF_DEPTH - 8; z += 7) {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(ROOM_WIDTH - 1.6, 0.16, 0.16), darkTrim);
    rib.position.set(0, 8.08, z);
    group.add(rib);

    const light = new THREE.SpotLight(0xffdfbd, 3.6, 18, Math.PI / 6.8, 0.58, 1.0);
    const side = Math.round((z + ROOM_HALF_DEPTH) / 7) % 2 === 0 ? -1 : 1;
    light.position.set(side * 4.7, 7.75, z);
    light.target.position.set(side * (ROOM_HALF_WIDTH - 1.3), 3.2, z - 1.4);
    light.castShadow = true;
    light.shadow.mapSize.set(1024, 1024);
    group.add(light, light.target);

    [-4.7, 4.7].forEach(x => {
      const lamp = new THREE.Mesh(
        new THREE.BoxGeometry(0.34, 0.26, 0.52),
        new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.28, metalness: 0.35 })
      );
      lamp.position.set(x, 7.65, z);
      lamp.rotation.y = x < 0 ? -0.58 : 0.58;
      lamp.rotation.x = -0.18;
      group.add(lamp);
    });
  }

  const bench = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.45, 1.2), createMaterial(0x594935, 0.42, 0.03));
  bench.position.set(-1.2 + index * 0.45, 0.55, 5.9);
  bench.castShadow = true;
  bench.receiveShadow = true;
  group.add(bench);

  const plinth = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.05, 2.6), createMaterial(0xd7d1c5, 0.72, 0.01));
  plinth.position.set(0, 0.5, -12.2);
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  group.add(plinth);

  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.58, 1.8, 32),
    new THREE.MeshStandardMaterial({ color: 0xf0b867, roughness: 0.36, metalness: 0.08, emissive: 0x3b1804, emissiveIntensity: 0.28 })
  );
  flame.position.set(0, 1.82, -12.2);
  flame.castShadow = true;
  group.add(flame);

  const roomLabel = new THREE.Mesh(
    new THREE.PlaneGeometry(6.4, 2.4),
    new THREE.MeshStandardMaterial({
      map: makeLabelTexture(config.label, 'A simulated Kigali Genocide Memorial gallery wall for remembrance, history, and testimony.', {
        bg: '#171411',
        accent: '#c75a48',
        footer: 'Kwibuka virtual visit',
      }),
      roughness: 0.7,
    })
  );
  roomLabel.position.set(0, 3.55, -ROOM_HALF_DEPTH + 0.24);
  group.add(roomLabel);

  const portal = new THREE.Mesh(new THREE.BoxGeometry(2.8, 5.4, 0.34), createMaterial(0x111315, 0.82, 0.02));
  portal.position.set(ROOM_HALF_WIDTH - 0.2, 2.55, 12.2);
  portal.rotation.y = Math.PI / 2;
  group.add(portal);
}

function addFramedPanel(roomKey, item, offsetIndex, total) {
  const room = ROOM_CONFIGS[roomKey] || ROOM_CONFIGS.origins;
  const frameMaterial = createMaterial(0x4a3026, 0.36, 0.08);
  const side = offsetIndex % 2 === 0 ? 'left' : 'right';
  const sideIndex = Math.floor(offsetIndex / 2);
  const sideTotal = Math.max(1, Math.ceil(total / 2));
  const zStep = sideTotal > 1 ? 20 / (sideTotal - 1) : 0;
  const localZ = 8.8 - sideIndex * zStep;
  const localX = side === 'left' ? -ROOM_HALF_WIDTH + 0.25 : ROOM_HALF_WIDTH - 0.25;
  const group = new THREE.Group();
  group.position.set(room.x + localX, 3.62, localZ);
  group.rotation.y = side === 'left' ? Math.PI / 2 : -Math.PI / 2;
  scene.add(group);

  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(4.7, 5.25),
    new THREE.MeshBasicMaterial({
      map: makeSpotGlowTexture(),
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  glow.position.set(0, 0.12, 0.005);
  group.add(glow);

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(3.55, 2.36),
    new THREE.MeshStandardMaterial({
      map: makeLabelTexture(item.title, item.subtitle || item.extract, {
        accent: '#d88b60',
        footer: item.source || 'Wikipedia + project archive',
      }),
      roughness: 0.62,
      metalness: 0,
    })
  );
  mesh.position.set(0, 0, 0.03);
  mesh.castShadow = true;
  mesh.userData = { payload: item };
  group.add(mesh);
  clickableObjects.push(mesh);

  [
    { w: 3.96, h: 0.16, x: 0, y: 1.26 },
    { w: 3.96, h: 0.16, x: 0, y: -1.26 },
    { w: 0.16, h: 2.68, x: -1.9, y: 0 },
    { w: 0.16, h: 2.68, x: 1.9, y: 0 },
  ].forEach(rail => {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(rail.w, rail.h, 0.18), frameMaterial);
    frame.position.set(rail.x, rail.y, 0.02);
    frame.castShadow = true;
    group.add(frame);
  });

  const reflection = new THREE.Mesh(
    new THREE.PlaneGeometry(3.3, 1.55),
    new THREE.MeshBasicMaterial({ color: 0xffd2a0, transparent: true, opacity: 0.055, depthWrite: false })
  );
  reflection.rotation.x = -Math.PI / 2;
  reflection.position.set(room.x + (side === 'left' ? -ROOM_HALF_WIDTH + 1.35 : ROOM_HALF_WIDTH - 1.35), 0.018, localZ + 0.08);
  scene.add(reflection);

  if (item.image) {
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';
    loader.load(item.image, texture => {
      texture.colorSpace = THREE.SRGBColorSpace;
      mesh.material.map = texture;
      mesh.material.needsUpdate = true;
    }, undefined, () => {});
  }
}

function addWitnessTheater() {
  const room = ROOM_CONFIGS.testimonies;
  const screenFrame = new THREE.Mesh(
    new THREE.BoxGeometry(ROOM_WIDTH - 0.7, 8.2, 0.28),
    createMaterial(0x050505, 0.38, 0.08)
  );
  screenFrame.position.set(room.x, 4.25, -ROOM_HALF_DEPTH + 0.18);
  screenFrame.castShadow = true;
  scene.add(screenFrame);

  screenMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(ROOM_WIDTH - 1.35, 7.6),
    new THREE.MeshBasicMaterial({
      map: makeCinemaScreenTexture(),
    })
  );
  screenMesh.position.set(room.x, 4.25, -ROOM_HALF_DEPTH + 0.36);
  scene.add(screenMesh);
}

function addTestimonyWall() {
  const room = ROOM_CONFIGS.testimonies;
  const frameMaterial = createMaterial(0x67451f, 0.38, 0.08);
  testimonyVideos.slice(0, 100).forEach((video, index) => {
    const side = index < 50 ? 'left' : 'right';
    const wallIndex = side === 'left' ? index : index - 50;
    const x = room.x + (side === 'left' ? -ROOM_HALF_WIDTH + 0.28 : ROOM_HALF_WIDTH - 0.28);
    const y = 3.45;
    const z = 52 - wallIndex * 2.08;
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = side === 'left' ? Math.PI / 2 : -Math.PI / 2;
    scene.add(group);

    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(2.35, 2.15),
      new THREE.MeshBasicMaterial({
        map: makeSpotGlowTexture(),
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    glow.position.set(0, 0.08, 0.006);
    group.add(glow);

    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2.05, 1.15),
      new THREE.MeshBasicMaterial({
        map: makeLabelTexture(video.title.replace(/^#\d+\s+[-—]\s+/, ''), video.src, {
          bg: '#0b1114',
          accent: '#79b8d9',
          footer: `Testimony ${index + 1} of ${testimonyVideos.length}`,
          titleFont: '700 44px Arial, sans-serif',
          titleLine: 50,
          titleLines: 4,
          bodyFont: '28px Arial, sans-serif',
          bodyLines: 2,
        }),
      })
    );
    mesh.position.set(0, 0, 0.045);
    mesh.userData = {
      payload: {
        kind: 'testimony',
        title: video.title,
        subtitle: video.src,
        extract: 'Video testimony from the project testimony archive. Click to open a museum placard and play the testimony in the virtual gallery.',
        source: video.src,
        room: 'testimonies',
        video,
      },
    };
    group.add(mesh);
    clickableObjects.push(mesh);

    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';
    loader.load(`https://i.ytimg.com/vi/${encodeURIComponent(video.id)}/hqdefault.jpg`, texture => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 8;
      mesh.material.map = texture;
      mesh.material.needsUpdate = true;
    }, undefined, () => {});

    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.26, 1.36, 0.08), frameMaterial);
    frame.position.set(0, 0, 0.02);
    frame.castShadow = true;
    group.add(frame);
  });
}

function buildSceneArtifacts() {
  clickableObjects = [];
  const grouped = { origins: [], preparation: [], hundredDays: [], testimonies: [] };

  collection.timeline.forEach(item => {
    grouped[item.room].push({
      kind: 'history',
      title: item.title,
      subtitle: item.date,
      extract: item.summary?.extract || item.body,
      image: item.summary?.image || '',
      url: item.summary?.url || '',
      source: item.summary?.source || 'Historical timeline',
      room: item.room,
    });
  });

  Object.entries(grouped).forEach(([roomKey, items]) => {
    const sample = items.slice(0, 8);
    sample.forEach((item, index) => addFramedPanel(roomKey, item, index, sample.length));
  });
  addTestimonyWall();
}

function updateCamera() {
  if (!camera) return;
  const sideLook = Math.sin(yaw);
  const targetZ = clamp(cameraTarget.z ?? CAMERA_NEAR_Z, CAMERA_FAR_Z, CAMERA_NEAR_Z);
  if (!cameraPosition) {
    cameraPosition = {
      x: cameraTarget.x,
      y: cameraTarget.y,
      z: targetZ,
    };
  }
  cameraPosition.x += (cameraTarget.x - cameraPosition.x) * 0.08;
  cameraPosition.y += (cameraTarget.y - cameraPosition.y) * 0.08;
  cameraPosition.z += (targetZ - cameraPosition.z) * 0.08;
  const cameraZ = cameraPosition.z;
  const lookZ = -ROOM_HALF_DEPTH + 1.15;
  camera.position.set(
    cameraPosition.x + sideLook * 1.35,
    cameraPosition.y + Math.sin(pitch) * 0.72,
    cameraZ
  );
  camera.lookAt(
    cameraPosition.x + sideLook * 5.8,
    2.9 + Math.sin(pitch) * 2.1,
    lookZ
  );
}

function animate() {
  if (!renderer || !scene || !camera) return;
  updateCamera();
  renderer.render(scene, camera);
  rafId = requestAnimationFrame(animate);
}

function resizeRenderer() {
  if (!renderer || !camera || !stage) return;
  const rect = stage.getBoundingClientRect();
  const width = Math.max(1, Math.floor(rect.width));
  const height = Math.max(1, Math.floor(rect.height));
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

async function initRenderer() {
  if (renderer) return;
  await loadThree();
  stage = document.getElementById('museumStage');
  canvas = document.getElementById('museumCanvas');
  if (!stage || !canvas) return;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05070a);
  scene.fog = new THREE.FogExp2(0x090706, 0.016);

  camera = new THREE.PerspectiveCamera(58, 1, 0.1, 240);
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.4;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene.add(new THREE.HemisphereLight(0xdde8ff, 0x453a2e, 1.4));
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const sun = new THREE.DirectionalLight(0xffe2be, 3.2);
  sun.position.set(-12, 16, 8);
  sun.castShadow = true;
  sun.shadow.camera.left = -45;
  sun.shadow.camera.right = 45;
  sun.shadow.camera.top = 30;
  sun.shadow.camera.bottom = -30;
  scene.add(sun);

  Object.values(ROOM_CONFIGS).forEach((config, index) => addRoom(config, index));
  addWitnessTheater();

  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();
  bindStageEvents();

  resizeObserver = new ResizeObserver(resizeRenderer);
  resizeObserver.observe(stage);
  resizeRenderer();
  animate();
}

function bindStageEvents() {
  stage.addEventListener('pointerdown', event => {
    if (event.target.closest('.museum-video-overlay')) return;
    dragging = true;
    dragPoint = { x: event.clientX, y: event.clientY };
    stage.setPointerCapture(event.pointerId);
  });

  stage.addEventListener('pointermove', event => {
    if (!dragging) return;
    yaw = clamp(yaw - (event.clientX - dragPoint.x) * 0.0035, -0.62, 0.62);
    pitch = clamp(pitch + (event.clientY - dragPoint.y) * 0.0025, -0.32, 0.36);
    dragPoint = { x: event.clientX, y: event.clientY };
  });

  stage.addEventListener('pointerup', event => {
    dragging = false;
    stage.releasePointerCapture?.(event.pointerId);
  });
  stage.addEventListener('pointercancel', () => { dragging = false; });

  stage.addEventListener('click', event => {
    if (event.target.closest('.museum-video-overlay')) return;
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(clickableObjects, false)[0];
    const payload = hit?.object?.userData?.payload;
    if (!payload) return;
    if (payload.kind === 'testimony' && payload.video) playTestimony(payload.video);
    else renderDetail(payload);
  });

  stage.addEventListener('wheel', event => {
    if (!isOpen()) return;
    event.preventDefault();
    moveThroughHall(Math.sign(event.deltaY) * 1.15);
  }, { passive: false });
}

function moveToRoom(room) {
  const cfg = ROOM_CONFIGS[room] || ROOM_CONFIGS.origins;
  currentRoom = room;
  cameraTarget = { x: cfg.x, y: cameraTarget.y || 2.15, z: CAMERA_NEAR_Z };
  cameraPosition = { ...cameraTarget };
  yaw = 0;
  pitch = 0;
  document.getElementById('museumVideoOverlay')?.classList.remove('vis');
  setRoomLabel(room);
  document.querySelectorAll('.museum-room').forEach(btn => {
    btn.classList.toggle('on', btn.dataset.museumRoom === room);
  });
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderDetail(payload) {
  selectedPayload = payload;
  const detail = document.getElementById('museumDetail');
  if (!detail) return;
  const image = payload.image ? `<img class="museum-detail-image" src="${escapeHtml(payload.image)}" alt="" loading="lazy" />` : '';
  const link = payload.url ? `<a href="${escapeHtml(payload.url)}" target="_blank" rel="noopener">Open source</a>` : '';
  const play = payload.video ? `<button class="museum-play-detail" type="button" onclick="museumPlayTestimony('${escapeHtml(payload.video.id)}')">PLAY TESTIMONY</button>` : '';
  detail.innerHTML = `
    ${image}
    <div class="museum-detail-kicker">${escapeHtml((payload.kind || 'memorial item').toUpperCase())}</div>
    <h3>${escapeHtml(payload.title)}</h3>
    <div class="museum-detail-meta">${escapeHtml(payload.subtitle || payload.source || '')}</div>
    <p>${escapeHtml(payload.extract || '')}</p>
    <div class="museum-detail-actions">${play}${link}</div>
  `;
  if (payload.room) moveToRoom(payload.room);
}

function enterEventVideoWall(event, index) {
  const video = testimonyVideos[index % testimonyVideos.length];
  renderDetail({
    kind: event.type || 'event',
    title: event.name,
    subtitle: `${formatDate(dayToDate(event.day))} / ${event.prov}`,
    extract: `${event.desc} A related testimony is opened in the video wall gallery for a visual visit experience.`,
    source: 'Project event dataset + testimony archive',
    room: 'hundredDays',
    video,
  });
  window.setTimeout(() => playTestimony(video, event), 120);
}

function renderInitialDetail() {
  const first = collection.timeline[0];
  if (!first) return;
  renderDetail({
    kind: 'history',
    title: first.title,
    subtitle: first.date,
    extract: first.summary?.extract || first.body,
    image: first.summary?.image || '',
    url: first.summary?.url || '',
    source: first.summary?.source || 'Historical timeline',
    room: first.room,
  });
}

function timelineXForYear(year) {
  return (year - 1959) * 150;
}

function buildTimeline() {
  const world = document.getElementById('museumTimelineWorld');
  if (!world) return;
  world.innerHTML = '';

  for (let year = 1959; year <= 1994; year += 5) {
    const tick = document.createElement('div');
    tick.className = 'museum-tick';
    tick.style.left = `${timelineXForYear(year)}px`;
    tick.style.top = '14px';
    tick.textContent = year;
    world.appendChild(tick);
  }

  collection.timeline.forEach((item, index) => {
    const node = document.createElement('button');
    node.type = 'button';
    node.className = `museum-timeline-node history ${item.room}`;
    node.style.left = `${timelineXForYear(item.year)}px`;
    node.style.top = `${78 + (index % 4) * 72}px`;
    node.innerHTML = `<span>${escapeHtml(item.title)}</span><small>${escapeHtml(item.date)}</small>`;
    node.addEventListener('click', () => renderDetail({
      kind: 'history',
      title: item.title,
      subtitle: item.date,
      extract: item.summary?.extract || item.body,
      image: item.summary?.image || '',
      url: item.summary?.url || '',
      source: item.summary?.source || 'Historical timeline',
      room: item.room,
    }));
    world.appendChild(node);
  });

  events.forEach((event, index) => {
    const date = dayToDate(event.day);
    const node = document.createElement('button');
    node.type = 'button';
    node.className = `museum-timeline-node memory ${event.type?.toLowerCase() || ''}`;
    node.style.left = `${timelineXForYear(1994) + event.day * 6.5}px`;
    node.style.top = `${420 + (index % 5) * 46}px`;
    node.innerHTML = `<span>${escapeHtml(event.name)}</span><small>${escapeHtml(formatDate(date))}</small>`;
    node.addEventListener('click', () => enterEventVideoWall(event, index));
    world.appendChild(node);
  });

  testimonyVideos.forEach((video, index) => {
    const node = document.createElement('button');
    node.type = 'button';
    node.className = 'museum-timeline-node testimony';
    node.style.left = `${timelineXForYear(1994) + (index % 25) * 64}px`;
    node.style.top = `${700 + Math.floor(index / 25) * 58}px`;
    node.innerHTML = `<span>${escapeHtml(video.title.replace(/^#\d+\s+[-—]\s+/, ''))}</span><small>${escapeHtml(video.src)}</small>`;
    node.addEventListener('click', () => playTestimony(video));
    world.appendChild(node);
  });

  applyTimelineTransform();
  bindTimelinePanZoom();
}

function applyTimelineTransform() {
  const world = document.getElementById('museumTimelineWorld');
  if (!world) return;
  world.style.transform = `translate(${timelineState.x}px, ${timelineState.y}px) scale(${timelineState.scale})`;
}

function bindTimelinePanZoom() {
  const canvasEl = document.getElementById('museumTimelineCanvas');
  if (!canvasEl || canvasEl.dataset.bound) return;
  canvasEl.dataset.bound = 'true';

  canvasEl.addEventListener('pointerdown', event => {
    timelineState.dragging = true;
    timelineState.startX = event.clientX;
    timelineState.startY = event.clientY;
    canvasEl.setPointerCapture(event.pointerId);
  });
  canvasEl.addEventListener('pointermove', event => {
    if (!timelineState.dragging) return;
    timelineState.x += event.clientX - timelineState.startX;
    timelineState.y += event.clientY - timelineState.startY;
    timelineState.startX = event.clientX;
    timelineState.startY = event.clientY;
    applyTimelineTransform();
  });
  canvasEl.addEventListener('pointerup', event => {
    timelineState.dragging = false;
    canvasEl.releasePointerCapture?.(event.pointerId);
  });
  canvasEl.addEventListener('pointercancel', () => { timelineState.dragging = false; });
  canvasEl.addEventListener('wheel', event => {
    event.preventDefault();
    const next = clamp(timelineState.scale * (event.deltaY > 0 ? 0.88 : 1.14), 0.16, 3.8);
    const rect = canvasEl.getBoundingClientRect();
    const mx = event.clientX - rect.left;
    const my = event.clientY - rect.top;
    const beforeX = (mx - timelineState.x) / timelineState.scale;
    const beforeY = (my - timelineState.y) / timelineState.scale;
    timelineState.scale = next;
    timelineState.x = mx - beforeX * next;
    timelineState.y = my - beforeY * next;
    applyTimelineTransform();
  }, { passive: false });
}

function playTestimony(video, contextEvent = null) {
  moveToRoom('testimonies');
  yaw = 0;
  pitch = 0.03;
  cameraTarget.z = CAMERA_SCREEN_Z;

  const placard = document.getElementById('museumVideoPlacard');
  const frame = document.getElementById('museumVideoFrame');
  const overlay = document.getElementById('museumVideoOverlay');
  if (overlay) overlay.classList.add('vis');
  if (placard) {
    placard.innerHTML = `
      <div class="museum-detail-kicker">VIDEO TESTIMONY</div>
      <h3>${escapeHtml(video.title)}</h3>
      <p>${escapeHtml(video.src)}. Selected from the 100-video testimony archive already included in this project.${contextEvent ? ` Opened from timeline event: ${escapeHtml(contextEvent.name)}.` : ''}</p>
    `;
  }
  if (frame) {
    frame.innerHTML = `
      <iframe
        title="${escapeHtml(video.title)}"
        src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.id)}?autoplay=1"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen></iframe>
    `;
  }

  if (screenMesh) {
    screenMesh.material.map = makeCinemaScreenTexture(video);
    screenMesh.material.needsUpdate = true;
  }
}

export async function openMuseum(room) {
  const modal = document.getElementById('museumModal');
  if (!modal) return;
  modal.classList.add('vis');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('museum-open');
  document.getElementById('museumBtn')?.classList.add('on');
  window.setTimeout(() => document.getElementById('museumStage')?.focus(), 20);

  await initMuseum();
  moveToRoom(ROOM_CONFIGS[room] ? room : 'testimonies');
  resizeRenderer();
}

export function closeMuseum() {
  const modal = document.getElementById('museumModal');
  if (!modal) return;
  modal.classList.remove('vis');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('museum-open');
  document.getElementById('museumBtn')?.classList.remove('on');
  document.getElementById('museumVideoOverlay')?.classList.remove('vis');
}

export function rotateMuseum(delta) {
  yaw = clamp(yaw + delta * 0.01, -0.62, 0.62);
}

export function resetMuseum() {
  yaw = 0;
  pitch = 0;
  cameraTarget.y = 2.15;
  cameraTarget.z = CAMERA_NEAR_Z;
  moveToRoom(currentRoom || 'origins');
}

export function zoomMuseumTimeline(factor) {
  timelineState.scale = clamp(timelineState.scale * factor, 0.16, 3.8);
  applyTimelineTransform();
}

export function resetMuseumTimeline() {
  timelineState = { x: 48, y: 46, scale: 0.72, dragging: false, startX: 0, startY: 0 };
  applyTimelineTransform();
}

export function playMuseumTestimony(videoId) {
  const video = testimonyVideos.find(item => item.id === videoId);
  if (video) playTestimony(video);
}

export async function initMuseum() {
  await initRenderer();

  if (!collection.timeline.length) {
    setStatus('Fetching genocide-history Wikipedia summaries...');
    collection = await loadMuseumCollection();
    setStatus(`Memorial archive ready: ${collection.timeline.length} historical moments / ${testimonyVideos.length} testimonies`);
    buildSceneArtifacts();
    buildTimeline();
    renderInitialDetail();
  }

  document.querySelectorAll('.museum-room').forEach(btn => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = 'true';
    btn.addEventListener('click', () => moveToRoom(btn.dataset.museumRoom));
  });

  if (!keydownBound) {
    keydownBound = true;
    window.addEventListener('keydown', event => {
      if (!isOpen()) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMuseum();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        rotateMuseum(-18);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        rotateMuseum(18);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        moveThroughHall(-1.35);
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        moveThroughHall(1.35);
      }
    });
  }
}

window.addEventListener('beforeunload', () => {
  if (rafId) cancelAnimationFrame(rafId);
  resizeObserver?.disconnect();
});
