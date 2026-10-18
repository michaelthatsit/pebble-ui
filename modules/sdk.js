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
export const MENU_CELL_BASIC_CELL_HEIGHT = 44;
export const MENU_CELL_ROUND_FOCUSED_SHORT_CELL_HEIGHT = 68;
export const MENU_CELL_ROUND_FOCUSED_TALL_CELL_HEIGHT = 84;
export const MENU_CELL_ROUND_UNFOCUSED_SHORT_CELL_HEIGHT = 24;
export const MENU_CELL_ROUND_UNFOCUSED_TALL_CELL_HEIGHT = 32;

// The 64 colours of the Pebble palette, by their SDK names, plus Clear.
export const GColor = Object.freeze({
	Clear: "transparent",
	Black: "#000000", OxfordBlue: "#000055", DukeBlue: "#0000AA", Blue: "#0000FF",
	DarkGreen: "#005500", MidnightGreen: "#005555", CobaltBlue: "#0055AA", BlueMoon: "#0055FF",
	IslamicGreen: "#00AA00", JaegerGreen: "#00AA55", TiffanyBlue: "#00AAAA", VividCerulean: "#00AAFF",
	Green: "#00FF00", Malachite: "#00FF55", MediumSpringGreen: "#00FFAA", Cyan: "#00FFFF",
	BulgarianRose: "#550000", ImperialPurple: "#550055", Indigo: "#5500AA", ElectricUltramarine: "#5500FF",
	ArmyGreen: "#555500", DarkGray: "#555555", Liberty: "#5555AA", VeryLightBlue: "#5555FF",
	KellyGreen: "#55AA00", MayGreen: "#55AA55", CadetBlue: "#55AAAA", PictonBlue: "#55AAFF",
	BrightGreen: "#55FF00", ScreaminGreen: "#55FF55", MediumAquamarine: "#55FFAA", ElectricBlue: "#55FFFF",
	DarkCandyAppleRed: "#AA0000", JazzberryJam: "#AA0055", Purple: "#AA00AA", VividViolet: "#AA00FF",
	WindsorTan: "#AA5500", RoseVale: "#AA5555", Purpureus: "#AA55AA", LavenderIndigo: "#AA55FF",
	Limerick: "#AAAA00", Brass: "#AAAA55", LightGray: "#AAAAAA", BabyBlueEyes: "#AAAAFF",
	SpringBud: "#AAFF00", Inchworm: "#AAFF55", MintGreen: "#AAFFAA", Celeste: "#AAFFFF",
	Red: "#FF0000", Folly: "#FF0055", FashionMagenta: "#FF00AA", Magenta: "#FF00FF",
	Orange: "#FF5500", SunsetOrange: "#FF5555", BrilliantRose: "#FF55AA", ShockingPink: "#FF55FF",
	ChromeYellow: "#FFAA00", Rajah: "#FFAA55", Melon: "#FFAAAA", RichBrilliantLavender: "#FFAAFF",
	Yellow: "#FFFF00", Icterine: "#FFFF55", PastelYellow: "#FFFFAA", White: "#FFFFFF",
});

// A colour's channels as the display's levels (0..3), for blending by hand.
export function colorLevels(color) {
	return [1, 3, 5].map(i => Math.round(parseInt(color.substr(i, 2), 16) / 85));
}

// A colour from levels, blended towards black by `coverage` (0..1) in those levels.
export function blendToBlack(levels, coverage) {
	let color = "#";
	for (const level of levels) {
		const value = Math.round(level * (1 - coverage)) * 85;
		color += (value < 16 ? "0" : "") + value.toString(16);
	}
	return color;
}

// System fonts, as Piu names them (the firmware's exact sizes only).
export const FONT_KEY = Object.freeze({
	GOTHIC_14: "14px Gothic",
	GOTHIC_14_BOLD: "bold 14px Gothic",
	GOTHIC_18: "18px Gothic",
	GOTHIC_18_BOLD: "bold 18px Gothic",
	GOTHIC_24: "24px Gothic",
	GOTHIC_24_BOLD: "bold 24px Gothic",
	GOTHIC_28: "28px Gothic",
	GOTHIC_28_BOLD: "bold 28px Gothic",
	BITHAM_30_BLACK: "black 30px Bitham",
	BITHAM_42_BOLD: "bold 42px Bitham",
	BITHAM_42_LIGHT: "light 42px Bitham",
	ROBOTO_CONDENSED_21: "condensed 21px Roboto",
	DROID_SERIF_28_BOLD: "bold 28px DroidSerif",
});

// On these displays the firmware substitutes larger fonts for two SDK defaults (measured).
export const TEXT_LAYER_DEFAULT_FONT = FONT_KEY.GOTHIC_18_BOLD;
export const STATUS_BAR_FONT = FONT_KEY.GOTHIC_18;

// Piu draws a Pebble font (cap offset - 1) px above where graphics_draw_text
// puts it for the same y (piuView.c, PiuViewDrawString). These top margins put
// the glyphs back where a TextLayer has them. Measured for the Gothic family;
// the regular 24 and 28 are assumed to match their bold weights.
export const TEXT_TOP_INSET = Object.freeze({
	[FONT_KEY.GOTHIC_14]: 4,
	[FONT_KEY.GOTHIC_14_BOLD]: 4,
	[FONT_KEY.GOTHIC_18]: 2,
	[FONT_KEY.GOTHIC_18_BOLD]: 2,
	[FONT_KEY.GOTHIC_24]: 4,
	[FONT_KEY.GOTHIC_24_BOLD]: 4,
	[FONT_KEY.GOTHIC_28]: 5,
	[FONT_KEY.GOTHIC_28_BOLD]: 5,
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
