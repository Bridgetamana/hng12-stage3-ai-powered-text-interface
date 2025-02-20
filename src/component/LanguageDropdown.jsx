import React from "react";

const LanguageDropdown = ({ languages, selectedLanguage, setSelectedLanguage, isOpen, setIsOpen, }) => {
  return (
    <div className="relative w-36">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-white/5 rounded-lg flex items-center justify-between hover:bg-zinc-200 dark:hover:bg-white/[0.07] transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:focus:ring-emerald-500/70 border border-zinc-200 dark:border-transparent"
        aria-expanded={isOpen}
      >
        {languages.find((lang) => lang.value === selectedLanguage)?.label}
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute bottom-full mb-2 w-full bg-white dark:bg-zinc-900/95 backdrop-blur-lg rounded-xl border border-zinc-200 dark:border-white/10 shadow-lg dark:shadow-xl z-50"
          role="listbox"
        >
          {languages.map((language) => (
            <button
              key={language.value}
              onClick={() => {
                setSelectedLanguage(language.value);
                setIsOpen(false);
              }}
              className="w-full px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 text-left first:rounded-t-xl last:rounded-b-xl transition-colors focus:outline-none focus:bg-zinc-200 dark:focus:bg-white/10"
              role="option"
              aria-selected={selectedLanguage === language.value}
            >
              {language.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageDropdown;