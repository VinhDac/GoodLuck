// THE FIRST SCREEN'S DUCK (the home page): the app's own mark, the path the
// still duck under it is drawn from (mark.DUCK), cut out of a thick piece of
// glossy blue with its eyes set in white, in the rainbow ring the app lights
// round its box while it works. It drops into the ring and bobs there as on
// water. Every few seconds it hops and turns, as the app's duck turns while
// it works, and its name ripples with it; it looks toward the pointer; a
// press makes it hop and turn at once. Lights float up behind it.
//
// Where WebGL or the library cannot be had, the still duck stays and nothing
// else changes. IT MOVES WHATEVER THE SYSTEM ASKS: Windows tells the browser
// "less motion" whenever its own animations are turned off, as they are on
// many machines (Vin's among them, 14 Oct 2026, where the duck stood still).
import * as THREE from 'three';

const intro = document.querySelector('[data-intro]');
const stage = intro && intro.querySelector('[data-duckstage]');
const still = stage && stage.querySelector('svg path');
const host = intro && intro.querySelector('[data-duck3d]');
const word = intro && intro.querySelector('[data-word]');
const SMALL = matchMedia('(max-width: 760px)').matches;
// THE APP'S BLUE (mark.BLUE) and the rainbow's five (the site's --rainbow).
const BLUE = 0x8C9CF8;
const RAINBOW = ['#6AA6FF', '#A98CF8', '#EF7FA0', '#F2B866', '#66CB8E'];
const FOV = 30;
const FAR = 10;       // the camera, this far before the duck
const REACH = 1.75;   // the ring and its light, this far round the duck's middle
const RING = 1.3;     // the ring's own radius; the duck's half height is 1
const EVERY = 7;      // seconds between the duck's own turns
const WORD_IN = 3400; // ms after the page opened: its name has come in

// ---- the path, read: one outline of cubic curves, then four ellipses, each
// drawn as two half arcs: an eye cut out, its pupil put back (mark.py).
const read = (d) => {
  const parts = [];
  for (const [, cmd, args] of d.matchAll(/([MCAZ])([^MCAZ]*)/g)) {
    const n = (args.match(/-?\d*\.?\d+/g) || []).map(Number);
    if (cmd === 'M') parts.push({ at: n, curves: [], arcs: [] });
    const part = parts[parts.length - 1];
    if (cmd === 'C') for (let i = 0; i + 5 < n.length; i += 6) part.curves.push(n.slice(i, i + 6));
    if (cmd === 'A') for (let i = 0; i + 6 < n.length; i += 7) part.arcs.push(n.slice(i, i + 7));
  }
  return parts;
};

// The duck in the world's units: its middle at the origin, its height 2, y up.
const duckOf = (d) => {
  const [body, ...rest] = read(d);
  const xs = [body.at[0]];
  const ys = [body.at[1]];
  body.curves.forEach((c) => { xs.push(c[0], c[2], c[4]); ys.push(c[1], c[3], c[5]); });
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const R = Math.max(Math.max(...xs) - cx, Math.max(...ys) - cy);
  const P = (x, y) => [(x - cx) / R, (cy - y) / R];
  const outline = new THREE.Shape();
  outline.moveTo(...P(body.at[0], body.at[1]));
  body.curves.forEach((c) => outline.bezierCurveTo(...P(c[0], c[1]), ...P(c[2], c[3]), ...P(c[4], c[5])));
  // AN ELLIPSE drawn as two half arcs has its middle half way between them.
  const ovals = rest.map((part) => {
    const [rx, ry, turn, , , x1, y1] = part.arcs[0];
    const [x, y] = P((part.at[0] + x1) / 2, (part.at[1] + y1) / 2);
    return { x, y, rx: rx / R, ry: ry / R, turn: -turn * Math.PI / 180 };
  });
  const oval = (o, into) => into.absellipse(o.x, o.y, o.rx, o.ry, 0, Math.PI * 2, false, o.turn);
  // EACH EYE'S WHITE: its outline with its pupil cut out, so the pupil is the
  // duck's own blue under it, as on the icon.
  const eyes = [];
  for (let i = 0; i + 1 < ovals.length; i += 2) {
    const white = oval(ovals[i], new THREE.Shape());
    white.holes.push(oval(ovals[i + 1], new THREE.Path()));
    eyes.push(white);
  }
  return { outline, eyes };
};

// SMOOTH EDGES WITHOUT FACETS: each corner of the body takes the mean of the
// slopes of the faces round it that bend less than `crease` from its own,
// each slope once; the two flat faces (the geometry's first group) face
// straight out, so their long thin triangles show no seams in the gloss.
const smooth = (geo, crease) => {
  const pos = geo.attributes.position;
  const n = pos.count;
  const face = new Float32Array(n * 3);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  for (let i = 0; i < n; i += 3) {
    a.fromBufferAttribute(pos, i);
    b.fromBufferAttribute(pos, i + 1).sub(a);
    c.fromBufferAttribute(pos, i + 2).sub(a);
    b.cross(c).normalize();
    for (let j = 0; j < 3; j += 1) face.set([b.x, b.y, b.z], (i + j) * 3);
  }
  const at = new Map();
  for (let i = 0; i < n; i += 1) {
    const k = `${Math.round(pos.getX(i) * 1e5)}|${Math.round(pos.getY(i) * 1e5)}|${Math.round(pos.getZ(i) * 1e5)}`;
    if (!at.has(k)) at.set(k, []);
    at.get(k).push(i);
  }
  const dot = (i, j) => face[i * 3] * face[j * 3] + face[i * 3 + 1] * face[j * 3 + 1]
    + face[i * 3 + 2] * face[j * 3 + 2];
  const near = Math.cos(crease);
  const out = new Float32Array(n * 3);
  for (const same of at.values()) {
    for (const i of same) {
      const took = [];
      for (const j of same) {
        if (dot(i, j) >= near && !took.some((t) => dot(t, j) > 0.99999)) took.push(j);
      }
      let x = 0;
      let y = 0;
      let z = 0;
      took.forEach((j) => { x += face[j * 3]; y += face[j * 3 + 1]; z += face[j * 3 + 2]; });
      const l = Math.hypot(x, y, z) || 1;
      out.set([x / l, y / l, z / l], i * 3);
    }
  }
  const caps = geo.groups[0];
  if (caps) {
    for (let i = caps.start; i < caps.start + caps.count; i += 1) {
      out.set([0, 0, pos.getZ(i) < 0 ? -1 : 1], i * 3);
    }
  }
  geo.setAttribute('normal', new THREE.BufferAttribute(out, 3));
  return geo;
};

// ---- a room of soft lights in the rainbow's colours, for the gloss to show
const studio = () => {
  const room = new THREE.Scene();
  room.background = new THREE.Color(0x05060f);
  const light = (hex, power, w, h, x, y, z) => {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({
      color: new THREE.Color(hex).multiplyScalar(power), side: THREE.DoubleSide }));
    panel.position.set(x, y, z);
    panel.lookAt(0, 0, 0);
    room.add(panel);
  };
  light('#ffffff', 4.5, 4.5, 1.5, -2.2, 5, 3);
  light('#ffffff', 0.3, 6, 2.5, 1, 0, 7);
  light(RAINBOW[0], 5, 1.2, 7, -6, 0.5, 0);
  light(RAINBOW[2], 5, 1.2, 7, 6, 0, -0.5);
  light(RAINBOW[3], 2.5, 7, 1.2, 0, -6, 1.5);
  light(RAINBOW[1], 1.4, 7, 7, 0, 0, -7);
  light(RAINBOW[4], 2.2, 1.2, 4, 4.5, 4, -3);
  return room;
};

// ---- the ring: the app's running ring, its colours going round, a light
// running round it with a tail, its glow beating as the app's duck beats
// while idle (2.4 s), flaring when the duck lands or turns
const RING_VERT = `varying vec2 vP;
void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const RING_FRAG = `varying vec2 vP;
uniform float uTime, uDrawn, uFlare, uBeat, uR;
uniform vec3 uC0, uC1, uC2, uC3, uC4;
vec3 rainbow(float t) {
  t = fract(t) * 5.0;
  vec3 c = mix(uC0, uC1, smoothstep(0.0, 1.0, clamp(t, 0.0, 1.0)));
  c = mix(c, uC2, smoothstep(0.0, 1.0, clamp(t - 1.0, 0.0, 1.0)));
  c = mix(c, uC3, smoothstep(0.0, 1.0, clamp(t - 2.0, 0.0, 1.0)));
  c = mix(c, uC4, smoothstep(0.0, 1.0, clamp(t - 3.0, 0.0, 1.0)));
  return mix(c, uC0, smoothstep(0.0, 1.0, clamp(t - 4.0, 0.0, 1.0)));
}
void main() {
  float r = length(vP);
  float a = atan(vP.x, vP.y);
  float u = fract(a / 6.2831853 + 1.0);
  float shown = 1.0 - smoothstep(uDrawn - 0.03, uDrawn, u);
  float d = abs(r - uR);
  float line = 1.0 - smoothstep(0.012, 0.012 + fwidth(r) * 1.5, d);
  float halo = exp(-d * d / 0.011);
  float head = fract(uTime / 2.6);
  float behind = fract(head - u);
  float tail = exp(-behind * 6.0);
  float spot = exp(-pow(min(behind, 1.0 - behind) * 45.0, 2.0));
  vec3 col = rainbow(u + uTime * 0.04);
  float k = shown * (line * (0.5 + 1.1 * tail + 0.9 * uFlare)
    + halo * (0.16 + 0.1 * uBeat + 0.75 * tail + 0.8 * uFlare + 0.7 * spot));
  gl_FragColor = vec4(col * k + vec3(spot * line * 0.8 * shown), min(1.0, k));
}`;
// ---- the lights floating up, and the sparks the duck throws when it lands
const MOTE_VERT = `attribute vec3 aColor;
attribute float aSize, aAlpha;
uniform float uScale;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = max(1.0, aSize * uScale / -mv.z);
  vColor = aColor;
  vAlpha = aAlpha;
}`;
const MOTE_FRAG = `varying vec3 vColor;
varying float vAlpha;
void main() {
  float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5));
  a = a * a * vAlpha;
  gl_FragColor = vec4(vColor * a, a);
}`;
const vec3 = (hex) => new THREE.Vector3(...[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255));
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);

const start = () => {
  if (!intro || !stage || !still || !host) return;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    return;
  }
  const ratio = Math.min(devicePixelRatio || 1, SMALL ? 1.5 : 2);
  renderer.setPixelRatio(ratio);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // NO TONE MAPPING: with it the duck came out grey, not the app's blue.
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.setClearColor(0x000000, 0);
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(studio(), 0.02).texture;
  pmrem.dispose();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 60);
  camera.position.set(0, 0, FAR);
  const key = new THREE.DirectionalLight(0xffffff, 3);
  key.position.set(-2, 3, 4);
  scene.add(key, new THREE.HemisphereLight(0xdde3ff, 0x141833, 1));

  // THE RIG: the duck and its ring, placed and sized on the page's own place
  // for the duck (the still duck's), whatever the window.
  const rig = new THREE.Group();
  scene.add(rig);

  // THE DUCK: the outline given a body with rounded edges, the eyes' whites
  // laid on both faces; in a holder that hops, bobs and squashes.
  const { outline, eyes } = duckOf(still.getAttribute('d'));
  const DEPTH = 0.2;
  const EDGE = 0.075;
  const body = smooth(new THREE.ExtrudeGeometry(outline, {
    depth: DEPTH, steps: 1, curveSegments: SMALL ? 8 : 14,
    bevelEnabled: true, bevelThickness: EDGE, bevelSize: 0.04, bevelSegments: SMALL ? 6 : 10,
  }).translate(0, 0, -DEPTH / 2), Math.PI / 3);
  const enamel = new THREE.MeshPhysicalMaterial({ color: BLUE, roughness: 0.34, metalness: 0,
    clearcoat: 1, clearcoatRoughness: 0.07 });
  const white = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.25,
    clearcoat: 1, clearcoatRoughness: 0.05 });
  const FACE = DEPTH / 2 + EDGE;
  const LAY = 0.012;
  const eyeGeo = new THREE.ExtrudeGeometry(eyes, { depth: LAY, bevelEnabled: false, curveSegments: 40 });
  const front = new THREE.Mesh(eyeGeo, white);
  front.position.z = FACE - 0.003;
  const back = new THREE.Mesh(eyeGeo, white);
  back.position.z = -FACE - LAY + 0.003;
  const duck = new THREE.Group();
  duck.add(new THREE.Mesh(body, enamel), front, back);
  const holder = new THREE.Group();
  holder.add(duck);

  const ring = new THREE.Mesh(new THREE.PlaneGeometry(REACH * 2, REACH * 2), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uDrawn: { value: 0 }, uFlare: { value: 0 },
      uBeat: { value: 0 }, uR: { value: RING }, uC0: { value: vec3(RAINBOW[0]) },
      uC1: { value: vec3(RAINBOW[1]) }, uC2: { value: vec3(RAINBOW[2]) },
      uC3: { value: vec3(RAINBOW[3]) }, uC4: { value: vec3(RAINBOW[4]) } },
    vertexShader: RING_VERT, fragmentShader: RING_FRAG }));
  rig.add(ring, holder);
  const U = ring.material.uniforms;

  // THE MOTES: some float up through the whole screen, slowly, at different
  // depths; the rest are sparks, thrown from the ring when the duck lands.
  const AMBIENT = SMALL ? 34 : 80;
  const SPARKS = 48;
  const N = AMBIENT + SPARKS;
  const mPos = new Float32Array(N * 3);
  const mCol = new Float32Array(N * 3);
  const mSize = new Float32Array(N);
  const mAlpha = new Float32Array(N);
  const mVel = new Float32Array(N * 3);
  const mLife = new Float32Array(N);
  const motes = new THREE.BufferGeometry();
  motes.setAttribute('position', new THREE.BufferAttribute(mPos, 3));
  motes.setAttribute('aColor', new THREE.BufferAttribute(mCol, 3));
  motes.setAttribute('aSize', new THREE.BufferAttribute(mSize, 1));
  motes.setAttribute('aAlpha', new THREE.BufferAttribute(mAlpha, 1));
  const moteMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, uniforms: { uScale: { value: 1 } },
    vertexShader: MOTE_VERT, fragmentShader: MOTE_FRAG });
  const cloud = new THREE.Points(motes, moteMat);
  cloud.frustumCulled = false;
  scene.add(cloud);
  let seed = 11;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const half = (z) => (FAR - z) * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  const float = (i, anywhere) => {
    const z = -5 + rand() * 5.5;
    const hh = half(z);
    const hw = hh * camera.aspect;
    mPos.set([(rand() * 2 - 1) * hw, anywhere ? (rand() * 2 - 1) * hh : -hh - 0.2, z], i * 3);
    mVel.set([0, 0.06 + rand() * 0.2, 0], i * 3);
    mCol.set(rgb(rand() < 0.2 ? '#ffffff' : RAINBOW[Math.floor(rand() * 5)]), i * 3);
    mSize[i] = 0.03 + rand() * 0.07;
    mLife[i] = rand() * 6.283;
  };
  const sparks = (many, power) => {
    let made = 0;
    for (let i = AMBIENT; i < N && made < many; i += 1) {
      if (mLife[i] > 0) continue;
      const turn = rand() * Math.PI * 2;
      const p = new THREE.Vector3(Math.sin(turn) * RING, Math.cos(turn) * RING, 0);
      rig.localToWorld(p);
      const speed = (0.5 + rand() * 1.1) * power * rig.scale.x;
      mPos.set([p.x, p.y, p.z], i * 3);
      mVel.set([Math.sin(turn) * speed, Math.cos(turn) * speed + 0.15, (rand() - 0.5) * 0.4], i * 3);
      mCol.set(rgb(RAINBOW[Math.floor(rand() * 5)]), i * 3);
      mSize[i] = (0.04 + rand() * 0.05) * rig.scale.x * 1.6;
      mLife[i] = 0.9 + rand() * 0.6;
      made += 1;
    }
  };

  // ---- the page's place for the duck, read each frame: the words round it
  // can move it as their fonts come in.
  let W = 0;
  let H = 0;
  const place = () => {
    const w = intro.clientWidth;
    const h = intro.clientHeight;
    if (w !== W || h !== H) {
      W = w;
      H = h;
      renderer.setSize(W, H, false);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      moteMat.uniforms.uScale.value = (H * ratio) / (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)));
      for (let i = 0; i < AMBIENT; i += 1) float(i, true);
    }
    const k = H / (2 * half(0));
    const x = stage.offsetLeft + stage.offsetWidth / 2;
    const y = stage.offsetTop + stage.offsetHeight / 2;
    rig.position.set((x - W / 2) / k, -(y - H / 2) / k, 0);
    rig.scale.setScalar(stage.offsetWidth / 2 / (REACH * k));
  };

  // ---- the motion: a drop into the ring (a spring, so it overshoots and
  // bobs), two turns as it falls; stretched by its speed, squashed as it lands
  let y = 3.2;
  let vy = 0;
  let ay = 0;
  let angle = -Math.PI * 4;
  let spin = 0;
  let aim = 0;
  let flare = 0;
  let landed = false;
  let next = 4.5;
  const tilt = { x: 0, y: 0 };
  const want = { x: 0, y: 0 };

  // ITS NAME ripples as the duck turns, once it has come in (intro.css).
  const ripple = () => {
    if (!word || !word.classList.contains('landed')) return;
    word.classList.remove('wave');
    void word.offsetWidth;
    word.classList.add('wave');
  };
  if (word) setTimeout(() => word.classList.add('landed'), Math.max(0, WORD_IN - performance.now()));
  const hop = (power) => {
    aim += Math.PI * 2;
    vy += 3.4 * power;
    flare = Math.max(flare, 0.55 + 0.45 * power);
    sparks(Math.round(10 + 14 * power), 0.8 + 0.5 * power);
    ripple();
  };

  addEventListener('pointermove', (e) => {
    const box = stage.getBoundingClientRect();
    const px = (e.clientX - (box.left + box.width / 2)) / (innerWidth / 2);
    const py = (e.clientY - (box.top + box.height / 2)) / (innerHeight / 2);
    want.y = Math.max(-1, Math.min(1, px)) * 0.6;
    want.x = Math.max(-1, Math.min(1, py)) * 0.35;
  }, { passive: true });
  document.addEventListener('pointerleave', () => { want.x = 0; want.y = 0; });

  let t = 0;
  const draw = (dt) => {
    place();
    t += dt;
    for (let i = 0; i < 3; i += 1) {
      const h = dt / 3;
      ay = -48 * y - 7.6 * vy;
      vy += ay * h;
      y += vy * h;
      spin += ((aim - angle) * 26 - spin * 7.2) * h;
      angle += spin * h;
    }
    if (!landed && y < 0) {
      landed = true;
      flare = 1;
      sparks(SMALL ? 20 : 34, 1.2);
    }
    if (landed && t >= next) { hop(0.6); next = t + EVERY; }
    const k = 1 - Math.exp(-dt * 4);
    tilt.x += (want.x - tilt.x) * k;
    tilt.y += (want.y - tilt.y) * k;
    flare *= Math.exp(-dt * 2.4);
    U.uDrawn.value = Math.min(1.04, U.uDrawn.value + dt * 1.1);
    const bob = Math.sin(t * 1.9) * 0.055;
    const stretch = Math.max(-0.14, Math.min(0.16, Math.abs(vy) * 0.02 - Math.max(0, ay) * 0.0025));
    holder.position.y = y + bob;
    holder.scale.set(1 - stretch * 0.5, 1 + stretch, 1 - stretch * 0.5);
    const sway = Math.sin(t * 0.8) * 0.2;
    duck.rotation.set(0.08 + tilt.x + Math.sin(t * 1.3) * 0.03, -0.18 + angle + tilt.y + sway,
      Math.sin(t * 1.9 + 0.9) * 0.045);
    ring.rotation.set(tilt.x * 0.4, tilt.y * 0.4, 0);
    U.uTime.value = t;
    U.uFlare.value = flare;
    U.uBeat.value = 0.5 - 0.5 * Math.cos((t * Math.PI * 2) / 2.4);

    for (let i = 0; i < N; i += 1) {
      const o = i * 3;
      if (i < AMBIENT) {
        mPos[o] += Math.sin(t * 0.6 + mLife[i]) * 0.04 * dt;
        mPos[o + 1] += mVel[o + 1] * dt;
        if (mPos[o + 1] > half(mPos[o + 2]) + 0.2) float(i, false);
        mAlpha[i] = 0.18 + 0.32 * (0.5 + 0.5 * Math.sin(t * 1.7 + mLife[i] * 3));
        continue;
      }
      if (mLife[i] <= 0) { mAlpha[i] = 0; continue; }
      mLife[i] -= dt;
      const drag = Math.exp(-dt * 2.2);
      mVel[o] *= drag;
      mVel[o + 1] = mVel[o + 1] * drag - 0.25 * dt;
      mVel[o + 2] *= drag;
      mPos[o] += mVel[o] * dt;
      mPos[o + 1] += mVel[o + 1] * dt;
      mPos[o + 2] += mVel[o + 2] * dt;
      mAlpha[i] = Math.max(0, Math.min(1, mLife[i] / 0.9)) * 0.95;
    }
    cloud.rotation.y = tilt.y * 0.12;
    motes.attributes.position.needsUpdate = true;
    motes.attributes.aColor.needsUpdate = true;
    motes.attributes.aSize.needsUpdate = true;
    motes.attributes.aAlpha.needsUpdate = true;
    renderer.render(scene, camera);
  };

  // ---- drawn only while it is in sight and the tab is in front
  let seen = true;
  let looping = false;
  let last = 0;
  const loop = (now) => {
    if (!seen || document.hidden) { looping = false; return; }
    draw(Math.min(0.05, (now - last) / 1000));
    last = now;
    requestAnimationFrame(loop);
  };
  const wake = () => {
    if (looping) return;
    looping = true;
    last = performance.now();
    requestAnimationFrame(loop);
  };
  stage.addEventListener('click', () => {
    if (!landed) return;
    hop(1);
    next = t + EVERY;
    wake();
  });
  new IntersectionObserver(([e]) => { seen = e.isIntersecting; if (seen) wake(); }).observe(intro);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) wake(); });
  addEventListener('resize', () => { if (!looping) draw(0); });
  draw(0);
  intro.classList.add('live');
  wake();
};

start();
