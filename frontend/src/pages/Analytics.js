import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useUnityLedgerContract } from "../services/contract";
import { motion } from "framer-motion";
import { 
    TrendingUp, 
    Users, 
    DollarSign, 
    PieChart,
    Activity,
    Target,
    Award,
    BarChart3,
    RefreshCw,
    Coins
} from "lucide-react";
import { ethers } from "ethers";

const Analytics = () => {
    const contract = useUnityLedgerContract();
    
    const [analytics, setAnalytics] = useState({
        totalPools: 0,
        activePools: 0,
        totalMembers: 0,
        totalValue: "0",
        avgPoolSize: 0,
        avgContribution: "0",
        topPoolTypes: [],
        recentActivity: [],
        poolsByStatus: { active: 0, completed: 0, inactive: 0 },
        totalUltBurned: "0",
        avgYield: "0"
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAnalytics = async () => {
        if (!contract) return;
        
        setLoading(true);
        setError(null);
        
        try {
            // Get total pools from nextPoolId
            const nextPoolId = await contract.nextPoolId();
            const totalPools = Number(nextPoolId);
            
            if (totalPools === 0) {
                setAnalytics({
                    totalPools: 0,
                    activePools: 0,
                    totalMembers: 0,
                    totalValue: "0",
                    avgPoolSize: 0,
                    avgContribution: "0",
                    topPoolTypes: [],
                    recentActivity: [],
                    poolsByStatus: { active: 0, completed: 0, inactive: 0 },
                    totalUltBurned: "0",
                    avgYield: "0"
                });
                setLoading(false);
                return;
            }

            // Fetch all pool details
            const poolDetailsArray = await Promise.all(
                Array.from({ length: totalPools }, (_, i) => contract.getPoolDetails(i))
            );

            // Calculate analytics from pool data
            let activePools = 0;
            let totalMembers = 0;
            let totalValueWei = BigInt(0);
            const poolTypeCount = {};
            const statusCount = { active: 0, completed: 0, inactive: 0 };
            let totalFees = 0;

            poolDetailsArray.forEach(pool => {
                // Count active pools
                if (pool.isActive) activePools++;
                
                // Sum total members
                totalMembers += Number(pool.totalMembers);
                
                // Sum total value (contribution * members)
                const poolValue = BigInt(pool.contributionAmount.toString()) * BigInt(pool.totalMembers.toString());
                totalValueWei += poolValue;
                
                // Pool types distribution
                const type = pool.poolType || "Savings Pool";
                poolTypeCount[type] = (poolTypeCount[type] || 0) + 1;
                
                // Status distribution
                if (pool.isCompleted) statusCount.completed++;
                else if (pool.isActive) statusCount.active++;
                else statusCount.inactive++;
                
                // Sum fees for average yield
                totalFees += Number(pool.fee || 0);
            });

            // Get platform stats if available
            let totalUltBurned = "0";
            try {
                const platformStats = await contract.getTotalStats();
                if (platformStats && platformStats[1]) {
                    totalUltBurned = ethers.formatEther(platformStats[1]);
                }
            } catch (err) {
                console.warn("Platform stats not available:", err);
            }

            // Calculate derived metrics
            const totalValue = ethers.formatEther(totalValueWei.toString());
            const avgPoolSize = totalPools > 0 ? totalMembers / totalPools : 0;
            const avgContribution = totalMembers > 0 ? Number(totalValueWei) / totalMembers : 0;
            const avgYield = totalPools > 0 ? totalFees / totalPools : 0;

            // Top pool types
            const topPoolTypes = Object.entries(poolTypeCount)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([type, count]) => ({ type, count }));

            // Recent activity (newest pools first)
            const recentActivity = poolDetailsArray
                .map((pool, index) => ({ ...pool, id: index }))
                .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
                .slice(0, 10);

            setAnalytics({
                totalPools,
                activePools,
                totalMembers,
                totalValue,
                avgPoolSize,
                avgContribution: ethers.formatEther(avgContribution.toString()),
                topPoolTypes,
                recentActivity,
                poolsByStatus: statusCount,
                totalUltBurned,
                avgYield: avgYield.toFixed(1)
            });

        } catch (error) {
            console.error("Error fetching analytics:", error);
            setError("Failed to load analytics data");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchAnalytics();
    }, [contract]);

    const StatCard = ({ title, value, subtitle, icon, color }) => (
        _jsx(motion.div, {
            className: `bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700`,
            whileHover: { scale: 1.02, y: -5 },
            children: _jsxs("div", { 
                className: "flex items-center justify-between", 
                children: [
                    _jsxs("div", { 
                        children: [
                            _jsx("p", { className: "text-sm font-medium text-gray-600 dark:text-gray-400", children: title }),
                            _jsx("p", { className: "text-2xl font-bold text-gray-900 dark:text-white mt-1", children: value }),
                            subtitle && _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 mt-1", children: subtitle })
                        ] 
                    }),
                    _jsx("div", { 
                        className: `${color} p-3 rounded-xl`, 
                        children: icon 
                    })
                ] 
            })
        })
    );

    if (error) {
        return _jsx("div", { 
            className: "w-full max-w-7xl mx-auto px-4 sm:px-6 py-8", 
            children: _jsxs("div", { 
                className: "text-center py-16", 
                children: [
                    _jsx("div", { 
                        className: "bg-red-100 dark:bg-red-900/30 rounded-full p-4 w-fit mx-auto mb-4", 
                        children: _jsx(Activity, { size: 32, className: "text-red-500" }) 
                    }),
                    _jsx("h2", { 
                        className: "text-xl font-bold text-gray-900 dark:text-white mb-2", 
                        children: "Analytics Error" 
                    }),
                    _jsx("p", { 
                        className: "text-gray-600 dark:text-gray-400 mb-6", 
                        children: error 
                    }),
                    _jsx("button", {
                        onClick: fetchAnalytics,
                        className: "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl",
                        children: "Retry"
                    })
                ] 
            }) 
        });
    }

    if (loading) {
        return _jsx("div", { 
            className: "w-full max-w-7xl mx-auto px-4 sm:px-6 py-8", 
            children: _jsxs("div", { 
                className: "space-y-6", 
                children: [
                    _jsx("div", { className: "h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }),
                    _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6", children: [1,2,3,4,5].map(i => 
                        _jsx("div", { className: "h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" }, i)
                    )})
                ] 
            }) 
        });
    }

    return _jsxs("div", { 
        className: "w-full max-w-7xl mx-auto px-4 sm:px-6 py-8", 
        children: [
            // Header
            _jsxs(motion.div, { 
                className: "mb-8 flex justify-between items-center",
                initial: { opacity: 0, y: -20 },
                animate: { opacity: 1, y: 0 },
                children: [
                    _jsxs("div", {
                        children: [
                            _jsx("h1", { className: "text-4xl font-black text-gray-900 dark:text-white mb-2", children: "Analytics" }),
                            _jsx("p", { className: "text-gray-600 dark:text-gray-400", children: "Platform insights and statistics" })
                        ]
                    }),
                    _jsx(motion.button, {
                        onClick: fetchAnalytics,
                        className: "flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 font-semibold transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700",
                        whileHover: { scale: 1.05 },
                        whileTap: { scale: 0.95 },
                        children: _jsx(RefreshCw, { size: 16, className: loading ? "animate-spin" : "" })
                    })
                ]
            }),

            // Main Stats
            _jsx(motion.div, { 
                className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8",
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                transition: { delay: 0.1 },
                children: [
                    _jsx(StatCard, {
                        title: "Total Pools",
                        value: analytics.totalPools.toLocaleString(),
                        subtitle: `${analytics.activePools} active`,
                        icon: _jsx(PieChart, { size: 24, className: "text-indigo-600 dark:text-indigo-400" }),
                        color: "bg-indigo-100 dark:bg-indigo-900/30"
                    }),
                    _jsx(StatCard, {
                        title: "Total Members",
                        value: analytics.totalMembers.toLocaleString(),
                        subtitle: `Avg ${analytics.avgPoolSize.toFixed(1)} per pool`,
                        icon: _jsx(Users, { size: 24, className: "text-emerald-600 dark:text-emerald-400" }),
                        color: "bg-emerald-100 dark:bg-emerald-900/30"
                    }),
                    _jsx(StatCard, {
                        title: "Total Value Locked",
                        value: `${parseFloat(analytics.totalValue).toFixed(2)} ETH`,
                        subtitle: `$${(parseFloat(analytics.totalValue) * 1600).toLocaleString()}`,
                        icon: _jsx(DollarSign, { size: 24, className: "text-purple-600 dark:text-purple-400" }),
                        color: "bg-purple-100 dark:bg-purple-900/30"
                    }),
                    _jsx(StatCard, {
                        title: "Avg Contribution",
                        value: `${parseFloat(analytics.avgContribution).toFixed(3)} ETH`,
                        subtitle: `$${(parseFloat(analytics.avgContribution) * 1600).toFixed(2)}`,
                        icon: _jsx(Target, { size: 24, className: "text-amber-600 dark:text-amber-400" }),
                        color: "bg-amber-100 dark:bg-amber-900/30"
                    }),
                    _jsx(StatCard, {
                        title: "ULT Burned",
                        value: `${parseFloat(analytics.totalUltBurned).toLocaleString()} ULT`,
                        subtitle: `Avg ${analytics.avgYield}% APY`,
                        icon: _jsx(Coins, { size: 24, className: "text-red-600 dark:text-red-400" }),
                        color: "bg-red-100 dark:bg-red-900/30"
                    })
                ]
            }),

            _jsx("div", { 
                className: "grid grid-cols-1 lg:grid-cols-2 gap-8", 
                children: [
                    // Pool Types Chart
                    _jsxs(motion.div, { 
                        className: "bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700",
                        initial: { opacity: 0, x: -20 },
                        animate: { opacity: 1, x: 0 },
                        transition: { delay: 0.2 },
                        children: [
                            _jsxs("h3", { 
                                className: "text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2", 
                                children: [
                                    _jsx(BarChart3, { size: 20 }),
                                    "Pool Types"
                                ] 
                            }),
                            analytics.topPoolTypes.length === 0 ? 
                                _jsx("p", { className: "text-gray-500 dark:text-gray-400 text-center py-8", children: "No pool data available" }) :
                                _jsx("div", { 
                                    className: "space-y-3", 
                                    children: analytics.topPoolTypes.map((item, index) => {
                                        const percentage = (item.count / analytics.totalPools) * 100;
                                        return _jsxs("div", { 
                                            className: "flex items-center justify-between", 
                                            children: [
                                                _jsxs("div", { 
                                                    className: "flex items-center gap-3", 
                                                    children: [
                                                        _jsx("div", { 
                                                            className: `w-3 h-3 rounded-full bg-gradient-to-r ${
                                                                index === 0 ? 'from-indigo-500 to-purple-600' :
                                                                index === 1 ? 'from-emerald-500 to-teal-600' :
                                                                index === 2 ? 'from-amber-500 to-orange-600' :
                                                                index === 3 ? 'from-rose-500 to-pink-600' :
                                                                'from-gray-500 to-gray-600'
                                                            }` 
                                                        }),
                                                        _jsx("span", { className: "text-sm font-medium text-gray-900 dark:text-white", children: item.type }),
                                                        _jsx("span", { className: "text-xs text-gray-500 dark:text-gray-400", children: item.count })
                                                    ] 
                                                }),
                                                _jsxs("span", { 
                                                    className: "text-sm font-semibold text-gray-600 dark:text-gray-400", 
                                                    children: [percentage.toFixed(1), "%"] 
                                                })
                                            ] 
                                        }, item.type);
                                    }) 
                                })
                        ] 
                    }),

                    // Pool Status Distribution
                    _jsxs(motion.div, { 
                        className: "bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700",
                        initial: { opacity: 0, x: 20 },
                        animate: { opacity: 1, x: 0 },
                        transition: { delay: 0.3 },
                        children: [
                            _jsxs("h3", { 
                                className: "text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2", 
                                children: [
                                    _jsx(Activity, { size: 20 }),
                                    "Pool Status"
                                ] 
                            }),
                            _jsx("div", { 
                                className: "space-y-4", 
                                children: [
                                    {
                                        label: "Active",
                                        count: analytics.poolsByStatus.active,
                                        color: "from-green-500 to-emerald-600",
                                        bgColor: "bg-green-100 dark:bg-green-900/30"
                                    },
                                    {
                                        label: "Completed", 
                                        count: analytics.poolsByStatus.completed,
                                        color: "from-blue-500 to-indigo-600",
                                        bgColor: "bg-blue-100 dark:bg-blue-900/30"
                                    },
                                    {
                                        label: "Inactive",
                                        count: analytics.poolsByStatus.inactive,
                                        color: "from-gray-500 to-gray-600", 
                                        bgColor: "bg-gray-100 dark:bg-gray-700"
                                    }
                                ].map(status => {
                                    const percentage = analytics.totalPools > 0 ? (status.count / analytics.totalPools) * 100 : 0;
                                    return _jsxs("div", { 
                                        className: `${status.bgColor} rounded-xl p-4`, 
                                        children: [
                                            _jsxs("div", { 
                                                className: "flex justify-between items-center mb-2", 
                                                children: [
                                                    _jsx("span", { className: "font-semibold text-gray-900 dark:text-white", children: status.label }),
                                                    _jsx("span", { className: "text-sm font-bold text-gray-600 dark:text-gray-400", children: status.count })
                                                ] 
                                            }),
                                            _jsx("div", { 
                                                className: "w-full bg-white dark:bg-gray-600 rounded-full h-2", 
                                                children: _jsx("div", { 
                                                    className: `bg-gradient-to-r ${status.color} h-2 rounded-full transition-all duration-500`, 
                                                    style: { width: `${percentage}%` } 
                                                }) 
                                            }),
                                            _jsxs("p", { 
                                                className: "text-xs text-gray-500 dark:text-gray-400 mt-1", 
                                                children: [percentage.toFixed(1), "% of all pools"] 
                                            })
                                        ] 
                                    }, status.label);
                                }) 
                            })
                        ] 
                    })
                ] 
            }),

            // Recent Activity
            _jsxs(motion.div, { 
                className: "mt-8 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700",
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                transition: { delay: 0.4 },
                children: [
                    _jsxs("h3", { 
                        className: "text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2", 
                        children: [
                            _jsx(TrendingUp, { size: 20 }),
                            "Recent Pool Activity"
                        ] 
                    }),
                    analytics.recentActivity.length === 0 ? 
                        _jsx("p", { className: "text-gray-500 dark:text-gray-400 text-center py-8", children: "No recent activity" }) :
                        _jsx("div", { 
                            className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", 
                            children: analytics.recentActivity.slice(0, 6).map((pool, index) => {
                                const contributionEth = ethers.formatEther(pool.contributionAmount.toString());
                                return _jsxs("div", { 
                                    className: "border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors", 
                                    children: [
                                        _jsxs("div", { 
                                            className: "flex justify-between items-start mb-2", 
                                            children: [
                                                _jsxs("span", { 
                                                    className: "text-xs font-semibold text-indigo-600 dark:text-indigo-400", 
                                                    children: ["Pool #", pool.id] 
                                                }),
                                                _jsx("span", { 
                                                    className: `text-xs px-2 py-1 rounded-full ${
                                                        pool.isCompleted ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' :
                                                        pool.isActive ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300' :
                                                        'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                                    }`, 
                                                    children: pool.isCompleted ? 'Completed' : pool.isActive ? 'Active' : 'Inactive' 
                                                })
                                            ] 
                                        }),
                                        _jsx("h4", { className: "font-semibold text-gray-900 dark:text-white text-sm mb-1", children: pool.poolType || "Savings Pool" }),
                                        _jsxs("p", { 
                                            className: "text-xs text-gray-600 dark:text-gray-400", 
                                            children: [contributionEth, " ETH • ", pool.totalMembers.toString(), "/", pool.maxMembers.toString(), " members"] 
                                        }),
                                        _jsx("p", { 
                                            className: "text-xs text-gray-500 dark:text-gray-400 mt-2", 
                                            children: new Date(Number(pool.createdAt) * 1000).toLocaleDateString() 
                                        })
                                    ] 
                                }, index);
                            }) 
                        })
                ] 
            })
        ] 
    });
};

export default Analytics;