
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";
  import { GlobalDataProvider } from "./app/contexts/GlobalDataContext.tsx";

  createRoot(document.getElementById("root")!).render(
    <GlobalDataProvider>
      <App />
    </GlobalDataProvider>
  );
  