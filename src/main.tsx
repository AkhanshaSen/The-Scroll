import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { ScrollView } from './components/ScrollView.tsx'
import './styles.css'

const params = new URLSearchParams(window.location.search)
const viewToken = params.get('view')?.trim()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {viewToken ? <ScrollView token={viewToken} /> : <App />}
  </StrictMode>,
)
