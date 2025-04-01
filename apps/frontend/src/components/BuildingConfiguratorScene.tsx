import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, TransformControls } from '@react-three/drei';
import ModularBuilding, { BuildingConfig } from './ModularBuilding'; // Assuming ModularBuilding exports this type
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
      position: [2, 5, 1.5], // Position relative to base origin (bottom-front-left corner)
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
const PV_TILE_WIDTH = 1.0; // 1 meter wide
const PV_TILE_DEPTH = 1.6; // 1.6 meters deep
const PV_TILE_HEIGHT = 0.05; // 5cm thick
const MIN_SPACING = 0.1; // Minimum spacing between tiles in meters

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
  newTile: { position: [number, number, number], roofFace: 'front' | 'back' | 'left' | 'right' },
  existingTiles: Array<{ position: [number, number, number], roofFace: 'front' | 'back' | 'left' | 'right' }>
): boolean {
  return existingTiles.some(tile => {
    if (tile.roofFace !== newTile.roofFace) return false;
    
    const dx = Math.abs(tile.position[0] - newTile.position[0]);
    const dz = Math.abs(tile.position[2] - newTile.position[2]);
    
    return dx < (PV_TILE_WIDTH + MIN_SPACING) && dz < (PV_TILE_DEPTH + MIN_SPACING);
  });
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
          if (!checkTileOverlap({ position, roofFace: face }, buildingConfig.pvTiles || [])) {
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
                  depth: PV_TILE_DEPTH
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
  // Use state for dynamic configuration
  const [buildingConfig, setBuildingConfig] = useState<BuildingConfig>(defaultConfig);
  // State for the currently selected object (chimney, dormer, PV tile)
  const [selectedObject, setSelectedObject] = useState<THREE.Object3D | null>(null);
  // State to track if the transform gizmo is being dragged
  const [isDragging, setIsDragging] = useState(false);
  // State to track the selected PV tile index
  const [selectedPVTileIndex, setSelectedPVTileIndex] = useState<number | null>(null);

  // Effect to sync selectedPVTileIndex with selectedObject
  useEffect(() => {
    if (selectedObject && selectedObject.userData.type === 'pvtile') {
      setSelectedPVTileIndex(selectedObject.userData.index);
    } else if (!selectedObject) {
      setSelectedPVTileIndex(null);
    }
  }, [selectedObject]);

  // Effect to handle Escape key press for deselecting
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedObject(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Cleanup function to remove listener on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  // Callback to update config when an object is moved via TransformControls
  const handleObjectChange = useCallback(() => {
    if (selectedObject && selectedObject.userData.type && typeof selectedObject.userData.index === 'number') {
      const { type, index } = selectedObject.userData;
      const newPositionArray: [number, number, number] = [selectedObject.position.x, selectedObject.position.y, selectedObject.position.z];

      setBuildingConfig(prevConfig => {
        const newConfig = { ...prevConfig };
        if (type === 'chimney' && newConfig.chimneys && newConfig.chimneys[index]) {
          newConfig.chimneys = [...newConfig.chimneys]; // Create new array for state update
          newConfig.chimneys[index] = { ...newConfig.chimneys[index], position: newPositionArray };
        } else if (type === 'dormer' && newConfig.dormers && newConfig.dormers[index]) {
          newConfig.dormers = [...newConfig.dormers];
          newConfig.dormers[index] = { ...newConfig.dormers[index], position: newPositionArray };
        } else if (type === 'pvtile' && newConfig.pvTiles && newConfig.pvTiles[index]) {
          newConfig.pvTiles = [...newConfig.pvTiles];
          newConfig.pvTiles[index] = { ...newConfig.pvTiles[index], position: newPositionArray };
        }
        return newConfig;
      });
    }
  }, [selectedObject]); // Dependency: re-create if selectedObject changes

  // Handlers for base building dimension changes
  const handleBaseDimensionChange = (dimension: 'width' | 'depth' | 'height', value: number) => {
    setBuildingConfig(prevConfig => ({
      ...prevConfig,
      base: { ...prevConfig.base, [dimension]: Math.max(1, value) } // Ensure dimension is at least 1
    }));
  };

  // Handler for roof angle slider change
  const handleRoofAngleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newAngle = Number(event.target.value);
    setBuildingConfig(prevConfig => ({
      ...prevConfig,
      base: { ...prevConfig.base, roofAngle: newAngle }
    }));
  };

  // Handler for roof clicks
  const handleRoofClick = useCallback((point: THREE.Vector3, face: 'front' | 'back' | 'left' | 'right') => {
    if (isDragging) return;

    console.log('Roof clicked:', { point, face, pointRaw: point.toArray() });

    // Get the base building dimensions
    const { width, height, depth, roofAngle } = buildingConfig.base;
    
    // Convert point to position in the ModularBuilding's local space
    // The ModularBuilding is positioned at -width/2, 0, -depth/2
    const groupOffsetX = -width / 2;
    const groupOffsetZ = -depth / 2;
    
    // Calculate the absolute world position where we want to place the tile
    const worldPos = new THREE.Vector3(
      point.x - groupOffsetX,
      point.y, 
      point.z - groupOffsetZ
    );
    
    console.log('World position:', worldPos.toArray());
    
    // Calculate the rotation
    const rotation = calculatePVTileRotation(face, roofAngle);
    
    // Calculate the exact height based on the roof angle and position 
    // to ensure the tile sits perfectly on the roof
    const angleRad = (roofAngle * Math.PI) / 180;
    let adjustedY = 0;
    
    switch (face) {
      case 'left':
        // For left roof, height depends on X position (distance from left edge)
        adjustedY = height + (Math.tan(angleRad) * worldPos.x);
        break;
      case 'right':
        // For right roof, height depends on distance from right edge
        adjustedY = height + (Math.tan(angleRad) * (width - worldPos.x));
        break;
      case 'front':
      case 'back':
        // Keep existing Y value for front/back
        adjustedY = worldPos.y;
        break;
    }
    
    // Set the final position with correct height and a tiny offset to prevent z-fighting
    const finalPosition: [number, number, number] = [
      worldPos.x,
      adjustedY + 0.02, // Small offset to prevent z-fighting
      worldPos.z
    ];
    
    console.log('Final position:', finalPosition);
    
    // Check for overlap with existing tiles
    if (!checkTileOverlap({ position: finalPosition, roofFace: face }, buildingConfig.pvTiles || [])) {
      // Add new PV tile
      setBuildingConfig(prev => ({
        ...prev,
        pvTiles: [
          ...(prev.pvTiles || []),
          {
            position: finalPosition,
            rotation,
            roofFace: face,
            width: PV_TILE_WIDTH,
            depth: PV_TILE_DEPTH
          }
        ]
      }));
    } else {
      console.log('Tile overlap detected, skipping placement');
    }
  }, [buildingConfig, isDragging]);

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

          {/* PV Tile Placement Scene */}
          <PVTilePlacementScene
            buildingConfig={buildingConfig}
            setBuildingConfig={setBuildingConfig}
            selectedObject={selectedObject}
            setSelectedObject={setSelectedObject}
            isDragging={isDragging}
            setIsDragging={setIsDragging}
          />

          {/* Conditionally render TransformControls */} 
          {selectedObject && (
            <TransformControls
              object={selectedObject}
              mode="translate" // Only allow translation
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
          • <strong>Components:</strong> Click to select (Chimney/Dormer/PV Tile). Drag gizmo to move. ESC to deselect.
        </p>
        <p className="text-sm text-gray-700">
          • <strong>PV Tiles:</strong> Click on roof faces to place PV tiles. Tiles will automatically align with the roof slope.
        </p>
        <p className="text-sm text-gray-700">
          • <strong>Camera:</strong> Mouse drag to orbit (when not dragging component). Scroll to zoom.
        </p>
      </div>
    </div>
  );
};

export default BuildingConfiguratorScene; 