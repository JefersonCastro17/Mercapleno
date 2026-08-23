import App from "./App";
import Providers from "./providers";

export default function Root() {
  return (
    <Providers>
      <App />
    </Providers>
  );
}
