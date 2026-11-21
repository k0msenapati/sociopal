import './globals.css'

export const metadata = {
  title: 'SocioPal — Intelligent Sociology Agent',
  description: 'Corrective RAG powered sociology agent with live vector search and web retrieval.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#050508] text-gray-100 selection:bg-violet-500/30 selection:text-white">
        {children}
      </body>
    </html>
  )
}
