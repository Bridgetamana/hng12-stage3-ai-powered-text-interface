import React from "react";

export default function ChatContent({
  error,
  messages,
  summarizedTexts,
  isSummarizing,
  isSummarizerSupported,
  isTranslating,
  selectedLanguage,
  handleSummarize,
  handleTranslate,
  getLanguageName,
}) {
  return (
    <main
      className="h-[500px] overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent"
      role="log"
      aria-live="polite"
    >
      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-2.5 rounded-xl text-sm border border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20">
          {error}
        </div>
      )}

      {messages.length === 0 ? (
        <div className="text-center p-6 w-full max-w-xl mx-auto relative inline-block">
          <h2 className="text-emerald-600 dark:text-emerald-300 font-bold mb-4 overflow-hidden whitespace-nowrap inline-block typewriter">
            Hi, how can I help you?
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400  max-w-lg mx-auto description">
            I can help you translate text between different languages and
            summarize English text. Just type your message and I&apos;ll
            detect the language automatically.
          </p>
        </div>
      ) : (
        messages.map((message) => (
          <div key={message.id} className="space-y-3">
            <div
              className={`flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div className={`flex flex-col w-2/3`}>
                {message.sender === "user" && (
                  <div className="flex justify-end mb-1.5">
                    <span className="px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200 rounded-lg">
                      YOU
                    </span>
                  </div>
                )}

                <div
                  className={`px-5 py-4 rounded-2xl ${
                    message.sender === "user"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-100 dark:border-emerald-500/20"
                      : "bg-zinc-100 text-zinc-800 border border-zinc-200 dark:bg-zinc-800/50 dark:text-zinc-200 dark:border-zinc-700/30"
                  }`}
                >
                  <div className="leading-relaxed">{message.text}</div>
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-xs font-medium text-zinc-500">
                      {getLanguageName(message.language)}
                    </div>
                    <p className="text-xs text-zinc-500">
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex justify-end gap-4">
                {message.language === "en" &&
                  message.text.length > 150 &&
                  !summarizedTexts[message.id] &&
                  isSummarizerSupported && (
                    <button
                      onClick={() =>
                        handleSummarize(message.id, message.text)
                      }
                      className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 flex items-center gap-1"
                      disabled={isSummarizing}
                    >
                      {isSummarizing ? (
                        <span className="flex items-center">
                           Summarizing
                          <span className="loading-dots ml-1">
                            <span>.</span>
                            <span>.</span>
                            <span>.</span>
                          </span>
                        </span>
                      ) : (
                        <>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M4 6h16M4 12h10M4 18h6" />
                          </svg>
                          Summarize
                        </>
                      )}
                    </button>
                  )}

                {!message.translation && (
                  <>
                    {message.language === selectedLanguage ? (
                      <p className="text-sm text-red-500 dark:text-red-300 italic">
                        Please select a different language
                      </p>
                    ) : (
                      <button
                        onClick={() =>
                          handleTranslate(
                            message.id,
                            message.text,
                            message.language
                          )
                        }
                        className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center gap-1"
                        disabled={isTranslating}
                      >
                        {isTranslating ? (
                          <span className="flex items-center">
                            Translating
                            <span className="loading-dots ml-1">
                              <span>.</span>
                              <span>.</span>
                              <span>.</span>
                            </span>
                          </span>
                        ) : (
                          <>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="2"
                              stroke="currentColor"
                              width="16"
                              height="16"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802"
                              />
                            </svg>
                            Translate to {getLanguageName(selectedLanguage)}
                          </>
                        )}
                      </button>
                    )}
                  </>
                )}
              </div>

              {summarizedTexts[message.id] && (
                <div className="w-3/4">
                  <div className="flex justify-end mb-1.5">
                    <span className="px-2.5 py-1 text-xs font-medium bg-zinc-50 text-zinc-700 dark:bg-zinc-500/10 dark:text-zinc-200 rounded-lg uppercase">
                      summary
                    </span>
                  </div>

                  <div className="bg-white text-zinc-800 p-4 rounded-2xl border border-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-200 dark:border-zinc-700/30 w-full shadow-sm">
                    {summarizedTexts[message.id]}
                  </div>
                </div>
              )}

              {message.translation && (
                <div className="w-3/4">
                  <div className="flex items-start mb-1.5">
                    <span className="px-2.5 py-1 text-xs font-medium bg-zinc-50 text-zinc-700 dark:bg-zinc-500/10 dark:text-zinc-200 rounded-lg uppercase">
                      Translation
                    </span>
                  </div>
                  <div className="bg-white text-zinc-800 p-4 rounded-2xl border border-zinc-200 dark:bg-zinc-800/60 dark:text-zinc-200 dark:border-zinc-700/30 w-full shadow-sm">
                    {message.translation}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </main>
  );
}