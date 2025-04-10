import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
const App = () => {
    return (_jsx(ThemeProvider, { children: _jsx(WalletProvider, { children: _jsxs(Router, { children: [_jsx(Layout, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Dashboard, {}) }), _jsx(Route, { path: "/join-create", element: _jsx(JoinCreatePool, {}) }), _jsx(Route, { path: "/pool/:poolId", element: _jsx(ViewPool, {}) }), _jsx(Route, { path: "/pools", element: _jsx("div", { children: "All Pools" }) }), _jsx(Route, { path: "/analytics", element: _jsx("div", { children: "Analytics" }) }), _jsx(Route, { path: "/leaderboard", element: _jsx("div", { children: "Leaderboard" }) }), _jsx(Route, { path: "/privacy", element: _jsx("div", { children: "Privacy Policy" }) }), _jsx(Route, { path: "/terms", element: _jsx("div", { children: "Terms of Service" }) }), _jsx(Route, { path: "*", element: _jsx("div", { children: "Page Not Found" }) })] }) }), _jsx(ToastContainer, { position: "bottom-right", theme: "colored", toastClassName: "font-sans", autoClose: 4000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true })] }) }) }));
};
export default App;
