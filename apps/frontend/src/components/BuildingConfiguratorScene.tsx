import { useState, useEffect, useRef } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import ModularBuilding, { BuildingConfig } from './ModularBuilding'
import * as THREE from 'three'

// Camera controls component with keyboard movement
function KeyboardCameraControls() {
  const { camera } = useThree()
  const moveSpeed = 0.15
  const keys = useRef<{ [key: string]: boolean }>({})
  
  // Set up key listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])
  
  // Handle camera movement
  useFrame(() => {
    // Check if any movement key is pressed
    const isMoving = ['KeyW', 'KeyS', 'KeyA', 'KeyD', 'KeyQ', 'KeyE', 
                      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']
                      .some(key => keys.current[key]);
    
    // Only move if a movement key is pressed
    if (isMoving) {
      // Movement logic
      const direction = new THREE.Vector3()
      const frontVector = new THREE.Vector3()
      const sideVector = new THREE.Vector3()
      const upVector = new THREE.Vector3(0, 0, 0)
      
      // Forward/backward
      if (keys.current['KeyW'] || keys.current['ArrowUp']) frontVector.z -= 1
      if (keys.current['KeyS'] || keys.current['ArrowDown']) frontVector.z += 1
      
      // Left/right
      if (keys.current['KeyA'] || keys.current['ArrowLeft']) sideVector.x += 1
      if (keys.current['KeyD'] || keys.current['ArrowRight']) sideVector.x -= 1
      
      // Up/down
      if (keys.current['KeyQ']) upVector.y += 1
      if (keys.current['KeyE']) upVector.y -= 1
      
      // Combine movements relative to camera orientation
      direction
        .addVectors(frontVector, sideVector)
        .normalize()
        .multiplyScalar(moveSpeed)
        .applyEuler(camera.rotation)
      
      camera.position.add(direction)
      
      // Apply vertical movement separately (not affected by camera rotation)
      if (upVector.y !== 0) {
        upVector.multiplyScalar(moveSpeed * 0.5)
        camera.position.add(upVector)
      }
    }
  })
  
  return null
}

// Default building configuration
const defaultConfig: BuildingConfig = {
  base: {
    width: 10,
    depth: 8,
    height: 5,
    roofAngle: 25
  },
  // No wings - we want a single building
  wings: [],
  chimneys: [
    {
      position: [2, 5, 1.5],
      width: 0.8,
      depth: 0.8,
      height: 1.5
    }
  ],
  dormers: [
    {
      position: [3, 5, -0.1], // Front face dormer
      width: 1.5,
      depth: 1,
      height: 1.2
    },
    {
      position: [6, 5, -0.1], // Front face dormer
      width: 1.5,
      depth: 1, 
      height: 1.2
    }
  ]
}

export default function BuildingConfiguratorScene() {
  const [buildingConfig, setBuildingConfig] = useState<BuildingConfig>(defaultConfig)

  return (
    <div className="w-full">
      <div className="w-full h-[600px] border border-gray-300 rounded-md overflow-hidden">
        <Canvas
          camera={{ position: [12, 8, 12], fov: 45 }}
          shadows
        >
          <ambientLight intensity={0.5} />
          <directionalLight 
            position={[10, 10, 5]} 
            intensity={1} 
            castShadow 
            shadow-mapSize={[2048, 2048]}
          />
          <ModularBuilding config={buildingConfig} />
          <OrbitControls enableDamping dampingFactor={0.1} />
          <KeyboardCameraControls />
          <gridHelper args={[30, 30]} />
          <axesHelper args={[5]} />
        </Canvas>
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <h3 className="text-sm font-medium mb-1">Modular Building System</h3>
        <p className="text-sm text-gray-700">
          This scene demonstrates a modular building system with base, wings, chimneys, and dormers.
        </p>
        <p className="text-sm text-gray-700 mt-2">
          <strong>Controls:</strong> 
          Mouse to orbit, WASD/Arrow keys to move, Q/E to move up/down
        </p>
      </div>
    </div>
  )
} 