"use client";
import React from "react";
import ReactMarkdown from "react-markdown";

export default function ProjectDescription({ description }: { description: string }) {
  if (!description) return null;
  return (
    <div className="prose prose-invert max-w-none mb-4">
      <ReactMarkdown>{description}</ReactMarkdown>
    </div>
  );
}