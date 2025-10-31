import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./components/LoginPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import MainLayout from "./layouts/MainLayout.jsx";
// sau này thêm Dashboard, NotFound,...

function App() {
  return (
    <>
     <RouterProvider router={router} />
    </>
  )
}

export default App;
