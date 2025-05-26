import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/pages/Leaderboard.tsx
import { useState, useEffect } from "react";
import { useUnityLedgerContract } from "../services/contract";
import { motion } from "framer-motion";
import { 
    Trophy, 
    Medal, 
    Award, 
    Crown,
    TrendingUp,
    Users,
    DollarSign,
    Star
} from "lucide-react";
import { ethers } from "ethers";

const Leaderboard = () => {
    const contract = useUnityLedgerContract();
    
    const [leaderboards, setLeaderboards] = useState({
        topCreators: [],
        topPools: [],
        mostActiveMembers: [],
        highestYield: []
    });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("creators");

    const fetchLeaderboardData = async () => {
        if (!contract) return;
        
        setLoading(true);
        try {
            const nextPoolId = await contract.nextPoolId();
            const total = Number(nextPoolId);
            
            if (total === 0) {
                setLoading(false);
                return;
            }

            // Fetch all pool details
            const poolDetailsArray = await Promise.all(
                Array.from({ length: total }, (_, i) => contract.getPoolDetails(i))
            );

            // Calculate top creators
            const creatorStats = {};
            const poolStats = [];
            const memberStats = {};

            for (let i = 0; i < poolDetailsArray.length; i++) {
                const pool = poolDetailsArray[i];
                const creator = pool.creator;
                
                // Creator stats
                if (!creatorStats[creator]) {
                    creatorStats[creator] = {
                        address: creator,
                        poolsCreated: 0,
                        totalValue: BigInt(0),
                        totalMembers: 0,
                        avgAPY: 0
                    };
                }
                
                creatorStats[creator].poolsCreated++;
                creatorStats[creator].totalValue += pool.totalContributions;
                creatorStats[creator].totalMembers += Number(pool.totalMembers);
                creatorStats[creator].avgAPY += Number(pool.fee);

                // Pool stats
                poolStats.push({
                    id: Number(pool.id),
                    poolType: pool.poolType,
                    creator: pool.creator,
                    totalMembers: Number(pool.totalMembers),
                    maxMembers: Number(pool.maxMembers),
                    totalValue: pool.totalContributions,
                    apy: Number(pool.fee),
                    isActive: pool.isActive,
                    isCompleted: pool.isCompleted,
                    completionRate: Number(pool.totalMembers) / Number(pool.maxMembers)
                });

                // Member stats
                try {
                    const members = await contract.getPoolMembers(i);
                    members.forEach(member => {
                        if (!memberStats[member.wallet]) {
                            memberStats[member.wallet] = {
                                address: member.wallet,
                                poolsJoined: 0,
                                totalContributed: BigInt(0),
                                payoutsReceived: 0
                            };
                        }
                        
                        memberStats[member.wallet].poolsJoined++;
                        memberStats[member.wallet].totalContributed += BigInt(member.totalContributed || 0);
                        if (member.hasReceivedPayout) {
                            memberStats[member.wallet].payoutsReceived++;
                        }
                    });
                } catch (error) {
                    console.warn("Error fetching members for pool", i);
                }
            }

            // Process and sort data
            const topCreators = Object.values(creatorStats)
                .map(creator => ({
                    ...creator,
                    avgAPY: creator.poolsCreated > 0 ? creator.avgAPY / creator.poolsCreated : 0
                }))
                .sort((a, b) => Number(b.totalValue) - Number(a.totalValue))
                .slice(0, 10);

            const topPools = poolStats
                .sort((a, b) => Number(b.totalValue) - Number(a.totalValue))
                .slice(0, 10);

            const mostActiveMembers = Object.values(memberStats)
                .sort((a, b) => b.poolsJoined - a.poolsJoined)
                .slice(0, 10);

            const highestYield = poolStats
                .filter(pool => pool.apy > 0)
                .sort((a, b) => b.apy - a.apy)
                .slice(0, 10);

            setLeaderboards({
                topCreators,
                topPools,
                mostActiveMembers,
                highestYield
            });
        } catch (error) {
            console.error("Error fetching leaderboard data:", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchLeaderboardData();
    }, [contract]);

    const getRankIcon = (rank) => {
        if (rank === 0) return _jsx(Crown, { size: 20, className: "text-yellow-500" });
        if (rank === 1) return _jsx(Trophy, { size: 20, className: "text-gray-400" });
        if (rank === 2) return _jsx(Medal, { size: 20, className: "text-amber-600" });
        return _jsx("div", { 
            className: "w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-400", 
            children: rank + 1 
        });
    };

    const tabs = [
        { id: "creators", label: "Top Creators", icon: Crown },
        { id: "pools", label: "Top Pools", icon: Trophy },
        { id: "members", label: "Active Members", icon: Users },
        { id: "yield", label: "High Yield", icon: TrendingUp }
    ];

    if (loading) {
        return _jsx("div", { 
            className: "w-full max-w-7xl mx-auto px-4 sm:px-6 py-8", 
            children: _jsxs("div", { 
                className: "space-y-6", 
                children: [
                    _jsx("div", { className: "h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }),
                    _jsx("div", { className: "flex gap-4", children: [1,2,3,4].map(i => 
                        _jsx("div", { className: "h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }, i)
                    )}),
                    _jsx("div", { className: "space-y-4", children: [1,2,3,4,5].map(i => 
                        _jsx("div", { className: "h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }, i)
                    )})
                ] 
            }) 
        });
    }

    const renderCreators = () => (
        _jsx("div", { 
            className: "space-y-4", 
            children: leaderboards.topCreators.map((creator, index) => 
                _jsxs(motion.div, {
                    className: "bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4",
                    whileHover: { scale: 1.01 },
                    children: [
                        getRankIcon(index),
                        _jsxs("div", { 
                            className: "flex-1", 
                            children: [
                                _jsxs("h3", { 
                                    className: "font-semibold text-gray-900 dark:text-white", 
                                    children: [creator.address.slice(0, 6), "...", creator.address.slice(-4)] 
                                }),
                                _jsxs("p", { 
                                    className: "text-sm text-gray-600 dark:text-gray-400", 
                                    children: [creator.poolsCreated, " pools created • ", creator.totalMembers, " total members"] 
                                })
                            ] 
                        }),
                        _jsxs("div", { 
                            className: "text-right", 
                            children: [
                                _jsxs("p", { 
                                    className: "font-bold text-gray-900 dark:text-white", 
                                    children: [ethers.formatEther(creator.totalValue.toString()), " ETH"] 
                                }),
                                _jsxs("p", { 
                                    className: "text-sm text-gray-600 dark:text-gray-400", 
                                    children: ["Avg APY: ", creator.avgAPY.toFixed(1), "%"] 
                                })
                            ] 
                        })
                    ]
                }, creator.address)
            ) 
        })
    );

    const renderPools = () => (
        _jsx("div", { 
            className: "space-y-4", 
            children: leaderboards.topPools.map((pool, index) => 
                _jsxs(motion.div, {
                    className: "bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4",
                    whileHover: { scale: 1.01 },
                    children: [
                        getRankIcon(index),
                        _jsxs("div", { 
                            className: "flex-1", 
                            children: [
                                _jsxs("h3", { 
                                    className: "font-semibold text-gray-900 dark:text-white flex items-center gap-2", 
                                    children: [
                                        pool.poolType,
                                        _jsxs("span", { 
                                            className: "text-xs text-indigo-600 dark:text-indigo-400", 
                                            children: ["#", pool.id] 
                                        })
                                    ] 
                                }),
                                _jsxs("p", { 
                                    className: "text-sm text-gray-600 dark:text-gray-400", 
                                    children: [
                                        pool.totalMembers, "/", pool.maxMembers, " members • ",
                                        (pool.completionRate * 100).toFixed(0), "% full"
                                    ] 
                                })
                            ] 
                        }),
                        _jsxs("div", { 
                            className: "text-right", 
                            children: [
                                _jsxs("p", { 
                                    className: "font-bold text-gray-900 dark:text-white", 
                                    children: [ethers.formatEther(pool.totalValue.toString()), " ETH"] 
                                }),
                                _jsxs("p", { 
                                    className: "text-sm text-emerald-600 dark:text-emerald-400", 
                                    children: [pool.apy, "% APY"] 
                                })
                            ] 
                        }),
                        _jsx("div", { 
                            children: _jsx("span", { 
                                className: `px-2 py-1 rounded-full text-xs font-semibold ${
                                    pool.isCompleted ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' :
                                    pool.isActive ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300' :
                                    'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                }`, 
                                children: pool.isCompleted ? 'Completed' : pool.isActive ? 'Active' : 'Inactive' 
                            }) 
                        })
                    ]
                }, pool.id)
            ) 
        })
    );

    const renderMembers = () => (
        _jsx("div", { 
            className: "space-y-4", 
            children: leaderboards.mostActiveMembers.map((member, index) => 
                _jsxs(motion.div, {
                    className: "bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4",
                    whileHover: { scale: 1.01 },
                    children: [
                        getRankIcon(index),
                        _jsxs("div", { 
                            className: "flex-1", 
                            children: [
                                _jsxs("h3", { 
                                    className: "font-semibold text-gray-900 dark:text-white", 
                                    children: [member.address.slice(0, 6), "...", member.address.slice(-4)] 
                                }),
                                _jsxs("p", { 
                                    className: "text-sm text-gray-600 dark:text-gray-400", 
                                    children: [member.poolsJoined, " pools joined • ", member.payoutsReceived, " payouts received"] 
                                })
                            ] 
                        }),
                        _jsxs("div", { 
                            className: "text-right", 
                            children: [
                                _jsxs("p", { 
                                    className: "font-bold text-gray-900 dark:text-white", 
                                    children: [ethers.formatEther(member.totalContributed.toString()), " ETH"] 
                                }),
                                _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "Total contributed" })
                            ] 
                        })
                    ]
                }, member.address)
            ) 
        })
    );

    const renderYield = () => (
        _jsx("div", { 
            className: "space-y-4", 
            children: leaderboards.highestYield.map((pool, index) => 
                _jsxs(motion.div, {
                    className: "bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4",
                    whileHover: { scale: 1.01 },
                    children: [
                        getRankIcon(index),
                        _jsxs("div", { 
                            className: "flex-1", 
                            children: [
                                _jsxs("h3", { 
                                    className: "font-semibold text-gray-900 dark:text-white flex items-center gap-2", 
                                    children: [
                                        pool.poolType,
                                        _jsxs("span", { 
                                            className: "text-xs text-indigo-600 dark:text-indigo-400", 
                                            children: ["#", pool.id] 
                                        })
                                    ] 
                                }),
                                _jsxs("p", { 
                                    className: "text-sm text-gray-600 dark:text-gray-400", 
                                    children: [
                                        "By ", pool.creator.slice(0, 6), "...", pool.creator.slice(-4),
                                        " • ", pool.totalMembers, " members"
                                    ] 
                                })
                            ] 
                        }),
                        _jsxs("div", { 
                            className: "text-right", 
                            children: [
                                _jsxs("p", { 
                                    className: "font-bold text-emerald-600 dark:text-emerald-400 text-xl", 
                                    children: [pool.apy, "%"] 
                                }),
                                _jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: "APY" })
                            ] 
                        }),
                        _jsx(Star, { size: 20, className: "text-yellow-500" })
                    ]
                }, pool.id)
            ) 
        })
    );

    return _jsxs("div", { 
        className: "w-full max-w-6xl mx-auto px-4 sm:px-6 py-8", 
        children: [
            // Header
            _jsxs(motion.div, { 
                className: "mb-8 text-center",
                initial: { opacity: 0, y: -20 },
                animate: { opacity: 1, y: 0 },
                children: [
                    _jsx("h1", { className: "text-4xl font-black text-gray-900 dark:text-white mb-2", children: "Leaderboard" }),
                    _jsx("p", { className: "text-gray-600 dark:text-gray-400", children: "Top performers and achievements" })
                ]
            }),

            // Tabs
            _jsx(motion.div, { 
                className: "flex flex-wrap gap-2 mb-8 bg-gray-100 dark:bg-gray-800 p-2 rounded-2xl",
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                transition: { delay: 0.1 },
                children: tabs.map(tab => 
                    _jsxs("button", {
                        onClick: () => setActiveTab(tab.id),
                        className: `flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                            activeTab === tab.id 
                                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`,
                        children: [
                            _jsx(tab.icon, { size: 18 }),
                            tab.label
                        ]
                    }, tab.id)
                ) 
            }),

            // Content
            _jsx(motion.div, { 
                key: activeTab,
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.3 },
                children: activeTab === "creators" ? renderCreators() :
                         activeTab === "pools" ? renderPools() :
                         activeTab === "members" ? renderMembers() :
                         renderYield()
            })
        ] 
    });
};

export default Leaderboard;