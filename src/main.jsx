import React from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios'
import App from './App.jsx'
import './index.css'

// Set axios global baseURL so ALL axios calls (direct + via client.js) hit the right backend.
// In production (GitHub Pages): reads VITE_API_URL from .env.production
// In development (localhost):   Vite proxy handles /api → localhost:5000
const API_URL = import.meta.env.VITE_API_URL
axios.defaults.baseURL = API_URL || ''

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
