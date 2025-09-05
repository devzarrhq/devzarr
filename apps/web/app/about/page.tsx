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
                    A Digital Bazaar for Indie Developers
                  </h1>
                  <p className="mt-2 text-gray-200 md:text-lg drop-shadow text-left mb-2">
                    Discoverable projects. Support without gatekeepers. Tools that help the small shine.<br />
                    Build in public, find your people, and grow at your own pace.
                  </p>
                  <div className="mt-8 space-y-6 text-lg text-gray-200">
                    <p>
                      <strong>Devzarr</strong> is a vibrant, open platform where indie developers showcase their freshest tools, gather around digital campfires, and amplify their launches with real community, not algorithms.
                    </p>
                    <ul className="list-disc pl-6">
                      <li>
                        <span className="font-bold text-emerald-300">Indie-first</span> — Devzarr is built for solo devs, small teams, and makers.
                      </li>
                      <li>
                        <span className="font-bold text-emerald-300">Human connections</span> — Join “Cliques” (IRC-inspired rooms) for real-time talk.
                      </li>
                      <li>
                        <span className="font-bold text-emerald-300">AI Assistants</span> — Generate launch threads, release notes, and blurbs in your voice.
                      </li>
                      <li>
                        <span className="font-bold text-emerald-300">No gatekeeping</span> — No downvotes, no karma games. Just signal.
                      </li>
                      <li>
                        <span className="font-bold text-emerald-300">Open source</span> — Transparent, collaborative, and free to remix.
                      </li>
                    </ul>
                    <p>
                      <strong>Our mission:</strong> Help indie devs get discovered, connect, and grow—without the noise and gatekeeping of traditional platforms.
                    </p>
                    <p>
                      <strong>How it works:</strong> Submit your project, join a clique, or just browse and support others. Use AI tools to polish your launch, and connect with a real community.
                    </p>
                    <p>
                      <strong>Open source & transparent:</strong> Devzarr is AGPL-3.0 licensed and built in public. Contributions are welcome!
                    </p>
                  </div>
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