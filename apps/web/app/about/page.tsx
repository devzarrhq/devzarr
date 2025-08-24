import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import ParallaxBackground from "../components/ParallaxBackground";

export const metadata = {
  title: "About • Devzarr",
  description:
    "Devzarr is the indie-first developer bazaar—discover, share, and uplift each other's work with zero gatekeeping.",
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen md:ml-64">
        <Topbar />
        <main className="flex-1 flex flex-col md:flex-row gap-0">
          {/* Left column: Parallax background for all content */}
          <section className="flex-1 flex flex-col items-center justify-start py-0 relative">
            <ParallaxBackground
              src="/images/bazaar-hero.webp"
              alt="Ancient bazaar with slanted tents over a cobblestone path"
              overlay="from-gray-900/60 to-gray-950/95"
              className="w-full h-full"
            >
              <div className="mx-auto w-full max-w-4xl px-6 pt-12 pb-8">
                {/* Banner Heading */}
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-emerald-300 drop-shadow-lg text-left mb-4">
                  A Digital Bazaar for Indie Developers
                </h1>
                <p className="mt-2 text-gray-200/90 md:text-lg drop-shadow text-left mb-10">
                  Discoverable projects. Support without gatekeepers. Tools that help the small shine.
                </p>
                {/* About content */}
                <section className="space-y-10">
                  <div className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white drop-shadow text-left">Our Mission</h2>
                    <p className="text-gray-200 leading-relaxed drop-shadow text-left">
                      Devzarr is a community-powered marketplace for ideas: a place where indie makers can
                      launch, learn, and lift each other. We champion visibility, fair discovery, and
                      creator-owned growth.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    <Feature title="Indie-First">
                      No gatekeeping. Your work is welcome—whether it’s a weekend toy or a full product.
                    </Feature>
                    <Feature title="Cliques (Real-Time Groups)">
                      Share progress, get feedback, and rally your niche in lightweight chat circles.
                    </Feature>
                    <Feature title="AI-Powered Lift">
                      Launch blurbs, thumbnails, and snippets—auto-generated, then refined by you.
                    </Feature>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-white drop-shadow text-left">How Devzarr Works</h3>
                    <ul className="list-disc pl-6 text-gray-200 space-y-2 drop-shadow">
                      <li className="text-gray-200">Create a profile and showcase your projects.</li>
                      <li className="text-gray-200">Post updates; your work appears in the Feed and Cliques.</li>
                      <li className="text-gray-200">Share to socials, earn badges, and collect support/donations.</li>
                      <li className="text-gray-200">Everything is remix-friendly and community-driven.</li>
                    </ul>
                  </div>
                </section>
              </div>
            </ParallaxBackground>
          </section>
          {/* Right column: reserved for widgets */}
          <aside className="hidden lg:block w-[340px] flex-shrink-0 px-6 py-10">
            {/* Future: Latest Projects, Featured Projects, etc. */}
          </aside>
        </main>
      </div>
    </div>
  );
}

function Feature({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
      <h4 className="font-semibold text-emerald-300 drop-shadow">{title}</h4>
      <p className="mt-2 text-gray-200 text-sm leading-relaxed drop-shadow">{children}</p>
    </div>
  );
}