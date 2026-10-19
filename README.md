# Hot Seat

*Practice Makes Perfect.*

Hot Seat helps entrepreneurial women practice talking about their ideas, their work, and themselves. It puts users in realistic conversations with different audiences and gives them a short window to respond out loud. The goal is to make pitching feel more familiar before the real conversation happens.

The project grew out of a simple idea: having something valuable to say and feeling ready to say it are not always the same thing. Hot Seat gives women a place to rehearse, try a different approach, and build confidence through repetition. It can be used to prepare for an investor meeting, explain a business to a potential customer, or practice a personal introduction.

## How it works

Users start by describing what they are pitching, their background, and what they want to achieve. They can sign in with ChatGPT and save that information as a pitch profile, so they do not have to start from scratch each time.

Next, they choose up to five skills to focus on, such as clarity, concision, directness, impact, or storytelling. They also choose how many audience roles to practice with, from one to eight. Audiences include journalists, investors, customers, grant committees, recruiters, technical experts, nontechnical listeners, and young audiences.

Each role asks three questions. After a 10-second reading countdown, recording starts automatically. Answers have time limits of 30, 45, or 60 seconds to encourage users to adapt their message and think on their feet.

After each answer, users can listen to the recording, check or correct the transcript, and retry the question. They can also repeat a role or finish the session early. At the end, AI feedback reviews the available transcripts against the selected skills and suggests what to work on next.

## How it was built

The app uses **TypeScript** and **React**, with **Vinext** providing Next.js-compatible routing and server endpoints. **Vite** handles development and production builds. The interface combines **Tailwind CSS** with custom CSS, **shadcn/ui** and **Radix UI** controls, and **Lucide** icons. The visual design uses deep pink accents, off-white backgrounds, and restrained animation.

Audio recording runs in the browser through the **MediaRecorder API**. The **Web Audio API** powers the microphone input meter. Recorded answers are sent to the **OpenAI API**, where **GPT-4o mini Transcribe** converts speech to text. **GPT-4.1 mini** generates practice scenarios and reviews the transcripts for feedback. These requests run through server endpoints so the API key is not exposed in browser code.

Saved pitch profiles use **Cloudflare D1**, a SQLite database. **Drizzle** defines the schema and generates migrations; the profile endpoints use prepared D1 queries. The hosted app runs on **Cloudflare Workers** through **Sites**, with **Sign in with ChatGPT** identifying users and keeping saved profiles tied to their accounts.

Tests use the **Node.js test runner** to cover recording events, transcription failures, and ending a session early.

## Challenges

Recording reliably was one of the main challenges. Microphone permission alone did not guarantee that useful audio was being captured, and the original browser speech-recognition approach could leave users without a transcript. The recording flow now includes an input selector, a live microphone meter, checks for empty recordings, and transcription of the recorded audio rather than a separate browser speech service.

Another challenge was ending sessions cleanly. Finishing during an answer needs to stop the recording, collect its final audio, and wait for transcription before requesting feedback. The summary also needs to handle sessions with only a few answers—or none—without inventing scores.

## Current work and future directions

The current focus is improving reliability across browsers and microphone setups, and making the feedback more useful after short or incomplete sessions. These areas still need testing with people using their own devices.

Future directions include saving session history alongside pitch profiles, showing progress across repeated attempts, and offering more control over scenario difficulty. Feedback on pacing, pauses, and vocal delivery would also be useful, but would require audio analysis beyond the current transcript-based review.

For now, saved profiles persist across sessions, while recordings and session results remain available only in the current page session unless the user downloads their session notes. Feedback assesses the words in the transcript; it does not measure vocal confidence or delivery.
