// The 64 colours of the Pebble palette, by their SDK names, plus Clear. Not in
// manifest.json: map "pebble-ui/colors" yourself when an app needs them all
// (about 2 kB of compiled code; pebble-ui/sdk's GColor has the common ones).
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

