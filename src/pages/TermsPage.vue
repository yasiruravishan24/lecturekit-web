<template>
  <legal-document title="Terms &amp; Conditions" :toc="toc" :glance="glance"
                  lead="The rules for using Lecture Assistant, in plain language. By creating an account you agree to them.">
    <legal-section id="service" :n="1" title="What the service is">
      <p>Lecture Assistant turns a lecture recording, and optionally the lecture slides, into structured notes and a practice quiz. It is a research prototype built for a university degree project, run by a student for study and evaluation. It is not a commercial product.</p>
    </legal-section>

    <legal-section id="account" :n="2" title="Your account">
      <ul>
        <li>Give a real name and an email address you can read. We send a 6-digit code to confirm it.</li>
        <li>Keep your password to yourself. You are responsible for what happens under your account.</li>
        <li>You can delete your account at any time in Settings. This deletes everything you stored (see the <router-link :to="{ path: '/privacy', query: route.query }" class="lk-link">Privacy Policy</router-link>).</li>
      </ul>
    </legal-section>

    <legal-section id="files" :n="3" title="Your recordings and files">
      <ul>
        <li>You keep all rights to what you upload. You only allow us to process it to make your notes and quiz.</li>
        <li>Only upload recordings you are allowed to make and use. Many lecturers and institutions have rules about recording lectures, and the people in a recording may need to agree. Check before you record or upload.</li>
        <li>Do not upload anything unlawful, or confidential material you have no right to share.</li>
        <li>Recordings of a classroom can show other people. We blur faces in the replay, in screenshots and in everything sent to the AI service, but automatic blurring can miss a face, so get people's permission first.</li>
        <li>Your lectures are private to your account. Nobody else on the service can see them.</li>
      </ul>
    </legal-section>

    <legal-section id="ai" :n="4" title="Notes and quizzes are made by AI">
      <p>The notes and quiz questions are written automatically from the recording and slides. They can contain mistakes or leave things out. Use them as a study aid and check important facts against the lecture, the slides and your course materials. They do not replace your lecturer, and we make no promise about exam results.</p>
    </legal-section>

    <legal-section id="limits" :n="5" title="Fair use and limits">
      <ul>
        <li>You can process up to {{ limits.daily_limit }} lectures a day, and uploads have size limits (recordings up to {{ limits.max_recording_mb }} MB in total, slides up to {{ limits.max_slides_mb }} MB per file), and each account has {{ limits.max_storage_gb }} GB of storage. These limits keep the service usable and its cost under control.</li>
        <li>Do not try to break, overload or get around the service, use another person's account, or run it automatically in bulk.</li>
      </ul>
    </legal-section>

    <legal-section id="availability" :n="6" title="Availability and your data">
      <p>This is a prototype. It may change, be slow, go offline or be removed without notice. Your recordings (for replay), screenshots, notes and quizzes stay until you delete them. Download what you want to keep (Export on the lecture page), and do not rely on the service as your only copy.</p>
    </legal-section>

    <legal-section id="ending" :n="7" title="Ending your access">
      <p>We may suspend or remove an account that breaks these terms or harms the service. You can stop using the service and delete your account whenever you like.</p>
    </legal-section>

    <legal-section id="responsibility" :n="8" title="Responsibility">
      <p>The service is provided &ldquo;as is&rdquo;, without promises that it will be error-free or always available. As far as the law allows, we are not responsible for losses that come from using it, including lost data or decisions you make from the notes. Nothing in these terms limits rights you have by law that cannot be limited.</p>
    </legal-section>

    <legal-section id="changes" :n="9" title="Changes to these terms">
      <p>We may update these terms, and we will update this page when we do. If you keep using the service after a change, you accept the new terms.</p>
    </legal-section>

    <legal-section id="questions" :n="10" title="Questions">
      <p>For questions about these terms or your account, contact the person who gave you access to this service. See also our <router-link :to="{ path: '/privacy', query: route.query }" class="lk-link">Privacy Policy</router-link>.</p>
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
const limits = computed(() => auth.limits)
onMounted(() => { auth.loadConfig().catch(() => {}) })

const toc = [
  { id: 'service', title: 'What the service is' },
  { id: 'account', title: 'Your account' },
  { id: 'files', title: 'Your recordings and files' },
  { id: 'ai', title: 'Notes and quizzes are made by AI' },
  { id: 'limits', title: 'Fair use and limits' },
  { id: 'availability', title: 'Availability and your data' },
  { id: 'ending', title: 'Ending your access' },
  { id: 'responsibility', title: 'Responsibility' },
  { id: 'changes', title: 'Changes to these terms' },
  { id: 'questions', title: 'Questions' },
]

const glance = [
  'This is a research prototype for study, not a commercial product.',
  'Your lectures are private to your account, and you keep your rights to them. Faces of other people in recordings are blurred automatically, which is not perfect.',
  'Only upload recordings you are allowed to make. Notes and quizzes are made by AI, so check important facts.',
  'You can delete your account at any time and everything goes with it.',
]
</script>
