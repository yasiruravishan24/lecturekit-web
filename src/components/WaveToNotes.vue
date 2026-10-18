<template>
  <!-- decorative: a sound wave that turns into notes (the idea of the product). SVG + CSS only, no files. -->
  <svg class="lk-wave" viewBox="0 0 380 210" role="presentation" aria-hidden="true" focusable="false">
    <!-- the sound wave -->
    <g class="bars">
      <rect v-for="(b, i) in bars" :key="i" :x="14 + i * 12" :y="105 - b.h / 2" width="6" :height="b.h" rx="3" :style="{ '--d': b.d, '--t': b.t }" />
    </g>
    <!-- the arrow from speech to notes -->
    <path class="flow" d="M186 105 H214" />
    <path class="head" d="M207 96 L218 105 L207 114" />
    <!-- the notes card -->
    <g class="card">
      <rect x="226" y="22" width="140" height="166" rx="16" />
      <rect class="title" x="244" y="42" width="72" height="9" rx="4.5" />
      <rect class="line l1" x="244" y="68" width="104" height="6" rx="3" />
      <rect class="line l2" x="244" y="84" width="88" height="6" rx="3" />
      <rect class="line l3" x="244" y="100" width="100" height="6" rx="3" />
      <rect class="line l4" x="244" y="116" width="64" height="6" rx="3" />
      <g class="tick"><circle cx="252" cy="152" r="9" /><path d="M247.5 152.5 L251 156 L257 148.5" /></g>
      <rect class="line l5" x="270" y="148" width="72" height="8" rx="4" />
    </g>
  </svg>
</template>

<script setup>
// heights and timing of the bars: fixed values, so the picture is the same every time
const bars = [28, 52, 38, 78, 56, 96, 64, 110, 72, 90, 50, 70, 34, 48].map((h, i) => ({ h, d: `${(i * 0.13).toFixed(2)}s`, t: `${(1.1 + (i % 4) * 0.22).toFixed(2)}s` }))
</script>

<style scoped>
.lk-wave { width: 100%; height: auto; display: block; }
.bars rect { fill: #fff; opacity: 0.9; transform-box: fill-box; transform-origin: center; animation: beat var(--t) ease-in-out var(--d) infinite alternate; }
@keyframes beat { from { transform: scaleY(0.35); } to { transform: scaleY(1); } }

.flow { fill: none; stroke: rgba(255, 255, 255, 0.85); stroke-width: 3; stroke-linecap: round; stroke-dasharray: 5 9; animation: flow 1.2s linear infinite; }
.head { fill: none; stroke: #fff; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
@keyframes flow { to { stroke-dashoffset: -28; } }

.card > rect:first-child { fill: #fff; filter: drop-shadow(0 10px 18px rgba(8, 43, 94, 0.35)); animation: float 5s ease-in-out infinite alternate; }
@keyframes float { from { transform: translateY(0); } to { transform: translateY(-4px); } }
.title { fill: #1976d2; }
.line { fill: #cfe0f5; transform-box: fill-box; transform-origin: left center; animation: write 4.8s ease-in-out infinite; }
.l1 { animation-delay: 0s; } .l2 { animation-delay: 0.35s; } .l3 { animation-delay: 0.7s; } .l4 { animation-delay: 1.05s; } .l5 { animation-delay: 1.5s; fill: #9fc3ee; }
@keyframes write { 0% { transform: scaleX(0); } 22%, 88% { transform: scaleX(1); } 100% { transform: scaleX(0); } }
.tick circle { fill: #21ba45; transform-box: fill-box; transform-origin: center; animation: pop 4.8s ease-in-out 1.3s infinite; }
.tick path { fill: none; stroke: #fff; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
@keyframes pop { 0%, 8% { transform: scale(0); } 18%, 88% { transform: scale(1); } 100% { transform: scale(0); } }

@media (prefers-reduced-motion: reduce) {
  .bars rect, .flow, .line, .tick circle, .card > rect:first-child { animation: none; }
  .bars rect { transform: scaleY(0.7); }
}
</style>
