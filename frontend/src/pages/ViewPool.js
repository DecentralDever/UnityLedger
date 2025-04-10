import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/pages/ViewPool.tsx
import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useUnityLedgerContract } from "../services/contract";
import { useWallet } from "../context/WalletProvider";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { PieChart } from "lucide-react";
import { ethers } from "ethers";
import UltBalanceAndClaim from "../components/UltBalanceAndClaim";
const ViewPool = () => {
    const { poolId } = useParams();
    const contract = useUnityLedgerContract();
    const { account } = useWallet();
    const [pool, setPool] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isMember, setIsMember] = useState(false);
    const fetchPoolDetails = useCallback(async () => {
        if (!contract || !poolId)
            return;
        setLoading(true);
        try {
            // Fetch pool details using the contract's getPoolDetails function
            const details = await contract.getPoolDetails(Number(poolId));
            const fetchedPool = {
                id: BigInt(details[0].toString()),
                creator: details[1],
                contributionAmount: BigInt(details[2].toString()),
                cycleDuration: BigInt(details[3].toString()),
                maxMembers: BigInt(details[4].toString()),
                totalMembers: BigInt(details[5].toString()),
                currentCycle: BigInt(details[6].toString()),
                lastPayoutTime: BigInt(details[7].toString()),
                isActive: details[8],
                poolType: details.length > 9 ? details[9] : undefined,
                fee: details.length > 10 ? BigInt(details[10].toString()) : undefined,
            };
            setPool(fetchedPool);
            // Check if the current user is a member of the pool using getPoolMembers
            const members = await contract.getPoolMembers(Number(poolId));
            const joined = members.some((member) => member.wallet.toLowerCase() === account?.toLowerCase());
            setIsMember(joined);
        }
        catch (error) {
            console.error("Error fetching pool details:", error);
            toast.error("Error fetching pool details");
        }
        setLoading(false);
    }, [contract, poolId, account]);
    useEffect(() => {
        if (contract && poolId) {
            fetchPoolDetails();
        }
    }, [contract, poolId, fetchPoolDetails]);
    if (loading || !pool) {
        return (_jsx("div", { className: "flex justify-center items-center py-16", children: _jsx(motion.div, { className: "w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin", initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.5 } }) }));
    }
    // Convert contribution amount from wei to ETH and cycle duration from seconds to days
    const contributionEth = ethers.formatEther(pool.contributionAmount.toString());
    const cycleDurationDays = Number(pool.cycleDuration) / 86400;
    const apy = pool.fee ? pool.fee.toString() : "N/A";
    // Set button text based on whether the connected account is the creator (you may allow a different flow)
    const actionText = pool.creator.toLowerCase() === account?.toLowerCase() ? "Contribute" : "Join Pool";
    // Placeholder action handler – replace with actual join/contribute logic
    const handleAction = async () => {
        toast.info(`Executing "${actionText}" functionality...`);
        // Example:
        // if (!isMember) {
        //   await contract.joinPool(Number(poolId));
        // } else {
        //   await contract.contribute(Number(poolId), { value: pool.contributionAmount });
        // }
        // After action, refresh pool details.
        fetchPoolDetails();
    };
    return (_jsxs("div", { className: "container mx-auto px-4 py-8", children: [_jsxs(motion.h1, { className: "text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200", initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, children: ["Pool Details - #", pool.id.toString()] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700", children: [_jsxs("div", { className: "flex justify-between items-start mb-4", children: [_jsx("div", { children: _jsxs("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: ["Creator: ", pool.creator.slice(0, 6), "...", pool.creator.slice(-4)] }) }), _jsx("div", { className: "bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-lg", children: _jsx(PieChart, { size: 20, className: "text-indigo-600 dark:text-indigo-400" }) })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("p", { className: "text-sm text-gray-600 dark:text-gray-300", children: [_jsx("strong", { children: "Contribution Amount (ETH):" }), " ", contributionEth, " ETH"] }), _jsxs("p", { className: "text-sm text-gray-600 dark:text-gray-300", children: [_jsx("strong", { children: "Cycle Duration (days):" }), " ", cycleDurationDays.toFixed(2), " days"] }), _jsxs("p", { className: "text-sm text-gray-600 dark:text-gray-300", children: [_jsx("strong", { children: "Max Members:" }), " ", pool.maxMembers.toString()] }), _jsxs("p", { className: "text-sm text-gray-600 dark:text-gray-300", children: [_jsx("strong", { children: "Pool Reason:" }), " ", pool.poolType || "N/A"] }), _jsxs("p", { className: "text-sm text-gray-600 dark:text-gray-300", children: [_jsx("strong", { children: "APY (%):" }), " ", apy] }), _jsxs("p", { className: "text-sm text-gray-600 dark:text-gray-300", children: [_jsx("strong", { children: "Status:" }), " ", pool.isActive ? "Active" : "Inactive"] })] })] }), isMember && (_jsx("div", { className: "mt-8", children: _jsx(UltBalanceAndClaim, { poolId: poolId }) })), _jsx("div", { className: "mt-6", children: _jsx(motion.button, { whileHover: { scale: 1.03 }, whileTap: { scale: 0.98 }, onClick: handleAction, className: "w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium text-sm transition-colors", children: actionText }) }), _jsx("div", { className: "mt-8", children: _jsx(Link, { to: "/dashboard", className: "text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors", children: "\u2190 Back to Dashboard" }) })] }));
};
export default ViewPool;
