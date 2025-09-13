"use client";

import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useAuth } from "../../../providers/AuthProvider";
import { useTheme } from "../../../theme-context";
import dynamic from "next/dynamic";
import Sidebar from "../../../components/Sidebar";
import Topbar from "../../../components/Topbar";
import RightSidebarWidgets from "../../../components/RightSidebarWidgets";

const ReactMarkdown = dynamic(() => import("react-markdown"), { ssr: false });

const TYPE_OPTIONS = [
  "Web App", "Library", "Game", "CLI Tool", "Mobile App", "API", "Other"
];
const STATUS_OPTIONS = [
  "Alpha", "Beta", "Production", "Paused"
];

// Helper: check file header for common image types
async function isValidImageFile(file: File): Promise<boolean> {
  const signatures: { [key: string]: number[][] } = {
    jpg: [[0xFF, 0xD8, 0xFF]],
    png: [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
    gif: [[0x47, 0x49, 0x46, 0x38]],
    webp: [[0x52, 0x49, 0x46, 0x46]],
    bmp: [[0x42, 0x4D]],
    svg: [[0x3C, 0x73, 0x76, 0x67]], // "<svg"
  };
  const buf = await file.slice(0, 12).arrayBuffer();
  const bytes = new Uint8Array(buf);
  for (const sigs of Object.values(signatures)) {
    for (const sig of sigs) {
      if (bytes.length >= sig.length && sig.every((b, i) => bytes[i] === b)) {
        return true;
      }
    }
  }
  return false;
}

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

  // Upload state
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

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
  if (loading) return (
    <div className="flex min-h-screen w-full flex-row bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
      <Sidebar />
      <div className="flex flex-1 flex-col min-h-screen">
        <Topbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="p-8 text-gray-300">Loading…</div>
        </main>
      </div>
    </div>
  );
  if (error) return (
    <div className="flex min-h-screen w-full flex-row bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
      <Sidebar />
      <div className="flex flex-1 flex-col min-h-screen">
        <Topbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="p-8 text-red-400">{error}</div>
        </main>
      </div>
    </div>
  );
  if (!user || user.id !== project.owner_id) return (
    <div className="flex min-h-screen w-full flex-row bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
      <Sidebar />
      <div className="flex flex-1 flex-col min-h-screen">
        <Topbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="p-8 text-gray-300">You do not have permission to edit this project.</div>
        </main>
      </div>
    </div>
  );

  // --- Icon upload handler ---
  async function handleIconUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingIcon(true);
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      setUploadingIcon(false);
      return;
    }
    if (!(await isValidImageFile(file))) {
      setError("File does not appear to be a valid image.");
      setUploadingIcon(false);
      return;
    }

    const supabase = supabaseBrowser();
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/${project.slug}-icon.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from("project-assets").upload(filePath, file, {
      upsert: true,
      cacheControl: "3600",
    });
    if (uploadError) {
      setError("Failed to upload icon: " + uploadError.message);
      setUploadingIcon(false);
      return;
    }
    const { data } = supabase.storage.from("project-assets").getPublicUrl(filePath);
    setIconUrl(data.publicUrl + "?t=" + Date.now());
    setUploadingIcon(false);
  }

  // --- Banner upload handler ---
  async function handleBannerUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingBanner(true);
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      setUploadingBanner(false);
      return;
    }
    if (!(await isValidImageFile(file))) {
      setError("File does not appear to be a valid image.");
      setUploadingBanner(false);
      return;
    }

    const supabase = supabaseBrowser();
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/${project.slug}-banner.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from("project-assets").upload(filePath, file, {
      upsert: true,
      cacheControl: "3600",
    });
    if (uploadError) {
      setError("Failed to upload banner: " + uploadError.message);
      setUploadingBanner(false);
      return;
    }
    const { data } = supabase.storage.from("project-assets").getPublicUrl(filePath);
    setBannerUrl(data.publicUrl + "?t=" + Date.now());
    setUploadingBanner(false);
  }

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
    <div className="flex min-h-screen w-full flex-row bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
      <Sidebar />
      <div className="flex flex-1 flex-col min-h-screen">
        <Topbar />
        <div className="flex flex-1 flex-row">
          <div className="flex-1 flex flex-col md:ml-64 lg:mr-[340px] px-4">
            <main className="flex-1 flex flex-col items-center justify-start py-10">
              <div className="w-full max-w-2xl bg-gray-900 rounded-2xl shadow-2xl p-8 mb-8">
                <h1 className="text-3xl font-bold mb-6 text-center" style={{ color: `var(--tw-color-accent-${accent})` }}>
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
                  {/* Icon upload */}
                  <div>
                    <label className="block text-gray-200 font-medium mb-1">Icon</label>
                    <div className="flex items-center gap-3">
                      {iconUrl ? (
                        <img src={iconUrl} alt="icon" className="w-12 h-12 rounded object-cover border border-gray-700" />
                      ) : (
                        <div className="w-12 h-12 rounded bg-gray-700" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleIconUpload}
                        disabled={uploadingIcon}
                        className="block text-sm text-gray-400"
                      />
                      {uploadingIcon && <span className="text-xs text-gray-400">Uploading…</span>}
                    </div>
                    <input
                      className="mt-2 w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2"
                      value={iconUrl}
                      onChange={e => setIconUrl(e.target.value)}
                      placeholder="Or paste an image URL"
                    />
                  </div>
                  {/* Banner upload */}
                  <div>
                    <label className="block text-gray-200 font-medium mb-1">Banner</label>
                    <div className="flex items-center gap-3">
                      {bannerUrl ? (
                        <img src={bannerUrl} alt="banner" className="w-24 h-12 rounded object-cover border border-gray-700" />
                      ) : (
                        <div className="w-24 h-12 rounded bg-gray-700" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBannerUpload}
                        disabled={uploadingBanner}
                        className="block text-sm text-gray-400"
                      />
                      {uploadingBanner && <span className="text-xs text-gray-400">Uploading…</span>}
                    </div>
                    <input
                      className="mt-2 w-full px-3 py-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2"
                      value={bannerUrl}
                      onChange={e => setBannerUrl(e.target.value)}
                      placeholder="Or paste an image URL"
                    />
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