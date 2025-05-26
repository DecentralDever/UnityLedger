import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/pages/JoinCreatePool.tsx
import { useState } from "react";
import { useUnityLedgerContract } from "../services/contract";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { ethers } from 'ethers';

const JoinCreatePool = () => {
    const contract = useUnityLedgerContract();
    
    // Form states
    const [contributionAmount, setContributionAmount] = useState("");
    const [cycleDurationDays, setCycleDurationDays] = useState("");
    const [maxMembers, setMaxMembers] = useState("2"); // Default minimum
    const [payoutOrder, setPayoutOrder] = useState("");
    const [poolReason, setPoolReason] = useState("Savings");
    const [otherReason, setOtherReason] = useState("");
    const [apy, setApy] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCreatePool = async () => {
        if (!contract) {
            toast.error("Contract not connected");
            return;
        }

        try {
            setIsSubmitting(true);
            
            // Enhanced validation
            const contribution = parseFloat(contributionAmount);
            const duration = parseInt(cycleDurationDays);
            const members = parseInt(maxMembers);
            const apyValue = parseFloat(apy);

            // Validate inputs
            if (!contribution || contribution < 0.001) {
                toast.error("Minimum contribution is 0.001 ETH");
                return;
            }

            if (!duration || duration < 1 || duration > 365) {
                toast.error("Cycle duration must be between 1-365 days");
                return;
            }

            if (!members || members < 2 || members > 50) {
                toast.error("Member count must be between 2-50");
                return;
            }

            if (!apyValue || apyValue < 0 || apyValue > 50) {
                toast.error("APY must be between 0-50%");
                return;
            }

            // Parse payout order addresses
            const addresses = payoutOrder.split(",").map((addr) => addr.trim());
            
            if (addresses.length !== members) {
                toast.error(`Payout order must contain exactly ${members} addresses`);
                return;
            }

            // Validate addresses
            for (let i = 0; i < addresses.length; i++) {
                if (!ethers.isAddress(addresses[i])) {
                    toast.error(`Invalid address at position ${i + 1}: ${addresses[i]}`);
                    return;
                }
            }

            // Convert values
            const weiAmount = ethers.parseEther(contributionAmount);
            const cycleDurationSeconds = duration * 86400;
            const reason = poolReason === "Other" ? otherReason : poolReason;

            // Call contract
            const tx = await contract.createPool(
                weiAmount,
                cycleDurationSeconds,
                members,
                addresses,
                reason,
                Math.floor(apyValue) // Ensure integer
            );

            toast.info("Creating pool...");
            await tx.wait();
            toast.success("Pool created successfully!");

            // Clear form
            setContributionAmount("");
            setCycleDurationDays("");
            setMaxMembers("2");
            setPayoutOrder("");
            setPoolReason("Savings");
            setOtherReason("");
            setApy("");

        } catch (error) {
            console.error("Error creating pool:", error);
            let errorMessage = "Pool creation failed";
            
            if (error.reason) {
                errorMessage += ": " + error.reason;
            } else if (error.message) {
                errorMessage += ": " + error.message;
            }
            
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const fadeInUp = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    return _jsxs(motion.div, { 
        className: "max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 transition-colors duration-300", 
        initial: "hidden", 
        animate: "visible", 
        variants: fadeInUp,
        children: [
            _jsx("h2", { 
                className: "text-3xl font-bold mb-8 text-gray-800 dark:text-gray-200 text-center", 
                children: "Create a Savings Pool" 
            }),

            _jsxs("div", { 
                className: "space-y-6",
                children: [
                    // Contribution Amount
                    _jsxs("div", { 
                        children: [
                            _jsx("label", { 
                                className: "block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300", 
                                children: "Contribution Amount (ETH)" 
                            }),
                            _jsx("input", { 
                                type: "number", 
                                step: "0.001",
                                min: "0.001",
                                value: contributionAmount, 
                                onChange: (e) => setContributionAmount(e.target.value), 
                                className: "w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors", 
                                placeholder: "Minimum 0.001 ETH" 
                            }),
                            _jsx("p", { 
                                className: "text-xs text-gray-500 dark:text-gray-400 mt-1", 
                                children: "Minimum contribution is 0.001 ETH" 
                            })
                        ] 
                    }),

                    // Cycle Duration
                    _jsxs("div", { 
                        children: [
                            _jsx("label", { 
                                className: "block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300", 
                                children: "Cycle Duration (days)" 
                            }),
                            _jsx("input", { 
                                type: "number", 
                                min: "1",
                                max: "365",
                                value: cycleDurationDays, 
                                onChange: (e) => setCycleDurationDays(e.target.value), 
                                className: "w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors", 
                                placeholder: "e.g. 30 for monthly cycles" 
                            }),
                            _jsx("p", { 
                                className: "text-xs text-gray-500 dark:text-gray-400 mt-1", 
                                children: "Duration between 1-365 days" 
                            })
                        ] 
                    }),

                    // Max Members
                    _jsxs("div", { 
                        children: [
                            _jsx("label", { 
                                className: "block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300", 
                                children: "Max Members" 
                            }),
                            _jsx("input", { 
                                type: "number", 
                                min: "2",
                                max: "50",
                                value: maxMembers, 
                                onChange: (e) => setMaxMembers(e.target.value), 
                                className: "w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors", 
                                placeholder: "e.g. 10" 
                            }),
                            _jsx("p", { 
                                className: "text-xs text-gray-500 dark:text-gray-400 mt-1", 
                                children: "Between 2-50 members" 
                            })
                        ] 
                    }),

                    // Payout Order
                    _jsxs("div", { 
                        children: [
                            _jsx("label", { 
                                className: "block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300", 
                                children: "Payout Order (Wallet Addresses)" 
                            }),
                            _jsx("textarea", { 
                                rows: 4,
                                value: payoutOrder, 
                                onChange: (e) => setPayoutOrder(e.target.value), 
                                className: "w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors", 
                                placeholder: "0x123...,0x456...,0x789... (comma-separated, must match member count)" 
                            }),
                            _jsx("p", { 
                                className: "text-xs text-gray-500 dark:text-gray-400 mt-1", 
                                children: `Must provide exactly ${maxMembers || 0} valid Ethereum addresses` 
                            })
                        ] 
                    }),

                    // Pool Reason
                    _jsxs("div", { 
                        children: [
                            _jsx("label", { 
                                className: "block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300", 
                                children: "Pool Purpose" 
                            }),
                            _jsxs("select", { 
                                value: poolReason, 
                                onChange: (e) => setPoolReason(e.target.value), 
                                className: "w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors", 
                                children: [
                                    _jsx("option", { value: "Savings", children: "Savings" }),
                                    _jsx("option", { value: "Investment", children: "Investment" }),
                                    _jsx("option", { value: "Emergency", children: "Emergency Fund" }),
                                    _jsx("option", { value: "Social", children: "Social/Community" }),
                                    _jsx("option", { value: "Business", children: "Business" }),
                                    _jsx("option", { value: "Other", children: "Other" })
                                ] 
                            })
                        ] 
                    }),

                    // Custom Reason
                    poolReason === "Other" && _jsxs("div", { 
                        children: [
                            _jsx("label", { 
                                className: "block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300", 
                                children: "Custom Purpose" 
                            }),
                            _jsx("input", { 
                                type: "text", 
                                value: otherReason, 
                                onChange: (e) => setOtherReason(e.target.value), 
                                className: "w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors", 
                                placeholder: "Describe your pool purpose" 
                            })
                        ] 
                    }),

                    // APY
                    _jsxs("div", { 
                        children: [
                            _jsx("label", { 
                                className: "block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300", 
                                children: "APY (%) - Yield in ULT Tokens" 
                            }),
                            _jsx("input", { 
                                type: "number", 
                                min: "0",
                                max: "50",
                                step: "0.1",
                                value: apy, 
                                onChange: (e) => setApy(e.target.value), 
                                className: "w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors", 
                                placeholder: "e.g. 5.0" 
                            }),
                            _jsx("p", { 
                                className: "text-xs text-gray-500 dark:text-gray-400 mt-1", 
                                children: "Annual Percentage Yield (0-50%)" 
                            })
                        ] 
                    }),

                    // Submit Button
                    _jsx("button", { 
                        onClick: handleCreatePool, 
                        disabled: isSubmitting, 
                        className: "w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none", 
                        children: isSubmitting ? "Creating Pool..." : "Create Pool" 
                    })
                ]
            })
        ] 
    });
};

export default JoinCreatePool;