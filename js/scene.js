// ── THREE.JS 3-D HOSTEL SCENE ────────────────────────────────────────────────

function initScene() {
  const canvas = document.getElementById('three-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const W = () => window.innerWidth;
  const H = () => window.innerHeight;

  // ── Renderer
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(W(), H());
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // ── Scene
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000011, 0.015);

  // ── Camera
  const camera = new THREE.PerspectiveCamera(52, W() / H(), 0.1, 600);
  camera.position.set(28, 10, 28);
  camera.lookAt(0, 3, 0);

  // ── Lights
  const ambient = new THREE.AmbientLight(0x111133, 1.2);
  scene.add(ambient);

  const cyanLight = new THREE.PointLight(0x00d4ff, 4, 80);
  cyanLight.castShadow = true;
  scene.add(cyanLight);

  const purpleLight = new THREE.PointLight(0x7c3aed, 2.5, 60);
  purpleLight.position.set(-18, 8, -12);
  scene.add(purpleLight);

  const warmLight = new THREE.PointLight(0xfbbf24, 1.2, 35);
  warmLight.position.set(0, -8, 0);
  scene.add(warmLight);

  const topLight = new THREE.DirectionalLight(0xffffff, 0.3);
  topLight.position.set(10, 30, 10);
  topLight.castShadow = true;
  scene.add(topLight);

  // ── Building group
  const building = new THREE.Group();

  const BW = 14, BH = 24, BD = 9; // width, height, depth

  // Main body
  const bodyGeo = new THREE.BoxGeometry(BW, BH, BD);
  const bodyMat = new THREE.MeshPhongMaterial({
    color: 0x060825,
    transparent: true,
    opacity: 0.55,
    shininess: 70,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = true;
  body.receiveShadow = true;
  building.add(body);

  // Edge glow lines
  const edgesGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(BW + 0.05, BH + 0.05, BD + 0.05));
  const edgesMat = new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.5 });
  building.add(new THREE.LineSegments(edgesGeo, edgesMat));

  // Floor dividers
  const numFloors = 6;
  const floorH = BH / numFloors;
  for (let f = 0; f <= numFloors; f++) {
    const y = -BH / 2 + f * floorH;
    const divGeo = new THREE.BoxGeometry(BW + 0.1, 0.08, BD + 0.1);
    const divMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.25 });
    const div = new THREE.Mesh(divGeo, divMat);
    div.position.y = y;
    building.add(div);
  }

  // Windows — front (z+) and back (z-)
  const cols = 4;
  const winW = 2.1, winH = 1.6;
  const xStart = -(BW / 2) + winW * 0.75;
  const xStep  = (BW - winW * 1.5) / (cols - 1);

  const windowMeshes = [];
  const glowLights   = [];

  [-1, 1].forEach(side => {
    for (let fl = 0; fl < numFloors; fl++) {
      for (let c = 0; c < cols; c++) {
        const occupied = (fl * cols + c) < 15; // first 15 windows = occupied
        const winColor    = occupied ? 0xff6060 : 0x00ff88;
        const emissiveClr = occupied ? new THREE.Color(0.35, 0.02, 0.02) : new THREE.Color(0.01, 0.35, 0.12);

        const winGeo = new THREE.BoxGeometry(winW, winH, 0.25);
        const winMat = new THREE.MeshPhongMaterial({
          color: winColor,
          emissive: emissiveClr,
          emissiveIntensity: 0.6,
          shininess: 120,
          transparent: true,
          opacity: 0.92,
        });
        const win = new THREE.Mesh(winGeo, winMat);
        win.position.set(
          xStart + c * xStep,
          -BH / 2 + floorH / 2 + fl * floorH,
          side * (BD / 2 + 0.12),
        );
        if (side === -1) win.rotation.y = Math.PI;
        building.add(win);
        windowMeshes.push({ mesh: win, occupied, mat: winMat });

        // Point glow on some windows
        if (Math.random() > 0.55) {
          const gl = new THREE.PointLight(winColor, 0.5, 5);
          gl.position.copy(win.position);
          building.add(gl);
          glowLights.push(gl);
        }
      }
    }
  });

  // Side windows (smaller)
  [1, -1].forEach(side => {
    for (let fl = 0; fl < numFloors; fl++) {
      for (let c = 0; c < 2; c++) {
        const occupied = Math.random() > 0.4;
        const color = occupied ? 0xff6060 : 0x00ff88;
        const sWinGeo = new THREE.BoxGeometry(0.25, 1.4, 1.7);
        const sWinMat = new THREE.MeshPhongMaterial({
          color,
          emissive: new THREE.Color(occupied ? 0.2 : 0.01, occupied ? 0.01 : 0.2, 0.01),
          emissiveIntensity: 0.5,
          transparent: true,
          opacity: 0.85,
          shininess: 100,
        });
        const sWin = new THREE.Mesh(sWinGeo, sWinMat);
        sWin.position.set(
          side * (BW / 2 + 0.12),
          -BH / 2 + floorH / 2 + fl * floorH,
          -BD / 2 + 2 + c * 4.5,
        );
        building.add(sWin);
      }
    }
  });

  // Rooftop elements
  // Water tank
  const tankGeo = new THREE.CylinderGeometry(1.2, 1.2, 2.5, 12);
  const tankMat = new THREE.MeshPhongMaterial({ color: 0x1a1a3e, shininess: 60 });
  const tank = new THREE.Mesh(tankGeo, tankMat);
  tank.position.set(-3.5, BH / 2 + 1.25, 0);
  building.add(tank);
  const tankRingGeo = new THREE.TorusGeometry(1.2, 0.08, 8, 20);
  const tankRingMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.5 });
  const tankRing = new THREE.Mesh(tankRingGeo, tankRingMat);
  tankRing.position.set(-3.5, BH / 2 + 2.4, 0);
  tankRing.rotation.x = Math.PI / 2;
  building.add(tankRing);

  // Antenna
  const antGeo = new THREE.CylinderGeometry(0.06, 0.06, 5, 8);
  const antMat = new THREE.MeshPhongMaterial({ color: 0x333366 });
  const antenna = new THREE.Mesh(antGeo, antMat);
  antenna.position.set(3, BH / 2 + 2.5, 0);
  building.add(antenna);

  // Antenna blink light
  const antLight = new THREE.PointLight(0xff2222, 2.5, 6);
  antLight.position.set(3, BH / 2 + 5.2, 0);
  building.add(antLight);

  // HVAC units on roof
  [-2, 2].forEach(x => {
    const hvacGeo = new THREE.BoxGeometry(2, 1, 1.5);
    const hvacMat = new THREE.MeshPhongMaterial({ color: 0x1c1c3c, shininess: 40 });
    const hvac = new THREE.Mesh(hvacGeo, hvacMat);
    hvac.position.set(x, BH / 2 + 0.5, 2.5);
    building.add(hvac);
  });

  building.position.y = 4;
  scene.add(building);

  // ── Ground
  const groundGeo = new THREE.PlaneGeometry(200, 200);
  const groundMat = new THREE.MeshPhongMaterial({ color: 0x020210, shininess: 10 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -BH / 2 + 4 - 0.5;
  ground.receiveShadow = true;
  scene.add(ground);

  // Neon grid
  const grid = new THREE.GridHelper(120, 48, 0x00d4ff, 0x06061a);
  grid.position.y = ground.position.y + 0.01;
  scene.add(grid);

  // ── Particles
  const pCount = 2200;
  const pPos   = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount * 3; i++) {
    pPos[i] = (Math.random() - 0.5) * 160;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({
    color: 0x00d4ff,
    size: 0.18,
    transparent: true,
    opacity: 0.55,
    sizeAttenuation: true,
  });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  // ── Floating cubes (decorative)
  const floaters = [];
  const cubeColors = [0x00d4ff, 0x7c3aed, 0x00ff88, 0xfbbf24];
  for (let i = 0; i < 10; i++) {
    const size = Math.random() * 0.6 + 0.2;
    const geo  = new THREE.BoxGeometry(size, size, size);
    const mat  = new THREE.MeshPhongMaterial({
      color: cubeColors[i % cubeColors.length],
      transparent: true,
      opacity: 0.3 + Math.random() * 0.2,
      wireframe: i % 2 === 0,
      shininess: 80,
    });
    const cube = new THREE.Mesh(geo, mat);
    const angle = (i / 10) * Math.PI * 2;
    const radius = 18 + Math.random() * 10;
    cube.position.set(
      Math.cos(angle) * radius,
      (Math.random() - 0.5) * 14,
      Math.sin(angle) * radius,
    );
    cube.userData = {
      baseX: cube.position.x,
      baseZ: cube.position.z,
      baseY: cube.position.y,
      phase: Math.random() * Math.PI * 2,
      rx: (Math.random() - 0.5) * 0.025,
      ry: (Math.random() - 0.5) * 0.025,
      orbit: 0.004 + Math.random() * 0.003,
    };
    scene.add(cube);
    floaters.push(cube);
  }

  // ── Mouse tracking
  let mx = 0, my = 0, tmx = 0, tmy = 0;
  document.addEventListener('mousemove', e => {
    mx = (e.clientX / window.innerWidth  - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // ── Camera orbit state
  let angle = 0.75;
  const ORBIT_R = 38;
  const ORBIT_Y = 10;

  // ── Animate
  let t = 0;
  (function animate() {
    requestAnimationFrame(animate);
    t += 0.01;

    // Smooth mouse
    tmx += (mx - tmx) * 0.04;
    tmy += (my - tmy) * 0.04;

    // Camera orbit
    angle += 0.003;
    camera.position.x = Math.cos(angle) * ORBIT_R + tmx * 4;
    camera.position.z = Math.sin(angle) * ORBIT_R;
    camera.position.y = ORBIT_Y + tmy * 3;
    camera.lookAt(0, 4, 0);

    // Building gentle float
    building.position.y = 4 + Math.sin(t * 0.45) * 0.35;
    building.rotation.y += 0.0015;

    // Orbiting cyan light
    cyanLight.position.x = Math.cos(t * 0.7) * 24;
    cyanLight.position.y = 12 + Math.sin(t * 0.4) * 6;
    cyanLight.position.z = Math.sin(t * 0.7) * 24;

    // Antenna blink
    antLight.intensity = Math.floor(t * 1.5) % 2 === 0 ? 2.5 : 0;

    // Window shimmer
    windowMeshes.forEach((w, i) => {
      const flicker = 0.92 + Math.sin(t * 3 + i * 1.7) * 0.08;
      w.mat.emissiveIntensity = 0.6 * flicker;
    });

    // Glow light pulse
    glowLights.forEach((gl, i) => {
      gl.intensity = 0.5 + Math.sin(t * 2.5 + i) * 0.3;
    });

    // Floaters
    floaters.forEach(c => {
      const od = c.userData;
      c.rotation.x += od.rx;
      c.rotation.y += od.ry;
      c.position.y  = od.baseY + Math.sin(t * 0.8 + od.phase) * 1.5;
    });

    // Particle drift
    particles.rotation.y  = t * 0.018;
    particles.rotation.x  = t * 0.006;

    renderer.render(scene, camera);
  })();

  // ── Resize
  window.addEventListener('resize', () => {
    camera.aspect = W() / H();
    camera.updateProjectionMatrix();
    renderer.setSize(W(), H());
  });
}
