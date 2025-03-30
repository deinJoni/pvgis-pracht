import { useState, useEffect, useRef } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import Building from './Building.tsx'
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

// Custom mouse look component
function MouseLookControls({ active }: { active: boolean }) {
  const { camera, gl } = useThree()
  const prevMouseRef = useRef({ x: 0, y: 0 })
  const isMouseDownRef = useRef(false)
  const sensitivityX = 0.003
  const sensitivityY = 0.003
  const maxPolarAngle = Math.PI * 0.9
  const minPolarAngle = Math.PI * 0.1
  
  useEffect(() => {
    if (!active) return
    
    const canvas = gl.domElement
    
    const handleMouseDown = (e: MouseEvent) => {
      isMouseDownRef.current = true
      prevMouseRef.current = { x: e.clientX, y: e.clientY }
    }
    
    const handleMouseUp = () => {
      isMouseDownRef.current = false
    }
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDownRef.current || !active) return
      
      const deltaX = e.clientX - prevMouseRef.current.x
      const deltaY = e.clientY - prevMouseRef.current.y
      
      // Update camera rotation based on mouse movement
      camera.rotation.y -= deltaX * sensitivityX
      
      // Calculate and apply vertical rotation (with limits)
      let newXRotation = camera.rotation.x - deltaY * sensitivityY
      newXRotation = Math.max(minPolarAngle - Math.PI/2, Math.min(maxPolarAngle - Math.PI/2, newXRotation))
      camera.rotation.x = newXRotation
      
      prevMouseRef.current = { x: e.clientX, y: e.clientY }
    }
    
    canvas.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('mousemove', handleMouseMove)
    
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [active, camera, gl.domElement, sensitivityX, sensitivityY])
  
  return null
}

interface ThreeSceneProps {
  initialWidth?: number
  initialDepth?: number
  initialHeight?: number
  initialRoofAngle?: number
}

export default function ThreeScene({
  initialWidth = 10,
  initialDepth = 8,
  initialHeight = 5,
  initialRoofAngle = 20
}: ThreeSceneProps) {
  const [width, setWidth] = useState(initialWidth)
  const [depth, setDepth] = useState(initialDepth)
  const [height, setHeight] = useState(initialHeight)
  const [roofAngle, setRoofAngle] = useState(initialRoofAngle)

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWidth(Number(e.target.value))
  }

  const handleDepthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDepth(Number(e.target.value))
  }

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHeight(Number(e.target.value))
  }

  const handleRoofAngleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoofAngle(Number(e.target.value))
  }

  return (
    <div className="w-full">
      <div className="w-full h-[500px] border border-gray-300 rounded-md overflow-hidden">
        <Canvas
          camera={{ position: [15, 15, 15], fov: 50 }}
          shadows
        >
          <ambientLight intensity={0.5} />
          <directionalLight 
            position={[10, 10, 5]} 
            intensity={1} 
            castShadow 
            shadow-mapSize={[2048, 2048]}
          />
          <Building width={width} depth={depth} height={height} roofAngle={roofAngle} />
          
          {/* Both orbit controls and keyboard controls are active simultaneously */}
          <OrbitControls />
          <KeyboardCameraControls />
          <MouseLookControls active={false} />
          
          <gridHelper args={[30, 30]} />
          <axesHelper args={[5]} />
        </Canvas>
      </div>
      
      <div className="flex flex-wrap gap-4 mt-4">
        <div className="flex flex-col">
          <label htmlFor="width" className="text-sm font-medium">
            Width (m)
          </label>
          <input
            id="width"
            type="number"
            min="1"
            max="30"
            value={width}
            onChange={handleWidthChange}
            className="border border-gray-300 rounded px-2 py-1"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="depth" className="text-sm font-medium">
            Depth (m)
          </label>
          <input
            id="depth"
            type="number"
            min="1"
            max="30"
            value={depth}
            onChange={handleDepthChange}
            className="border border-gray-300 rounded px-2 py-1"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="height" className="text-sm font-medium">
            Height (m)
          </label>
          <input
            id="height"
            type="number"
            min="1"
            max="30"
            value={height}
            onChange={handleHeightChange}
            className="border border-gray-300 rounded px-2 py-1"
          />
        </div>
        <div className="flex flex-col">
          <label htmlFor="roofAngle" className="text-sm font-medium">
            Roof Angle (°)
          </label>
          <input
            id="roofAngle"
            type="range"
            min="0"
            max="45"
            step="1"
            value={roofAngle}
            onChange={handleRoofAngleChange}
            className="w-32 border border-gray-300 rounded px-2 py-1"
          />
          <span className="text-sm text-gray-500 mt-1">{roofAngle}°</span>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <h3 className="text-sm font-medium mb-1">Camera Controls:</h3>
        <p className="text-sm text-gray-700">
          • <strong>Mouse</strong>: Click and drag to rotate, scroll to zoom
        </p>
        <p className="text-sm text-gray-700">
          • <strong>Keyboard</strong>: 
          Use WASD or arrow keys to move forward/backward/left/right, 
          Q/E to move up/down
        </p>
      </div>
    </div>
  )
} 