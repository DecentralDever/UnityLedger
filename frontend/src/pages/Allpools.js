import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/pages/AllPools.tsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useUnityLedgerContract } from "../services/contract";
import { useWallet } from "../context/WalletProvider";
import { useTheme } from "../context/ThemeProvider";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Search, 
    Filter, 
    PieChart, 
    Star, 
    Users, 
    TrendingUp,
    CheckCircle,
    AlertCircle,
    ArrowUpDown
} from "lucide-react";
import { ethers } from "ethers";

const AllPools = () => {
    const contract = useUnityLedgerContract();
    const { account } = useWallet();
    const { isDark } = useTheme();
    
    const [pools, setPools] = useState([]);
    const [filteredPools, setFilteredPools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [sortBy, setSortBy] = useState("newest");

    const fetchAllPools = async () => {
        if (!contract) return;
        
        setLoading(true);
        try {
            const nextPoolId = await contract.nextPoolId();
            const total = Number(nextPoolId);
            
            if (total === 0) {
                setPools([]);
                setFilteredPools([]);
                setLoading(false);
                return;
            }

            const poolDetailsArray = await Promise.all(
                Array.from({ length: total }, (_, i) => contract.getPoolDetails(i))
            );

            const formattedPools = await Promise.all(
                poolDetailsArray.map(async (poolInfo) => {
                    let joined = false;
                    let canJoin = false;
                    
                    if (account) {
                        try {
                            const members = await contract.getPoolMembers(poolInfo.id);
                            joined = members.some((member) =>
                                member.wallet.toLowerCase() === account.toLowerCase()
                            );
                            canJoin = await contract.canJoinPool(poolInfo.id, account);
                        } catch (error) {
                            console.warn("Error checking membership for pool", poolInfo.id);
                        }
                    }

                    return {
                        id: Number(poolInfo.id),
                        creator: poolInfo.creator,
                        contributionAmount: BigInt(poolInfo.contributionAmount.toString()),
                        cycleDuration: poolInfo.cycleDuration,
                        maxMembers: Number(poolInfo.maxMembers),
                        totalMembers: Number(poolInfo.totalMembers),
                        currentCycle: Number(poolInfo.currentCycle),
                        isActive: poolInfo.isActive,
                        isCompleted: poolInfo.isCompleted,
                        poolType: poolInfo.poolType,
                        fee: Number(poolInfo.fee),
                        totalContributions: poolInfo.totalContributions,
                        createdAt: Number(poolInfo.createdAt),
                        joined,
                        canJoin
                    };
                })
            );

            setPools(formattedPools);
            setFilteredPools(formattedPools);
        } catch (error) {
            console.error("Error fetching pools:", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchAllPools();
    }, [contract, account]);

    useEffect(() => {
        let filtered = pools.filter(pool => {
            const matchesSearch = pool.poolType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                pool.creator.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                pool.id.toString().includes(searchTerm);
            
            const matchesFilter = filterStatus === "all" ||
                                (filterStatus === "active" && pool.isActive && !pool.isCompleted) ||
                                (filterStatus === "completed" && pool.isCompleted) ||
                                (filterStatus === "joinable" && pool.canJoin) ||
                                (filterStatus === "joined" && pool.joined);
            
            return matchesSearch && matchesFilter;
        });

        // Sort pools
        filtered.sort((a, b) => {
            switch (sortBy) {
                case "newest":
                    return b.createdAt - a.createdAt;
                case "oldest": 
                    return a.createdAt - b.createdAt;
                case "members":
                    return b.totalMembers - a.totalMembers;
                case "contribution":
                    return Number(b.contributionAmount) - Number(a.contributionAmount);
                case "apy":
                    return b.fee - a.fee;
                default:
                    return 0;
            }
        });

        setFilteredPools(filtered);
    }, [pools, searchTerm, filterStatus, sortBy]);

    const getStatusBadge = (pool) => {
        if (pool.isCompleted) {
            return _jsx("span", { 
                className: "px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 rounded-full text-xs font-semibold",
                children: "Completed"
            });
        }
        if (pool.canJoin) {
            return _jsx("span", { 
                className: "px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-full text-xs font-semibold",
                children: "Joinable"
            });
        }
        if (pool.joined) {
            return _jsx("span", { 
                className: "px-2 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 rounded-full text-xs font-semibold",
                children: "Joined"
            });
        }
        if (pool.isActive) {
            return _jsx("span", { 
                className: "px-2 py-1 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 rounded-full text-xs font-semibold",
                children: "Active"
            });
        }
        return _jsx("span", { 
            className: "px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs font-semibold",
            children: "Inactive"
        });
    };

    return _jsxs("div", { 
        className: "w-full max-w-7xl mx-auto px-4 sm:px-6 py-8", 
        children: [
            // Header
            _jsxs(motion.div, { 
                className: "mb-8",
                initial: { opacity: 0, y: -20 },
                animate: { opacity: 1, y: 0 },
                children: [
                    _jsx("h1", { className: "text-4xl font-black text-gray-900 dark:text-white mb-2", children: "All Pools" }),
                    _jsx("p", { className: "text-gray-600 dark:text-gray-400", children: "Explore all available savings pools" })
                ]
            }),

            // Filters & Search
            _jsxs(motion.div, { 
                className: "bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 mb-8",
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                transition: { delay: 0.1 },
                children: [
                    _jsx("div", { 
                        className: "grid grid-cols-1 md:grid-cols-4 gap-4", 
                        children: [
                            // Search
                            _jsxs("div", { 
                                className: "relative", 
                                children: [
                                    _jsx(Search, { size: 20, className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" }),
                                    _jsx("input", {
                                        type: "text",
                                        placeholder: "Search pools...",
                                        value: searchTerm,
                                        onChange: (e) => setSearchTerm(e.target.value),
                                        className: "w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    })
                                ] 
                            }),

                            // Status Filter
                            _jsxs("select", { 
                                value: filterStatus,
                                onChange: (e) => setFilterStatus(e.target.value),
                                className: "px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white",
                                children: [
                                    _jsx("option", { value: "all", children: "All Pools" }),
                                    _jsx("option", { value: "active", children: "Active" }),
                                    _jsx("option", { value: "completed", children: "Completed" }),
                                    _jsx("option", { value: "joinable", children: "Joinable" }),
                                    _jsx("option", { value: "joined", children: "My Pools" })
                                ] 
                            }),

                            // Sort
                            _jsxs("select", { 
                                value: sortBy,
                                onChange: (e) => setSortBy(e.target.value),
                                className: "px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white",
                                children: [
                                    _jsx("option", { value: "newest", children: "Newest First" }),
                                    _jsx("option", { value: "oldest", children: "Oldest First" }),
                                    _jsx("option", { value: "members", children: "Most Members" }),
                                    _jsx("option", { value: "contribution", children: "Highest Contribution" }),
                                    _jsx("option", { value: "apy", children: "Highest APY" })
                                ] 
                            }),

                            // Results count
                            _jsx("div", { 
                                className: "flex items-center justify-center px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-xl", 
                                children: _jsxs("span", { 
                                    className: "text-sm font-semibold text-gray-600 dark:text-gray-400", 
                                    children: [filteredPools.length, " pools"] 
                                }) 
                            })
                        ] 
                    })
                ] 
            }),

            // Pools Grid
            _jsx(AnimatePresence, { 
                children: loading ? 
                    _jsx("div", { 
                        className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", 
                        children: [1, 2, 3, 4, 5, 6].map((i) => 
                            _jsx("div", {
                                className: "bg-white dark:bg-gray-800 rounded-2xl p-6 h-64 shadow-lg animate-pulse border border-gray-100 dark:border-gray-700"
                            }, i)
                        ) 
                    }) :
                filteredPools.length === 0 ? 
                    _jsx(motion.div, {
                        className: "text-center py-16",
                        initial: { opacity: 0 },
                        animate: { opacity: 1 },
                        children: _jsxs("div", { 
                            className: "bg-gray-50 dark:bg-gray-800 rounded-2xl p-12", 
                            children: [
                                _jsx(PieChart, { size: 48, className: "text-gray-400 mx-auto mb-4" }),
                                _jsx("h3", { className: "text-xl font-semibold text-gray-900 dark:text-white mb-2", children: "No pools found" }),
                                _jsx("p", { className: "text-gray-600 dark:text-gray-400", children: "Try adjusting your search or filters" })
                            ] 
                        })
                    }) :
                    _jsx(motion.div, { 
                        className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
                        initial: { opacity: 0 },
                        animate: { opacity: 1 },
                        children: filteredPools.map((pool) => {
                            const contributionEth = ethers.formatEther(pool.contributionAmount.toString());
                            const contributionUSD = parseFloat(contributionEth) * 2500;
                            const cycleDays = Number(pool.cycleDuration) / 86400;
                            const completionPercentage = (pool.totalMembers / pool.maxMembers) * 100;

                            return _jsx(Link, { 
                                to: `/pool/${pool.id}`, 
                                children: _jsxs(motion.div, {
                                    whileHover: { scale: 1.02, y: -5 },
                                    className: "bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl border border-gray-100 dark:border-gray-700 transition-all duration-300 group",
                                    children: [
                                        // Header
                                        _jsxs("div", { 
                                            className: "flex justify-between items-start mb-4", 
                                            children: [
                                                _jsxs("div", { 
                                                    children: [
                                                        _jsxs("span", { 
                                                            className: "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-100 to-emerald-200 dark:from-emerald-900/50 dark:to-emerald-800/50 text-emerald-800 dark:text-emerald-300 mb-2", 
                                                            children: ["Pool #", pool.id] 
                                                        }),
                                                        _jsx("h3", { 
                                                            className: "text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors", 
                                                            children: pool.poolType 
                                                        }),
                                                        _jsxs("p", { 
                                                            className: "text-sm text-gray-500 dark:text-gray-400", 
                                                            children: [pool.creator.slice(0, 6), "...", pool.creator.slice(-4)] 
                                                        })
                                                    ] 
                                                }),
                                                getStatusBadge(pool)
                                            ] 
                                        }),

                                        // Stats
                                        _jsxs("div", { 
                                            className: "grid grid-cols-2 gap-4 mb-4", 
                                            children: [
                                                _jsxs("div", { 
                                                    children: [
                                                        _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: "Contribution" }),
                                                        _jsxs("p", { 
                                                            className: "font-bold text-gray-900 dark:text-white", 
                                                            children: [contributionEth, " ETH"] 
                                                        }),
                                                        _jsxs("p", { 
                                                            className: "text-xs text-gray-500", 
                                                            children: ["$", contributionUSD.toFixed(2)] 
                                                        })
                                                    ] 
                                                }),
                                                _jsxs("div", { 
                                                    children: [
                                                        _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: "APY" }),
                                                        _jsxs("p", { 
                                                            className: "font-bold text-emerald-600 dark:text-emerald-400", 
                                                            children: [pool.fee, "%"] 
                                                        }),
                                                        _jsxs("p", { 
                                                            className: "text-xs text-gray-500", 
                                                            children: [cycleDays.toFixed(0), " day cycles"] 
                                                        })
                                                    ] 
                                                })
                                            ] 
                                        }),

                                        // Progress
                                        _jsxs("div", { 
                                            className: "mb-4", 
                                            children: [
                                                _jsxs("div", { 
                                                    className: "flex justify-between text-sm mb-1", 
                                                    children: [
                                                        _jsx("span", { className: "text-gray-600 dark:text-gray-400", children: "Members" }),
                                                        _jsxs("span", { 
                                                            className: "font-semibold text-gray-900 dark:text-white", 
                                                            children: [pool.totalMembers, "/", pool.maxMembers] 
                                                        })
                                                    ] 
                                                }),
                                                _jsx("div", { 
                                                    className: "w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2", 
                                                    children: _jsx("div", { 
                                                        className: "bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-500", 
                                                        style: { width: `${completionPercentage}%` } 
                                                    }) 
                                                })
                                            ] 
                                        }),

                                        // Footer
                                        _jsxs("div", { 
                                            className: "flex items-center justify-between", 
                                            children: [
                                                _jsxs("div", { 
                                                    className: "flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400", 
                                                    children: [
                                                        _jsx(Users, { size: 12 }),
                                                        _jsxs("span", { children: ["Cycle ", pool.currentCycle] })
                                                    ] 
                                                }),
                                                pool.joined && _jsx(Star, { size: 16, className: "text-yellow-500" })
                                            ] 
                                        })
                                    ]
                                }) 
                            }, pool.id);
                        }) 
                    })
            })
        ] 
    });
};

export default AllPools;