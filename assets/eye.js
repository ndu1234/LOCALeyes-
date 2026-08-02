/* ══ THREE.JS — SKY BLUE EYE ══ */
(function () {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(58, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
  camera.position.z = 6.2;

  /* Fibonacci particle sphere — sky blue + pale blue */
  const COUNT = 2600;
  const pos = new Float32Array(COUNT * 3);
  const col = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    const phi   = Math.acos(-1 + (2 * i) / COUNT);
    const theta = Math.sqrt(COUNT * Math.PI) * phi;
    const r = 2.3;
    pos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
    pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    pos[i*3+2] = r * Math.cos(phi);
    /* #38BDF8 = (0.220, 0.741, 0.973)  |  #7DD3FC = (0.490, 0.827, 0.988) */
    const light = Math.random() > 0.7;
    col[i*3]   = light ? 0.490 : 0.220;
    col[i*3+1] = light ? 0.827 : 0.741;
    col[i*3+2] = light ? 0.988 : 0.973;
  }
  const sGeo = new THREE.BufferGeometry();
  sGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  sGeo.setAttribute('color',    new THREE.BufferAttribute(col, 3));
  const sphere = new THREE.Points(sGeo,
    new THREE.PointsMaterial({ size: 0.026, vertexColors: true, transparent: true, opacity: 0.9 }));
  scene.add(sphere);

  /* Iris ring — sky blue */
  const iris = new THREE.Mesh(
    new THREE.TorusGeometry(2.6, 0.014, 12, 130),
    new THREE.MeshBasicMaterial({ color: 0x38BDF8, transparent: true, opacity: 0.55 })
  );
  iris.rotation.x = Math.PI / 2;
  scene.add(iris);

  /* Pupil ring — pale blue */
  const pupil = new THREE.Mesh(
    new THREE.TorusGeometry(0.85, 0.011, 12, 80),
    new THREE.MeshBasicMaterial({ color: 0x7DD3FC, transparent: true, opacity: 0.7 })
  );
  scene.add(pupil);

  /* Background stars */
  const bgPos = new Float32Array(700 * 3);
  for (let i = 0; i < 700; i++) {
    bgPos[i*3]   = (Math.random() - 0.5) * 16;
    bgPos[i*3+1] = (Math.random() - 0.5) * 16;
    bgPos[i*3+2] = (Math.random() - 0.5) * 8 - 3;
  }
  const bgGeo = new THREE.BufferGeometry();
  bgGeo.setAttribute('position', new THREE.BufferAttribute(bgPos, 3));
  scene.add(new THREE.Points(bgGeo,
    new THREE.PointsMaterial({ size: 0.01, color: 0x2A6A8A, transparent: true, opacity: 0.4 })));

  let mx = 0, my = 0, tx = 0, ty = 0;
  document.addEventListener('mousemove', e => {
    mx = (e.clientX / innerWidth  - 0.5) * 2;
    my = (e.clientY / innerHeight - 0.5) * 2;
  }, { passive: true });

  let frame = 0;
  (function animate() {
    requestAnimationFrame(animate);
    frame++;
    tx += (mx - tx) * 0.038;
    ty += (my - ty) * 0.038;
    sphere.rotation.y = frame * 0.0028 + tx * 0.32;
    sphere.rotation.x = frame * 0.001  + ty * 0.18;
    iris.rotation.z   = frame * 0.004;
    pupil.rotation.y  = frame * 0.007;
    pupil.rotation.x  = Math.sin(frame * 0.005) * 0.28;
    renderer.render(scene, camera);
  })();

  window.addEventListener('resize', () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }, { passive: true });
})();
