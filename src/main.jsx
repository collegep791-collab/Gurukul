/**
 * src/main.jsx
 * 
 * Technical Component: React Application Entry Point
 * Description: Bootstraps the React virtual DOM and mounts the <App /> component 
 * into the root HTML node. This is the very first file executed in the frontend bundle.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
