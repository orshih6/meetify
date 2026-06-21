import './index.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// import App from './App'
import Chat from './Chat'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* <App /> */}
    <Chat />
  </StrictMode>
)
