import React from "react";

export default function Header({ setShowClearChatModal }) {
  return (
    <header className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span
          className="w-2.5 h-2.5 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-pulse"
          aria-hidden="true"
        ></span>
        <h1 className="text-zinc-800 dark:text-zinc-100 font-medium tracking-wide">
          AI Text Assist
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowClearChatModal(true)}
          className="p-2 rounded-full text-zinc-500 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10"
          title="Clear chat history"
          aria-label="Clear chat history"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h18"></path>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    </header>
  );
}