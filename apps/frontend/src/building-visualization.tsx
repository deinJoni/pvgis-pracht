import ThreeScene from './components/ThreeScene'

export default function BuildingVisualization() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-4">Building Visualization</h1>
      <p className="mb-4">
        Adjust the building dimensions using the controls below the 3D model. 
        The building will update in real-time.
      </p>
      <ThreeScene />
    </div>
  )
} 