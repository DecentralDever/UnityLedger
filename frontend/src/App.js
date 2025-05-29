import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import './index.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import JoinCreatePool from "./pages/JoinCreatePool";
import ViewPool from "./pages/ViewPool";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { WalletProvider } from "./context/WalletProvider";
import { ThemeProvider } from "./context/ThemeProvider";
import AllPools from "./pages/Allpools";
import Analytics from "./pages/Analytics";
import Leaderboard from "./pages/Leaderboard";
import MemberDashboard from "./pages/MemberDashboard";
import SwapInterface from "./pages/SwapInterface.jsx";
import ULTFaucet from "./pages/ULTFaucet";
import ULTStaking from "./pages/ULTStaking.jsx";


const App = () => {
    return (_jsx(ThemeProvider, { 
        children: _jsx(WalletProvider, { 
            children: _jsxs(Router, { 
                children: [
                    _jsx(Layout, { 
                        children: _jsxs(Routes, { 
                            children: [
                                _jsx(Route, { path: "/", element: _jsx(Dashboard, {}) }),
                                _jsx(Route, { path: "/join-create", element: _jsx(JoinCreatePool, {}) }),
                                _jsx(Route, { path: "/pool/:poolId", element: _jsx(ViewPool, {}) }),
                                _jsx(Route, { path: "/pools", element: _jsx(AllPools, {}) }),
                                _jsx(Route, { path: "/analytics", element: _jsx(Analytics, {}) }),
                                _jsx(Route, { path: "/leaderboard", element: _jsx(Leaderboard, {}) }),
                                _jsx(Route, { path: "/privacy", element: _jsx("div", { children: "Privacy Policy" }) }),
                                _jsx(Route, { path: "/terms", element: _jsx("div", { children: "Terms of Service" }) }),
                                _jsx(Route, { path: "/memberdashboard", element: _jsx(MemberDashboard, {}) }),
                                _jsx(Route, { path: "/swap", element: _jsx(SwapInterface, {}) }),
                                _jsx(Route, { path: "/faucet", element: _jsx(ULTFaucet, {}) }),
                                _jsx(Route, { path: "/stake", element: _jsx(ULTStaking, {}) }),
                                _jsx(Route, { path: "*", element: _jsx("div", { children: "Page Not Found" }) })
                            ] 
                        }) 
                    }),
                    _jsx(ToastContainer, { 
                        position: "bottom-right",
                        theme: "colored",
                        toastClassName: "font-sans",
                        autoClose: 4000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true
                    })
                ] 
            }) 
        }) 
    }));
};

export default App;