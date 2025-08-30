"use client";

import { Home, Rocket, Users, MessageCircle, UserCircle, Info } from "lucide-react";
import Link from "next/link";
import { useTheme } from "../theme-context";

const navLinks = [
  { name: "Feed", icon: Home, href: "/" },
  { name: "Projects", icon: Rocket, href: "/projects" },
  { name: "Cliques", icon: Users, href: "/cliques" },
  { name: "Messages", icon: MessageCircle, href: "/messages" },
  { name: "Profile", icon: UserCircle, href: "/profile" },
  { name: "About", icon: Info, href: "/about" },
];

export default function Sidebar() {
  const { accent } = useTheme();

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-800 border-r border-gray-800 px-4 py-6 fixed left-0 top-0 z-20">
      <div className="mb-8 flex items-center justify-center">
        <Link href="/" className="flex items-center justify-center">
          <img
            src="/images/devzarr_logo.png"
            alt="Devzarr Logo"
            className="h-16 w-16 object-contain"
            style={{ background: "transparent" }}
          />
        </Link>
      </div>
      <nav className="flex-1">
        <ul className="space-y-2">
          {navLinks.map(({ name, icon: Icon, href }) => (
            <li key={name}>
              <Link
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent-${accent}/20 transition-colors text-gray-200 font-medium`}
                style={{ borderLeft: `4px solid var(--tw-color-accent-${accent})` }}
              >
                <Icon className={`w-5 h-5`} style={{ color: `var(--tw-color-accent-${accent})` }} />
                {name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-auto text-xs text-gray-400 px-2">
        <span>© {new Date().getFullYear()} Devzarr</span>
      </div>
    </aside>
  );
}