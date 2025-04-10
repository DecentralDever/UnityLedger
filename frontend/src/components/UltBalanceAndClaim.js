import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/components/UltBalanceAndClaim.tsx
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { useWallet } from "../context/WalletProvider";
import { useUnityLedgerContract } from "../services/contract";
import ultTokenAbi from "../abis/ULTTokenABI.json";
// Define a minimal ABI for ULT token (if you did not generate a full ABI)
// You may alternatively import the full ABI JSON from your build artifacts.
const ULT_ABI = ultTokenAbi;
const UltBalanceAndClaim = ({ poolId }) => {
    const { account, provider } = useWallet();
    const contract = useUnityLedgerContract(); // UnityLedger instance for claimYield()
    const [ultBalance, setUltBalance] = useState("0");
    const [ultSymbol, setUltSymbol] = useState("ULT");
    const [loadingBalance, setLoadingBalance] = useState(false);
    const [isClaiming, setIsClaiming] = useState(false);
    // Get the ULT token contract address from env
    const ultTokenAddress = import.meta.env.VITE_ULT_CONTRACT_ADDRESS;
    // Function to fetch the user's ULT balance
    const fetchUltBalance = async () => {
        if (!provider || !account || !ultTokenAddress)
            return;
        setLoadingBalance(true);
        try {
            const ultContract = new ethers.Contract(ultTokenAddress, ULT_ABI, provider);
            const balance = await ultContract.balanceOf(account);
            const decimals = await ultContract.decimals();
            const formattedBalance = ethers.formatUnits(balance, decimals);
            setUltBalance(formattedBalance);
            const symbol = await ultContract.symbol();
            setUltSymbol(symbol);
        }
        catch (error) {
            console.error("Error fetching ULT balance:", error);
            toast.error("Error fetching ULT balance");
        }
        setLoadingBalance(false);
    };
    useEffect(() => {
        fetchUltBalance();
    }, [account, provider, ultTokenAddress]);
    // Handle yield claim via UnityLedger contract
    const handleClaimYield = async () => {
        if (!contract || !poolId) {
            toast.error("Contract not connected or poolId missing");
            return;
        }
        setIsClaiming(true);
        try {
            // Call claimYield on the UnityLedger contract, converting poolId to a number
            const tx = await contract.claimYield(Number(poolId));
            toast.info("Claiming yield...");
            await tx.wait();
            toast.success("Yield claimed successfully");
            // Refresh the ULT balance after claim
            fetchUltBalance();
        }
        catch (error) {
            console.error("Error claiming yield:", error);
            toast.error("Error claiming yield: " + error.message);
        }
        setIsClaiming(false);
    };
    return (_jsxs("div", { className: "max-w-md mx-auto bg-white dark:bg-gray-800 p-6 rounded shadow", children: [_jsx("h2", { className: "text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200", children: "Your ULT Balance" }), loadingBalance ? (_jsx(motion.div, { className: "w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto", initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.5 } })) : (_jsxs("p", { className: "text-lg text-center text-gray-700 dark:text-gray-300", children: [ultBalance, " ", ultSymbol] })), _jsx(motion.button, { whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, onClick: handleClaimYield, disabled: isClaiming || loadingBalance, className: "w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium text-sm transition-colors", children: isClaiming ? "Claiming..." : "Claim Yield" })] }));
};
export default UltBalanceAndClaim;
