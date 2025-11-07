import React, { useEffect, useState, useCallback } from "react";
import { ethers } from "ethers";
import { Coins, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";

const UltBalanceAndClaim = ({ poolId }) => {
  const [ultBalance, setUltBalance] = useState("0");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [claiming, setClaiming] = useState(false);
  const [contractAddress, setContractAddress] = useState(null);

  // Get the correct ULT token address for the current network
  const getUltTokenAddress = useCallback(async () => {
    if (!window.ethereum) return null;

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);

      // Network-specific ULT token addresses
      const addresses = {
        50312: "0x2Da2331B2a0E669785e8EAAadc19e63e20E19E5f", // Somnia
        4202: "0x9C6adb7DC4b27fbFe381D726606248Ad258F4228"  // Lisk Sepolia
      };

      return addresses[chainId] || addresses[4202]; // Default to Lisk Sepolia
    } catch (error) {
      console.error("Error getting network:", error);
      return "0x9C6adb7DC4b27fbFe381D726606248Ad258F4228"; // Fallback
    }
  }, []);

  // Verify contract exists and has balanceOf function
  const verifyContract = useCallback(async (address) => {
    if (!window.ethereum || !address || address === ethers.ZeroAddress) {
      return false;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const code = await provider.getCode(address);
      
      // If code is "0x", contract doesn't exist
      if (code === "0x") {
        console.warn(`No contract found at address ${address}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error verifying contract:", error);
      return false;
    }
  }, []);

  // Fetch ULT balance with proper error handling
  const fetchUltBalance = useCallback(async () => {
    if (!window.ethereum) {
      setError("Web3 wallet not detected");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get accounts
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const account = await signer.getAddress();

      if (!account) {
        setError("No wallet connected");
        setLoading(false);
        return;
      }

      // Get correct contract address for current network
      const ultAddress = await getUltTokenAddress();
      setContractAddress(ultAddress);

      if (!ultAddress) {
        setError("ULT token address not found");
        setLoading(false);
        return;
      }

      // Verify contract exists
      const contractExists = await verifyContract(ultAddress);
      if (!contractExists) {
        setError("ULT contract not deployed on this network");
        setLoading(false);
        return;
      }

      // Create contract instance with minimal ABI
      const ultAbi = ["function balanceOf(address) external view returns (uint256)"];
      const ultContract = new ethers.Contract(ultAddress, ultAbi, provider);

      // Fetch balance with timeout
      const balancePromise = ultContract.balanceOf(account);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), 10000)
      );

      const balance = await Promise.race([balancePromise, timeoutPromise]);
      
      // Format and set balance
      const formattedBalance = ethers.formatEther(balance);
      setUltBalance(formattedBalance);
      setError(null);
    } catch (err) {
      console.error("Error fetching ULT balance:", err);
      
      // Provide user-friendly error messages
      if (err.message.includes("could not decode result data")) {
        setError("Contract not responding - may not be deployed");
      } else if (err.message.includes("timeout")) {
        setError("Request timed out - network may be slow");
      } else if (err.code === "NETWORK_ERROR") {
        setError("Network error - check your connection");
      } else {
        setError("Failed to fetch balance");
      }
      
      // Set default balance on error
      setUltBalance("0");
    } finally {
      setLoading(false);
    }
  }, [getUltTokenAddress, verifyContract]);

  // Claim rewards function (placeholder - implement based on your contract)
  const handleClaim = useCallback(async () => {
    if (!window.ethereum || !poolId) {
      toast.error("Cannot claim rewards");
      return;
    }

    try {
      setClaiming(true);
      
      // TODO: Implement your actual claim logic here
      // This is a placeholder
      toast.info("Claim functionality coming soon!");
      
      // After successful claim, refresh balance
      await fetchUltBalance();
      
    } catch (error) {
      console.error("Error claiming rewards:", error);
      toast.error("Failed to claim rewards");
    } finally {
      setClaiming(false);
    }
  }, [poolId, fetchUltBalance]);

  // Initial fetch
  useEffect(() => {
    fetchUltBalance();
  }, [fetchUltBalance]);

  // Listen for account/network changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = () => {
      fetchUltBalance();
    };

    const handleChainChanged = () => {
      fetchUltBalance();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [fetchUltBalance]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 py-2">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        <span className="text-sm">Loading balance...</span>
      </div>
    );
  }

  // Error state with retry
  if (error) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
          <AlertCircle size={16} />
          <span className="text-sm font-medium">{error}</span>
        </div>
        <button
          onClick={fetchUltBalance}
          className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          <RefreshCw size={12} />
          Retry
        </button>
      </div>
    );
  }

  // Success state
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins size={16} className="text-yellow-500" />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Your ULT Balance
          </span>
        </div>
        <button
          onClick={fetchUltBalance}
          disabled={loading}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title="Refresh balance"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">
          {parseFloat(ultBalance).toFixed(3)}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">ULT</span>
      </div>

      {parseFloat(ultBalance) > 0 && (
        <button
          onClick={handleClaim}
          disabled={claiming}
          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:from-gray-400 disabled:to-gray-500 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 text-sm disabled:cursor-not-allowed"
        >
          {claiming ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Claiming...
            </div>
          ) : (
            "Claim Rewards"
          )}
        </button>
      )}

      {contractAddress && (
        <div className="text-xs text-gray-400 dark:text-gray-500 truncate">
          Contract: {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
        </div>
      )}
    </div>
  );
};

export default UltBalanceAndClaim;