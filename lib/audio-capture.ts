export type Recording = { blob: Blob; seconds: number };
export type Capture = { stop: () => void; cancel: () => void; result: Promise<Recording> };

// Each take owns its chunks and event handlers, including the final chunk emitted on stop.
export function captureAudio(stream: MediaStream, onStarted: () => void, Recorder: typeof MediaRecorder = MediaRecorder): Capture {
  const track = stream.getAudioTracks().find(t => t.readyState === 'live' && t.enabled);
  if (!track || track.muted) throw new Error('Your microphone is not sending audio. Check the selected input and try again.');
  const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'].find(type => Recorder.isTypeSupported(type));
  const recorder = new Recorder(stream, mimeType ? {mimeType} : undefined);
  const chunks: Blob[] = [];
  let started = 0, settled = false, resolve!: (take: Recording) => void, reject!: (error: Error) => void;
  const result = new Promise<Recording>((yes, no) => {resolve = yes; reject = no;});
  const cleanup = () => { track.removeEventListener('ended', disconnected); clearTimeout(stopTimeout); };
  let stopTimeout: ReturnType<typeof setTimeout> | undefined;
  const fail = (message: string) => {if (settled) return; settled = true; cleanup(); reject(new Error(message));};
  const disconnected = () => {fail('Your microphone disconnected during the answer. Reconnect it and retry.'); if(recorder.state !== 'inactive') recorder.stop();};
  track.addEventListener('ended', disconnected);
  recorder.ondataavailable = event => {if(event.data.size > 0) chunks.push(event.data);};
  recorder.onstart = () => {started = Date.now(); onStarted();};
  recorder.onerror = () => {fail('The browser could not record your audio. Retry with your microphone connected.'); if(recorder.state !== 'inactive') recorder.stop();};
  recorder.onstop = () => {
    if(settled) return;
    const blob = new Blob(chunks, {type: recorder.mimeType || chunks[0]?.type || mimeType || 'audio/webm'});
    if(!blob.size) {fail('No audio was captured. Check your microphone input and retry this question.'); return;}
    settled = true; cleanup(); resolve({blob, seconds: Math.max(0, (Date.now() - started) / 1000)});
  };
  try {recorder.start(250);} catch {fail('Recording could not start. Check your microphone and try again.');}
  return {
    result,
    stop() {if(settled || recorder.state === 'inactive') return; stopTimeout = setTimeout(() => fail('The recording did not finish. Please retry this question.'), 10000); recorder.stop();},
    cancel() {fail('Recording cancelled.'); if(recorder.state !== 'inactive') recorder.stop();}
  };
}

export function audioFilename(blob: Blob) {
  const type = blob.type.split(';')[0];
  return `answer.${type.includes('mp4') ? 'mp4' : type.includes('ogg') ? 'ogg' : type.includes('wav') ? 'wav' : 'webm'}`;
}

export async function transcribeAudio(blob: Blob) {
  if(!blob.size) throw new Error('No audio was captured. Retry this question.');
  const data = new FormData();
  data.append('file', blob, audioFilename(blob));
  const response = await fetch('/api/transcribe', {method:'POST', body:data, signal:AbortSignal.timeout(65000)});
  const result: any = await response.json();
  if(!response.ok) throw new Error(result.error || 'Transcription failed. Your recording is available to retry.');
  if(typeof result.text !== 'string' || !result.text.trim()) throw new Error('No speech was detected. Listen to the recording, then retry or add your transcript.');
  return result.text.trim() as string;
}
