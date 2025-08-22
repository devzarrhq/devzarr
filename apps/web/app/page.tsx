import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Feed from "./components/Feed";

export default function HomePage() {
  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-64">
        <Topbar />
        <main className="flex-1">
          <Feed />
        </main>
      </div>
    </div>
  );
}