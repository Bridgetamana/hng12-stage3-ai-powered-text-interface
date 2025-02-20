import React, { useState, useEffect } from "react";
import LanguageDropdown from "./LanguageDropdown";
import ClearChatModal from "./ClearChatModal";

export default function ChatUI() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [inputText, setInputText] = useState("");
  const [detectedLanguage, setDetectedLanguage] = useState("");
  const [error, setError] = useState("");
  const [detector, setDetector] = useState(null);
  const [translatorCapabilities, setTranslatorCapabilities] = useState(null);
  const [isDetectorSupported, setIsDetectorSupported] = useState(true);
  const [isTranslatorSupported, setIsTranslatorSupported] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);
  const [summarizedTexts, setSummarizedTexts] = useState({});
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isSummarizerSupported, setIsSummarizerSupported] = useState(true);
  const [summarizer, setSummarizer] = useState(null);
  const [showClearChatModal, setShowClearChatModal] = useState(false);
  const languages = [
    { value: "en", label: "English" },
    { value: "es", label: "Spanish" },
    { value: "fr", label: "French" },
    { value: "ru", label: "Russian" },
    { value: "tr", label: "Turkish" },
    { value: "pt", label: "Portuguese" },
  ];
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem("chatMessages");
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Error loading messages:", error);
      return [];
    }
  });
  useEffect(() => {
    initialize();
    try {
      if (messages.length > 0) {
        localStorage.setItem("chatMessages", JSON.stringify(messages));
      }
    } catch (error) {
      console.error("Error saving messages:", error);
      setError("Failed to save messages");
    }
  }, [messages]);

  const handleClearChat = () => {
    setMessages([]);
    localStorage.removeItem("chatMessages");
    setShowClearChatModal(false);
  };

  const initialize = async () => {
    if (!("ai" in window)) {
      setIsDetectorSupported(false);
      setIsTranslatorSupported(false);
      setIsSummarizerSupported(false);
      setError("AI APIs are not available in this browser");
      return;
    }

    if ("languageDetector" in window.ai) {
      try {
        const detectorCapabilities =
          await window.ai.languageDetector.capabilities();

        if (detectorCapabilities.available === "no") {
          setIsDetectorSupported(false);
          setError("Language detection is not available on this device");
        } else if (detectorCapabilities.available === "after-download") {
          const newDetector = await window.ai.languageDetector.create({
            monitor: (m) => {
              m.addEventListener("downloadprogress", (e) => {
                setError(
                  `Downloading language model: ${Math.round(
                    (e.loaded / e.total) * 100
                  )}%`
                );
              });
            },
          });
          await newDetector.ready;
          setDetector(newDetector);
          setIsDetectorSupported(true);
          setError("");
        } else if (detectorCapabilities.available === "readily") {
          const newDetector = await window.ai.languageDetector.create();
          setDetector(newDetector);
          setIsDetectorSupported(true);
          setError("");
        }
      } catch (err) {
        setError("Failed to initialize language detector: " + err.message);
        setIsDetectorSupported(false);
      }
    } else {
      setIsDetectorSupported(false);
      setError("Language detection is not supported in this browser");
    }

    if ("summarizer" in window.ai) {
      try {
        const summarizerCapabilities =
          await window.ai.summarizer.capabilities();

        if (summarizerCapabilities.available === "no") {
          setIsSummarizerSupported(false);
          setError("Summarization is not available on this device");
        } else if (summarizerCapabilities.available === "after-download") {
          const newSummarizer = await window.ai.summarizer.create({
            type: "tl;dr",
            format: "plain-text",
            length: "short",
            monitor: (m) => {
              m.addEventListener("downloadprogress", (e) => {
                setError(
                  `Downloading summarization model: ${Math.round(
                    (e.loaded / e.total) * 100
                  )}%`
                );
              });
            },
          });
          await newSummarizer.ready;
          setSummarizer(newSummarizer);
          setIsSummarizerSupported(true);
          setError("");
        } else if (summarizerCapabilities.available === "readily") {
          const newSummarizer = await window.ai.summarizer.create({
            type: "tl;dr",
            format: "plain-text",
            length: "short",
          });
          setSummarizer(newSummarizer);
          setIsSummarizerSupported(true);
          setError("");
        }
      } catch (err) {
        setError("Failed to initialize summarizer: " + err.message);
        setIsSummarizerSupported(false);
      }
    } else {
      setIsSummarizerSupported(false);
      setError("Summarization is not supported in this browser");
    }

    if ("translator" in window.ai) {
      try {
        const capabilities = await window.ai.translator.capabilities();
        setTranslatorCapabilities(capabilities);
        setIsTranslatorSupported(true);
      } catch (err) {
        setError("Failed to initialize translator: " + err.message);
        setIsTranslatorSupported(false);
      }
    } else {
      setIsTranslatorSupported(false);
      setError("Translation is not supported in this browser");
    }
  };

  const handleInputChange = async (e) => {
    const text = e.target.value;
    setInputText(text);
    setError("");
    if (!detector || !text.trim()) {
      setDetectedLanguage("");
      return;
    }
    try {
      const results = await detector.detect(text.trim());
      const { detectedLanguage: lang } = results[0];
      setDetectedLanguage(getLanguageName(lang));
    } catch (err) {
      setError("Unable to detect language");
      console.error("Unable to detect language", err);
    }
  };

  const handleTranslate = async (messageId, text, sourceLang) => {
    if (!text.trim()) {
      setError("Please enter text to translate");
      return;
    }
    setIsTranslating(true);
    try {
      const pairAvailable = await translatorCapabilities.languagePairAvailable(
        sourceLang,
        selectedLanguage
      );
      if (pairAvailable === "no") {
        setError("Translation not available for this language pair");
        return;
      }
      const translator = await window.ai.translator.create({
        sourceLanguage: sourceLang,
        targetLanguage: selectedLanguage,
      });
      const translated = await translator.translate(text.trim());
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, translation: translated } : msg
        )
      );
    } catch (err) {
      setError("Translation failed");
      console.error("Translation failed", err);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSummarize = async (messageId, text) => {
    if (!text.trim()) {
      setError("Please enter text to summarize");
      return;
    }

    if (text.length <= 150) {
      setError("Text is too short to summarize (minimum 150 characters)");
      return;
    }

    if (!summarizer || !isSummarizerSupported) {
      setError("Summarization is not available");
      return;
    }

    setIsSummarizing(true);
    setError("");

    try {
      const stream = await summarizer.summarizeStreaming(text.trim());
      let result = "";
      let previousLength = 0;

      for await (const segment of stream) {
        const newContent = segment.slice(previousLength);
        previousLength = segment.length;
        result += newContent;

        setSummarizedTexts((prev) => ({
          ...prev,
          [messageId]: result,
        }));
      }
    } catch (err) {
      console.error("Summarization failed:", err);
      setError("Failed to summarize text: " + err.message);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    try {
      const results = await detector.detect(inputText.trim());
      const { detectedLanguage: lang } = results[0];
      const newMessage = {
        id: Date.now(),
        text: inputText,
        sender: "user",
        language: lang,
        timestamp: new Date().toLocaleString(),
      };
      setMessages((prev) => [...prev, newMessage]);
      setInputText("");
      setDetectedLanguage("");
    } catch (err) {
      setError("Failed to process message");
      console.error("Failed to process message", err);
    }
  };

  const getLanguageName = (langCode) => {
    const displayNames = new Intl.DisplayNames(["en"], { type: "language" });
    return displayNames.of(langCode);
  };

  if (!isDetectorSupported || !isTranslatorSupported) {
    return (
      <div className="w-full max-w-2xl p-4 bg-red-600/10 text-red-400 rounded-xl text-center">
        Language detection or translation is not supported in your browser.
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl bg-white/90 dark:bg-zinc-900/80 rounded-3xl backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 shadow-lg dark:shadow-xl overflow-hidden">
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
      {showClearChatModal && (
        <ClearChatModal
          onConfirm={handleClearChat}
          onCancel={() => setShowClearChatModal(false)}
        />
      )}

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
    </div>
  );
}
