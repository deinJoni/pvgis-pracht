import { useState } from 'react'
import ThreeScene from './components/ThreeScene'
import BuildingConfiguratorScene from './components/BuildingConfiguratorScene'

export default function BuildingVisualization() {
  const [showModular, setShowModular] = useState(false)

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-4">Building Visualization</h1>
      
      <div className="mb-4 flex gap-4">
        <button 
          onClick={() => setShowModular(false)}
          className={`px-4 py-2 rounded ${!showModular ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Simple Building
        </button>
        <button 
          onClick={() => setShowModular(true)}
          className={`px-4 py-2 rounded ${showModular ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Modular Building
        </button>
      </div>
      
      <div style={{ display: showModular ? 'block' : 'none' }}>
        <p className="mb-4">
          The modular building system supports a main building with additional wings, 
          chimneys, and dormers based on a configuration object.
        </p>
        <BuildingConfiguratorScene />
      </div>

      <div style={{ display: !showModular ? 'block' : 'none' }}>
        <p className="mb-4">
          Adjust the building dimensions using the controls below the 3D model. 
          The building will update in real-time.
        </p>
        <ThreeScene />
      </div>
    </div>
  )
} 