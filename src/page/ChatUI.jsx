import React, { useState, useEffect } from "react";
import ClearChatModal from "../component/ClearChatModal";
import ChatContent from "../component/ChatContent";
import Header from "../component/Header";
import InputForm from "../component/InputForm";

export default function ChatUI() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("es");
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
      setError("Failed to process message, please try refreshing the page");
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
      <Header setShowClearChatModal={setShowClearChatModal} />
      
      {showClearChatModal && (
        <ClearChatModal
          onConfirm={handleClearChat}
          onCancel={() => setShowClearChatModal(false)}
        />
      )}

      <ChatContent 
        error={error}
        messages={messages}
        summarizedTexts={summarizedTexts}
        isSummarizing={isSummarizing}
        isSummarizerSupported={isSummarizerSupported}
        isTranslating={isTranslating}
        selectedLanguage={selectedLanguage}
        handleSummarize={handleSummarize}
        handleTranslate={handleTranslate}
        getLanguageName={getLanguageName}
      />

      <InputForm
        handleSubmit={handleSubmit}
        inputText={inputText}
        handleInputChange={handleInputChange}
        languages={languages}
        selectedLanguage={selectedLanguage}
        setSelectedLanguage={setSelectedLanguage}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        detectedLanguage={detectedLanguage}
      />
    </div>
  );
}