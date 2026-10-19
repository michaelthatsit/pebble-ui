// The C SDK's defines for the platforms Alloy runs on (emery, gabbro), the
// system colours and fonts, and the corrections that make Piu text land where
// the firmware's TextLayer puts it. Values marked "measured" were read off the
// C SDK on the emulators, pixel by pixel.
export const ROUND = screen.round;
export const COLOR = screen.color;
export const PBL_IF_COLOR_ELSE = (color, bw) => COLOR ? color : bw;
export const PBL_IF_ROUND_ELSE = (round, rect) => ROUND ? round : rect;

export const ACTION_BAR_WIDTH = PBL_IF_ROUND_ELSE(40, 34);
export const STATUS_BAR_LAYER_HEIGHT = 20;

// The colours the SDK's own UI uses, by their SDK names (pebble-ui/colors has
// all 64 of the palette; it costs 2 kB of compiled code, so it is opt-in).
export const GColor = Object.freeze({
	Clear: "transparent",
	Black: "#000000", DarkGray: "#555555", LightGray: "#AAAAAA", White: "#FFFFFF",
	Red: "#FF0000", DarkCandyAppleRed: "#AA0000", Yellow: "#FFFF00", JaegerGreen: "#00AA55", BlueMoon: "#0055FF",
});

// A colour's channels as the display's levels (0..3), for blending by hand.
export function colorLevels(color) {
	return [1, 3, 5].map(i => Math.round(parseInt(color.substr(i, 2), 16) / 85));
}

// A colour from levels, blended by `coverage` (0..1) towards another's levels
// (black by default), in the display's levels.
export function blendToBlack(levels, coverage, towards = [0, 0, 0]) {
	let color = "#";
	for (let i = 0; i < 3; i++) {
		const value = Math.round(levels[i] + (towards[i] - levels[i]) * coverage) * 85;
		color += (value < 16 ? "0" : "") + value.toString(16);
	}
	return color;
}

// System fonts, as Piu names them (the firmware's exact sizes only). The Gothic
// family, which the SDK's UI uses; the others follow the same naming ("bold
// 26px Leco", "42px Leco", "black 30px Bitham", "bold 42px Bitham", "condensed
// 21px Roboto", "bold 28px DroidSerif"); pebble-ui/StatsScreen has the LECO ones.
export const FONT_KEY = Object.freeze({
	GOTHIC_14: "14px Gothic",
	GOTHIC_14_BOLD: "bold 14px Gothic",
	GOTHIC_18: "18px Gothic",
	GOTHIC_18_BOLD: "bold 18px Gothic",
	GOTHIC_24: "24px Gothic",
	GOTHIC_24_BOLD: "bold 24px Gothic",
	GOTHIC_28: "28px Gothic",
	GOTHIC_28_BOLD: "bold 28px Gothic",
});

// On these displays the firmware substitutes larger fonts for two SDK defaults
// (measured): a TextLayer's default is Gothic 18 Bold, the status bar's Gothic 18.

// Piu draws a Pebble font (cap offset - 1) px above where graphics_draw_text
// puts it for the same y (piuView.c, PiuViewDrawString). These top margins put
// the glyphs back where a TextLayer has them. Measured against the C SDK for
// Gothic 14, 14 Bold, 18, 18 Bold, 24 Bold, 28 Bold and three LECO fonts; the
// regular 24 and 28 are assumed to match their bold weights.
export const TEXT_TOP_INSET = Object.freeze({
	[FONT_KEY.GOTHIC_14]: 2,
	[FONT_KEY.GOTHIC_14_BOLD]: 2,
	[FONT_KEY.GOTHIC_18]: 2,
	[FONT_KEY.GOTHIC_18_BOLD]: 2,
	[FONT_KEY.GOTHIC_24]: 4,
	[FONT_KEY.GOTHIC_24_BOLD]: 4,
	[FONT_KEY.GOTHIC_28]: 5,
	[FONT_KEY.GOTHIC_28_BOLD]: 5,
	"bold 20px Leco": 3,
	"bold 26px Leco": 4,
	"42px Leco": 8,
});

// A TextLayer's text: the text box starts at the content's top edge, as
// graphics_draw_text draws it. Use with a Label or Text whose `top` is the
// TextLayer's frame top.
export function textLayerStyle(font, color = GColor.Black, horizontal = "left") {
	return new Style({ font, color, horizontal, vertical: "top", top: TEXT_TOP_INSET[font] ?? 0 });
}

// A GBitmap resource (package.json resources.media, IDs from 1 in order) as a
// skin of its own size, drawn with its transparency. The bitmap lives in the
// app heap while the skin is referenced: make these per window, not per module.
export function bitmapSkin(id) {
	const texture = new Texture(id);
	return new Skin({ texture, width: texture.width, height: texture.height });
}

export function solidSkin(color) {
	return new Skin({ fill: color });
}

// The time as the status bar shows it: 24 h with a leading zero, 12 h without.
export function clockString(date = new Date()) {
	let hours = date.getHours();
	const minutes = date.getMinutes();
	if (watch.hour12)
		hours = (hours % 12) || 12;
	else if (hours < 10)
		hours = "0" + hours;
	return hours + ":" + (minutes < 10 ? "0" : "") + minutes;
}
