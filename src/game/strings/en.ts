/**
 * All user-facing English strings, in one place for easy review and future
 * localisation. Import `EN` and reference keys rather than hardcoding copy.
 */
export const EN = {
	/** Page + game title and tagline. */
	title: "Caticorn Cave Rescue",
	tagline: "Free every caticorn, then reach the glowing exit. Mind the pits!",
	metaDescription:
		"Save the caticorns trapped in the cave! A PixiJS platformer.",

	/** Start / character-select screen. */
	chooseHero: "Choose your hero",
	startButton: "Start rescue",
	/** Punchy one-liner mission shown big on the start screen. */
	instructionsHeadline: "Free the caticorns. Beat the cave. Be a hero!",
	/** Scannable how-to lines for the start screen: an icon + its text, rendered
	 * as an aligned two-column grid (icon gutter + wrapping copy). */
	instructions: [
		{
			icon: "🦄",
			text: "Free every caticorn (stomp the cages, hug the shackled ones), then dash to the glowing exit.",
		},
		{
			icon: "💀",
			text: "Stomp baddies, leap the pits, duck the ceiling spikes, dodge the falling poop.",
		},
		{
			icon: "🎵",
			text: "Boing off trampolines, grab flutes to heal, clear every cave to win!",
		},
	],
	/** Controls line, kept compact. */
	controlsHint:
		"Move: Arrows / WASD   ·   Jump + double-jump: Up / Space / W   ·   Pause: P",

	/** In-canvas HUD. */
	hudRescued: (rescued: number, total: number) => `Rescued ${rescued}/${total}`,
	hudScore: (score: number) => `Score ${score}`,
	/** Level readout, e.g. "The Shallows  ·  2/4". */
	hudLevel: (name: string, index: number, total: number) =>
		`${name}  ·  ${index}/${total}`,

	/** Win / lose overlay. */
	wonTitle: "All caticorns saved!",
	wonSub: "You cleared every cave. Hero of the realm.",
	/** Flawless-run badge shown on the win screen when all four feats hold. */
	flawlessTitle: "✨ FLAWLESS RESCUE ✨",
	flawlessSub:
		"Untouched, peaceful, sure-footed and clean. A perfect run, you absolute legend.",
	/** Heading above the per-achievement list on the win screen. */
	achievementsTitle: "Achievements earned",
	/** Individual end-screen achievements: icon + label for each feat held all run. */
	achievements: {
		noDamage: { icon: "🛡️", label: "Untouched — took no damage" },
		noKills: { icon: "☮️", label: "Pacifist — harmed no baddies" },
		noFalls: { icon: "🦶", label: "Sure-footed — never fell in a pit" },
		noPoop: { icon: "✨", label: "Squeaky clean — dodged every poo" },
	},
	lostTitle: "Out of lives",
	lostSub: (rescued: number) => `You rescued ${rescued} this run. Try again?`,
	playAgain: "Play again",
	returnToStart: "Return to start",
	/** Game-over summary shown on the start screen, e.g. "Game over - 4 caticorns saved in 1:23". */
	runSummary: (rescued: number, time: string) =>
		`Game over - ${rescued} caticorn${rescued === 1 ? "" : "s"} saved in ${time}. Pick a hero to try again!`,

	/** Touch control button labels / aria. */
	moveLeft: "Move left",
	moveRight: "Move right",
	jump: "Jump",

	/** Shown on portrait phones prompting the player to turn the device. */
	rotateHint: "Rotate your device to landscape to play",

	/** Fullscreen toggle. */
	fullscreen: "Fullscreen",
	exitFullscreen: "Exit",

	/** PWA install prompts. */
	/** Android/Chrome: text on the "Add to Home Screen" install toast button. */
	installPrompt: "Add to Home Screen",
	/** Android/Chrome: dismiss button on the install toast. */
	installDismiss: "Not now",
	/** iOS Safari: one-time hint shown when the game hasn't been added to the
	 * home screen. Tells the user how to use the Share sheet. */
	iosInstallHint: "Add to Home Screen via Share ⬆️ for the best experience",

	/** Footer controls line. */
	controlsFooter:
		"Controls: Arrow keys / WASD to move, Up / Space / W to jump. Bounce on trampolines, dodge baddies, avoid the poop!",

	/** Character display names (keyed by PlayerVariant id). */
	characters: {
		aubrey: "Aubrey",
		quinn: "Quinn",
		summer: "Summer",
		hallie: "Hallie",
	} as Record<string, string>,

	/** Level display names (keyed by internal level name). */
	levels: {
		"The Shallows": "The Shallows",
		"Crystal Hollow": "Crystal Hollow",
		"Bat Roost": "Bat Roost",
		"Dragon's Maw": "Dragon's Maw",
	} as Record<string, string>,
} as const;
