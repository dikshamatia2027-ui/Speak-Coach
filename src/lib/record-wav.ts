/** Browser-only microphone capture producing a complete, decodable WAV file. */
export function encodeWav(chunks: readonly Float32Array[], sampleRate: number): Blob {
  const length = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const bytes = new ArrayBuffer(44 + length * 2);
  const view = new DataView(bytes);
  const tag = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
  };
  tag(0, "RIFF");
  view.setUint32(4, 36 + length * 2, true);
  tag(8, "WAVE");
  tag(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  tag(36, "data");
  view.setUint32(40, length * 2, true);
  let offset = 44;
  for (const chunk of chunks)
    for (const value of chunk) {
      const sample = Math.max(-1, Math.min(1, value));
      view.setInt16(offset, sample * (sample < 0 ? 32768 : 32767), true);
      offset += 2;
    }
  return new Blob([bytes], { type: "audio/wav" });
}

export type Recorder = {
  analyser: AnalyserNode;
  setPaused: (paused: boolean) => void;
  stop: () => Promise<File>;
  cancel: () => void;
};

const TARGET_RATE = 16000;

function downsample(input: Float32Array, from: number): Float32Array {
  if (from <= TARGET_RATE) return new Float32Array(input);
  const ratio = from / TARGET_RATE;
  const out = new Float32Array(Math.floor(input.length / ratio));
  for (let i = 0; i < out.length; i++) out[i] = input[Math.floor(i * ratio)] ?? 0;
  return out;
}

export async function startRecording(): Promise<Recorder> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true },
  });
  let context: AudioContext | undefined;
  try {
    context = new AudioContext();
    await context.resume();
    const ctx = context;
    const rate = ctx.sampleRate;
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    const node = ctx.createScriptProcessor(4096, 1, 1);
    const chunks: Float32Array[] = [];
    let paused = false;
    node.onaudioprocess = (e) => {
      if (!paused) chunks.push(downsample(e.inputBuffer.getChannelData(0), rate));
    };
    source.connect(node);
    node.connect(ctx.destination);
    let done = false;
    const teardown = () => {
      done = true;
      stream.getTracks().forEach((t) => t.stop());
      node.onaudioprocess = null;
      node.disconnect();
      source.disconnect();
      void ctx.close();
    };
    return {
      analyser,
      setPaused: (p) => {
        paused = p;
      },
      cancel: () => {
        if (!done) teardown();
      },
      async stop() {
        if (done) throw new Error("Recording already stopped");
        teardown();
        const blob = encodeWav(chunks, Math.min(rate, TARGET_RATE));
        if (blob.size < 8192) throw new Error("Recording was too short — please record again.");
        return new File([blob], "recording.wav", { type: "audio/wav" });
      },
    };
  } catch (error) {
    stream.getTracks().forEach((t) => t.stop());
    await context?.close();
    throw error;
  }
}
