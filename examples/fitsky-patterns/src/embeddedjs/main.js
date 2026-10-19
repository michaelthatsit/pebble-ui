// Fitsky patterns: the screens of thats-it-dev/fitsky-app's Pebble app, as
// pebble-ui windows with sample data. Verified against the C app on the
// emulators (see ../../README.md).
import WindowStack from "pebble-ui/WindowStack";

const App = Application.template($ => ({ behavior: new WindowStack }));

export default new App(
	{ View: "home" },
	{ commandListLength: 1024, displayListLength: 1024, touchCount: 0, pixels: screen.width * 4 },
);
