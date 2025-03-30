import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import Building from './Building'
import { Html } from '@react-three/drei'

// Define types for building configuration
interface BuildingPart {
  width: number
  depth: number
  height: number
  roofAngle: number
}

interface WingConfig extends BuildingPart {
  position: [number, number, number]
}

interface ChimneyConfig {
  position: [number, number, number]
  width: number
  depth: number
  height: number
}

interface DormerConfig {
  position: [number, number, number]
  width: number
  depth: number
  height: number
}

export interface BuildingConfig {
  base: BuildingPart
  wings?: WingConfig[]
  chimneys?: ChimneyConfig[]
  dormers?: DormerConfig[]
}

// Custom version of Building without labels
function BuildingWithoutLabels({ width, depth, height, roofAngle }: BuildingPart) {
  // Create a ref to the Building component
  const buildingRef = useRef<THREE.Group>(null)

  return (
    <group ref={buildingRef}>
      {/* Building body */}
      <mesh position={[width / 2, height / 2, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color="#F5F5F5" />
      </mesh>
      
      {/* Use the existing Building component but hide its labels */}
      <group position={[0, 0, 0]} visible={false}>
        <Building 
          width={width}
          depth={depth}
          height={height}
          roofAngle={roofAngle}
        />
      </group>
    </group>
  );
}

export default function ModularBuilding({ config }: { config: BuildingConfig }) {
  const groupRef = useRef<THREE.Group>(null)

  // Position the entire building so it's centered on the origin
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.set(
        -config.base.width / 2,
        0,
        -config.base.depth / 2
      )
    }
  })

  // Helper for dimension labels
  const DimensionLabel = ({ position, text }: { position: [number, number, number], text: string }) => {
    return (
      <Html position={position} center>
        <div className="label" style={{ 
          color: 'black', 
          backgroundColor: 'white', 
          padding: '2px 6px', 
          borderRadius: '4px',
          fontSize: '10px',
          fontWeight: 'bold',
          border: '1px solid #aaa',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          opacity: 0.9
        }}>
          {text}
        </div>
      </Html>
    )
  }

  // Render a chimney component
  const Chimney = ({ config }: { config: ChimneyConfig }) => {
    const { position, width, depth, height } = config
    return (
      <mesh position={position} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
    )
  }

  // Render a dormer component
  const Dormer = ({ config }: { config: DormerConfig }) => {
    const { position, width, depth, height } = config
    return (
      <group position={position}>
        {/* Dormer body */}
        <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
          <boxGeometry args={[width, height, depth]} />
          <meshStandardMaterial color="#F5F5F5" />
        </mesh>
        
        {/* Dormer roof */}
        <mesh position={[0, height, 0]} castShadow>
          <coneGeometry args={[width / 2, height / 2, 4, 1, false]} />
          <meshStandardMaterial color="#C35A38" />
        </mesh>
      </group>
    )
  }

  return (
    <group ref={groupRef}>
      {/* Main building base - hide default labels */}
      <Building 
        width={config.base.width}
        depth={config.base.depth}
        height={config.base.height}
        roofAngle={config.base.roofAngle}
        hideLabels={true}
      />
      
      {/* Main building labels - Only essential ones */}
      <DimensionLabel 
        position={[config.base.width / 2, -0.2, config.base.depth / 2]}
        text={`Width: ${config.base.width}m`}
      />
      <DimensionLabel 
        position={[config.base.width + 0.5, config.base.height / 2, config.base.depth / 2]}
        text={`Depth: ${config.base.depth}m`}
      />
      <DimensionLabel 
        position={[config.base.width / 2, config.base.height + 0.5, config.base.depth / 2]}
        text={`Height: ${config.base.height}m`}
      />
      <DimensionLabel 
        position={[config.base.width / 2, config.base.height * 1.3, config.base.depth / 2]}
        text={`Roof: ${config.base.roofAngle}°`}
      />
      
      {/* Additional wings */}
      {config.wings?.map((wing, index) => {
        return (
          <group key={`wing-${index}`}>
            <group position={wing.position}>
              <Building
                width={wing.width}
                depth={wing.depth}
                height={wing.height}
                roofAngle={wing.roofAngle}
                hideLabels={true}
              />
              
              {/* Only one label for wing dimensions */}
              <DimensionLabel 
                position={[wing.width / 2, -0.2, wing.depth / 2]}
                text={`${wing.width}m × ${wing.depth}m`}
              />
              <DimensionLabel 
                position={[wing.width / 2, wing.height * 1.3, wing.depth / 2]}
                text={`Roof: ${wing.roofAngle}°`}
              />
            </group>
          </group>
        );
      })}
      
      {/* Chimneys - no labels for chimneys */}
      {config.chimneys?.map((chimney, index) => (
        <Chimney key={`chimney-${index}`} config={chimney} />
      ))}
      
      {/* Dormers - no labels for dormers */}
      {config.dormers?.map((dormer, index) => (
        <Dormer key={`dormer-${index}`} config={dormer} />
      ))}
    </group>
  )
} 