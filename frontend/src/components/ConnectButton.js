import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useWallet } from "../context/WalletProvider";
import { Wallet, LogOut, ChevronDown } from "lucide-react";
const ConnectButton = () => {
    const { account, connect, disconnect, isConnecting } = useWallet();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const handleConnect = async () => {
        try {
            await connect();
        }
        catch (error) {
            console.error("Failed to connect wallet:", error);
        }
    };
    const handleDisconnect = async () => {
        try {
            await disconnect();
            setIsDropdownOpen(false);
        }
        catch (error) {
            console.error("Failed to disconnect wallet:", error);
        }
    };
    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };
    const formatAddress = (address) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };
    return (_jsx("div", { className: "relative", children: account ? (_jsxs(_Fragment, { children: [_jsxs("button", { onClick: toggleDropdown, className: "flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium py-2 px-4 rounded-lg transition-colors", children: [_jsx(Wallet, { size: 16 }), _jsx("span", { children: formatAddress(account) }), _jsx(ChevronDown, { size: 16, className: `transition-transform ${isDropdownOpen ? 'rotate-180' : ''}` })] }), isDropdownOpen && (_jsx("div", { className: "absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 animate-fadeInUp", children: _jsxs("div", { className: "py-1", children: [_jsxs("div", { className: "px-4 py-2 text-sm text-gray-500 border-b border-gray-100", children: ["Connected as", _jsx("div", { className: "font-mono text-gray-800 mt-1 break-all", children: account })] }), _jsx("a", { href: `https://etherscan.io/address/${account}`, target: "_blank", rel: "noopener noreferrer", className: "block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors", children: "View on Explorer" }), _jsxs("button", { onClick: handleDisconnect, className: "flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors", children: [_jsx(LogOut, { size: 16, className: "mr-2" }), "Disconnect"] })] }) }))] })) : (_jsxs("button", { onClick: handleConnect, disabled: isConnecting, className: "bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed", children: [_jsx(Wallet, { size: 16 }), isConnecting ? 'Connecting...' : 'Connect Wallet'] })) }));
};
export default ConnectButton;
