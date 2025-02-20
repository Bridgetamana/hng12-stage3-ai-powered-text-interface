import React from "react";
import LanguageDropdown from "./LanguageDropdown";

export default function InputForm({
  handleSubmit,
  inputText,
  handleInputChange,
  languages,
  selectedLanguage,
  setSelectedLanguage,
  isOpen,
  setIsOpen,
  detectedLanguage,
}) {
  return (
    <form
      className="border-t border-zinc-200 dark:border-zinc-800"
      onSubmit={handleSubmit}
    >
      <div className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <LanguageDropdown
          languages={languages}
          selectedLanguage={selectedLanguage}
          setSelectedLanguage={setSelectedLanguage}
          isOpen={isOpen}
          setIsOpen={setIsOpen}
        />
        {detectedLanguage && (
          <p className="mt-1.5 text-xs text-zinc-500">
            Detected: {detectedLanguage}
          </p>
        )}
      </div>
      <div className="p-4 flex items-center gap-3">
        <label htmlFor="chat-input" className="sr-only">
          Type your message
        </label>
        <input
          id="chat-input"
          type="text"
          value={inputText}
          onChange={handleInputChange}
          placeholder="Translate or summarize your text..."
          className="flex-1 min-w-0 bg-zinc-100 text-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-300 placeholder-zinc-500 border border-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-200 dark:focus:ring-emerald-500/40 dark:placeholder-zinc-500 dark:border-zinc-700/30"
          required
        />
        <button
          className="flex-none p-3 rounded-xl bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-all duration-200 focus:ring-2 focus:ring-emerald-300 focus:outline-none dark:focus:ring-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          type="submit"
          disabled={!inputText.trim()}
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
      </div>
    </form>
  );
}