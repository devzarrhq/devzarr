"use client";

import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "../../../providers/AuthProvider";
import { useTheme } from "../../../theme-context";
import dynamic from "next/dynamic";

const ReactMarkdown = dynamic(() => import("react-markdown"), { ssr: false });

const TYPE_OPTIONS = [
  "Web App", "Library", "Game", "CLI Tool", "Mobile App", "API", "Other"
];
const STATUS_OPTIONS = [
  "Alpha", "Beta", "Production", "Paused"
];

export default function ProjectEditPage({ params }: { params: { slug: string } }) {
  const { user } = useAuth();
  const { accent } = useTheme();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<any>(null);

  // Form fields
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [homepageUrl, setHomepageUrl] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [docsUrl, setDocsUrl] = useState("");
  const [packageUrl, setPackageUrl] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactDiscord, setContactDiscord] = useState("");
  const [contactMatrix, setContactMatrix] = useState("");
  const [supportKofi, setSupportKofi] = useState("");
  const [supportPatreon, setSupportPatreon] = useState("");
  const [supportBmac, setSupportBmac] = useState("");
  const [supportGithub, setSupportGithub] = useState("");
  const [fundingGoalNote, setFundingGoalNote] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      const supabase = supabaseBrowser();
      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("slug", params.slug)
        .single();
      if (!data) {
        setError("Project not found.");
        setLoading(false);
        return;
      }
      setProject(data);
      setName(data.name || "");
      setTagline(data.tagline || "");
      setDescription(data.description || "");
      setType(data.type || "");
      setStatus(data.status || "");
      setIconUrl(data.icon_url || "");
      setBannerUrl(data.banner_url || "");
      setHomepageUrl(data.homepage_url || "");
      setRepoUrl(data.repo_url || "");
      setDocsUrl(data.docs_url || "");
      setPackageUrl(data.package_url || "");
      setContactEmail(data.contact_email || "");
      setContactDiscord(data.contact_discord || "");
      setContactMatrix(data.contact_matrix || "");
      setSupportKofi(data.support_kofi || "");
      setSupportPatreon(data.support_patreon || "");
      setSupportBmac(data.support_bmac || "");
      setSupportGithub(data.support_github || "");
      setFundingGoalNote(data.funding_goal_note || "");
      setLoading(false);
    })();
  }, [params.slug]);

  // Only owner can edit
  if (loading) return <div className="p-8 text-gray-300">Loading…</div>;
  if (error) return <div className="p-8 text-red-400">{error}</div>;
  if (!user || user.id !== project.owner_id) return <div className="p-8 text-gray-300">You do not have permission to edit this project.</div>;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const supabase = supabaseBrowser();
    const { error: upError } = await supabase
      .from("projects")
      .update({
        name: name.trim(),
        tagline: tagline.trim(),
        description: description.trim(),
        type,
        status,
        icon_url: iconUrl.trim(),
        banner_url: bannerUrl.trim(),
        homepage_url: homepageUrl.trim(),
        repo_url: repoUrl.trim(),
        docs_url: docsUrl.trim(),
        package_url: packageUrl.trim(),
        contact_email: contactEmail.trim(),
        contact_discord: contactDiscord.trim(),
        contact_matrix: contactMatrix.trim(),
        support_kofi: supportKofi.trim(),
        support_patreon: supportPatreon.trim(),
        support_bmac: supportBmac.trim(),
        support_github: supportGithub.trim(),
        funding_goal_note: fundingGoalNote.trim(),
      })
      .eq("id", project.id);
    if (upError) {
      setError(upError.message);
      setSaving(false);
      return;
    }
    router.push(`/projects/${params.slug}`);
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6" style={{ color: `var(--tw-color-accent-${accent})` }}>
        Edit Project
      </h1>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className="block text-gray-200 font-medium mb-1">Name</label>
          <input className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2"
            value={name} onChange={e => setName(e.target.value)} maxLength={100} required />
        </div>
        <div>
          <label className="block text-gray-200 font-medium mb-1">Tagline</label>
          <input className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2"
            value={tagline} onChange={e => setTagline(e.target.value)} maxLength={120} />
        </div>
        <div>
          <label className="block text-gray-200 font-medium mb-1">Description (Markdown supported)</label>
          <textarea className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2"
            value={description} onChange={e => setDescription(e.target.value)} rows={6} />
          <div className="mt-2 text-xs text-gray-400">Preview:</div>
          <div className="prose prose-invert max-w-none border border-gray-700 rounded p-2 bg-gray-900">
            <ReactMarkdown>{description}</ReactMarkdown>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-gray-200 font-medium mb-1">Type</label>
            <select className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2"
              value={type} onChange={e => setType(e.target.value)}>
              <option value="">Select type</option>
              {TYPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-gray-200 font-medium mb-1">Status</label>
            <select className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2"
              value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">Select status</option>
              {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-gray-200 font-medium mb-1">Icon URL</label>
          <input className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2"
            value={iconUrl} onChange={e => setIconUrl(e.target.value)} />
        </div>
        <div>
          <label className="block text-gray-200 font-medium mb-1">Banner URL</label>
          <input className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2"
            value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} />
        </div>
        <div>
          <label className="block text-gray-200 font-medium mb-1">Homepage / Live Demo</label>
          <input className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2"
            value={homepageUrl} onChange={e => setHomepageUrl(e.target.value)} />
        </div>
        <div>
          <label className="block text-gray-200 font-medium mb-1">Repository (GitHub, GitLab, etc.)</label>
          <input className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2"
            value={repoUrl} onChange={e => setRepoUrl(e.target.value)} />
        </div>
        <div>
          <label className="block text-gray-200 font-medium mb-1">Docs / Wiki</label>
          <input className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2"
            value={docsUrl} onChange={e => setDocsUrl(e.target.value)} />
        </div>
        <div>
          <label className="block text-gray-200 font-medium mb-1">Package Registry (npm, Docker, etc.)</label>
          <input className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2"
            value={packageUrl} onChange={e => setPackageUrl(e.target.value)} />
        </div>
        <div>
          <label className="block text-gray-200 font-medium mb-1">Contact Email</label>
          <input className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2"
            value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-gray-200 font-medium mb-1">Contact Discord</label>
          <input className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2"
            value={contactDiscord} onChange={e => setContactDiscord(e.target.value)} />
        </div>
        <div>
          <label className="block text-gray-200 font-medium mb-1">Contact Matrix</label>
          <input className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2"
            value={contactMatrix} onChange={e => setContactMatrix(e.target.value)} />
        </div>
        <div>
          <label className="block text-gray-200 font-medium mb-1">Ko-fi</label>
          <input className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2"
            value={supportKofi} onChange={e => setSupportKofi(e.target.value)} />
        </div>
        <div>
          <label className="block text-gray-200 font-medium mb-1">Patreon</label>
          <input className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2"
            value={supportPatreon} onChange={e => setSupportPatreon(e.target.value)} />
        </div>
        <div>
          <label className="block text-gray-200 font-medium mb-1">BuyMeACoffee</label>
          <input className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2"
            value={supportBmac} onChange={e => setSupportBmac(e.target.value)} />
        </div>
        <div>
          <label className="block text-gray-200 font-medium mb-1">GitHub Sponsors</label>
          <input className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2"
            value={supportGithub} onChange={e => setSupportGithub(e.target.value)} />
        </div>
        <div>
          <label className="block text-gray-200 font-medium mb-1">Funding Goal Note</label>
          <input className="w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2"
            value={fundingGoalNote} onChange={e => setFundingGoalNote(e.target.value)} />
        </div>
        {error && <div className="text-red-400 text-sm">{error}</div>}
        <button
          type="submit"
          className="w-full px-4 py-2 rounded font-semibold text-white disabled:opacity-50"
          style={{ background: `var(--tw-color-accent-${accent})` }}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}