import { Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "./components/Navbar";
import DashboardNavbar from "./components/DashboardNavbar";
import Footer from "./components/Footer";
import ChatbotWidget from "./components/ChatbotWidget";
import CalculatorWidget from "./components/CalculatorWidget";
import Home from "./pages/Home";
import About from "./pages/About";
import Competition from "./pages/Competition";
import Schools from "./pages/Schools";
import Materials from "./pages/Materials";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
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
import Tuition from "./pages/Tuition";
import { applySavedTheme, readSavedTheme, applyTheme, THEME_EVENT } from "./theme";

export default function App() {
  const location = useLocation();

  // Routes that belong to a logged-in dashboard — these show the dashboard
  // navbar instead of the public website navbar.
  const DASHBOARD_ROUTES = [
    "/dashboard",
    "/exam",
    "/contests",
    "/student-review",
    "/settings",
    "/support",
    "/school-dashboard",
    "/parent-dashboard",
    "/owner-dashboard",
  ];
  const isDashboardPath =
    DASHBOARD_ROUTES.some((r) => location.pathname === r) ||
    location.pathname.startsWith("/parent-dashboard/");

  useEffect(() => {
    // Dashboard theme colour (saved in localStorage by the Settings/dashboard picker)
    applySavedTheme();
    const onChange = () => {
      applyTheme(readSavedTheme(), false);
    };
    window.addEventListener(THEME_EVENT, onChange);
    return () => window.removeEventListener(THEME_EVENT, onChange);
  }, []);

  return (
    <div className="flex flex-col min-h-full flex-1">
      {isDashboardPath ? <DashboardNavbar /> : <Navbar />}
      <div className="flex-1 page-enter">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/competition" element={<Competition />} />
          <Route path="/schools" element={<Schools />} />
          <Route path="/materials" element={<Materials />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/exam" element={<Exam />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/contests" element={<Contests />} />
          <Route path="/tuition" element={<Tuition />} />
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
      {!isDashboardPath && <Footer />}
      <ChatbotWidget />
      <CalculatorWidget />
    </div>
  );
}
