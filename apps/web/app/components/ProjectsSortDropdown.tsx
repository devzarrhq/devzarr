"use client";
import React from "react";

const SORT_OPTIONS = [
  { label: "Most Recent", value: "recent" },
  { label: "Alphabetical (A–Z)", value: "az" },
  { label: "Most Popular", value: "popular" },
];

export default function ProjectsSortDropdown({ sort }: { sort: string }) {
  return (
    <form method="get">
      <label className="sr-only" htmlFor="sort">Sort by</label>
      <select
        id="sort"
        name="sort"
        defaultValue={sort}
        className="px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2"
        style={{ minWidth: 180 }}
        onChange={e => {
          // Use client-side navigation for sort
          window.location.search = `?sort=${e.target.value}`;
        }}
      >
        {SORT_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </form>
  );
}