import './index.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.js";
import Dashboard from "./pages/Dashboard.js";
import JoinCreatePool from "./pages/JoinCreatePool.jsx";
import ViewPool from "./pages/ViewPool.js";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { WalletProvider } from "./context/WalletProvider.js";
import { ThemeProvider } from "./context/ThemeProvider.js";
import { useNetworkChangeHandler, useNetworkDebugger } from "./services/contract.js";
import AllPools from "./pages/Allpools.js";
import Analytics from "./pages/Analytics.jsx";
import Leaderboard from "./pages/Leaderboard.js";
import MemberDashboard from "./pages/MemberDashboard.jsx";
//import SwapInterface from "./pages/SwapInterface.jsx";
import ULTFaucet from "./pages/ULTFaucet.jsx";
import ULTStaking from "./pages/ULTStaking.jsx";

const App = () => {
    // Handle network changes
    useNetworkChangeHandler();
    useNetworkDebugger(); 

    return (
        <ThemeProvider>
            <WalletProvider>
                <Router>
                    <Layout>
                        <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/join-create" element={<JoinCreatePool />} />
                            <Route path="/pool/:poolId" element={<ViewPool />} />
                            <Route path="/pools" element={<AllPools />} />
                            <Route path="/analytics" element={<Analytics />} />
                            <Route path="/leaderboard" element={<Leaderboard />} />
                            <Route path="/privacy" element={<div>Privacy Policy</div>} />
                            <Route path="/terms" element={<div>Terms of Service</div>} />
                            <Route path="/memberdashboard" element={<MemberDashboard />} />
                            {/* <Route path="/swap" element={<SwapInterface />} /> */}
                            <Route path="/faucet" element={<ULTFaucet />} />
                            <Route path="/stake" element={<ULTStaking />} />
                            <Route path="*" element={<div>Page Not Found</div>} />
                        </Routes>
                    </Layout>
                    <ToastContainer 
                        position="bottom-right"
                        theme="colored"
                        toastClassName="font-sans"
                        autoClose={4000}
                        hideProgressBar={false}
                        closeOnClick={true}
                        pauseOnHover={true}
                    />
                </Router>
            </WalletProvider>
        </ThemeProvider>
    );
};

export default App;