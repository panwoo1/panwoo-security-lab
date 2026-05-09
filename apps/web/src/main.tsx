import React from 'react'
import ReactDOM from 'react-dom/client'

function App() {
  return (
    <main style={{ fontFamily: 'sans-serif', padding: '2rem', lineHeight: 1.6 }}>
      <h1>Cloudflare Pages + Workers Starter</h1>
      <p>이 앱은 Cloudflare Pages에 배포되는 프론트엔드 템플릿입니다.</p>
      <p>API는 Cloudflare Workers를 통해 연결합니다.</p>
    </main>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
