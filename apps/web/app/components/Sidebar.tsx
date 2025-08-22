"use client";

import { Home, Rocket, Users, MessageCircle, Settings } from "lucide-react";
import Link from "next/link";
import { useTheme } from "../theme-context";

const navLinks = [
  { name: "Feed", icon: Home, href: "/" },
  { name: "Projects", icon: Rocket, href: "/projects" },
  { name: "Cliques", icon: Users, href: "/cliques" },
  { name: "Messages", icon: MessageCircle, href: "/messages" },
  { name: "Settings", icon: Settings, href: "/settings" },
];

export default function Sidebar() {
  const { accent } = useTheme();

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen bg-gray-950 border-r border-gray-800 px-4 py-6 fixed left-0 top-0 z-20">
      <div className="mb-8 flex items-center gap-2">
        <span className={`text-2xl font-bold text-accent-${accent}`}>🏛️ Devzarr</span>
      </div>
      <nav className="flex-1">
        <ul className="space-y-2">
          {navLinks.map(({ name, icon: Icon, href }) => (
            <li key={name}>
              <Link
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-900 transition-colors text-gray-200 font-medium`}
              >
                <Icon className={`w-5 h-5 text-accent-${accent}`} />
                {name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-auto text-xs text-gray-600 px-2">
        <span>© {new Date().getFullYear()} Devzarr</span>
      </div>
    </aside>
  );
}