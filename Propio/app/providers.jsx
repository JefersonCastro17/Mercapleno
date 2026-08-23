import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

export default function Providers({ children }) {
  return (
    <BrowserRouter>
      <AuthProvider>{children}</AuthProvider>
    </BrowserRouter>
  );
}
