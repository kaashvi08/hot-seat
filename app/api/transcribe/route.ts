import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
export async function POST(req: Request) {
  if(!await getChatGPTUser()) return Response.json({error:'Sign in to transcribe your recordings.'},{status:401});
  if(req.headers.get('origin') !== new URL(req.url).origin) return Response.json({error:'Invalid origin'},{status:403});
  const key = (env as any).OPENAI_API_KEY;
  if(!key) return Response.json({error:'Transcription is not connected. Your recording is still available.'},{status:503});
  if(Number(req.headers.get('content-length') || 0) > 25 * 1024 * 1024) return Response.json({error:'The recording is too large. Please retry a shorter answer.'},{status:413});
  try {
    const body = await req.formData();
    const file = body.get('file');
    if(!(file instanceof File) || !file.size) return Response.json({error:'No audio was received. Retry this question.'},{status:400});
    if(file.size > 24 * 1024 * 1024) return Response.json({error:'The recording is too large. Please retry a shorter answer.'},{status:413});
    if(!/\.(webm|mp4|m4a|wav|ogg|mp3)$/i.test(file.name)) return Response.json({error:'This audio format is not supported.'},{status:400});
    const data = new FormData();
    data.append('file', file, file.name);
    data.append('model', 'gpt-4o-mini-transcribe');
    data.append('response_format', 'json');
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {method:'POST',headers:{Authorization:`Bearer ${key}`},body:data,signal:AbortSignal.timeout(55000)});
    if(!response.ok) {
      console.error('Transcription request failed', response.status);
      return Response.json({error:response.status === 429 ? 'Transcription is busy or the API usage limit was reached. Your audio is saved for retry.' : 'Transcription could not process this recording. Listen back, then retry transcription or record again.'},{status:502});
    }
    const transcript: any = await response.json();
    return Response.json({text:typeof transcript.text === 'string' ? transcript.text : ''});
  } catch {
    return Response.json({error:'Transcription timed out or was interrupted. Your recording is still available; try again.'},{status:503});
  }
}
