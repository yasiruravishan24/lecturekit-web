<template>
  <legal-document title="Privacy Policy" :toc="toc" :glance="glance"
                  lead="What Lecture Assistant stores about you, why, who else sees it, and how you can remove it. We keep only what the service needs.">
    <legal-section id="collect" :n="1" title="What we store">
      <ul>
        <li><strong>Account:</strong> your name, email address, a hashed password (we cannot read your password), the time you agreed to the terms, and whether your email is confirmed. If you sign in with Google we also store your Google account identifier.</li>
        <li><strong>Your lectures:</strong> the slides you upload, the text made from your recording (transcript, slide text), the notes and quiz questions, your quiz attempts and scores, and the recording itself in a replay copy (see section 4) with screenshots of the board and screen.</li>
        <li><strong>Technical logs:</strong> a line for each request with the time, address, result and your account number. Logs never contain your password, your files or what you typed. They are deleted after {{ logDays }} days.</li>
      </ul>
    </legal-section>

    <legal-section id="use" :n="2" title="What we use it for">
      <p>Only to run the service: to sign you in, to make your notes and quiz, to keep the daily limit, to keep the service secure and to fix problems. We do not sell your data, show advertising or build profiles about you.</p>
    </legal-section>

    <legal-section id="others" :n="3" title="Who else receives data">
      <ul>
        <li><strong>Speech to text, blurring faces and making the replay</strong> all run on our own server. Your audio and video as a whole are not sent to anyone else.</li>
        <li><strong>AI service (Anthropic, Claude):</strong> the transcript text and slide text of a lecture are sent there to write the notes and the quiz, and a limited number of still pictures taken from your video (faces blurred first) so it can read the board and screen. Audio, video files and your account details are not sent. Anthropic processes this under its own terms for business API use.</li>
        <li><strong>Email service:</strong> your email address and the message (confirmation code, welcome message) go through the email provider we use to send them.</li>
        <li><strong>Google:</strong> only if you choose &ldquo;Continue with Google&rdquo;, Google tells us your name and email address.</li>
        <li><strong>Hosting:</strong> the service runs on a server we control; the hosting provider keeps that server running.</li>
      </ul>
      <p>We do not share your data with anyone else unless the law requires it.</p>
    </legal-section>

    <legal-section id="keep" :n="4" title="How long we keep it">
      <ul>
        <li>Recordings: once your notes are ready, the server makes a replay copy with other people's faces blurred (the presenter's face, the person seen most in the video, stays clear) and then deletes the original upload. The replay and the screenshots stay until you delete the lecture or your account. Each account can keep up to {{ gb }} GB.</li>
        <li>Transcript, notes, quizzes and attempts: until you delete the lecture or your account.</li>
        <li>Delete a lecture, or your whole account (Settings), and its files and records are deleted straight away. Backups made by the operator can keep a copy until they are rotated out.</li>
      </ul>
    </legal-section>

    <legal-section id="cookies" :n="5" title="Cookies and similar storage">
      <p>We do not use cookies and we do not track you. Your browser keeps two small items for the app to work: your sign-in token and your light or dark mode choice. They stay on your device, and logging out removes the token.</p>
    </legal-section>

    <legal-section id="security" :n="6" title="Security">
      <p>The service uses HTTPS. Passwords are hashed. Every account can only see its own data, and links to a replay or a screenshot expire after a short time. No system is perfectly secure, so do not upload anything you could not accept being exposed.</p>
    </legal-section>

    <legal-section id="others-recorded" :n="7" title="Recording other people">
      <p>A lecture recording can include your lecturer and classmates. Faces are blurred automatically in screenshots and in the replay (where the presenter is left clear and everyone else is blurred) and before any picture is sent to the AI service. The detector is good but not perfect: a small, turned or covered face can be missed. You are responsible for having the right to record and upload it, and for following your institution's rules. See the <router-link :to="{ path: '/terms', query: route.query }" class="lk-link">Terms &amp; Conditions</router-link>.</p>
    </legal-section>

    <legal-section id="rights" :n="8" title="Your choices and rights">
      <ul>
        <li>See your data: it is on your lecture pages. Download notes with Export.</li>
        <li>Delete a lecture, or delete your account in Settings.</li>
        <li>Ask us to correct your details, or ask any question about this policy, by contacting the person who gave you access to the service.</li>
      </ul>
    </legal-section>

    <legal-section id="age" :n="9" title="Who can use it">
      <p>The service is meant for students and teachers. It is not meant for children under 13.</p>
    </legal-section>

    <legal-section id="changes" :n="10" title="Changes to this policy">
      <p>If this policy changes, we will update this page. Keep using the service only if you accept the new version.</p>
    </legal-section>
  </legal-document>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import LegalDocument from '../components/LegalDocument.vue'
import LegalSection from '../components/LegalSection.vue'

const auth = useAuthStore()
const route = useRoute()
const gb = computed(() => auth.limits.max_storage_gb)
const logDays = 14
onMounted(() => { auth.loadConfig().catch(() => {}) })

const toc = [
  { id: 'collect', title: 'What we store' },
  { id: 'use', title: 'What we use it for' },
  { id: 'others', title: 'Who else receives data' },
  { id: 'keep', title: 'How long we keep it' },
  { id: 'cookies', title: 'Cookies and similar storage' },
  { id: 'security', title: 'Security' },
  { id: 'others-recorded', title: 'Recording other people' },
  { id: 'rights', title: 'Your choices and rights' },
  { id: 'age', title: 'Who can use it' },
  { id: 'changes', title: 'Changes to this policy' },
]

const glance = [
  'Your recording stays on our server. Only text and a few still pictures (faces blurred first) go to the AI service that writes the notes.',
  'Faces of other people are blurred automatically in the replay and in screenshots.',
  'No advertising, no tracking, no selling of data, no cookies.',
  'You can delete any lecture, or your whole account, whenever you like.',
]
</script>
