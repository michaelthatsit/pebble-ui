// The pattern list. Each row opens one of fitsky's screens with sample data.
// Windows are named by module, so each is loaded when first opened: every
// imported module stays resident, and the slot heap is finite.
import { GColor, FONT_KEY } from "pebble-ui/sdk";

// fitsky's colours beyond the SDK UI set (pebble-ui/colors has them all, at
// the cost of a kilobyte of slots this app does not have to spare).
const Palette = Object.assign({ IslamicGreen: "#00AA00", Orange: "#FF5500", VividCerulean: "#00AAFF", Purple: "#AA00AA", TiffanyBlue: "#00AAAA", ChromeYellow: "#FFAA00", KellyGreen: "#55AA00" }, GColor);
import Menu from "pebble-ui/Menu";
import WindowStack from "pebble-ui/WindowStack";

const CardMenu = "pebble-ui/cards", ActionMenu = "pebble-ui/ActionMenu", StatsScreen = "pebble-ui/StatsScreen";
const AdjustWindow = "pebble-ui/AdjustWindow", InfoScreen = "pebble-ui/InfoScreen", BarList = "pebble-ui/BarList";

const push = (View, data) => WindowStack.current.push(View, data);
const pop = () => WindowStack.current.pop();

// fitsky's workout types, categories and colours
const TYPES = [
	["Running", "Cardio", Palette.IslamicGreen], ["Cycling", "Cardio", Palette.Orange], ["Swimming", "Cardio", Palette.VividCerulean],
	["Walking", "Cardio", Palette.IslamicGreen], ["Weightlifting", "Strength", Palette.Purple], ["Bodyweight", "Strength", Palette.Purple],
	["Yoga", "Flexibility", Palette.TiffanyBlue], ["HIIT", "Intervals", Palette.Red], ["Sports", "Activity", Palette.ChromeYellow],
	["Stretching", "Flexibility", Palette.TiffanyBlue], ["Hiking", "Cardio", Palette.IslamicGreen],
].map(([title, subtitle, color]) => ({ title, subtitle, color }));

const adjust = { sets: 0, reps: 10, weight: 0 };
const number = (get, set, min = 0) => ({ text: () => String(get()), increment: () => set(get() + 1), decrement: () => { if (get() > min) set(get() - 1); } });

const WINDOWS = [
	{ title: "Workout cards", View: CardMenu, data: { items: TYPES, onSelect(index, item) {
		push(ActionMenu, { items: ["Start Workout", "Start Live"], background: item.color, onSelect(i, action) { console.log(`${item.title}: ${action.title}`); } });
	} } },
	{ title: "Action menu", View: ActionMenu, data: { items: ["Start Outdoor", "Start Indoor", "Live Outdoor", "Live Indoor"], background: Palette.IslamicGreen, onSelect(i, item) { console.log(item.title); } } },
	{ title: "Finish menu", View: ActionMenu, data: { items: ["Finish Workout"], background: Palette.DarkCandyAppleRed, onSelect() { console.log("finished"); } } },
	{ title: "Dashboard", View: StatsScreen, data: { sub: "0:02", corners: ["--", "0:00", "--:--", "0.0"] } },
	{ title: "Titled dashboard", View: StatsScreen, data: { title: "Freeform", sub: "0:02", corners: ["--", "0:02", "1", "--"], background: Palette.Purple } },
	{ title: "Adjust", View: AdjustWindow, data: { title: "Exercise", background: Palette.Purple, rows: [
		[{ label: "SETS", ...number(() => adjust.sets, v => adjust.sets = v) }, { label: "REPS", ...number(() => adjust.reps, v => adjust.reps = v, 1) }],
		[{ label: "WEIGHT", text: () => adjust.weight ? (adjust.weight % 1 ? adjust.weight.toFixed(1) : String(adjust.weight)) : "0", increment: () => adjust.weight += 2.5, decrement: () => adjust.weight = Math.max(0, adjust.weight - 2.5) }],
	], onComplete() { console.log(`sets ${adjust.sets} reps ${adjust.reps} weight ${adjust.weight}`); pop(); } } },
	{ title: "HR zones", View: BarList, data: { title: "Heart Rate Zones", rows: [Palette.VividCerulean, Palette.KellyGreen, Palette.Purple, Palette.ChromeYellow, Palette.Red].map((color, i) => ({ label: "", value: 0, text: "0:00", color })) } },
	{ title: "Summary", View: InfoScreen, data: { background: Palette.IslamicGreen, lines: [
		{ text: "Workout Complete", font: FONT_KEY.GOTHIC_24_BOLD, top: 12, height: 28 },
		{ text: "Running  0:10", font: FONT_KEY.GOTHIC_18_BOLD, top: 44, height: 24 },
		{ text: "0.0 km  0 steps\nHR avg 0", font: FONT_KEY.GOTHIC_18, top: 72, height: 48 },
	], status: "Post failed" } },
	{ title: "Interval", View: InfoScreen, data: { background: Palette.Red, lines: [
		{ text: "Burpees", font: FONT_KEY.GOTHIC_24_BOLD, top: 16, height: 32 },
		{ text: "Round 1 of 8", font: FONT_KEY.GOTHIC_18, top: 50, height: 24 },
		{ text: "WORK", font: FONT_KEY.GOTHIC_24_BOLD, top: 80, height: 28 },
		{ text: "0:27 / 0:30", font: FONT_KEY.GOTHIC_28_BOLD, top: 112, height: 36 },
	] } },
	{ title: "Plans", View: "pebble-ui/subtitles", data: { items: [
		{ title: "Freeform", subtitle: "No plan — log sets freely" }, { title: "Push Day", subtitle: "5 exercises" }, { title: "Legs", subtitle: "4 exercises" }, { title: "Core", subtitle: "3 exercises" },
	], onSelect(i, item) { console.log(item.title); } } },
];

export default class Home extends Menu {
	constructor() {
		super({ items: WINDOWS, onSelect(index, item) { push(item.View, item.data); } });
	}
}
