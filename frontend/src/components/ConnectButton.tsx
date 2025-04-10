import React, { useState } from "react";
import { useWallet } from "../context/WalletProvider";
import { Wallet, LogOut, ChevronDown } from "lucide-react";

const ConnectButton: React.FC = () => {
  const { account, connect, disconnect, isConnecting } = useWallet();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setIsDropdownOpen(false);
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="relative">
      {account ? (
        <>
          <button
            onClick={toggleDropdown}
            className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium py-2 px-4 rounded-lg transition-colors"
          >
            <Wallet size={16} />
            <span>{formatAddress(account)}</span>
            <ChevronDown size={16} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 animate-fadeInUp">
              <div className="py-1">
                <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100">
                  Connected as
                  <div className="font-mono text-gray-800 mt-1 break-all">
                    {account}
                  </div>
                </div>
                
                <a
                  href={`https://etherscan.io/address/${account}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  View on Explorer
                </a>
                
                <button
                  onClick={handleDisconnect}
                  className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={16} className="mr-2" />
                  Disconnect
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <Wallet size={16} />
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      )}
    </div>
  );
};

export default ConnectButton;
