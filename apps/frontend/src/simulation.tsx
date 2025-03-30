import { useState, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

interface BuildingProps {
  width: number
  length: number
  height: number
  roofHeight: number
}

function Building({ width, length, height, roofHeight }: BuildingProps) {
  // Calculate roof slope angle and length
  const slopeAngle = Math.atan(roofHeight / (width / 2))
  const slopeLength = Math.sqrt((width / 2) ** 2 + roofHeight ** 2)

  return (
    <group>
      {/* Building body */}
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, length]} />
        <meshStandardMaterial color="#e0e0e0" />
      </mesh>

      {/* Left roof plane */}
      <group position={[0, height, 0]}>
        <mesh position={[-width / 4, roofHeight / 2, 0]} rotation={[0, 0, -slopeAngle]}>
          <planeGeometry args={[slopeLength, length]} />
          <meshStandardMaterial color="#c0c0c0" side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Right roof plane */}
      <group position={[0, height, 0]}>
        <mesh position={[width / 4, roofHeight / 2, 0]} rotation={[0, 0, slopeAngle]}>
          <planeGeometry args={[slopeLength, length]} />
          <meshStandardMaterial color="#c0c0c0" side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  )
}

function Scene(props: BuildingProps) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 10]} intensity={1} />
      <Building {...props} />
      <primitive object={new THREE.GridHelper(100, 100)} />
      <OrbitControls makeDefault />
    </>
  )
}

export default function Simulation() {
  const [buildingParams, setBuildingParams] = useState({
    width: 8,
    length: 10,
    height: 3,
    roofHeight: 2,
  })

  return (
    <div className="w-full h-screen flex">
      <div className="w-1/4 p-4 bg-gray-100">
        <h2 className="text-xl font-bold mb-4">Building Parameters</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Width (m)</label>
            <input
              type="number"
              value={buildingParams.width}
              onChange={(e) => setBuildingParams({ ...buildingParams, width: Number(e.target.value) })}
              className="w-full p-2 border rounded"
              min={1}
              step={0.5}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Length (m)</label>
            <input
              type="number"
              value={buildingParams.length}
              onChange={(e) => setBuildingParams({ ...buildingParams, length: Number(e.target.value) })}
              className="w-full p-2 border rounded"
              min={1}
              step={0.5}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Wall Height (m)</label>
            <input
              type="number"
              value={buildingParams.height}
              onChange={(e) => setBuildingParams({ ...buildingParams, height: Number(e.target.value) })}
              className="w-full p-2 border rounded"
              min={1}
              step={0.5}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Roof Height (m)</label>
            <input
              type="number"
              value={buildingParams.roofHeight}
              onChange={(e) => setBuildingParams({ ...buildingParams, roofHeight: Number(e.target.value) })}
              className="w-full p-2 border rounded"
              min={0.5}
              step={0.5}
            />
          </div>
        </div>
      </div>
      <div className="flex-1">
        <Canvas
          camera={{ position: [15, 15, 15], fov: 50 }}
          gl={{ antialias: true }}
          dpr={[1, 2]}
        >
          <Suspense fallback={null}>
            <Scene {...buildingParams} />
          </Suspense>
        </Canvas>
      </div>
    </div>
  )
} 