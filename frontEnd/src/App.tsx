import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import ReminderForm from "./pages/ReminderForm";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/reminder" element={<ReminderForm />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;