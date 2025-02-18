import React from "react";

export default function ChatUI() {
  return (
    <div className="w-full max-w-2xl bg-zinc-900/50 rounded-2xl backdrop-blur-xl border border-white/10 overflow-hidden">
      <header className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 bg-emerald-200 rounded-full animate-pulse"
            aria-hidden="true"
          ></span>
          <h1 className="text-zinc-300 font-medium">AI Text Assist</h1>
        </div>
      </header>

      <main
        className="h-[500px] overflow-y-auto p-6 space-y-4"
        role="log"
        aria-live="polite"
      >
        <p className="text-zinc-400">No messages yet.</p>
      </main>

      <form className="border-t border-white/10 p-4 flex items-center gap-3">
        <label htmlFor="chat-input" className="sr-only">
          Type your message
        </label>
        <input
          id="chat-input"
          type="text"
          placeholder="Translate or summarize your text..."
          className="flex-1 bg-white/5 text-zinc-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/70 placeholder-zinc-600"
          required
        />
        <button
          className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors focus:ring-2 focus:ring-emerald-500/70 focus:outline-none"
          type="submit"
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
