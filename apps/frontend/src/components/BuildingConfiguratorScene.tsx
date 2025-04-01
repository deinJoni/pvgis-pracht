import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, TransformControls } from '@react-three/drei';
import ModularBuilding, { 
  BuildingConfig, 
  PVTileConfig, 
  ChimneyConfig,
  DormerConfig
} from './ModularBuilding';
import * as THREE from 'three';

// Default building configuration for Step 1
const defaultConfig: BuildingConfig = {
  base: {
    width: 10,
    depth: 8,
    height: 5,
    roofAngle: 25
  },
  wings: [], 
  chimneys: [
    {
      position: [3, 6.5, 5.5], // [x=2m from left edge, y=5m up from ground, z=1.5m from front edge]
      width: 0.8,
      depth: 0.8,
      height: 1.5
    }
  ],
  dormers: [
    {
      position: [3, 5.5, 1.5], // Position relative to base origin 
      width: 1.8,
      depth: 1.5,
      height: 1.3
    },
    {
      position: [7, 5.5, 1.5], 
      width: 1.8,
      depth: 1.5,
      height: 1.3
    }
  ],
  pvTiles: []
};

// PV Tile placement constants
const PV_TILE_WIDTH = 1.1; // Updated width
const PV_TILE_DEPTH = 1.7; // Updated depth
const PV_TILE_HEIGHT = 0.05; // 5cm thick
const MIN_SPACING = 0.1; // Minimum spacing between tiles in meters
const GRID_SIZE = 0.1; // Snap grid size (e.g., 10cm)

// Helper function to snap a value to the grid
function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

// Helper function to calculate Y position on the roof for given X, Z
function calculateRoofY(x: number, z: number, face: 'front' | 'back' | 'left' | 'right', baseHeight: number, baseWidth: number, baseDepth: number, roofAngle: number): number {
  const angleRad = (roofAngle * Math.PI) / 180;
  let y = baseHeight; // Default to base height

  switch (face) {
    case 'left':
      y = baseHeight + Math.tan(angleRad) * x;
      break;
    case 'right':
      y = baseHeight + Math.tan(angleRad) * (baseWidth - x);
      break;
    case 'front':
      // Assuming ridge is at depth/2. Height depends on distance from ridge.
      y = baseHeight + Math.tan(angleRad) * Math.min(x, baseWidth - x); // Simplified gable height based on X
      break;
    case 'back':
      // Similar logic for back face, might need refinement based on exact roof geometry
      y = baseHeight + Math.tan(angleRad) * Math.min(x, baseWidth - x); // Simplified gable height based on X
      break;
  }
  // Add a small offset to prevent z-fighting
  return y + 0.02;
}

// Helper function to check if a point is on a roof face
function isPointOnRoofFace(point: THREE.Vector3, roofFace: 'front' | 'back' | 'left' | 'right', buildingConfig: BuildingConfig): boolean {
  const { width, depth, height, roofAngle } = buildingConfig.base;
  const roofHeight = Math.tan((roofAngle * Math.PI) / 180) * (width / 2);
  
  // Convert point to local building coordinates
  const localPoint = point.clone().add(new THREE.Vector3(width/2, 0, depth/2));
  
  // Add some tolerance for detection
  const tolerance = 0.2;
  
  switch (roofFace) {
    case 'front':
      return localPoint.z < tolerance && localPoint.z > -tolerance && 
             localPoint.y > height && localPoint.y < height + roofHeight + 1;
    case 'back':
      return Math.abs(localPoint.z - depth) < tolerance && 
             localPoint.y > height && localPoint.y < height + roofHeight + 1;
    case 'left':
      return localPoint.x < tolerance && localPoint.x > -tolerance && 
             localPoint.y > height && localPoint.y < height + roofHeight + 1;
    case 'right':
      return Math.abs(localPoint.x - width) < tolerance && 
             localPoint.y > height && localPoint.y < height + roofHeight + 1;
    default:
      return false;
  }
}

// Helper function to calculate PV tile rotation based on roof face
function calculatePVTileRotation(roofFace: 'front' | 'back' | 'left' | 'right', roofAngle: number): [number, number, number] {
  const angleRad = (roofAngle * Math.PI) / 180;
  
  // Using Euler angles in XYZ order
  switch (roofFace) {
    case 'left':
      // For left roof, the box should be tilted to match the left face slope
      return [0, 0, angleRad];
      
    case 'right':
      // For right roof, the box should be tilted to match the right face slope (negative angle)
      return [0, 0, -angleRad];
      
    case 'front':
      // For front gable, rotate around X axis 
      return [angleRad, 0, 0];
      
    case 'back':
      // For back gable, rotate around X axis in opposite direction
      return [-angleRad, 0, 0];
      
    default:
      return [0, 0, 0];
  }
}

// Helper function to check for tile overlap
function checkTileOverlap(
  newTile: { position: [number, number, number], roofFace: 'front' | 'back' | 'left' | 'right', orientation: 0 | 90, width: number, depth: number },
  existingTiles: Array<{ position: [number, number, number], roofFace: 'front' | 'back' | 'left' | 'right', orientation: 0 | 90, width: number, depth: number }>
): boolean {
  return existingTiles.some(tile => {
    if (tile.roofFace !== newTile.roofFace) return false;

    // Calculate bounding boxes based on orientation
    const tile1Width = tile.orientation === 0 ? tile.width : tile.depth;
    const tile1Depth = tile.orientation === 0 ? tile.depth : tile.width;
    const tile2Width = newTile.orientation === 0 ? newTile.width : newTile.depth;
    const tile2Depth = newTile.orientation === 0 ? newTile.depth : newTile.width;

    // Calculate half-dimensions for easier overlap check
    const halfTile1Width = tile1Width / 2;
    const halfTile1Depth = tile1Depth / 2;
    const halfTile2Width = tile2Width / 2;
    const halfTile2Depth = tile2Depth / 2;

    // Calculate centers
    const center1X = tile.position[0];
    const center1Z = tile.position[2];
    const center2X = newTile.position[0];
    const center2Z = newTile.position[2];

    // Check for overlap on X and Z axes, including minimum spacing
    const overlapX = Math.abs(center1X - center2X) < (halfTile1Width + halfTile2Width + MIN_SPACING);
    const overlapZ = Math.abs(center1Z - center2Z) < (halfTile1Depth + halfTile2Depth + MIN_SPACING);

    return overlapX && overlapZ;
  });
}

// Helper function to recalculate PV tile position based on new angle
function recalculateTilePosition(tile: PVTileConfig, newRoofAngle: number, baseHeight: number, baseWidth: number): [number, number, number] {
  const angleRad = (newRoofAngle * Math.PI) / 180;
  let adjustedY = 0;

  switch (tile.roofFace) {
    case 'left':
      adjustedY = baseHeight + Math.tan(angleRad) * tile.placementX;
      break;
    case 'right':
      adjustedY = baseHeight + Math.tan(angleRad) * (baseWidth - tile.placementX);
      break;
    // Keep existing Y calculation for front/back for now
    case 'front':
    case 'back':
      adjustedY = baseHeight + Math.tan(angleRad) * Math.min(tile.placementX, baseWidth - tile.placementX);
      break;
  }

  return [
    tile.placementX,
    adjustedY + 0.02, // Recalculated Y + offset
    tile.placementZ,
  ];
}

// Scene component for handling PV tile placement
function PVTilePlacementScene({ 
  buildingConfig, 
  setBuildingConfig,
  selectedObject,
  setSelectedObject,
  isDragging,
  setIsDragging
}: {
  buildingConfig: BuildingConfig;
  setBuildingConfig: React.Dispatch<React.SetStateAction<BuildingConfig>>;
  selectedObject: THREE.Object3D | null;
  setSelectedObject: React.Dispatch<React.SetStateAction<THREE.Object3D | null>>;
  isDragging: boolean;
  setIsDragging: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { camera, scene } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

  const handlePointerMove = useCallback((event: any) => {
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
    mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }, []);

  const handleClick = useCallback((event: any) => {
    if (isDragging) return;

    // Update raycaster
    raycaster.current.setFromCamera(mouse.current, camera);

    // Find intersections with roof faces
    const intersects = raycaster.current.intersectObjects(scene.children, true);
    
    // Debug: Log all intersections
    console.log('Intersections:', intersects.map(i => ({
      object: i.object.name,
      distance: i.distance,
      point: i.point
    })));
    
    for (const intersect of intersects) {
      const point = intersect.point;
      const object = intersect.object;
      
      // Debug: Log the clicked object
      console.log('Clicked object:', object.name);
      
      // Check each roof face
      const roofFaces: Array<'front' | 'back' | 'left' | 'right'> = ['front', 'back', 'left', 'right'];
      for (const face of roofFaces) {
        if (isPointOnRoofFace(point, face, buildingConfig)) {
          console.log('Valid roof face clicked:', face);
          
          // Calculate tile position and rotation
          const rotation = calculatePVTileRotation(face, buildingConfig.base.roofAngle);
          const position: [number, number, number] = [
            point.x - buildingConfig.base.width/2,
            point.y,
            point.z - buildingConfig.base.depth/2
          ];

          // Check for overlap with existing tiles
          if (!checkTileOverlap({ position, roofFace: face, orientation: 0, width: PV_TILE_WIDTH, depth: PV_TILE_DEPTH }, buildingConfig.pvTiles || [])) {
            console.log('Adding new PV tile at position:', position);
            // Add new PV tile
            setBuildingConfig(prev => ({
              ...prev,
              pvTiles: [
                ...(prev.pvTiles || []),
                {
                  position,
                  rotation,
                  roofFace: face,
                  width: PV_TILE_WIDTH,
                  depth: PV_TILE_DEPTH,
                  placementX: snapToGrid(position[0], GRID_SIZE),
                  placementZ: snapToGrid(position[2], GRID_SIZE),
                  orientation: 0, // Default orientation (portrait)
                }
              ]
            }));
            return;
          } else {
            console.log('Tile overlap detected, skipping placement');
          }
        }
      }
    }
  }, [buildingConfig, camera, scene, isDragging]);

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('click', handleClick);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('click', handleClick);
    };
  }, [handlePointerMove, handleClick]);

  return null;
}

const BuildingConfiguratorScene: React.FC = () => {
  const [buildingConfig, setBuildingConfig] = useState<BuildingConfig>(defaultConfig);
  const [selectedObject, setSelectedObject] = useState<THREE.Object3D | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedPVTileIndex, setSelectedPVTileIndex] = useState<number | null>(null);
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate'>('translate'); // State for gizmo mode

  // Effect to sync selectedPVTileIndex with selectedObject
  useEffect(() => {
    if (selectedObject && selectedObject.userData.type === 'pvtile') {
      setSelectedPVTileIndex(selectedObject.userData.index);
    } else if (!selectedObject) {
      setSelectedPVTileIndex(null);
    }
  }, [selectedObject]);

  // Effect to handle Escape key press
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedObject(null);
      } else if ((event.key === 'Delete' || event.key === 'Backspace') && selectedPVTileIndex !== null) {
        // Delete the selected PV tile
        setBuildingConfig(prev => ({
          ...prev,
          pvTiles: prev.pvTiles?.filter((_, index) => index !== selectedPVTileIndex) || [],
        }));
        setSelectedObject(null); // Deselect after deleting
      } else if (event.key === 'Shift' && selectedObject && selectedObject.userData.type === 'pvtile') {
        // Only switch to rotate if Shift is pressed AND a PV tile is selected
        setTransformMode('rotate');
      }
    };

    // Add keyup listener for Shift
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Shift') {
        setTransformMode('translate'); // Revert to translate mode on Shift up
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp); // Add keyup listener
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp); // Remove keyup listener
    };
  }, [selectedPVTileIndex, selectedObject]); // Add selectedObject dependency

  // Callback to update config when an object is moved via TransformControls
  const handleObjectChange = useCallback(() => {
    if (!selectedObject || !selectedObject.userData.type || typeof selectedObject.userData.index !== 'number') return;

      const { type, index } = selectedObject.userData;
    const currentPosition = selectedObject.position;
    const baseConfig = buildingConfig;

    let nextConfig: BuildingConfig = { ...baseConfig }; // Start with a copy

    try {
      if (type === 'chimney' && nextConfig.chimneys) {
        const updatedChimneys: ChimneyConfig[] = nextConfig.chimneys.map((c, i) =>
          i === index ? { ...c, position: [currentPosition.x, currentPosition.y, currentPosition.z] as [number, number, number] } : c
        );
        nextConfig = { ...nextConfig, chimneys: updatedChimneys };
      } else if (type === 'dormer' && nextConfig.dormers) {
        const updatedDormers: DormerConfig[] = nextConfig.dormers.map((d, i) =>
          i === index ? { ...d, position: [currentPosition.x, currentPosition.y, currentPosition.z] as [number, number, number] } : d
        );
        nextConfig = { ...nextConfig, dormers: updatedDormers };
      } else if (type === 'pvtile' && nextConfig.pvTiles) {
        const mappedPvTiles = nextConfig.pvTiles.map((tile, i): PVTileConfig => {
          if (i === index) {
            const { base } = baseConfig;
            let { orientation } = tile; // Get current orientation
            let position: [number, number, number] = [...tile.position]; // Start with current position
            let placementX = tile.placementX;
            let placementZ = tile.placementZ;

            // Check the current transform mode state
            if (transformMode === 'rotate') {
              // ROTATION LOGIC
              const currentRotationY = selectedObject.rotation.y;
              const snappedAngleDeg = Math.round(THREE.MathUtils.radToDeg(currentRotationY) / 90) * 90;
              orientation = (snappedAngleDeg % 180 === 0 ? 0 : 90) as 0 | 90;
              // Keep position the same when rotating
              position = tile.position;
              placementX = tile.placementX;
              placementZ = tile.placementZ;
            } else {
              // TRANSLATION LOGIC (existing logic)
              const snappedX = snapToGrid(currentPosition.x, GRID_SIZE);
              const snappedZ = snapToGrid(currentPosition.z, GRID_SIZE);
              const snappedY = calculateRoofY(snappedX, snappedZ, tile.roofFace, base.height, base.width, base.depth, base.roofAngle);
              position = [snappedX, snappedY, snappedZ];
              placementX = snappedX;
              placementZ = snappedZ;
              // Keep orientation the same when translating
              orientation = tile.orientation;
            }

            return {
              ...tile, // Spread existing properties first
              position,
              placementX,
              placementZ,
              orientation, // Update orientation if rotating, keep if translating
              // rotation property (alignment with roof) remains unchanged by gizmo
            };
          }
          return tile;
        });
        // Explicitly type the resulting array
        const updatedPvTiles: PVTileConfig[] = mappedPvTiles;
        nextConfig = { ...nextConfig, pvTiles: updatedPvTiles };
      }

      setBuildingConfig(nextConfig);
    } catch (error) {
      console.error("Error updating object:", error);
    }

  }, [selectedObject, buildingConfig, transformMode]);

  // Handlers for base building dimension changes
  const handleBaseDimensionChange = (dimension: 'width' | 'depth' | 'height', value: number) => {
    const nextConfig = {
      ...buildingConfig,
      base: { ...buildingConfig.base, [dimension]: Math.max(1, value) }
    };
    setBuildingConfig(nextConfig);
  };

  // Handler for roof angle slider change
  const handleRoofAngleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newAngle = Number(event.target.value);
    const baseConfig = buildingConfig;

    const mappedPvTiles = (baseConfig.pvTiles || []).map((tile): PVTileConfig => {
      const newRotation = calculatePVTileRotation(tile.roofFace, newAngle);
      const newPosition = recalculateTilePosition(tile, newAngle, baseConfig.base.height, baseConfig.base.width);
      return {
        ...tile, // Spread existing props first
        position: newPosition,
        rotation: newRotation,
        // Ensure all other props are implicitly carried over by the spread
      };
    });
    // Explicitly type the resulting array
    const updatedPvTiles: PVTileConfig[] = mappedPvTiles;

    const nextConfig: BuildingConfig = {
      ...baseConfig,
      base: { ...baseConfig.base, roofAngle: newAngle },
      pvTiles: updatedPvTiles,
    };
    setBuildingConfig(nextConfig);
  };

  // Handler for roof clicks
  const handleRoofClick = useCallback((point: THREE.Vector3, face: 'front' | 'back' | 'left' | 'right') => {
    // Prevent adding tiles if dragging OR if an object is currently selected
    if (isDragging || selectedObject) return;

    const { width, height, depth, roofAngle } = buildingConfig.base;
    const groupOffsetX = -width / 2;
    const groupOffsetZ = -depth / 2;
    const worldPos = new THREE.Vector3(point.x - groupOffsetX, point.y, point.z - groupOffsetZ);

    const snappedX = snapToGrid(worldPos.x, GRID_SIZE);
    const snappedZ = snapToGrid(worldPos.z, GRID_SIZE);
    const snappedY = calculateRoofY(snappedX, snappedZ, face, height, width, depth, roofAngle);
    const finalPosition: [number, number, number] = [snappedX, snappedY, snappedZ];
    const rotation = calculatePVTileRotation(face, roofAngle);

    // Ensure the new tile object conforms to PVTileConfig
    const newTile: PVTileConfig = {
      position: finalPosition,
      rotation,
      roofFace: face,
      width: PV_TILE_WIDTH,
      depth: PV_TILE_DEPTH,
      placementX: snappedX,
      placementZ: snappedZ,
      orientation: 0, // Default orientation (portrait)
    };

    if (!checkTileOverlap(newTile, buildingConfig.pvTiles || [])) {
      const nextConfig: BuildingConfig = {
        ...buildingConfig,
        pvTiles: [...(buildingConfig.pvTiles || []), newTile],
      };
      setBuildingConfig(nextConfig);
    } else {
      console.log('Tile overlap detected, skipping placement');
    }
  }, [buildingConfig, isDragging, selectedObject]);

  return (
    <div className="w-full">
      <div className="w-full h-[500px] border border-gray-300 rounded-md overflow-hidden">
        <Canvas
          camera={{
            position: [15, 15, 15],
            fov: 50,
            near: 0.1,
            far: 1000,
          }}
          // shadows // Shadows disabled for now
        >
          <ambientLight intensity={0.6} />
          <directionalLight
            // castShadow // Shadows disabled
            position={[10, 20, 5]}
            intensity={1.0}
            // shadow-mapSize-width={1024} // Shadow settings commented out
            // shadow-mapSize-height={1024}
            // shadow-camera-far={50}
            // shadow-camera-left={-10}
            // shadow-camera-right={10}
            // shadow-camera-top={10}
            // shadow-camera-bottom={-10}
          />
          <ModularBuilding
            config={buildingConfig}
            setSelectedObject={setSelectedObject}
            selectedObject={selectedObject}
            onRoofClick={handleRoofClick}
            selectedPVTileIndex={selectedPVTileIndex}
            onPVTileClick={(index: number) => {
              setSelectedPVTileIndex(prevIndex => prevIndex === index ? null : index);
            }}
          />

          {/* PV Tile Placement Scene - REMOVED as it conflicts with onRoofClick */}
          {/* <PVTilePlacementScene
            buildingConfig={buildingConfig}
            setBuildingConfig={setBuildingConfig}
            selectedObject={selectedObject}
            setSelectedObject={setSelectedObject}
            isDragging={isDragging}
            setIsDragging={setIsDragging}
          /> */}

          {/* Conditionally render TransformControls */} 
          {selectedObject && (
            <TransformControls
              object={selectedObject}
              // Set mode based on selected object type AND transformMode state
              mode={selectedObject.userData.type === 'pvtile' ? transformMode : 'translate'}
              space={transformMode === 'rotate' ? "local" : "world"} // Use local for rotate, world for translate
              // Configure axes visibility based on mode
              // Show Y axis (local up) only when rotating PV tile, OR always when translating
              showY={(transformMode === 'translate') || (selectedObject.userData.type === 'pvtile' && transformMode === 'rotate')}
              // Show X/Z axes only when translating (any object type)
              showX={transformMode === 'translate'}
              showZ={transformMode === 'translate'}
              onPointerDown={(e) => {
                e?.stopPropagation();
                setIsDragging(true);
              }} 
              onPointerUp={(e) => {
                e?.stopPropagation(); 
                setIsDragging(false);
              }}
              onObjectChange={handleObjectChange} // Update config continuously during drag
             />
          )}

          <OrbitControls 
            makeDefault
            enableDamping 
            dampingFactor={0.1} 
            enabled={!isDragging} // Disable controls while dragging object 
          />

          <gridHelper args={[30, 30]} position={[0, -0.01, 0]} />
          <axesHelper args={[5]} />

        </Canvas>
      </div>

      {/* Controls layout - matching Simple Building */}
      <div className="flex flex-wrap gap-4 mt-4">
        {/* Width Input */} 
        <div className="flex flex-col">
          <label htmlFor="baseWidth" className="text-sm font-medium">Base Width (m)</label>
          <input
            id="baseWidth"
            type="number"
            value={buildingConfig.base.width}
            onChange={(e) => handleBaseDimensionChange('width', Number(e.target.value))}
            className="w-24 border border-gray-300 rounded px-2 py-1"
            min={1}
            step={0.5}
          />
        </div>
        {/* Depth Input */} 
        <div className="flex flex-col">
          <label htmlFor="baseDepth" className="text-sm font-medium">Base Depth (m)</label>
          <input
            id="baseDepth"
            type="number"
            value={buildingConfig.base.depth}
            onChange={(e) => handleBaseDimensionChange('depth', Number(e.target.value))}
            className="w-24 border border-gray-300 rounded px-2 py-1"
            min={1}
            step={0.5}
          />
        </div>
        {/* Height Input */} 
        <div className="flex flex-col">
          <label htmlFor="baseHeight" className="text-sm font-medium">Base Height (m)</label>
          <input
            id="baseHeight"
            type="number"
            value={buildingConfig.base.height}
            onChange={(e) => handleBaseDimensionChange('height', Number(e.target.value))}
            className="w-24 border border-gray-300 rounded px-2 py-1"
            min={1}
            step={0.5}
          />
        </div>
        {/* Roof Angle Slider */} 
        <div className="flex flex-col">
          <label htmlFor="roofAngle" className="text-sm font-medium">
            Base Roof Angle (°)
          </label>
          <input
            id="roofAngle"
            type="range"
            min="0"
            max="45"
            step="1"
            value={buildingConfig.base.roofAngle}
            onChange={handleRoofAngleChange}
            className="w-32 border border-gray-300 rounded px-2 py-1" 
          />
          <span className="text-sm text-gray-500 mt-1">{buildingConfig.base.roofAngle}°</span>
        </div>
      </div>

      {/* Interaction Instructions - Styled like Simple Building Camera Controls box */} 
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <h3 className="text-sm font-medium mb-1">Controls:</h3>
        <p className="text-sm text-gray-700">
          • <strong>Components:</strong> Click to select (Chimney/Dormer/PV Tile).
            Drag gizmo to move (snaps to grid for PV). 
            Hold <strong>Shift</strong> while dragging PV Tile gizmo to rotate (snaps to 0°/90°). 
            ESC to deselect.
        </p>
        <p className="text-sm text-gray-700">
          • <strong>PV Tiles:</strong> Click on roof faces to place PV tiles (snaps to grid).
        </p>
        <p className="text-sm text-gray-700">
          • <strong>Camera:</strong> Mouse drag to orbit (when not dragging component). Scroll to zoom.
        </p>
      </div>
    </div>
  );
};

export default BuildingConfiguratorScene; 