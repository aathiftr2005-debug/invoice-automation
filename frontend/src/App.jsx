import { AnimatePresence, motion } from "framer-motion";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import AIChatComponent from "./components/AIChatComponent.jsx";
import InvoiceDashboard from "./components/InvoiceDashboard.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Analytics from "./pages/Analytics.jsx";
import InvoiceDetail from "./pages/InvoiceDetail.jsx";
import Invoices from "./pages/Invoices.jsx";
import Upload from "./pages/Upload.jsx";

const pageMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.24, ease: "easeOut" }
};

function Page({ children }) {
  return (
    <motion.main className="min-h-screen flex-1 p-4 md:p-8" {...pageMotion}>
      {children}
    </motion.main>
  );
}

export default function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen overflow-hidden bg-cleanWhite text-deepBlack">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(180deg,#FFFFFF_0%,#FFF7D1_48%,#FFFFFF_100%)]" />
      <div className="relative flex min-h-screen flex-col md:flex-row">
        <Sidebar />
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Navigate to="/upload" replace />} />
            <Route path="/upload" element={<Page><Upload /></Page>} />
            <Route path="/invoices" element={<Page><Invoices /></Page>} />
            <Route path="/invoices/:id" element={<Page><InvoiceDetail /></Page>} />
            <Route path="/analytics" element={<Page><Analytics /></Page>} />
            <Route path="/chat" element={<Page><AIChatComponent /><InvoiceDashboard /></Page>} />
          </Routes>
        </AnimatePresence>
      </div>
    </div>
  );
}
