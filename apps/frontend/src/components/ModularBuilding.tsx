import React, { useRef, Dispatch, SetStateAction, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Building from './Building'; // Assuming this path is correct

// --- Interfaces (Copied for self-containment) --- 
interface BuildingPart { width: number; depth: number; height: number; roofAngle: number; }
interface WingConfig extends BuildingPart { position: [number, number, number]; }
interface ChimneyConfig { position: [number, number, number]; width: number; depth: number; height: number; }
interface DormerConfig { position: [number, number, number]; width: number; depth: number; height: number; }
// Export BuildingConfig so it can be imported by the scene
export interface BuildingConfig { base: BuildingPart; wings?: WingConfig[]; chimneys?: ChimneyConfig[]; dormers?: DormerConfig[]; }

// Define props type for child components (Chimney, Dormer)
interface ChildComponentProps {
  config: ChimneyConfig | DormerConfig;
  index: number;
  setSelectedObject: Dispatch<SetStateAction<THREE.Object3D | null>>;
  selectedObject: THREE.Object3D | null;
}

// --- Updatable Child Components ---

// Chimney Component with selection logic and highlighting
function Chimney({ config, index, setSelectedObject, selectedObject }: ChildComponentProps & { config: ChimneyConfig }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const { position, width, depth, height } = config;
  const originalColor = '#8B4513';
  const highlightColor = '#BC8F8F'; // A lighter brown/rosy brown

  // Effect to handle highlighting
  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const material = mesh.material as THREE.MeshStandardMaterial;
    if (!(material instanceof THREE.MeshStandardMaterial)) return;

    if (selectedObject === mesh) {
      material.color.set(highlightColor);
      material.emissive.set(highlightColor); // Add slight emission for better visibility
      material.emissiveIntensity = 0.3;
    } else {
      material.color.set(originalColor);
      material.emissive.set(originalColor); // Reset emission
      material.emissiveIntensity = 0; 
    }

    // Cleanup function to reset color if component unmounts while selected
    return () => {
      if (material instanceof THREE.MeshStandardMaterial) {
        material.color.set(originalColor);
        material.emissive.set(originalColor);
        material.emissiveIntensity = 0;
      }
    };

  }, [selectedObject]); // Rerun effect when selectedObject changes

  const handleClick = (event: any) => {
    event.stopPropagation();
    if (meshRef.current) {
      meshRef.current.userData = { type: 'chimney', index };
      setSelectedObject(meshRef.current);
    }
  };

  return (
    <mesh 
      ref={meshRef}
      position={position} 
      onClick={handleClick}
    >
      <boxGeometry args={[width, height, depth]} /> 
      <meshStandardMaterial color={originalColor} name="chimneyMaterial" />
    </mesh>
  );
}

// Dormer Component with selection logic and highlighting
function Dormer({ config, index, setSelectedObject, selectedObject }: ChildComponentProps & { config: DormerConfig }) {
  const groupRef = useRef<THREE.Group>(null!);
  const { position, width, depth, height } = config;
  const originalBoxColor = '#E8E8E8';
  const originalRoofColor = '#C35A38';
  const highlightColor = '#FFFFFF'; // Bright white highlight

  // Effect to handle highlighting
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;

    const isSelected = selectedObject === group;

    group.children.forEach(child => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        const material = child.material as THREE.MeshStandardMaterial;
        const originalColor = child.name === 'dormerRoof' ? originalRoofColor : originalBoxColor;
        
        if (isSelected) {
          material.color.set(highlightColor);
          material.emissive.set(highlightColor);
          material.emissiveIntensity = 0.4;
        } else {
          material.color.set(originalColor);
          material.emissive.set(originalColor);
          material.emissiveIntensity = 0;
        }
      }
    });

    // Cleanup function
    return () => {
      group.children.forEach(child => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          const material = child.material as THREE.MeshStandardMaterial;
          const originalColor = child.name === 'dormerRoof' ? originalRoofColor : originalBoxColor;
          material.color.set(originalColor);
          material.emissive.set(originalColor);
          material.emissiveIntensity = 0;
        }
      });
    };

  }, [selectedObject]); // Rerun effect when selectedObject changes

  const handleClick = (event: any) => {
    event.stopPropagation();
    if (groupRef.current) {
      groupRef.current.userData = { type: 'dormer', index };
      setSelectedObject(groupRef.current);
    }
  };

  return (
    <group 
      ref={groupRef}
      position={position} 
      onClick={handleClick}
    >
      {/* Main box */}
      <mesh position={[0, height / 2, 0]} name="dormerBox"> 
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={originalBoxColor} />
      </mesh>
      {/* Simple roof plane */}
      <mesh position={[0, height + 0.1, 0]} name="dormerRoof"> 
         <boxGeometry args={[width, 0.2, depth]} />
         <meshStandardMaterial color={originalRoofColor} />
       </mesh>
    </group>
  );
}

// --- ModularBuilding Component --- 
interface ModularBuildingProps {
  config: BuildingConfig;
  setSelectedObject: Dispatch<SetStateAction<THREE.Object3D | null>>;
  selectedObject: THREE.Object3D | null;
}

export default function ModularBuilding({
  config,
  setSelectedObject,
  selectedObject
}: ModularBuildingProps) {
  // Calculate initial position once
  const initialPosition: [number, number, number] = [
    -config.base.width / 2,
    0,
    -config.base.depth / 2
  ];

  return (
    // Set position directly on the group
    <group position={initialPosition}>
      {/* Base Building */}
      <Building
        width={config.base.width}
        depth={config.base.depth}
        height={config.base.height}
        roofAngle={config.base.roofAngle}
        hideLabels={true} // Hide internal labels from Building component
      />

      {/* Render Chimneys with props for selection */}
      {config.chimneys?.map((chimneyConf, index) => (
        <Chimney 
          key={`chimney-${index}`} 
          config={chimneyConf} 
          index={index} 
          setSelectedObject={setSelectedObject} 
          selectedObject={selectedObject}
        />
      ))}

      {/* Render Dormers with props for selection */}
      {config.dormers?.map((dormerConf, index) => (
        <Dormer 
          key={`dormer-${index}`} 
          config={dormerConf} 
          index={index} 
          setSelectedObject={setSelectedObject} 
          selectedObject={selectedObject}
        />
      ))}

      {/* Wings would be rendered here in future steps */}
      {/* {config.wings?.map((wingConf, index) => { ... })} */}

    </group>
  );
}
