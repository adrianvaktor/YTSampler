
// Set up the scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create a geometry with random stars
const starCount = 10000;
const starsGeometry = new THREE.BufferGeometry();
const positions = [];

for (let i = 0; i < starCount; i++) {
  positions.push(
    (Math.random() - 0.5) * 2000, // X
    (Math.random() - 0.5) * 2000, // Y
    (Math.random() - 0.5) * 2000  // Z
  );
}

starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

// Create a material for the stars
const starMaterial = new THREE.PointsMaterial({
  color: 'grey',
  size: 2,
  sizeAttenuation: true
});

// Create a points object to represent the stars in 3D space
const stars = new THREE.Points(starsGeometry, starMaterial);
scene.add(stars);

// Position the camera
camera.position.z = 1000;

// Zoom settings
let zoomSpeed = 0.05;  // Speed of the zoom
let zoomLimit = 100;   // Limit to stop zooming
let targetZ = 1000; // Initial camera position

let direction = 1
// Animation loop
function animate() {
  requestAnimationFrame(animate);

  if(direction == -1 && camera.position.z < zoomLimit){
    direction = 1
  }
  if(direction == 1 && camera.position.z > targetZ){
    direction = -1
  }
  camera.position.z += zoomSpeed * direction;

  renderer.render(scene, camera);
}

animate();

// Adjust the renderer when the window is resized
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});
