/* ============================================
   3D BACKGROUND EFFECT - THREE.JS
   ============================================ */

   function initBackground() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas || !window.THREE) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    
    const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    camera.position.z = 5;

    // Create animated mesh
    const geometry = new THREE.IcosahedronGeometry(2, 3);
    const material = new THREE.MeshNormalMaterial({
        wireframe: true,
        transparent: true,
        opacity: 0.3
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Add particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 1000;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 10;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.02,
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.6
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    // Mouse movement
    let mouseX = 0;
    let mouseY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);

        // Rotate mesh
        mesh.rotation.x += 0.001;
        mesh.rotation.y += 0.002;

        // Move mesh with mouse
        mesh.position.x = Helpers.lerp(mesh.position.x, mouseX * 0.5, 0.05);
        mesh.position.y = Helpers.lerp(mesh.position.y, mouseY * 0.5, 0.05);

        // Rotate particles
        particlesMesh.rotation.x += 0.0005;
        particlesMesh.rotation.y += 0.001;

        renderer.render(scene, camera);
    }

    animate();

    // Handle resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Cleanup on mobile to save performance
    if (window.innerWidth < 768) {
        material.wireframe = false;
        particlesMaterial.size = 0.01;
    }
}

// Make globally available
window.initBackground = initBackground;