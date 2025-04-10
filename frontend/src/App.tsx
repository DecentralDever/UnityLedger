import React from 'react';
import './index.css'; // Global CSS
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import JoinCreatePool from "./pages/JoinCreatePool";
import ViewPool from "./pages/ViewPool";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { WalletProvider } from "./context/WalletProvider";
import { ThemeProvider } from "./context/ThemeProvider";

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <WalletProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/join-create" element={<JoinCreatePool />} />
              <Route path="/pool/:poolId" element={<ViewPool />} />
              <Route path="/pools" element={<div>All Pools</div>} />
              <Route path="/analytics" element={<div>Analytics</div>} />
              <Route path="/leaderboard" element={<div>Leaderboard</div>} />
              <Route path="/privacy" element={<div>Privacy Policy</div>} />
              <Route path="/terms" element={<div>Terms of Service</div>} />
              <Route path="*" element={<div>Page Not Found</div>} />
            </Routes>
          </Layout>
          <ToastContainer 
            position="bottom-right" 
            theme="colored" 
            toastClassName="font-sans"
            autoClose={4000}
            hideProgressBar={false}
            closeOnClick
            pauseOnHover
          />
        </Router>
      </WalletProvider>
    </ThemeProvider>
  );
};

export default App;