// Web Audio API & HTML5 Audio Synthesizer for Break Timer Completion Ringtones
export const playTimerSound = (preset: string = "chime") => {
  try {
    if (preset === "custom") {
      const customData = localStorage.getItem("timerCustomAudioData");
      if (customData) {
        const audio = new Audio(customData);
        audio.play().catch((e) => console.error("Failed to play custom audio file:", e));
        return;
      }
    }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const audioCtx = new AudioContextClass();

    if (preset === "digital") {
      // Digital Beep (Double crisp synth beep)
      const playBeep = (freq: number, start: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "square";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + start + 0.12);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + start);
        osc.stop(audioCtx.currentTime + start + 0.12);
      };
      playBeep(880, 0);
      playBeep(1200, 0.14);
    } else if (preset === "bell") {
      // Soft Bell (Resonant sine bell with harmonic decay)
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc1.type = "sine";
      osc1.frequency.value = 587.33; // D5
      osc2.type = "sine";
      osc2.frequency.value = 1174.66; // D6 harmonic

      gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);

      osc1.start(audioCtx.currentTime);
      osc2.start(audioCtx.currentTime);
      osc1.stop(audioCtx.currentTime + 1.2);
      osc2.stop(audioCtx.currentTime + 1.2);
    } else if (preset === "classic") {
      // Classic Alarm (3 rapid alert pulses)
      [0, 0.18, 0.36].forEach((start) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sawtooth";
        osc.frequency.value = 750;
        gain.gain.setValueAtTime(0.18, audioCtx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + start + 0.1);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + start);
        osc.stop(audioCtx.currentTime + start + 0.1);
      });
    } else {
      // Melodic Chime (default arpeggio: C5, E5, G5, C6)
      const playTone = (freq: number, start: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.25, audioCtx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + start);
        osc.stop(audioCtx.currentTime + start + duration);
      };
      playTone(523.25, 0, 0.3);
      playTone(659.25, 0.25, 0.3);
      playTone(783.99, 0.5, 0.3);
      playTone(1046.5, 0.75, 0.8);
    }
  } catch (e) {
    console.error("Failed to play timer ringtone sound:", e);
  }
};
