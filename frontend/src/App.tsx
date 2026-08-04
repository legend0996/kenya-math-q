import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ChatbotWidget from "./components/ChatbotWidget";
import CalculatorWidget from "./components/CalculatorWidget";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Exam from "./pages/Exam";
import Leaderboard from "./pages/Leaderboard";
import Contests from "./pages/Contests";
import Settings from "./pages/Settings";
import SupportPage from "./pages/Support";
import StudentReviewPage from "./pages/StudentReview";
import SchoolDashboard from "./pages/SchoolDashboard";
import ParentDashboard from "./pages/ParentDashboard";
import ParentChildDetail from "./pages/ParentChildDetail";
import ForgotPassword from "./pages/ForgotPassword";
import OwnerLogin from "./pages/OwnerLogin";
import OwnerDashboard from "./pages/owner-dashboard/OwnerDashboard";

export default function App() {
  return (
    <div className="flex flex-col min-h-full flex-1">
      <Navbar />
      <div className="flex-1 page-enter">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/exam" element={<Exam />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/contests" element={<Contests />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/student-review" element={<StudentReviewPage />} />
          <Route path="/school-dashboard" element={<SchoolDashboard />} />
          <Route path="/parent-dashboard" element={<ParentDashboard />} />
          <Route path="/parent-dashboard/child/:studentId" element={<ParentChildDetail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/owner-login-7843-secure" element={<OwnerLogin />} />
          <Route path="/owner-dashboard" element={<OwnerDashboard />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </div>
      <Footer />
      <ChatbotWidget />
      <CalculatorWidget />
    </div>
  );
}
