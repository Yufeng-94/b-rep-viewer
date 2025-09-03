let scene, camera, renderer, controls;
let faceMesh, edgeLines, vertexPoints;
let currentMeshData = null;

init();

function init() {
    // Setup scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // Setup camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    // Setup renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Setup controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Setup event listeners
    setupEventListeners();

    // Handle window resize
    window.addEventListener('resize', onWindowResize);

    // Start animation loop
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

function setupEventListeners() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    // const loadButton = document.getElementById('loading');

    // Drag and drop handling
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#007bff'
    });
    dropZone.addEventListener('dragleave', () => {
        dropZone.style.borderColor = '#ccc';
    });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '#ccc';

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    });
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
        }
    });

    // Control buttons
    document.getElementById('show-faces').addEventListener('click', () => showOnly('faces'));
    document.getElementById('show-edges').addEventListener('click', () => showOnly('edges'));
    document.getElementById('show-vertices').addEventListener('click', () => showOnly('vertices'));
    document.getElementById('show-all').addEventListener('click', () => showOnly('all'));
}

function handleFileUpload(file) {
    if (file.name.toLowerCase().endsWith('.step') || file.name.toLowerCase().endsWith('.stp')) {
        const loading = document.getElementById('loading');
        loading.style.display = 'block';

        const formData = new FormData();
        formData.append('file', file);

        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert('Error: ' + data.error);
            } else {
                currentMeshData = data;
                visualizeModel(data);
                // Hide drop zone after successful upload
                document.getElementById('drop-zone').style.display = 'none';
                // Show control buttons
                document.getElementById('controls').style.display = 'block';
            }
        })
        .catch(error => {
            alert('Error uploading file: ' + error);
        })
        .finally(() => {
            // Hide loading indicator
            loading.style.display = 'none';
        });
    } else {
        alert('Please upload a STEP (.step or .stp) file.');
    }
}

function visualizeModel(meshData) {
    // Clear previous model
    if  (faceMesh) scene.remove(faceMesh);
    if  (edgeLines) scene.remove(edgeLines);
    if  (vertexPoints) scene.remove(vertexPoints);

    // Create geometry for faces
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(meshData.vertices, 3));
    geometry.setIndex(meshData.faces);
    geometry.computeVertexNormals();

    const material = new THREE.MeshPhongMaterial({
        color: 0x2194ce,
        side: THREE.DoubleSide,
        flatShading: true
    });

    faceMesh = new THREE.Mesh(geometry, material);
    scene.add(faceMesh);

    // Create geometry for edges
    const edgeGemometry = new THREE.BufferGeometry();
    edgeGemometry.setAttribute('position', new THREE.Float32BufferAttribute(meshData.vertices, 3));
    edgeGemometry.setIndex(meshData.edges);

    const edgeMaterial = new THREE.LineBasicMaterial({color: 0x000000});
    edgeLines = new THREE.LineSegments(edgeGemometry, edgeMaterial);
    scene.add(edgeLines);

    // Create geometry for vertices
    const vertexGeometry = new THREE.BufferGeometry();
    vertexGeometry.setAttribute('position', new THREE.Float32BufferAttribute(meshData.vertices, 3));
    const vertexMaterial = new THREE.PointsMaterial({
        color: 0xff0000,
        size: 0.05,
        sizeAttenuation: true
    });

    vertexPoints = new THREE.Points(vertexGeometry, vertexMaterial);
    scene.add(vertexPoints);

    // Position camera based on bounding box
    if (meshData.bounding_box) {
        const center = new THREE.Vector3(...meshData.bounding_box.center);
        const size = new THREE.Vector3(
            meshData.bounding_box.max[0] - meshData.bounding_box.min[0],
            meshData.bounding_box.max[1] - meshData.bounding_box.min[1],
            meshData.bounding_box.max[2] - meshData.bounding_box.min[2]
        )

        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / (2 * Math.tan(fov / 2)))
        cameraZ *= 1.5; // zoom out a little so that objects fit in view

        camera.position.copy(center);
        camera.position.z += cameraZ;
        camera.lookAt(center);

        controls.target.copy(center);
        controls.update();
        
    }

    // show all by default
    showOnly('all');
}

function showOnly(mode) {
    if (!faceMesh || !edgeLines || !vertexPoints) return;

    faceMesh.visible = false;
    edgeLines.visible = false;
    vertexPoints.visible = false;

    switch(mode) {
        case 'faces':
            faceMesh.visible = true;
            break;
        case 'edges':
            edgeLines.visible = true;
            break;
        case 'vertices':
            vertexPoints.visible = true;
            break;
        case 'all':
            faceMesh.visible = true;
            edgeLines.visible = true;
            vertexPoints.visible = true;
            break;
    }

    // Update button states
    document.querySelectorAll('#controls button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`show-${mode}`).classList.add('active');
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}