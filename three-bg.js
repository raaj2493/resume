// 3D Particle Background using Three.js - Optimized

const initThreeJS = () => {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    // SCENE
    const scene = new THREE.Scene();
    const fogColor = document.body.classList.contains('dark-mode') ? 0x0f172a : 0xf8fafc;
    scene.fog = new THREE.FogExp2(fogColor, 0.002);

    // CAMERA
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 120;

    // RENDERER
    const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: false, // Disable for performance if needed, but keeping off for mobile usually helps
        powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap pixel ratio
    container.appendChild(renderer.domElement);

    // PARTICLES
    const particleCount = window.innerWidth < 768 ? 60 : 120; // Reduce count based on device
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = [];
    const colors = new Float32Array(particleCount * 3);

    const colorPalette = [
        new THREE.Color(0x94a3b8),
        new THREE.Color(0x60a5fa),
        new THREE.Color(0xa78bfa)
    ];

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 500;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 500;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 500;

        velocities.push(
            (Math.random() - 0.5) * 0.4,
            (Math.random() - 0.5) * 0.4,
            (Math.random() - 0.5) * 0.4
        );

        const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 3,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
    });
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // LINES - Pre-allocate
    const lineMaterial = new THREE.LineBasicMaterial({
        color: 0xcbd5e1,
        transparent: true,
        opacity: 0.12,
        vertexColors: false
    });

    const maxConnections = particleCount * particleCount; // Worst case
    const linesGeometry = new THREE.BufferGeometry();
    const linePositions = new Float32Array(maxConnections * 3); // Pre-allocate buffer
    linesGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    linesGeometry.setDrawRange(0, 0);

    const linesMesh = new THREE.LineSegments(linesGeometry, lineMaterial);
    scene.add(linesMesh);

    // INTERACTION
    const mouse = new THREE.Vector2();
    let targetX = 0;
    let targetY = 0;
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    document.addEventListener('mousemove', (event) => {
        mouse.x = (event.clientX - windowHalfX);
        mouse.y = (event.clientY - windowHalfY);
    });

    // Handle Resize
    window.addEventListener('resize', () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        windowHalfX = width / 2;
        windowHalfY = height / 2;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    });

    // Theme Update
    window.updateTheme3D = (isDark) => {
        scene.fog.color.setHex(isDark ? 0x0f172a : 0xf8fafc);
        scene.fog.density = 0.002;
        material.color.setHex(isDark ? 0xffffff : 0xffffff);
        material.opacity = isDark ? 0.6 : 0.8;
        lineMaterial.color.setHex(isDark ? 0x94a3b8 : 0xcbd5e1);
        lineMaterial.opacity = isDark ? 0.08 : 0.12;
    };

    if (document.body.classList.contains('dark-mode')) {
        window.updateTheme3D(true);
    }

    // ANIMATION LOOP
    const animate = () => {
        requestAnimationFrame(animate);

        targetX = mouse.x * 0.001;
        targetY = mouse.y * 0.001;

        particles.rotation.y += 0.002 + 0.03 * (targetX - particles.rotation.y);
        particles.rotation.x += 0.002 + 0.03 * (targetY - particles.rotation.x);

        linesMesh.rotation.copy(particles.rotation);

        const positions = particles.geometry.attributes.position.array;
        const linePosArr = linesMesh.geometry.attributes.position.array;

        let vertexIndex = 0;
        const connectionDistance = 12000; // threshold squared

        for (let i = 0; i < particleCount; i++) {
            // Update positions
            positions[i * 3] += velocities[i * 3];
            positions[i * 3 + 1] += velocities[i * 3 + 1];
            positions[i * 3 + 2] += velocities[i * 3 + 2];

            // Wrap
            if (positions[i * 3] < -250) positions[i * 3] = 250;
            else if (positions[i * 3] > 250) positions[i * 3] = -250;

            if (positions[i * 3 + 1] < -250) positions[i * 3 + 1] = 250;
            else if (positions[i * 3 + 1] > 250) positions[i * 3 + 1] = -250;

            if (positions[i * 3 + 2] < -250) positions[i * 3 + 2] = 250;
            else if (positions[i * 3 + 2] > 250) positions[i * 3 + 2] = -250;

            // Connections
            for (let j = i + 1; j < particleCount; j++) {
                const dx = positions[i * 3] - positions[j * 3];
                const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
                const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
                const distSq = dx * dx + dy * dy + dz * dz;

                if (distSq < connectionDistance) {
                    if (vertexIndex < linePosArr.length - 6) {
                        linePosArr[vertexIndex++] = positions[i * 3];
                        linePosArr[vertexIndex++] = positions[i * 3 + 1];
                        linePosArr[vertexIndex++] = positions[i * 3 + 2];

                        linePosArr[vertexIndex++] = positions[j * 3];
                        linePosArr[vertexIndex++] = positions[j * 3 + 1];
                        linePosArr[vertexIndex++] = positions[j * 3 + 2];
                    }
                }
            }
        }

        particles.geometry.attributes.position.needsUpdate = true;
        linesMesh.geometry.setDrawRange(0, vertexIndex / 3);
        linesMesh.geometry.attributes.position.needsUpdate = true;

        renderer.render(scene, camera);
    };

    animate();
};

// Defer initialization to unblock main thread paint
if (window.requestIdleCallback) {
    window.requestIdleCallback(() => initThreeJS());
} else {
    setTimeout(initThreeJS, 100);
}
