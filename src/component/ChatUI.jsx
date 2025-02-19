import React, { useState, useEffect } from "react";
import LanguageDropdown from "./LanguageDropdown";

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
    <div className="w-full max-w-2xl bg-zinc-900/50 rounded-2xl backdrop-blur-xl border border-white/10 overflow-hidden">
      <header className="px-4 sm:px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 bg-emerald-200 rounded-full animate-pulse"
            aria-hidden="true"
          ></span>
          <h1 className="text-zinc-300 font-medium">AI Text Assist</h1>
        </div>
      </header>

      <main
        className="h-[500px] overflow-y-auto p-4 sm:p-6 space-y-4"
        role="log"
        aria-live="polite"
      >
        {error && (
          <div className="bg-red-500/10 text-red-400 px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        {messages.length === 0 ? (
          <p className="text-zinc-400">Welcome</p>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="space-y-2">
              <div
                className={`flex ${
                  message.sender === "user" ? "justify-end " : "justify-start "
                }`}
              >
                <div className={`flex flex-col w-2/3`}>
                  {message.sender === "user" && (
                    <div className="flex justify-end mb-1">
                      <span className="px-2 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-200 rounded-lg">
                        YOU
                      </span>
                    </div>
                  )}

                  <div
                    className={`px-4 py-3 rounded-2xl ${
                      message.sender === "user"
                        ? "bg-emerald-500/10 text-emerald-200 "
                        : "bg-white/5 text-zinc-300"
                    }`}
                  >
                    <div>{message.text}</div>
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-zinc-400 mt-1">
                        {getLanguageName(message.language)}
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">
                        {message.timestamp}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-end gap-2">
                  {message.language === "en" &&
                    message.text.length > 150 &&
                    !summarizedTexts[message.id] &&
                    isSummarizerSupported && (
                      <button
                        onClick={() =>
                          handleSummarize(message.id, message.text)
                        }
                        className="text-sm text-zinc-200 hover:text-zinc-300"
                        disabled={isSummarizing}
                      >
                        {isSummarizing ? "Summarizing..." : "Summarize"}
                      </button>
                    )}

                  {message.language === selectedLanguage ? (
                    <p className="text-sm text-red-400">
                      Please pick a different language to translate.
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
                      className="text-sm text-emerald-500 hover:text-emerald-600"
                      disabled={
                        isTranslating || message.language === selectedLanguage
                      }
                    >
                      {isTranslating ? (
                        "Translating..."
                      ) : (
                        <span>
                          Translate to {getLanguageName(selectedLanguage)}
                        </span>
                      )}
                    </button>
                  )}
                </div>

                {summarizedTexts[message.id] && (
                  <div>
                    <div className="flex justify-end mb-1">
                      <span className="px-2 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-200 rounded-lg">
                        YOU
                      </span>
                    </div>

                    <div className="bg-white/5 text-zinc-300 p-3 rounded-xl w-3/4">
                      <div className="text-sm font-medium mb-1 text-zinc-400">
                        Summary
                      </div>
                      {summarizedTexts[message.id]}
                    </div>
                  </div>
                )}

                {message.translation && (
                  <div className="flex flex-col w-3/4">
                    <div className="flex items-start mb-1">
                      <span className="px-2 py-1 text-xs font-medium bg-white/5 text-zinc-400 rounded-lg">
                        AI
                      </span>
                    </div>
                    <div className="bg-white/5 text-zinc-300 p-3 rounded-xl w-3/4">
                      <div className="text-sm font-medium mb-1 text-zinc-400">
                        Translation
                      </div>
                      {message.translation}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </main>

      <form className="border-t border-white/10" onSubmit={handleSubmit}>
        <div className="px-4 py-2 border-b border-white/10">
          <LanguageDropdown
            languages={languages}
            selectedLanguage={selectedLanguage}
            setSelectedLanguage={setSelectedLanguage}
            isOpen={isOpen}
            setIsOpen={setIsOpen}
          />
          {detectedLanguage && (
            <p className="mt-1 text-xs text-zinc-500">
              Detected: {detectedLanguage}
            </p>
          )}
        </div>
        <div className="p-4 flex items-center gap-2">
          <label htmlFor="chat-input" className="sr-only">
            Type your message
          </label>
          <input
            id="chat-input"
            type="text"
            value={inputText}
            onChange={handleInputChange}
            placeholder="Translate or summarize your text..."
            className="flex-1 min-w-0 bg-white/5 text-zinc-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/70 placeholder-zinc-600"
            required
          />
          <button
            className="flex-none p-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors focus:ring-2 focus:ring-emerald-500/70 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
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
