import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/pages/JoinCreatePool.tsx
import { useState } from "react";
import { useUnityLedgerContract } from "../services/contract";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { ethers } from 'ethers';
const JoinCreatePool = () => {
    const contract = useUnityLedgerContract();
    // New input states
    const [contributionAmount, setContributionAmount] = useState(""); // in ETH
    const [cycleDurationDays, setCycleDurationDays] = useState(""); // in days
    const [maxMembers, setMaxMembers] = useState("");
    const [payoutOrder, setPayoutOrder] = useState("");
    const [poolReason, setPoolReason] = useState("Savings"); // default option
    const [otherReason, setOtherReason] = useState(""); // for "Other"
    const [apy, setApy] = useState(""); // APY percentage
    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleCreatePool = async () => {
        if (!contract) {
            toast.error("Contract not connected");
            return;
        }
        try {
            setIsSubmitting(true);
            // Parse payout order addresses
            const addresses = payoutOrder.split(",").map((addr) => addr.trim());
            // Convert contribution amount from ETH to wei using ethers.parseEther (ethers v6 style)
            const weiAmount = ethers.parseEther(contributionAmount);
            // Convert cycle duration from days to seconds
            const cycleDurationSeconds = Number(cycleDurationDays) * 86400;
            // Determine the pool reason (if "Other" is selected, use the provided text)
            const reason = poolReason === "Other" ? otherReason : poolReason;
            // Parse maxMembers and APY as numbers
            const maxMembersNum = Number(maxMembers);
            const apyNum = Number(apy);
            // Call the contract's createPool function with new parameters
            const tx = await contract.createPool(weiAmount, cycleDurationSeconds, maxMembersNum, addresses, reason, apyNum);
            toast.info("Creating pool...");
            await tx.wait();
            toast.success("Pool created successfully!");
            // Clear the form
            setContributionAmount("");
            setCycleDurationDays("");
            setMaxMembers("");
            setPayoutOrder("");
            setPoolReason("Savings");
            setOtherReason("");
            setApy("");
        }
        catch (error) {
            console.error("Error creating pool:", error);
            toast.error("Pool creation failed: " + error.message);
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const fadeInUp = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };
    return (_jsxs(motion.div, { className: "max-w-md mx-auto bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg transition-colors duration-300", initial: "hidden", animate: "visible", variants: fadeInUp, children: [_jsx("h2", { className: "text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200", children: "Create a Pool" }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300", children: "Contribution Amount (ETH)" }), _jsx("input", { type: "number", value: contributionAmount, onChange: (e) => setContributionAmount(e.target.value), className: "w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors", placeholder: "Enter amount in ETH" })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300", children: "Cycle Duration (days)" }), _jsx("input", { type: "number", value: cycleDurationDays, onChange: (e) => setCycleDurationDays(e.target.value), className: "w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors", placeholder: "e.g. 1 for 1 day" })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300", children: "Max Members" }), _jsx("input", { type: "number", value: maxMembers, onChange: (e) => setMaxMembers(e.target.value), className: "w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors", placeholder: "e.g. 10" })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300", children: "Payout Order" }), _jsx("input", { type: "text", value: payoutOrder, onChange: (e) => setPayoutOrder(e.target.value), className: "w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors", placeholder: "Comma-separated addresses" })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300", children: "Pool Reason" }), _jsxs("select", { value: poolReason, onChange: (e) => setPoolReason(e.target.value), className: "w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors", children: [_jsx("option", { value: "Savings", children: "Savings" }), _jsx("option", { value: "Investment", children: "Investment" }), _jsx("option", { value: "Emergency", children: "Emergency" }), _jsx("option", { value: "Social", children: "Social" }), _jsx("option", { value: "Other", children: "Other" })] })] }), poolReason === "Other" && (_jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300", children: "Specify Reason" }), _jsx("input", { type: "text", value: otherReason, onChange: (e) => setOtherReason(e.target.value), className: "w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors", placeholder: "Enter custom reason" })] })), _jsxs("div", { className: "mb-6", children: [_jsx("label", { className: "block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300", children: "APY (%) - Earned in ULT Token" }), _jsx("input", { type: "number", value: apy, onChange: (e) => setApy(e.target.value), className: "w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors", placeholder: "e.g. 5" })] }), _jsx("button", { onClick: handleCreatePool, disabled: isSubmitting, className: "w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white font-semibold py-2 rounded-lg transition-colors", children: isSubmitting ? "Creating Pool..." : "Create Pool" })] }));
};
export default JoinCreatePool;
