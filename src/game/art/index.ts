import { PLAYER_H, PLAYER_W } from "../types";

export {
	CATICORN_PALETTE_COUNT,
	CHARACTERS,
	drawCaticorn,
	drawGhost,
	drawLuke,
	drawPlayer,
	type PlayerVariant,
} from "./characters";
export { drawFirefly, drawParticle, drawRescueRing } from "./particles";
export {
	drawCage,
	drawExit,
	drawExitGlow,
	drawFlute,
	drawMonster,
	drawPoop,
	drawShackle,
	drawTrampoline,
} from "./props";
export {
	type BackgroundLayers,
	drawBackground,
	drawBackgroundLayers,
	drawDecor,
	drawFloorStrip,
	drawGlowCluster,
	drawGrassBlades,
	drawPlatform,
} from "./scenery";

// Reference the player dimensions so they stay in sync with the renderer scale.
void PLAYER_W;
void PLAYER_H;
