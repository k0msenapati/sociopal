'use client'

export default function Welcome({ onStart }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur z-50">
      <div className="bg-white/10 border border-white/20 backdrop-blur-lg text-white p-8 rounded-2xl shadow-xl max-w-sm text-center space-y-6">
        <h1 className="text-3xl font-bold">Wanna Try SocioPal?</h1>
        <p className="text-gray-300">Ask anything about sociology. Speak or type.</p>
        <button
          onClick={onStart}
          className="bg-purple-600 hover:bg-purple-700 transition text-white px-6 py-2 rounded-full font-semibold"
        >
          Let's Go
        </button>
      </div>
    </div>
  )
}
