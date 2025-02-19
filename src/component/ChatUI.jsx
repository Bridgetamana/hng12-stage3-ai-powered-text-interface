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
    if (!("ai" in window) || !("languageDetector" in window.ai)) {
      setIsDetectorSupported(false);
      setError("Language detection not supported");
      console.error("Language detection not supported");
      return;
    }
    try {
      const detectorCapabilities =
        await window.ai.languageDetector.capabilities();
      if (detectorCapabilities.available === "no") {
        setIsDetectorSupported(false);
        setError("Language detection not available");
        console.error("Language detection not available");
      } else {
        const newDetector = await window.ai.languageDetector.create();
        setDetector(newDetector);
      }
    } catch (err) {
      setError("Failed to initialize language detector");
      setIsDetectorSupported(false);
      console.error("Failed to initialize language detector", err);
    }
    if (!("ai" in window) || !("translator" in window.ai)) {
      setIsTranslatorSupported(false);
      setError("Translation not supported");
      console.error("Translation not supported");
      return;
    }
    try {
      const capabilities = await window.ai.translator.capabilities();
      setTranslatorCapabilities(capabilities);
    } catch (err) {
      setError("Failed to initialize translator");
      setIsTranslatorSupported(false);
      console.error("Failed to initialize translator", err);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    try {
      const results = await detector.detect(inputText.trim());
      const { detectedLanguage: lang } = results[0];
      const newMessage = {
        id: Date.now(),
        text: inputText,
        language: lang,
        translation: null,
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
              <div className="bg-white/5 p-3 rounded-xl w-3/4 md:w-2/3 mr-auto">
                <p className="text-zinc-300">{message.text}</p>
                <p className="text-xs text-zinc-500 mt-1">
                  {getLanguageName(message.language)}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  {message.timestamp}
                </p>
              </div>
             {message.translation ? (
                <div className="bg-emerald-500/5 p-3 rounded-xl w-3/4 md:w-2/3 ml-auto">
                  <p className="text-emerald-200">{message.translation}</p>
                  <p className="text-xs text-emerald-500/70 mt-1">
                    {getLanguageName(selectedLanguage)}
                  </p>
                </div>
              ) : (
                <>
                  {message.language === selectedLanguage ? (
                    <p className="text-sm text-red-400">
                      Please pick a different language to translate.
                    </p>
                  ) : (
                    <button
                      onClick={() =>
                        handleTranslate(message.id, message.text, message.language)
                      }
                      disabled={isTranslating}
                      className="text-sm text-emerald-500 hover:text-emerald-600 transition-colors disabled:opacity-50"
                    >
                      {isTranslating ? (
                        <span>Translating...</span>
                      ) : (
                        <span>Translate to {getLanguageName(selectedLanguage)}</span>
                      )}
                    </button>
                  )}
                </>
              )}
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
            disabled={!inputText.trim() || !detector}
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
