import React, { useState, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
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
  ]
};

const BuildingConfiguratorScene: React.FC = () => {
  // Use state for dynamic configuration
  const [buildingConfig, setBuildingConfig] = useState<BuildingConfig>(defaultConfig);
  // State for the currently selected object (chimney, dormer, wing)
  const [selectedObject, setSelectedObject] = useState<THREE.Object3D | null>(null);
  // State to track if the transform gizmo is being dragged
  const [isDragging, setIsDragging] = useState(false);

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
        }
        // Add similar logic for 'wing' if/when wings are implemented
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
          • <strong>Components:</strong> Click to select (Chimney/Dormer). Drag gizmo to move. ESC to deselect.
        </p>
        <p className="text-sm text-gray-700">
          • <strong>Camera:</strong> Mouse drag to orbit (when not dragging component). Scroll to zoom.
        </p>
      </div>
    </div>
  );
};

export default BuildingConfiguratorScene; 