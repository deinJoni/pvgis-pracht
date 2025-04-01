import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { Html } from '@react-three/drei'

interface BuildingProps {
  width: number
  depth: number
  height: number
  roofAngle: number
  hideLabels?: boolean
}

export default function Building({ 
  width, 
  depth, 
  height, 
  roofAngle = 20,
  hideLabels = false 
}: BuildingProps) {
  const buildingRef = useRef<THREE.Group>(null)
  
  // Calculate roof height based on angle
  const roofHeight = useMemo(() => {
    // Convert angle from degrees to radians
    const angleInRadians = (roofAngle * Math.PI) / 180
    // Calculate roof height using tangent (tan = opposite/adjacent)
    // tan(angle) = height / (width/2), so height = tan(angle) * (width/2)
    return Math.tan(angleInRadians) * (width / 2)
  }, [width, roofAngle])
  
  // Create geometry for flat roof (when angle is 0)
  const flatRoofGeometry = useMemo(() => {
    return new THREE.BoxGeometry(width, 0.2, depth) // Thin box for flat roof
  }, [width, depth])
  
  // Create the pitched roof geometry parts separately
  const roofParts = useMemo(() => {
    // Only create pitched roof if angle > 0
    if (roofAngle <= 0) return null
    
    // Front triangle face
    const frontGeometry = new THREE.BufferGeometry()
    const frontVertices = new Float32Array([
      0, 0, 0,
      width, 0, 0,
      width/2, roofHeight, 0
    ])
    frontGeometry.setAttribute('position', new THREE.BufferAttribute(frontVertices, 3))
    frontGeometry.setIndex([0, 1, 2])
    frontGeometry.computeVertexNormals()
    
    // Back triangle face
    const backGeometry = new THREE.BufferGeometry()
    const backVertices = new Float32Array([
      0, 0, depth,
      width, 0, depth,
      width/2, roofHeight, depth
    ])
    backGeometry.setAttribute('position', new THREE.BufferAttribute(backVertices, 3))
    backGeometry.setIndex([0, 2, 1])  // Reverse winding order for correct normals
    backGeometry.computeVertexNormals()
    
    // Left side
    const leftGeometry = new THREE.BufferGeometry()
    const leftVertices = new Float32Array([
      0, 0, 0,
      width/2, roofHeight, 0,
      width/2, roofHeight, depth,
      0, 0, depth
    ])
    leftGeometry.setAttribute('position', new THREE.BufferAttribute(leftVertices, 3))
    leftGeometry.setIndex([0, 1, 2, 0, 2, 3])  // Two triangles to form a quad
    leftGeometry.computeVertexNormals()
    
    // Right side
    const rightGeometry = new THREE.BufferGeometry()
    const rightVertices = new Float32Array([
      width, 0, 0,
      width/2, roofHeight, 0,
      width/2, roofHeight, depth,
      width, 0, depth
    ])
    rightGeometry.setAttribute('position', new THREE.BufferAttribute(rightVertices, 3))
    rightGeometry.setIndex([0, 2, 1, 0, 3, 2])  // Two triangles with correct winding
    rightGeometry.computeVertexNormals()
    
    return {
      front: frontGeometry,
      back: backGeometry,
      left: leftGeometry,
      right: rightGeometry
    }
  }, [width, depth, roofHeight, roofAngle])

  return (
    <group ref={buildingRef}>
      {/* Building body */}
      <mesh position={[width / 2, height / 2, depth / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color="#F5F5F5" />
      </mesh>
      
      {/* Roof - conditionally render flat or pitched roof */}
      {roofAngle <= 0 ? (
        // Flat roof when angle is 0
        <mesh position={[width / 2, height + 0.1, depth / 2]} castShadow>
          <primitive object={flatRoofGeometry} attach="geometry" />
          <meshStandardMaterial color="#C35A38" />
        </mesh>
      ) : roofParts ? (
        // Pitched roof with individual parts
        <group position={[0, height, 0]}>
          {/* Front face */}
          <mesh castShadow>
            <primitive object={roofParts.front} attach="geometry" />
            <meshStandardMaterial color="#C35A38" side={THREE.DoubleSide} />
          </mesh>
          
          {/* Back face */}
          <mesh castShadow>
            <primitive object={roofParts.back} attach="geometry" />
            <meshStandardMaterial color="#C35A38" side={THREE.DoubleSide} />
          </mesh>
          
          {/* Left side */}
          <mesh castShadow>
            <primitive object={roofParts.left} attach="geometry" />
            <meshStandardMaterial color="#C35A38" side={THREE.DoubleSide} />
          </mesh>
          
          {/* Right side */}
          <mesh castShadow>
            <primitive object={roofParts.right} attach="geometry" />
            <meshStandardMaterial color="#C35A38" side={THREE.DoubleSide} />
          </mesh>
        </group>
      ) : null}
      
      {/* Only render labels if hideLabels is false */}
      {!hideLabels && (
        <>
          {/* Width dimension label */}
          <Html position={[width / 2, -0.5, depth + 1]}>
            <div className="label" style={{ 
              color: 'black', 
              backgroundColor: 'white', 
              padding: '4px 8px', 
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold',
              border: '1px solid #aaa',
              whiteSpace: 'nowrap'
            }}>
              Width: {width}m
            </div>
          </Html>
          
          {/* Depth dimension label */}
          <Html position={[width + 1, -0.5, depth / 2]}>
            <div className="label" style={{ 
              color: 'black', 
              backgroundColor: 'white', 
              padding: '4px 8px', 
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold',
              border: '1px solid #aaa',
              whiteSpace: 'nowrap'
            }}>
              Depth: {depth}m
            </div>
          </Html>
          
          {/* Height dimension label */}
          <Html position={[-1, height / 2, depth / 2]}>
            <div className="label" style={{ 
              color: 'black', 
              backgroundColor: 'white', 
              padding: '4px 8px', 
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold',
              border: '1px solid #aaa',
              whiteSpace: 'nowrap'
            }}>
              Height: {height}m
            </div>
          </Html>
          
          {/* Roof angle label */}
          <Html position={[width / 2, height + (roofAngle > 0 ? roofHeight : 0.5) + 0.5, depth / 2]}>
            <div className="label" style={{ 
              color: 'black', 
              backgroundColor: 'white', 
              padding: '4px 8px', 
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold',
              border: '1px solid #aaa',
              whiteSpace: 'nowrap'
            }}>
              Roof: {roofAngle}°
            </div>
          </Html>
        </>
      )}
    </group>
  )
} 