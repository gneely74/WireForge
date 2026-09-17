import { useEffect, useRef, useState } from "react";
import { useWireForgeStore } from "../store/wireforge-store.js";

export function useAudioSquawk() {
  const {
    squawkEnabled,
    squawkVolume,
    squawkRate,
    selectedVoiceURI,
    squawkChannels,
    squawkQueue,
    popSquawkMessage,
    isSquawkPlaying,
    setIsSquawkPlaying,
  } = useWireForgeStore();

  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const isSpeakingRef = useRef(false);

  // Load available system voices
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // Process squawk queue
  useEffect(() => {
    if (!squawkEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    if (isSpeakingRef.current || squawkQueue.length === 0) {
      return;
    }

    const nextMsg = popSquawkMessage();
    if (!nextMsg) return;

    // Verify channel permission
    if (nextMsg.category === "flow" && !squawkChannels.flow) return;
    if (nextMsg.category === "halt" && !squawkChannels.halts) return;
    if (nextMsg.category !== "flow" && nextMsg.category !== "halt" && !squawkChannels.news) return;

    isSpeakingRef.current = true;
    setIsSquawkPlaying(true);

    const utterance = new SpeechSynthesisUtterance(nextMsg.text);
    utterance.volume = squawkVolume;
    utterance.rate = squawkRate;

    // Pick selected voice or preferred English voice
    if (selectedVoiceURI) {
      const found = availableVoices.find((v) => v.voiceURI === selectedVoiceURI);
      if (found) utterance.voice = found;
    } else {
      const preferred = availableVoices.find(
        (v) => (v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Samantha") || v.name.includes("Google")))
      );
      if (preferred) utterance.voice = preferred;
    }

    utterance.onend = () => {
      isSpeakingRef.current = false;
      setIsSquawkPlaying(false);
    };

    utterance.onerror = () => {
      isSpeakingRef.current = false;
      setIsSquawkPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [
    squawkQueue,
    squawkEnabled,
    squawkVolume,
    squawkRate,
    selectedVoiceURI,
    squawkChannels,
    availableVoices,
    popSquawkMessage,
    setIsSquawkPlaying,
  ]);

  const testSquawk = (text = "WireForge live audio squawk test. All systems operational.") => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = squawkVolume;
    utterance.rate = squawkRate;
    window.speechSynthesis.speak(utterance);
  };

  return {
    availableVoices,
    testSquawk,
  };
}
