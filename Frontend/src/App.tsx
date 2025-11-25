import { RouterProvider } from "react-router-dom";
import { router } from "./app/routes";
import { AlertProvider } from "./shared/providers/AlertProvider";

export default function App() {
  // gitHub CI test 주석222
  return (
    <AlertProvider>
      <RouterProvider router={router} />
    </AlertProvider>
  );
}
