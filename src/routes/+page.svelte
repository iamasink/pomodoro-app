<script lang="ts">
interface Times {
	work: number
	short: number
	long: number
}
const TIMES: Times = {
	work: 25 * 60,
	short: 5 * 60,
	long: 30 * 60,
}

type Phase = "work" | "short" | "long"
// Number of short breaks before a long break (default 3)
let shortBreaksBeforeLong = $state(3)

const getPhases = (shortBreaks: number): Phase[] => {
	const phases: Phase[] = []
	for (let i = 0; i < shortBreaks; i++) {
		phases.push("work", "short")
	}
	phases.push("work", "long")
	return phases
}

let PHASES: Phase[] = $derived(getPhases(shortBreaksBeforeLong))

$effect(() => {
	PHASES = getPhases(shortBreaksBeforeLong)
})

const PHASETIMES = $derived(PHASES.map((phase) => TIMES[phase]))
let phaseIndex = $state(0)
const currentPhase = $derived(PHASES[phaseIndex])
const currentPhaseTime = $derived(PHASETIMES[phaseIndex])

const phaseNames = { work: "Work", short: "Short Break", long: "Long Break" }
const phaseNamesShort = { work: "W", short: "S", long: "L" }
let phaseName = $derived(phaseNames[PHASES[phaseIndex]])
let phaseNameShort = $derived(phaseNamesShort[PHASES[phaseIndex]])

// this is the default time
// svelte-ignore state_referenced_locally
let time = $state(PHASETIMES[0])

let seconds = $derived(Math.abs(time) % 60)
let minutes = $derived(Math.floor(Math.abs(time) / 60))

let timestring = $derived(
	(time < 0 ? "-" : "")
		+ String(Math.abs(minutes)).padStart(2, "0")
		+ ":"
		+ String(Math.abs(seconds)).padStart(2, "0"),
)

let isTimerRunning = $state(false)

// save interval from setinterval
let interval = $state(0)

import { onMount } from "svelte"
let alarm: HTMLAudioElement

onMount(() => {
	alarm = new Audio("/miku.mp3")
	alarm.load()
})

$effect(() => {
	document.title = `${timestring} - ${phaseName} | Pomodoro Timer`
})

$effect(() => {
	if (time === 0 && isTimerRunning) {
		alarm.play().catch((e) => {
			console.warn("Alarm failed to play:", e)
		})
	}
})

function toggletimer() {
	if (isTimerRunning) {
		isTimerRunning = false
		if (interval) {
			clearInterval(interval)
			interval = 0
		}
	} else {
		isTimerRunning = true
		interval = setInterval(() => {
			time -= 1
		}, 1000)
	}
}

function nexttimer() {
	phaseIndex++
	if (phaseIndex >= PHASES.length) {
		phaseIndex = 0
	}
	time = currentPhaseTime
}

function nexttimercontinue() {
	phaseIndex++
	if (phaseIndex >= PHASES.length) {
		phaseIndex = 0
	}
	time += currentPhaseTime
	if (time < 0) {
		time = 1
	}
}

function nextphase() {
	phaseIndex++
	if (phaseIndex >= PHASES.length) {
		phaseIndex = 0
	}
	time = currentPhaseTime
}

function lastphase() {
	phaseIndex--
	if (phaseIndex < 0) {
		phaseIndex = PHASES.length - 1
	}
	time = currentPhaseTime
}

function changephase(phase: number) {
	phaseIndex = phase
	time = currentPhaseTime
}
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<div class="app">
	<!-- Backdrop for blur and dim effect -->
	<div id="backdrop">
		<div id="top" style="position: relative; z-index: 1">
			<div class="timercontainer">
				<!-- phase arrows and text -->
				<div class="phasetext">
					<button class="arrowbutton" onclick={lastphase}>←</button>
					<div style="flex: 1; text-align: center">
						<!--
							<span>
								Current Phase:
							</span>
						-->
						<span>
							{phaseNames[currentPhase]}
						</span>
					</div>
					<button class="arrowbutton" onclick={nextphase}>
						→
					</button>
				</div>

				<!-- phase lines -->
				<div style="display: flex; gap: 0.5rem">
					{#each PHASES as p, i}
						<div
							style="display: flex; flex-direction: column; align-items: center; margin: 0 2px"
							class="phaseline phaseline-{p} {i === phaseIndex ? 'active' : ''}"
						>
							<button title={phaseNames[p]} aria-label={phaseNames[p]} onclick={() => changephase(i)}>
								{phaseNamesShort[p]}
							</button>
							<small style="font-size: 0.6rem; color: #aaa">
								{i + 1}
							</small>
						</div>
					{/each}
				</div>

				<!-- time display -->
				<p class="timer">{timestring}</p>
				<!-- buttons -->
				<div id="timerbuttonscontainer">
					<button onclick={toggletimer}>{isTimerRunning ? "pause" : "start"}</button>
					<button
						onclick={() => {
							time += 50
						}}
					>
						add time
					</button>
					<button
						onclick={() => {
							time -= 50
						}}
					>
						remove time
					</button>
					<button
						onclick={() => {
							// set time to 5 s
							time = 5
						}}
					>
						skip
					</button>
				</div>
			</div>
			{#if time < 0}
				<div class="overlay">
					<div class="overlay-content">
						<p>{phaseName} is over!</p>
						<p class="timer">{timestring}</p>
						<p>next: {phaseNames[PHASES[(phaseIndex + 1) % PHASES.length]]}</p>
						<button onclick={nexttimer}>continue</button>
						<button onclick={nexttimercontinue}>continue from negative time</button>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- ------------- -->

	<div class="bottom">
		<p>hello offscreen!</p>
		<p>one day, there will be settings here..</p>
		<h1>Settings</h1>
		<div class="settings">
			<label for="shortBreaksBeforeLong">Short breaks before long</label>
			<input id="shortBreaksBeforeLong" type="number" min="1" max="10" bind:value={shortBreaksBeforeLong} style="width: 3rem; margin-left: 0.5rem" />
		</div>
	</div>
</div>

<style>
.app {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.overlay {
  position: fixed;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.6);
  width: 100%;
  height: 100%;
}

.overlay-content {
  background: rgb(32, 32, 32);
  padding: 2rem;
  border-radius: 0.5rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.phaseline {
  button {
    width: 2.5rem;
    height: 1rem;
    border-radius: 0.5rem;
    background: #4e4e4e;
    border: none;
    opacity: 1;
    cursor: pointer;
    transition: background 0.5s, border 0.2s, opacity 0.2s;
    font-size: 0.5rem;
    color: #fff;
  }
}

.phaseline-short > button {
  width: 1.5rem;
  opacity: 0.7;
}

.phaseline-long > button {
  width: 3rem;
  border: 2px solid gold;
  opacity: 0.9;
}

.phaseline.active > button {
  background: #fff;
  color: #4e4e4e;
}

div#backdrop {
  background-image: url("eternalseptember.jpg");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
div#top {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  position: relative;
  backdrop-filter: blur(2px) brightness(0.7);
}

.bottom {}

.timer {
  font-size: 4rem;
  font-family: "Fira Mono", monospace;
  margin: 2rem 0;
  letter-spacing: 0.1em;
  text-align: center;
}
.timercontainer {
  background: rgba(24, 24, 24, 0.85);
  border-radius: 1rem;
  padding: 2rem 2.5rem;
  box-shadow: 0 4px 32px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 350px;
  max-width: 95vw;
  margin: 2rem 0;
  position: relative;
  backdrop-filter: blur(8px);
}

.phasetext {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 400px;
  justify-content: center;
}

.arrowbutton {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #fff;
  padding: 0.2rem 0.7rem;
  border-radius: 0.5rem;
  transition: background 0.2s, color 0.2s;
  height: 100%;
}
.arrowbutton:hover {
  background: #fff;
  color: #333;
}

#timerbuttonscontainer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;

  button {
    margin: 0 0.5rem;
    padding: 0.5rem 1.2rem;
    font-size: 1rem;
    border-radius: 0.5rem;
    border: none;
    background: #333;
    color: #fff;
    cursor: pointer;
    transition: background 0.2s, color 0.2s;
  }
  button:hover {
    background: #fff;
    color: #333;
  }
}
</style>
