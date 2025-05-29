import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/pages/ViewPool.tsx
import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useUnityLedgerContract } from "../services/contract";
import { useWallet } from "../context/WalletProvider";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { 
    PieChart, 
    ArrowLeft, 
    Users, 
    Clock, 
    DollarSign, 
    TrendingUp,
    AlertCircle,
    CheckCircle,
    Star
} from "lucide-react";
import { ethers } from "ethers";
import UltBalanceAndClaim from "../components/UltBalanceAndClaim";

const ViewPool = () => {
    const { poolId } = useParams();
    const contract = useUnityLedgerContract();
    const { account } = useWallet();
    
    const [pool, setPool] = useState(null);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [isMember, setIsMember] = useState(false);
    const [canJoin, setCanJoin] = useState(false);
    const [canContribute, setCanContribute] = useState(false);
    const [error, setError] = useState(null);

    const fetchPoolDetails = useCallback(async () => {
        if (!contract || !poolId) return;
        
        setLoading(true);
        setError(null);
        
        try {
            // Fetch pool details using enhanced contract struct format
            const poolInfo = await contract.getPoolDetails(Number(poolId));
            
            const fetchedPool = {
                id: BigInt(poolInfo.id.toString()),
                creator: poolInfo.creator,
                contributionAmount: BigInt(poolInfo.contributionAmount.toString()),
                cycleDuration: BigInt(poolInfo.cycleDuration.toString()),
                maxMembers: BigInt(poolInfo.maxMembers.toString()),
                totalMembers: BigInt(poolInfo.totalMembers.toString()),
                currentCycle: BigInt(poolInfo.currentCycle.toString()),
                lastPayoutTime: BigInt(poolInfo.lastPayoutTime.toString()),
                createdAt: BigInt(poolInfo.createdAt.toString()),
                isActive: poolInfo.isActive,
                isCompleted: poolInfo.isCompleted,
                poolType: poolInfo.poolType,
                fee: poolInfo.fee ? BigInt(poolInfo.fee.toString()) : BigInt(0),
                totalContributions: BigInt(poolInfo.totalContributions.toString()),
                totalPayouts: BigInt(poolInfo.totalPayouts.toString())
            };
            
            setPool(fetchedPool);

            // Fetch pool members
            const poolMembers = await contract.getPoolMembers(Number(poolId));
            setMembers(poolMembers);

            // Check membership and permissions
            if (account) {
                const joined = poolMembers.some((member) => 
                    member.wallet.toLowerCase() === account.toLowerCase()
                );
                setIsMember(joined);

                // Check if can join
                const canJoinPool = await contract.canJoinPool(Number(poolId), account);
                setCanJoin(canJoinPool);

                // Check if can contribute
                const canContributeToPool = await contract.canContribute(Number(poolId), account);
                setCanContribute(canContributeToPool);
            }

        } catch (error) {
            console.error("Error fetching pool details:", error);
            setError("Failed to load pool details");
            toast.error("Error fetching pool details");
        }
        
        setLoading(false);
    }, [contract, poolId, account]);

    useEffect(() => {
        if (contract && poolId) {
            fetchPoolDetails();
        }
    }, [contract, poolId, fetchPoolDetails]);

    const handleJoinPool = async () => {
        if (!contract || !account) {
            toast.error("Please connect your wallet");
            return;
        }

        try {
            setActionLoading(true);
            const tx = await contract.joinPool(Number(poolId));
            toast.info("Joining pool...");
            await tx.wait();
            toast.success("Successfully joined pool!");
            fetchPoolDetails();
        } catch (error) {
            console.error("Error joining pool:", error);
            toast.error(error.reason || "Failed to join pool");
        } finally {
            setActionLoading(false);
        }
    };

    const handleContribute = async () => {
        if (!contract || !pool) {
            toast.error("Pool not loaded");
            return;
        }

        try {
            setActionLoading(true);
            const tx = await contract.contribute(Number(poolId), {
                value: pool.contributionAmount
            });
            toast.info("Contributing to pool...");
            await tx.wait();
            toast.success("Contribution successful!");
            fetchPoolDetails();
        } catch (error) {
            console.error("Error contributing:", error);
            toast.error(error.reason || "Failed to contribute");
        } finally {
            setActionLoading(false);
        }
    };

   // Updated getActionButton function for ViewPool.tsx
const getActionButton = () => {
    if (!account) {
        return {
            text: "Connect Wallet",
            handler: () => toast.info("Please connect your wallet"),
            disabled: true,
            variant: "secondary"
        };
    }

    const isCreator = pool.creator.toLowerCase() === account.toLowerCase();

    // Allow creator to contribute if they've joined and can contribute
    if (isCreator && isMember && canContribute) {
        return {
            text: "Contribute",
            handler: handleContribute,
            disabled: actionLoading,
            variant: "primary"
        };
    }

    // Non-creator actions
    if (canJoin) {
        return {
            text: "Join Pool",
            handler: handleJoinPool,
            disabled: actionLoading,
            variant: "success"
        };
    }

    if (canContribute && !isCreator) {
        return {
            text: "Contribute",
            handler: handleContribute,
            disabled: actionLoading,
            variant: "primary"
        };
    }

    if (isMember) {
        return {
            text: "Pool Member",
            handler: () => {},
            disabled: true,
            variant: "member"
        };
    }

    // Creator fallback
    if (isCreator) {
        return {
            text: "Pool Creator",
            handler: () => {},
            disabled: true,
            variant: "creator"
        };
    }

    return {
        text: "Not Available",
        handler: () => {},
        disabled: true,
        variant: "secondary"
    };
};

    const getButtonClasses = (variant, disabled) => {
        const base = "w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200";
        
        if (disabled) {
            return `${base} bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed`;
        }

        switch (variant) {
            case "success":
                return `${base} bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl`;
            case "primary":
                return `${base} bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl`;
            case "creator":
                return `${base} bg-gradient-to-r from-amber-500 to-orange-500 text-white`;
            case "member":
                return `${base} bg-gradient-to-r from-blue-500 to-blue-600 text-white`;
            default:
                return `${base} bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300`;
        }
    };

    if (error) {
        return _jsx("div", { 
            className: "container mx-auto px-4 py-8", 
            children: _jsxs("div", { 
                className: "text-center bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-100 dark:border-gray-700", 
                children: [
                    _jsx(AlertCircle, { size: 48, className: "text-red-500 mx-auto mb-4" }),
                    _jsx("h2", { className: "text-xl font-bold text-gray-900 dark:text-white mb-2", children: "Error Loading Pool" }),
                    _jsx("p", { className: "text-gray-600 dark:text-gray-400 mb-4", children: error }),
                    _jsx(Link, { 
                        to: "/", 
                        className: "inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors", 
                        children: [
                            _jsx(ArrowLeft, { size: 16 }),
                            "Back to Dashboard"
                        ]
                    })
                ] 
            }) 
        });
    }

    if (loading || !pool) {
        return _jsx("div", { 
            className: "flex justify-center items-center py-16", 
            children: _jsx(motion.div, { 
                className: "w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin", 
                initial: { opacity: 0 }, 
                animate: { opacity: 1 }, 
                transition: { duration: 0.5 } 
            }) 
        });
    }

    // Pool calculations
    const contributionEth = ethers.formatEther(pool.contributionAmount.toString());
    const contributionUSD = parseFloat(contributionEth) * 1600;
    const cycleDurationDays = Number(pool.cycleDuration) / 86400;
    const totalValueLocked = ethers.formatEther(pool.totalContributions.toString());
    const completionPercentage = (Number(pool.totalMembers) / Number(pool.maxMembers)) * 100;
    const action = getActionButton();

    return _jsxs("div", { 
        className: "container mx-auto px-4 py-8 max-w-4xl", 
        children: [
            // Header
            _jsxs(motion.div, { 
                className: "flex items-center gap-4 mb-8",
                initial: { opacity: 0, y: -20 },
                animate: { opacity: 1, y: 0 },
                children: [
                    _jsx(Link, { 
                        to: "/", 
                        className: "flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors", 
                        children: [
                            _jsx(ArrowLeft, { size: 20 }),
                            "Back"
                        ]
                    }),
                    _jsxs("h1", { 
                        className: "text-3xl font-black text-gray-800 dark:text-white", 
                        children: [
                            pool.poolType || "Pool", 
                            " #", pool.id.toString()
                        ] 
                    }),
                    pool.isCompleted && _jsx("span", { 
                        className: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-sm font-semibold", 
                        children: "Completed" 
                    })
                ] 
            }),

            _jsx("div", { 
                className: "grid grid-cols-1 lg:grid-cols-3 gap-8", 
                children: [
                    // Main Pool Info
                    _jsx("div", { 
                        className: "lg:col-span-2 space-y-6", 
                        children: [
                            // Pool Overview Card
                            _jsxs(motion.div, { 
                                className: "bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700",
                                initial: { opacity: 0, y: 20 },
                                animate: { opacity: 1, y: 0 },
                                transition: { delay: 0.1 },
                                children: [
                                    _jsxs("div", { 
                                        className: "flex items-center justify-between mb-6", 
                                        children: [
                                            _jsxs("div", { 
                                                children: [
                                                    _jsx("h2", { className: "text-xl font-bold text-gray-900 dark:text-white mb-1", children: "Pool Overview" }),
                                                    _jsxs("p", { 
                                                        className: "text-gray-600 dark:text-gray-400", 
                                                        children: ["Created by ", pool.creator.slice(0, 6), "...", pool.creator.slice(-4)] 
                                                    })
                                                ] 
                                            }),
                                            _jsx("div", { 
                                                className: "bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 p-3 rounded-xl", 
                                                children: _jsx(PieChart, { size: 28, className: "text-indigo-600 dark:text-indigo-400" }) 
                                            })
                                        ] 
                                    }),

                                    _jsx("div", { 
                                        className: "grid grid-cols-2 gap-6", 
                                        children: [
                                            _jsxs("div", { 
                                                className: "space-y-4", 
                                                children: [
                                                    _jsxs("div", { 
                                                        children: [
                                                            _jsx("label", { className: "text-sm font-medium text-gray-500 dark:text-gray-400", children: "Contribution Amount" }),
                                                            _jsxs("div", { 
                                                                children: [
                                                                    _jsxs("p", { 
                                                                        className: "text-lg font-bold text-gray-900 dark:text-white", 
                                                                        children: [contributionEth, " ETH"] 
                                                                    }),
                                                                    _jsxs("p", { 
                                                                        className: "text-sm text-gray-500 dark:text-gray-400", 
                                                                        children: ["$", contributionUSD.toFixed(2)] 
                                                                    })
                                                                ] 
                                                            })
                                                        ] 
                                                    }),
                                                    _jsxs("div", { 
                                                        children: [
                                                            _jsx("label", { className: "text-sm font-medium text-gray-500 dark:text-gray-400", children: "Cycle Duration" }),
                                                            _jsxs("p", { 
                                                                className: "text-lg font-bold text-gray-900 dark:text-white", 
                                                                children: [cycleDurationDays.toFixed(1), " days"] 
                                                            })
                                                        ] 
                                                    }),
                                                    _jsxs("div", { 
                                                        children: [
                                                            _jsx("label", { className: "text-sm font-medium text-gray-500 dark:text-gray-400", children: "APY" }),
                                                            _jsxs("p", { 
                                                                className: "text-lg font-bold text-emerald-600 dark:text-emerald-400", 
                                                                children: [pool.fee.toString(), "%"] 
                                                            })
                                                        ] 
                                                    })
                                                ] 
                                            }),
                                            _jsxs("div", { 
                                                className: "space-y-4", 
                                                children: [
                                                    _jsxs("div", { 
                                                        children: [
                                                            _jsx("label", { className: "text-sm font-medium text-gray-500 dark:text-gray-400", children: "Pool Progress" }),
                                                            _jsxs("div", { 
                                                                className: "flex items-center gap-2 mt-1", 
                                                                children: [
                                                                    _jsxs("span", { 
                                                                        className: "text-lg font-bold text-gray-900 dark:text-white", 
                                                                        children: [pool.totalMembers.toString(), "/", pool.maxMembers.toString()] 
                                                                    }),
                                                                    _jsx("span", { className: "text-sm text-gray-500", children: "members" })
                                                                ] 
                                                            }),
                                                            _jsx("div", { 
                                                                className: "w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2", 
                                                                children: _jsx("div", { 
                                                                    className: "bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-500", 
                                                                    style: { width: `${completionPercentage}%` } 
                                                                }) 
                                                            })
                                                        ] 
                                                    }),
                                                    _jsxs("div", { 
                                                        children: [
                                                            _jsx("label", { className: "text-sm font-medium text-gray-500 dark:text-gray-400", children: "Current Cycle" }),
                                                            _jsx("p", { 
                                                                className: "text-lg font-bold text-gray-900 dark:text-white", 
                                                                children: pool.currentCycle.toString() 
                                                            })
                                                        ] 
                                                    }),
                                                    _jsxs("div", { 
                                                        children: [
                                                            _jsx("label", { className: "text-sm font-medium text-gray-500 dark:text-gray-400", children: "Status" }),
                                                            _jsxs("div", { 
                                                                className: "flex items-center gap-2 mt-1", 
                                                                children: [
                                                                    pool.isActive ? 
                                                                        _jsx(CheckCircle, { size: 16, className: "text-green-500" }) :
                                                                        _jsx(AlertCircle, { size: 16, className: "text-red-500" }),
                                                                    _jsx("span", { 
                                                                        className: `text-sm font-semibold ${pool.isActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`, 
                                                                        children: pool.isActive ? "Active" : "Inactive" 
                                                                    })
                                                                ] 
                                                            })
                                                        ] 
                                                    })
                                                ] 
                                            })
                                        ] 
                                    })
                                ] 
                            }),

                            // Pool Members
                            _jsxs(motion.div, { 
                                className: "bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700",
                                initial: { opacity: 0, y: 20 },
                                animate: { opacity: 1, y: 0 },
                                transition: { delay: 0.2 },
                                children: [
                                    _jsxs("h3", { 
                                        className: "text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2", 
                                        children: [
                                            _jsx(Users, { size: 20 }),
                                            "Pool Members"
                                        ] 
                                    }),
                                    members.length > 0 ? 
                                        _jsx("div", { 
                                            className: "space-y-3", 
                                            children: members.map((member, index) => 
                                                _jsxs("div", { 
                                                    className: `flex items-center justify-between p-3 rounded-lg ${
                                                        member.wallet.toLowerCase() === account?.toLowerCase() 
                                                            ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800' 
                                                            : 'bg-gray-50 dark:bg-gray-700'
                                                    }`,
                                                    children: [
                                                        _jsxs("div", { 
                                                            className: "flex items-center gap-3", 
                                                            children: [
                                                                _jsx("div", { 
                                                                    className: "w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold", 
                                                                    children: (index + 1).toString() 
                                                                }),
                                                                _jsxs("div", { 
                                                                    children: [
                                                                        _jsxs("p", { 
                                                                            className: "font-medium text-gray-900 dark:text-white", 
                                                                            children: [
                                                                                member.wallet.slice(0, 6), "...", member.wallet.slice(-4),
                                                                                member.wallet.toLowerCase() === account?.toLowerCase() && 
                                                                                    _jsx("span", { className: "ml-2 text-xs text-indigo-600 dark:text-indigo-400", children: "(You)" })
                                                                            ] 
                                                                        }),
                                                                        _jsxs("p", { 
                                                                            className: "text-xs text-gray-500 dark:text-gray-400", 
                                                                            children: ["Joined: ", new Date(Number(member.joinedAt) * 1000).toLocaleDateString()] 
                                                                        })
                                                                    ] 
                                                                })
                                                            ] 
                                                        }),
                                                        member.hasReceivedPayout && 
                                                            _jsx("span", { 
                                                                className: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 px-2 py-1 rounded-full text-xs font-semibold", 
                                                                children: "Paid Out" 
                                                            })
                                                    ] 
                                                }, index)
                                            ) 
                                        }) :
                                        _jsx("p", { className: "text-gray-500 dark:text-gray-400 text-center py-4", children: "No members yet" })
                                ] 
                            })
                        ] 
                    }),

                    // Sidebar
                    _jsx("div", { 
                        className: "space-y-6", 
                        children: [
                            // ULT Balance & Claim
                            isMember && _jsx(motion.div, { 
                                initial: { opacity: 0, x: 20 },
                                animate: { opacity: 1, x: 0 },
                                transition: { delay: 0.3 },
                                children: _jsx(UltBalanceAndClaim, { poolId: poolId }) 
                            }),

                            // Action Button
                            _jsx(motion.div, { 
                                className: "bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700",
                                initial: { opacity: 0, x: 20 },
                                animate: { opacity: 1, x: 0 },
                                transition: { delay: 0.4 },
                                children: [
                                    _jsx("h3", { className: "text-lg font-bold text-gray-900 dark:text-white mb-4", children: "Actions" }),
                                    _jsx(motion.button, {
                                        onClick: action.handler,
                                        disabled: action.disabled,
                                        className: getButtonClasses(action.variant, action.disabled),
                                        whileHover: !action.disabled ? { scale: 1.02 } : {},
                                        whileTap: !action.disabled ? { scale: 0.98 } : {},
                                        children: actionLoading ? "Processing..." : action.text
                                    })
                                ]
                            }),

                            // Pool Stats
                            _jsxs(motion.div, { 
                                className: "bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700",
                                initial: { opacity: 0, x: 20 },
                                animate: { opacity: 1, x: 0 },
                                transition: { delay: 0.5 },
                                children: [
                                    _jsx("h3", { className: "text-lg font-bold text-gray-900 dark:text-white mb-4", children: "Pool Statistics" }),
                                    _jsxs("div", { 
                                        className: "space-y-3", 
                                        children: [
                                            _jsxs("div", { 
                                                className: "flex justify-between", 
                                                children: [
                                                    _jsx("span", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Total Contributions" }),
                                                    _jsxs("span", { 
                                                        className: "text-sm font-semibold text-gray-900 dark:text-white", 
                                                        children: [totalValueLocked, " ETH"] 
                                                    })
                                                ] 
                                            }),
                                            _jsxs("div", { 
                                                className: "flex justify-between", 
                                                children: [
                                                    _jsx("span", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Total Payouts" }),
                                                    _jsxs("span", { 
                                                        className: "text-sm font-semibold text-gray-900 dark:text-white", 
                                                        children: [ethers.formatEther(pool.totalPayouts.toString()), " ETH"] 
                                                    })
                                                ] 
                                            }),
                                            _jsxs("div", { 
                                                className: "flex justify-between", 
                                                children: [
                                                    _jsx("span", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Created" }),
                                                    _jsx("span", { 
                                                        className: "text-sm font-semibold text-gray-900 dark:text-white", 
                                                        children: new Date(Number(pool.createdAt) * 1000).toLocaleDateString() 
                                                    })
                                                ] 
                                            })
                                        ] 
                                    })
                                ] 
                            })
                        ] 
                    })
                ] 
            })
        ] 
    });
};

export default ViewPool;