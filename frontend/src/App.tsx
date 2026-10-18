import { AppProviders } from "./app/providers";
import { CockpitPage } from "./pages/cockpit";

export default function App() {
	return (
		<AppProviders>
			<CockpitPage />
		</AppProviders>
	);
}
