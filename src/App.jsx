import { useState } from 'react'
import './App.css'
import Header from './Components/Header'
import Merger from './Components/Meger'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Merger/>} />
        </Routes>
      </Router>
    </>
  )
}

export default App
