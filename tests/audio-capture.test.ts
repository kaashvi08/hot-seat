import test from 'node:test';
import assert from 'node:assert/strict';
import {captureAudio,audioFilename,transcribeAudio} from '../lib/audio-capture.ts';
class Track extends EventTarget {readyState='live';enabled=true;muted=false;}
class FakeRecorder {
 static last:FakeRecorder;static supported='audio/webm;codecs=opus';static isTypeSupported(t:string){return t===this.supported}
 state='inactive';mimeType:string;ondataavailable:any;onstart:any;onerror:any;onstop:any;timeslice=0;
 constructor(_:unknown,options?:{mimeType:string}){this.mimeType=options?.mimeType||'audio/mp4';FakeRecorder.last=this}
 start(n:number){this.timeslice=n;this.state='recording';queueMicrotask(()=>this.onstart?.())}
 stop(){this.state='inactive';queueMicrotask(()=>{this.ondataavailable?.({data:new Blob(['final chunk'],{type:this.mimeType})});this.onstop?.()})}
}
const makeStream=(track=new Track())=>({getAudioTracks:()=>[track]}) as unknown as MediaStream;
test('waits for onstart and includes the final chunk emitted after stop',async()=>{let started=false;const c=captureAudio(makeStream(),()=>{started=true},FakeRecorder as any);assert.equal(started,false);await Promise.resolve();assert.equal(started,true);assert.equal(FakeRecorder.last.timeslice,250);FakeRecorder.last.ondataavailable({data:new Blob(['first chunk'])});c.stop();const r=await c.result;assert.equal(await r.blob.text(),'first chunkfinal chunk');assert.equal(audioFilename(r.blob),'answer.webm')});
test('supports mp4 recording when webm is unavailable',async()=>{FakeRecorder.supported='audio/mp4';const c=captureAudio(makeStream(),()=>{},FakeRecorder as any);await Promise.resolve();c.stop();assert.equal(audioFilename((await c.result).blob),'answer.mp4');FakeRecorder.supported='audio/webm;codecs=opus'});
test('rejects zero-byte recordings instead of accepting an empty answer',async()=>{const c=captureAudio(makeStream(),()=>{},FakeRecorder as any);await Promise.resolve();FakeRecorder.last.state='inactive';FakeRecorder.last.onstop();await assert.rejects(c.result,/No audio was captured/)});
test('rejects a disconnected microphone',async()=>{const track=new Track();const c=captureAudio(makeStream(track),()=>{},FakeRecorder as any);await Promise.resolve();track.dispatchEvent(new Event('ended'));await assert.rejects(c.result,/disconnected/)});
test('rejects a muted or disabled microphone before starting',()=>{const track=new Track();track.muted=true;assert.throws(()=>captureAudio(makeStream(track),()=>{},FakeRecorder as any),/not sending audio/)});
test('keeps audio available when transcription fails and accepts a retry',async()=>{const original=globalThis.fetch;const blob=new Blob(['audio'],{type:'audio/mp4'});try{globalThis.fetch=async(_url,options)=>{const file=(options!.body as FormData).get('file') as File;assert.equal(file.name,'answer.mp4');assert.equal(await file.text(),'audio');return Response.json({error:'Temporary failure'},{status:503})};await assert.rejects(transcribeAudio(blob),/Temporary failure/);globalThis.fetch=async()=>Response.json({text:' My pitch is clear. '});assert.equal(await transcribeAudio(blob),'My pitch is clear.')}finally{globalThis.fetch=original}});
test('does not turn an empty transcription into a successful answer',async()=>{const original=globalThis.fetch;try{globalThis.fetch=async()=>Response.json({text:''});await assert.rejects(transcribeAudio(new Blob(['audio'])),/No speech was detected/)}finally{globalThis.fetch=original}});
