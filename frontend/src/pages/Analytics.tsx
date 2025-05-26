import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/pages/Analytics.tsx
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
    BarChart3
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
        poolsByStatus: { active: 0, completed: 0, inactive: 0 }
    });
    const [loading, setLoading] = useState(true);

    const fetchAnalytics = async () => {
        if (!contract) return;
        
        setLoading(true);
        try {
            // Get pool stats from contract
            const [totalPools, activePools, totalMembers, totalValue] = await contract.getPoolStats();
            
            // Fetch all pool details for deeper analytics
            const nextPoolId = await contract.nextPoolId();
            const total = Number(nextPoolId);
            
            let poolDetails = [];
            if (total > 0) {
                const poolDetailsArray = await Promise.all(
                    Array.from({ length: total }, (_, i) => contract.getPoolDetails(i))
                );
                poolDetails = poolDetailsArray;
            }

            // Calculate pool type distribution
            const poolTypeCount = {};
            const statusCount = { active: 0, completed: 0, inactive: 0 };
            let totalContributionValue = 0;

            poolDetails.forEach(pool => {
                // Pool types
                const type = pool.poolType || "Unknown";
                poolTypeCount[type] = (poolTypeCount[type] || 0) + 1;
                
                // Status
                if (pool.isCompleted) statusCount.completed++;
                else if (pool.isActive) statusCount.active++;
                else statusCount.inactive++;
                
                // Total contribution values
                totalContributionValue += Number(pool.contributionAmount) * Number(pool.totalMembers);
            });

            const topPoolTypes = Object.entries(poolTypeCount)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([type, count]) => ({ type, count }));

            const avgContribution = poolDetails.length > 0 
                ? totalContributionValue / poolDetails.reduce((sum, p) => sum + Number(p.totalMembers), 0)
                : 0;

            setAnalytics({
                totalPools: Number(totalPools),
                activePools: Number(activePools),
                totalMembers: Number(totalMembers),
                totalValue: ethers.formatEther(totalValue.toString()),
                avgPoolSize: poolDetails.length > 0 ? Number(totalMembers) / Number(totalPools) : 0,
                avgContribution: ethers.formatEther(avgContribution.toString()),
                topPoolTypes,
                poolsByStatus: statusCount,
                recentActivity: poolDetails
                    .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
                    .slice(0, 10)
            });
        } catch (error) {
            console.error("Error fetching analytics:", error);
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

    if (loading) {
        return _jsx("div", { 
            className: "w-full max-w-7xl mx-auto px-4 sm:px-6 py-8", 
            children: _jsxs("div", { 
                className: "space-y-6", 
                children: [
                    _jsx("div", { className: "h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" }),
                    _jsx("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6", children: [1,2,3,4].map(i => 
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
                className: "mb-8",
                initial: { opacity: 0, y: -20 },
                animate: { opacity: 1, y: 0 },
                children: [
                    _jsx("h1", { className: "text-4xl font-black text-gray-900 dark:text-white mb-2", children: "Analytics" }),
                    _jsx("p", { className: "text-gray-600 dark:text-gray-400", children: "Platform insights and statistics" })
                ]
            }),

            // Main Stats
            _jsx(motion.div, { 
                className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8",
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
                                                children: ["Pool #", pool.id.toString()] 
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
                                    _jsx("h4", { className: "font-semibold text-gray-900 dark:text-white text-sm mb-1", children: pool.poolType }),
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