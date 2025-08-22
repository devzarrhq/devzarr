import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Feed from "./components/Feed";

export default function HomePage() {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-64">
        <Topbar />
        <main className="flex-1 w-full">
          {/* Test Tailwind */}
          <div className="test-tailwind">TAILWIND TEST</div>
          <Feed />
        </main>
      </div>
    </div>
  );
}