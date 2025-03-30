import { Routes, Route } from 'react-router-dom'
import Layout from './layout'
import GridConnected from './grid-connected'
import BuildingVisualization from './building-visualization'

function App() {
  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<h1>Home</h1>} />
          <Route path="/grid-connected" element={<GridConnected />} />
          <Route path="/tracking-pv" element={<h1>Nachgeführte PV</h1>} />
          <Route path="/off-grid-pv" element={<h1>Netzunabhängig</h1>} />
          <Route path="/building-visualization" element={<BuildingVisualization />} />
        </Route>
      </Routes>
    </>
  )
}

export default App
