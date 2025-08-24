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
      <div className="flex-1 flex flex-col min-h-screen md:ml-64 relative">
        {/* Topbar is sticky and always above parallax */}
        <div className="sticky top-0 z-30">
          <Topbar />
        </div>
        <main className="flex-1 flex flex-col md:flex-row gap-0">
          {/* Parallax background sits behind content */}
          <section className="flex-1 flex flex-col items-center justify-start py-0 relative">
            <div className="absolute inset-0 w-full h-full -z-10">
              <ParallaxBackground
                src="/images/bazaar-hero.webp"
                alt="Ancient bazaar with slanted tents over a cobblestone path"
                overlay="from-gray-900/60 to-gray-950/95"
                className="w-full h-full"
              >
                {/* Empty fragment to satisfy required children prop */}
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

              <Section title="Our Mission">
                <p className="text-gray-200 leading-relaxed drop-shadow text-left">
                  Devzarr is a community-powered marketplace for ideas—a place where indie makers can launch, learn, and lift each other. We champion visibility, fair discovery, and creator-owned growth.
                </p>
              </Section>

              <Section title="Why Devzarr">
                <ul className="list-disc pl-6 text-gray-200 space-y-2 drop-shadow">
                  <li>
                    <span className="font-semibold text-emerald-300">Indie-First.</span> No gatekeeping. Ship weekend toys, research prototypes, and full products alike.
                  </li>
                  <li>
                    <span className="font-semibold text-emerald-300">Fair Discovery.</span> Transparent ranking, human curation, and tags that actually help.
                  </li>
                  <li>
                    <span className="font-semibold text-emerald-300">Creator-Owned.</span> Your work, your audience, your upside.
                  </li>
                </ul>
              </Section>

              <Section title="Core Features">
                <Feature title="Cliques (real-time groups)">
                  Rally your niche. Share progress, get feedback, and co-pilot launches in lightweight chat circles.
                </Feature>
                <Feature title="AI-Powered Lift">
                  Auto-generate blurbs, thumbnails, and social snippets—then refine with your voice.
                </Feature>
                <Feature title="Project Showcases">
                  Beautiful cards, live links, and versioned updates so your story reads like a changelog, not a résumé.
                </Feature>
                <Feature title="Badges & Ranks">
                  Celebrate momentum: first launch, first star, community helper, top builder this week.
                </Feature>
                <Feature title="Share Anywhere">
                  One-click posts to X/Twitter, LinkedIn, and more—with smart OpenGraph cards.
                </Feature>
              </Section>

              <Section title="How Devzarr Works">
                <ul className="list-disc pl-6 text-gray-200 space-y-2 drop-shadow">
                  <li>Create your profile. Add an avatar, links, and a short bio.</li>
                  <li>Publish a project. Title, summary, URL—done.</li>
                  <li>Post updates. Your work flows into the Feed and your Cliques.</li>
                  <li>Share &amp; grow. Use AI helpers, earn badges, collect support/donations.</li>
                  <li>Remix &amp; collaborate. Everything is community-friendly and credit-forward.</li>
                </ul>
              </Section>

              <Section title="Our Community Pledge">
                <p className="text-gray-200 leading-relaxed drop-shadow text-left">
                  Be kind. Give credit. Share what you’ve learned. We moderate for respect and keep the bazaar open, not chaotic.
                </p>
              </Section>

              <Section title="For Creators">
                <p className="text-gray-200 leading-relaxed drop-shadow text-left">
                  Launch faster, find early believers, and keep control of your roadmap.
                </p>
              </Section>

              <Section title="For Supporters">
                <p className="text-gray-200 leading-relaxed drop-shadow text-left">
                  Discover gems early, back the builders you love, and help shape what ships next.
                </p>
              </Section>

              <Section title="Call to Action">
                <p className="text-gray-200 leading-relaxed drop-shadow text-left">
                  Join the bazaar. Start a project, post your first update, and say hello in a Clique.<br />
                  Your next collaborator might be one scroll away. 💫
                </p>
              </Section>
            </div>
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 mt-10">
      <h2 className="text-2xl font-semibold text-white drop-shadow text-left mb-1">{title}</h2>
      {children}
    </div>
  );
}

function Feature({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 mb-4">
      <h4 className="font-semibold text-emerald-300 drop-shadow">{title}</h4>
      <p className="mt-2 text-gray-200 text-sm leading-relaxed drop-shadow">{children}</p>
    </div>
  );
}