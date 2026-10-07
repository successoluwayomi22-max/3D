import * as THREE from 'three';

/**
 * Creates the complete architectural 3D campus of Spring of Success Academy.
 * Returns an object containing the root group, blueprint group, realistic group,
 * scanline mesh, and hotspot anchors.
 */
export function createCampusModel() {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'CampusRoot';

  // Master materials for Realistic Mode
  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0xe8e2d5, // warm classical limestone
    roughness: 0.65,
    metalness: 0.05
  });

  const columnMat = new THREE.MeshStandardMaterial({
    color: 0xf3ede0,
    roughness: 0.45,
    metalness: 0.1
  });

  const brickMat = new THREE.MeshStandardMaterial({
    color: 0x9b4d38, // warm academic brick
    roughness: 0.85,
    metalness: 0.02
  });

  const roofMat = new THREE.MeshStandardMaterial({
    color: 0x2c3b4d, // dark slate roof
    roughness: 0.4,
    metalness: 0.3
  });

  const copperMat = new THREE.MeshStandardMaterial({
    color: 0x4aa382, // aged patina copper dome
    roughness: 0.5,
    metalness: 0.6
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37, // gold accent details
    roughness: 0.3,
    metalness: 0.85
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x88ccff,
    roughness: 0.1,
    transmission: 0.85,
    thickness: 1.2,
    transparent: true,
    opacity: 0.85,
    reflectivity: 0.9
  });

  const lawnMat = new THREE.MeshStandardMaterial({
    color: 0x2e6b38, // manicured campus turf
    roughness: 0.9,
    metalness: 0.0
  });

  const pathMat = new THREE.MeshStandardMaterial({
    color: 0xbdb7ab, // limestone pavers
    roughness: 0.7,
    metalness: 0.05
  });

  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x0099cc,
    roughness: 0.15,
    metalness: 0.2,
    transparent: true,
    opacity: 0.85
  });

  // Master materials for Blueprint Mode
  const bpMeshMat = new THREE.MeshBasicMaterial({
    color: 0x050f22,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1
  });

  const bpWireMat = new THREE.LineBasicMaterial({
    color: 0x00f0ff,
    linewidth: 1.5,
    transparent: true,
    opacity: 0.9
  });

  const bpAccentWireMat = new THREE.LineBasicMaterial({
    color: 0x50b0ff,
    linewidth: 1.0,
    transparent: true,
    opacity: 0.6
  });

  const realisticGroup = new THREE.Group();
  realisticGroup.name = 'RealisticCampus';
  const blueprintGroup = new THREE.Group();
  blueprintGroup.name = 'BlueprintCampus';

  // Helper to add a mesh to realistic and its wireframe to blueprint
  function addArchitecturalMesh(geo, mat, posX = 0, posY = 0, posZ = 0, rotY = 0, shadow = true) {
    // Realistic Mesh
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(posX, posY, posZ);
    mesh.rotation.y = rotY;
    mesh.castShadow = shadow;
    mesh.receiveShadow = true;
    realisticGroup.add(mesh);

    // Blueprint Wireframe
    const wireGeo = new THREE.EdgesGeometry(geo);
    const wire = new THREE.LineSegments(wireGeo, bpWireMat);
    wire.position.set(posX, posY, posZ);
    wire.rotation.y = rotY;
    blueprintGroup.add(wire);

    // Blueprint semi-opaque backing for occlusion
    const bpBacking = new THREE.Mesh(geo, bpMeshMat);
    bpBacking.position.set(posX, posY, posZ);
    bpBacking.rotation.y = rotY;
    blueprintGroup.add(bpBacking);

    return mesh;
  }

  // ==========================================
  // 1. MAIN ACADEMIC HALL & ROTUNDA
  // ==========================================
  // Central Main Building Body
  const mainBodyGeo = new THREE.BoxGeometry(28, 10, 16);
  addArchitecturalMesh(mainBodyGeo, stoneMat, 0, 5, 0);

  // Main Roof (Hip Roof)
  const roofGeo = new THREE.ConeGeometry(17, 4.5, 4);
  roofGeo.rotateY(Math.PI / 4);
  addArchitecturalMesh(roofGeo, roofMat, 0, 12, 0);

  // Grand Portico Base & Steps
  const stepsGeo = new THREE.BoxGeometry(16, 1.2, 8);
  addArchitecturalMesh(stepsGeo, stoneMat, 0, 0.6, 9.5);

  const upperStepGeo = new THREE.BoxGeometry(14, 0.8, 6);
  addArchitecturalMesh(upperStepGeo, stoneMat, 0, 1.6, 9);

  // Classical Portico Columns (8 columns across front)
  const colRadius = 0.45;
  const colHeight = 7.5;
  const colGeo = new THREE.CylinderGeometry(colRadius * 0.9, colRadius, colHeight, 16);
  const colBaseGeo = new THREE.BoxGeometry(1.1, 0.4, 1.1);

  const colPositions = [-5.5, -3.8, -2.1, -0.7, 0.7, 2.1, 3.8, 5.5];
  colPositions.forEach(x => {
    // Column Base
    addArchitecturalMesh(colBaseGeo, stoneMat, x, 2.2, 11);
    // Shaft
    addArchitecturalMesh(colGeo, columnMat, x, 6.0, 11);
    // Capital
    addArchitecturalMesh(colBaseGeo, goldMat, x, 9.8, 11);
  });

  // Classical Triangular Pediment
  const pedimentShape = new THREE.Shape();
  pedimentShape.moveTo(-7.5, 0);
  pedimentShape.lineTo(7.5, 0);
  pedimentShape.lineTo(0, 3.2);
  pedimentShape.closePath();
  const extrudeSettings = { depth: 3.5, bevelEnabled: true, bevelThickness: 0.2, bevelSize: 0.2 };
  const pedimentGeo = new THREE.ExtrudeGeometry(pedimentShape, extrudeSettings);
  pedimentGeo.center();
  addArchitecturalMesh(pedimentGeo, stoneMat, 0, 11.6, 10.2);

  // Pediment Crest Medallion
  const medallionGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.2, 32);
  medallionGeo.rotateX(Math.PI / 2);
  addArchitecturalMesh(medallionGeo, goldMat, 0, 11.6, 12.0);

  // Arched Grand Main Entrance Doorway
  const doorFrameGeo = new THREE.BoxGeometry(3.6, 5.2, 0.4);
  addArchitecturalMesh(doorFrameGeo, stoneMat, 0, 4.4, 8.1);
  const doorGeo = new THREE.BoxGeometry(2.8, 4.6, 0.2);
  addArchitecturalMesh(doorGeo, roofMat, 0, 4.1, 8.2);

  // ==========================================
  // 2. ICONIC CLOCK & BELL TOWER
  // ==========================================
  // Tower Level 1 (Square base)
  const towerBaseGeo = new THREE.BoxGeometry(6.5, 8, 6.5);
  addArchitecturalMesh(towerBaseGeo, stoneMat, 0, 14, 0);

  // Tower Level 2 (Clock Chamber)
  const towerClockGeo = new THREE.BoxGeometry(5.4, 6, 5.4);
  addArchitecturalMesh(towerClockGeo, stoneMat, 0, 20.5, 0);

  // 4 Glowing Clock Faces
  const clockFaceGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.15, 32);
  clockFaceGeo.rotateX(Math.PI / 2);
  const clockMat = new THREE.MeshBasicMaterial({ color: 0xfff3cc }); // glowing warm clock
  // Front clock
  addArchitecturalMesh(clockFaceGeo, clockMat, 0, 20.8, 2.75);
  // Back clock
  addArchitecturalMesh(clockFaceGeo, clockMat, 0, 20.8, -2.75);
  // Left clock
  const clockSideGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.15, 32);
  clockSideGeo.rotateZ(Math.PI / 2);
  addArchitecturalMesh(clockSideGeo, clockMat, -2.75, 20.8, 0);
  addArchitecturalMesh(clockSideGeo, clockMat, 2.75, 20.8, 0);

  // Tower Level 3 (Belfry columns & dome)
  const belfryGeo = new THREE.CylinderGeometry(2.3, 2.5, 4.5, 12);
  addArchitecturalMesh(belfryGeo, stoneMat, 0, 25.5, 0);

  // Bell Tower Cupola Dome (Patina Copper)
  const cupolaGeo = new THREE.SphereGeometry(2.4, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  addArchitecturalMesh(cupolaGeo, copperMat, 0, 27.5, 0);

  // Weather Vane & Gold Spire
  const spireGeo = new THREE.ConeGeometry(0.3, 3.5, 8);
  addArchitecturalMesh(spireGeo, goldMat, 0, 30.5, 0);

  // ==========================================
  // 3. MODERN SCIENCE & INNOVATION WING (WEST)
  // ==========================================
  const westWingBody = new THREE.BoxGeometry(20, 8.5, 14);
  addArchitecturalMesh(westWingBody, brickMat, -22, 4.25, -1);

  // Glass Atrium / Curtain Wall
  const westGlassGeo = new THREE.BoxGeometry(18, 7.5, 0.5);
  addArchitecturalMesh(westGlassGeo, glassMat, -22, 4.5, 6.2);

  // Cantilevered Upper Tech Pod
  const techPodGeo = new THREE.BoxGeometry(12, 4, 16);
  addArchitecturalMesh(techPodGeo, stoneMat, -24, 9.5, 0);
  const podGlassGeo = new THREE.BoxGeometry(11, 3.2, 0.3);
  addArchitecturalMesh(podGlassGeo, glassMat, -24, 9.5, 8.1);

  // Rooftop Solar Array Panels
  const solarPanelGeo = new THREE.BoxGeometry(3.5, 0.2, 2.5);
  const solarMat = new THREE.MeshStandardMaterial({ color: 0x112244, roughness: 0.1, metalness: 0.9 });
  for (let i = -27; i <= -17; i += 4.5) {
    addArchitecturalMesh(solarPanelGeo, solarMat, i, 11.6, -2);
  }

  // ==========================================
  // 4. PERFORMING ARTS & LIBRARY WING (EAST)
  // ==========================================
  const eastWingBody = new THREE.BoxGeometry(20, 8.5, 14);
  addArchitecturalMesh(eastWingBody, brickMat, 22, 4.25, -1);

  // Grand Circular Library Rotunda
  const rotundaGeo = new THREE.CylinderGeometry(7.5, 7.5, 9.5, 32);
  addArchitecturalMesh(rotundaGeo, stoneMat, 28, 4.75, 4);

  const rotundaDomeGeo = new THREE.SphereGeometry(7.6, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
  addArchitecturalMesh(rotundaDomeGeo, copperMat, 28, 9.5, 4);

  // Skylight Oculus on Dome
  const oculusGeo = new THREE.CylinderGeometry(2.0, 2.0, 0.8, 24);
  addArchitecturalMesh(oculusGeo, glassMat, 28, 16.5, 4);

  // Windows Rhythms (East & West Wings)
  const windowGeo = new THREE.BoxGeometry(1.6, 2.5, 0.2);
  [-16, -12, -8, 8, 12, 16].forEach(x => {
    addArchitecturalMesh(windowGeo, glassMat, x, 7.2, 8.1);
    addArchitecturalMesh(windowGeo, glassMat, x, 3.2, 8.1);
  });

  // ==========================================
  // 5. CAMPUS QUADRANGLE, LAWNS & PATHWAYS
  // ==========================================
  const groundGeo = new THREE.PlaneGeometry(120, 100);
  groundGeo.rotateX(-Math.PI / 2);
  const groundMesh = new THREE.Mesh(groundGeo, lawnMat);
  groundMesh.receiveShadow = true;
  realisticGroup.add(groundMesh);

  // Blueprint Grid Floor
  const bpGrid = new THREE.GridHelper(120, 40, 0x00e5ff, 0x083366);
  bpGrid.position.y = 0.05;
  blueprintGroup.add(bpGrid);

  // Main Paved Promenade (Axis to fountain)
  const walkwayGeo = new THREE.PlaneGeometry(10, 40);
  walkwayGeo.rotateX(-Math.PI / 2);
  const walkwayMesh = new THREE.Mesh(walkwayGeo, pathMat);
  walkwayMesh.position.set(0, 0.08, 28);
  walkwayMesh.receiveShadow = true;
  realisticGroup.add(walkwayMesh);

  // Cross Plaza Pathway
  const crossPlazaGeo = new THREE.PlaneGeometry(70, 8);
  crossPlazaGeo.rotateX(-Math.PI / 2);
  const crossPlazaMesh = new THREE.Mesh(crossPlazaGeo, pathMat);
  crossPlazaMesh.position.set(0, 0.07, 18);
  crossPlazaMesh.receiveShadow = true;
  realisticGroup.add(crossPlazaMesh);

  // ==========================================
  // 6. GRAND CAMPUS FOUNTAIN
  // ==========================================
  const fountainBaseGeo = new THREE.CylinderGeometry(6.5, 7.0, 1.2, 32);
  addArchitecturalMesh(fountainBaseGeo, stoneMat, 0, 0.6, 32);

  const fountainWaterGeo = new THREE.CylinderGeometry(6.2, 6.2, 0.8, 32);
  addArchitecturalMesh(fountainWaterGeo, waterMat, 0, 0.8, 32, 0, false);

  const fountainTier1Geo = new THREE.CylinderGeometry(3.2, 3.5, 1.8, 24);
  addArchitecturalMesh(fountainTier1Geo, stoneMat, 0, 1.8, 32);

  const fountainTier2Geo = new THREE.CylinderGeometry(1.6, 1.8, 1.4, 20);
  addArchitecturalMesh(fountainTier2Geo, stoneMat, 0, 3.2, 32);

  // ==========================================
  // 7. MANICURED CAMPUS TREES & LIGHT POSTS
  // ==========================================
  const treePositions = [
    [-38, 16], [-38, 28], [-38, 40],
    [38, 16], [38, 28], [38, 40],
    [-18, 36], [18, 36],
    [-12, 44], [12, 44],
    [-44, 2], [44, 2]
  ];

  const trunkGeo = new THREE.CylinderGeometry(0.35, 0.5, 3.5, 8);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5a3d28, roughness: 0.9 });
  const foliageGeo = new THREE.DodecahedronGeometry(2.6, 1);
  const foliageMat = new THREE.MeshStandardMaterial({ color: 0x2d6b38, roughness: 0.8 });

  treePositions.forEach(([tx, tz]) => {
    addArchitecturalMesh(trunkGeo, trunkMat, tx, 1.75, tz);
    addArchitecturalMesh(foliageGeo, foliageMat, tx, 5.0, tz);
  });

  // ==========================================
  // 8. BLUEPRINT DRAFTING ANNOTATIONS & CAD HUD
  // ==========================================
  const cadRingGeo = new THREE.RingGeometry(8, 8.2, 32);
  cadRingGeo.rotateX(-Math.PI / 2);
  const cadRing = new THREE.Mesh(cadRingGeo, bpAccentWireMat);
  cadRing.position.set(0, 0.1, 32);
  blueprintGroup.add(cadRing);

  // Compass Rose in blueprint mode
  const compassGroup = new THREE.Group();
  compassGroup.position.set(45, 0.1, 38);
  const northArrowShape = new THREE.Shape();
  northArrowShape.moveTo(0, 0);
  northArrowShape.lineTo(0.8, -4);
  northArrowShape.lineTo(0, -3.2);
  northArrowShape.lineTo(-0.8, -4);
  northArrowShape.closePath();
  const northArrowGeo = new THREE.ShapeGeometry(northArrowShape);
  northArrowGeo.rotateX(-Math.PI / 2);
  const northArrowMesh = new THREE.Mesh(northArrowGeo, bpWireMat);
  compassGroup.add(northArrowMesh);
  blueprintGroup.add(compassGroup);

  // ==========================================
  // 9. LASER SCANLINE PLANE (Transformation FX)
  // ==========================================
  const scanlineGeo = new THREE.PlaneGeometry(120, 2);
  scanlineGeo.rotateX(-Math.PI / 2);
  const scanlineMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
    transparent: true,
    opacity: 0.0,
    side: THREE.DoubleSide
  });
  const scanlineMesh = new THREE.Mesh(scanlineGeo, scanlineMat);
  scanlineMesh.position.set(0, 0.2, 0);
  rootGroup.add(scanlineMesh);

  // ==========================================
  // 10. CAMPUS INTERACTIVE HOTSPOT ANCHORS
  // ==========================================
  const hotspots = [
    {
      id: 'clock-tower',
      title: "Founder's Memorial Clock Tower",
      category: 'Heritage & Vision',
      position: new THREE.Vector3(0, 24, 0),
      description: "Erected in 1928, the iconic clock tower stands as a beacon of integrity and academic honor for generations of scholars."
    },
    {
      id: 'stem-lab',
      title: 'Robotics & AI Innovation Pavilion',
      category: 'STEM & Research',
      position: new THREE.Vector3(-24, 8, 3),
      description: "State-of-the-art makerspaces, bio-chemistry research stations, and autonomous robotics arenas preparing students for top engineering universities."
    },
    {
      id: 'library',
      title: 'Grand Academic Rotunda Library',
      category: 'Humanities & Inquiry',
      position: new THREE.Vector3(28, 10, 4),
      description: "A two-story dome with over 60,000 volumes, collaborative study chambers, and quiet research archives under natural sunlight."
    },
    {
      id: 'fountain',
      title: 'Centennial Quad & Reflection Basin',
      category: 'Campus Life',
      position: new THREE.Vector3(0, 3, 32),
      description: "The heart of student life, outdoor symposia, graduation ceremonies, and lifelong friendships."
    }
  ];

  const hotspotGroup = new THREE.Group();
  hotspotGroup.name = 'Hotspots';
  const pinGeo = new THREE.SphereGeometry(0.9, 16, 16);
  const pinMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });

  hotspots.forEach(h => {
    const pin = new THREE.Mesh(pinGeo, pinMat);
    pin.position.copy(h.position);
    pin.userData = h;
    hotspotGroup.add(pin);
  });
  rootGroup.add(hotspotGroup);

  // Combine groups
  rootGroup.add(blueprintGroup);
  rootGroup.add(realisticGroup);

  return {
    rootGroup,
    blueprintGroup,
    realisticGroup,
    scanlineMesh,
    hotspots,
    hotspotGroup
  };
}
