export default function HomePage() {
  return (
    <main className="max-w-2xl mx-auto py-16 px-4">
      <h1 className="text-4xl font-bold mb-4 text-center">🏛️ Devzarr — The Indie Bazaar for Developers</h1>
      <p className="text-lg mb-8 text-center text-gray-700">
        Welcome to <span className="font-semibold">Devzarr</span>, a vibrant, open platform where indie developers showcase their freshest tools, gather around digital campfires, and amplify their launches with real community, not algorithms.
      </p>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">🌟 What is Devzarr?</h2>
        <p className="mb-2">
          <span className="italic">A developer-powered bazaar for discovering new tools, collaborating with kindred coders, and using AI to help market your project—openly, fairly, and with a little attitude.</span>
        </p>
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Core Values</h2>
        <ul className="list-disc pl-6 space-y-1 text-gray-800">
          <li>💡 <span className="font-medium">Indie-first</span> — Built for solo devs, small teams, and makers.</li>
          <li>🧵 <span className="font-medium">Human connections</span> — Join “Cliques” (IRC-inspired rooms) for real-time talk.</li>
          <li>🤖 <span className="font-medium">AI Assistants</span> — Generate launch threads, release notes, and blurbs in your voice.</li>
          <li>🛍️ <span className="font-medium">No gatekeeping</span> — No downvotes, no karma games. Just signal.</li>
          <li>🧠 <span className="font-medium">Open source</span> — Transparent, collaborative, and free to remix.</li>
        </ul>
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">✨ MVP Features</h2>
        <ul className="list-disc pl-6 space-y-1 text-gray-800">
          <li>🧪 <span className="font-medium">Project Submissions</span> — Show off your tool with tags, media, and signals like "I’d Use This" or "I’m Using It Now."</li>
          <li>🔎 <span className="font-medium">AI Search Assistant</span> — “Find me a browser extension that does X...”</li>
          <li>💬 <span className="font-medium">Cliques</span> — Real-time, IRC-style chat rooms for dev tribes.</li>
          <li>🚀 <span className="font-medium">Signal Boosters</span> — Contributor-only AI tools to improve your pitch, tagline, and social copy.</li>
          <li>🎯 <span className="font-medium">Discover & Support</span> — Browse by tags, vibe, or suggestion and can donate or contribute.</li>
        </ul>
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">🛠️ Tech Stack</h2>
        <ul className="list-disc pl-6 space-y-1 text-gray-800">
          <li>Next.js 14 + App Router</li>
          <li>Supabase (Postgres + Realtime + Auth)</li>
          <li>TailwindCSS + shadcn/ui</li>
          <li>pgvector for semantic search</li>
          <li>Stripe for contributor tiers</li>
          <li>Vercel for deployment</li>
          <li>AI Endpoints (OpenAI, Anthropic or self-hosted)</li>
        </ul>
      </section>
      <section className="text-center text-gray-600">
        <p className="mb-2">The Bazaar is open. Come spark something. ✨</p>
        <p>
          <span className="font-medium">Contact:</span> <a href="mailto:hi@devzarr.com" className="underline">hi@devzarr.com</a>
        </p>
      </section>
    </main>
  )
}