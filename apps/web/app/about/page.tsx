import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import ParallaxBackground from "../components/ParallaxBackground";
import RightSidebarWidgets from "../components/RightSidebarWidgets";

export const metadata = {
  title: "About • Devzarr",
  description:
    "Devzarr is the indie-first developer bazaar—discover, share, and uplift each other's work with zero gatekeeping.",
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen w-full flex-row bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
      <Sidebar />
      <div className="flex flex-1 flex-col min-h-screen">
        <Topbar />
        <div className="flex flex-1 flex-row">
          <div className="flex-1 flex flex-col md:ml-64 lg:mr-[340px]">
            <main className="flex-1 flex flex-col md:flex-row gap-0">
              {/* Center column: Parallax background only behind main content */}
              <section className="flex-1 flex flex-col items-center justify-start py-0 relative overflow-hidden">
                <div className="absolute inset-0 w-full h-full -z-10 pointer-events-none">
                  <ParallaxBackground
                    src="/images/bazaar-hero.webp"
                    alt="Ancient bazaar with slanted tents over a cobblestone path"
                    overlay="from-gray-900/60 to-gray-950/95"
                    className="w-full h-full"
                  >
                    <></>
                  </ParallaxBackground>
                </div>
                <div className="mx-auto w-full max-w-4xl px-6 pt-12 pb-8 text-white relative z-10">
                  <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-emerald-300 drop-shadow-lg text-left mb-4">
                    🏛️ Devzarr — The Indie Bazaar for Developers
                  </h1>
                  <p className="mt-2 text-gray-200 md:text-lg drop-shadow text-left mb-2">
                    Welcome to <strong>Devzarr</strong>, a vibrant, open platform where indie developers showcase their freshest tools, gather around digital campfires, and amplify their launches with real community, not algorithms.
                  </p>
                  <p className="text-gray-300 text-lg mb-6">
                    Devzarr is where software meets story—where you don’t just drop your repo and hope. You <em>spark</em> something. 💥
                  </p>
                  <hr className="my-6 border-emerald-700/40" />
                  <h2 className="text-2xl font-bold mb-2 text-emerald-300">🌟 What is Devzarr?</h2>
                  <blockquote className="border-l-4 border-emerald-400 pl-4 italic text-gray-200 mb-6">
                    A developer-powered bazaar for discovering new tools, collaborating with kindred coders, and using AI to help market your project—openly, fairly, and with a little attitude.
                  </blockquote>
                  <h3 className="text-xl font-semibold mb-2 text-emerald-200">Core Values</h3>
                  <ul className="list-disc pl-6 mb-6 space-y-1 text-lg">
                    <li>💡 <strong>Indie-first</strong> — Devzarr is built for solo devs, small teams, and makers.</li>
                    <li>🧵 <strong>Human connections</strong> — Join “Cliques” (IRC-inspired rooms) for real-time talk.</li>
                    <li>🤖 <strong>AI Assistants</strong> — Generate launch threads, release notes, and blurbs in your voice.</li>
                    <li>🛍️ <strong>No gatekeeping</strong> — No downvotes, no karma games. Just signal.</li>
                    <li>🧠 <strong>Open source</strong> — Transparent, collaborative, and free to remix.</li>
                  </ul>
                  <hr className="my-6 border-emerald-700/40" />
                  <h3 className="text-xl font-semibold mb-2 text-emerald-200">✨ MVP Features (in progress)</h3>
                  <ul className="list-disc pl-6 mb-6 space-y-1 text-lg">
                    <li>🧪 <strong>Project Submissions</strong> — Show off your tool with tags, media, and signals like "I’d Use This" or "I’m Using It Now."</li>
                    <li>🔎 <strong>AI Search Assistant</strong> — “Find me a browser extension that does X...”</li>
                    <li>💬 <strong>Cliques</strong> — Real-time, IRC-style chat rooms for dev tribes.</li>
                    <li>🚀 <strong>Signal Boosters</strong> — Contributor-only AI tools to improve your pitch, tagline, and social copy.</li>
                    <li>🎯 <strong>Discover & Support</strong> — Users browse by tags, vibe, or suggestion and can donate or contribute.</li>
                  </ul>
                  <hr className="my-6 border-emerald-700/40" />
                  <h3 className="text-xl font-semibold mb-2 text-emerald-200">🛠️ Tech Stack</h3>
                  <ul className="list-disc pl-6 mb-6 space-y-1 text-lg">
                    <li><strong>Next.js 14</strong> + App Router</li>
                    <li><strong>Supabase</strong> (Postgres + Realtime + Auth)</li>
                    <li><strong>TailwindCSS</strong> + shadcn/ui</li>
                    <li><strong>pgvector</strong> for semantic search</li>
                    <li><strong>Stripe</strong> for contributor tiers</li>
                    <li><strong>Vercel</strong> for deployment</li>
                    <li><strong>AI Endpoints</strong> (OpenAI, Anthropic or self-hosted)</li>
                  </ul>
                  <hr className="my-6 border-emerald-700/40" />
                  <h3 className="text-xl font-semibold mb-2 text-emerald-200">🤝 Contributing</h3>
                  <p className="mb-2">
                    We’re building this in the open. Contributions are welcome and appreciated:
                  </p>
                  <ul className="list-disc pl-6 mb-6 space-y-1 text-lg">
                    <li>Bug fixes 🐞</li>
                    <li>New features 💡</li>
                    <li>UX polish 🎨</li>
                    <li>Docs ✍️</li>
                  </ul>
                  <p className="mb-6">
                    <strong>First time?</strong> Check out <code>CONTRIBUTING.md</code> for setup and guidelines.
                  </p>
                  <hr className="my-6 border-emerald-700/40" />
                  <h3 className="text-xl font-semibold mb-2 text-emerald-200">🛡️ License</h3>
                  <p className="mb-6">
                    This project is licensed under <strong>AGPL-3.0</strong> to keep it transparent and remixable, while encouraging open contributions.
                  </p>
                  <hr className="my-6 border-emerald-700/40" />
                  <h3 className="text-xl font-semibold mb-2 text-emerald-200">💌 Contact</h3>
                  <p className="mb-2">
                    Need help or want to collaborate?
                  </p>
                  <ul className="list-disc pl-6 mb-6 space-y-1 text-lg">
                    <li>Email: <a href="mailto:hi@devzarr.com" className="underline text-emerald-300">hi@devzarr.com</a></li>
                    <li>Org: <a href="https://github.com/devzarrhq" className="underline text-emerald-300" target="_blank" rel="noopener noreferrer">github.com/devzarrhq</a></li>
                    <li>Domain: <a href="https://devzarr.com" className="underline text-emerald-300" target="_blank" rel="noopener noreferrer">devzarr.com</a></li>
                  </ul>
                  <p className="italic text-emerald-300">
                    The Bazaar is open. Come spark something. ✨
                  </p>
                </div>
              </section>
            </main>
          </div>
          <aside className="hidden lg:block lg:w-[340px] flex-shrink-0 px-6 py-10 fixed right-0 top-0 h-full z-10">
            <RightSidebarWidgets />
          </aside>
        </div>
      </div>
    </div>
  );
}