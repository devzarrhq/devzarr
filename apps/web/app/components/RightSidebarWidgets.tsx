"use client";
import TrendingProjectsWidget from "./TrendingProjectsWidget";
import SupportWidget from "./SupportWidget";
import ActiveCliquesWidget from "./ActiveCliquesWidget";

export default function RightSidebarWidgets() {
  return (
    <aside className="hidden lg:block w-[340px] flex-shrink-0 px-6 py-10 sticky top-16">
      <TrendingProjectsWidget />
      <SupportWidget />
      <ActiveCliquesWidget />
    </aside>
  );
}