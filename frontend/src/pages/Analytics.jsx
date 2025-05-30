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

            // Fetch all pool details with error handling
            const poolDetailsArray = [];
            for (let i = 0; i < totalPools; i++) {
                try {
                    const pool = await contract.getPoolDetails(i);
                    poolDetailsArray.push(pool);
                } catch (err) {
                    console.warn(`Failed to fetch pool ${i}:`, err);
                    // Skip this pool but continue
                }
            }

            if (poolDetailsArray.length === 0) {
                throw new Error("No pool data available");
            }

            // Calculate analytics from pool data with null checks
            let activePools = 0;
            let totalMembers = 0;
            let totalValueWei = BigInt(0);
            const poolTypeCount = {};
            const statusCount = { active: 0, completed: 0, inactive: 0 };
            let totalFees = 0;

            poolDetailsArray.forEach(pool => {
                if (!pool) return;

                // Count active pools
                if (pool.isActive) activePools++;
                
                // Sum total members (with null check)
                const memberCount = pool.totalMembers ? Number(pool.totalMembers) : 0;
                totalMembers += memberCount;
                
                // Sum total value (with null checks)
                if (pool.contributionAmount && pool.totalMembers) {
                    try {
                        const contribution = BigInt(pool.contributionAmount.toString());
                        const members = BigInt(memberCount);
                        const poolValue = contribution * members;
                        totalValueWei += poolValue;
                    } catch (err) {
                        console.warn("Error calculating pool value:", err);
                    }
                }
                
                // Pool types distribution
                const type = pool.poolType || "Savings";
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
            const totalValue = totalValueWei > 0 ? ethers.formatEther(totalValueWei.toString()) : "0";
            const avgPoolSize = totalPools > 0 ? totalMembers / totalPools : 0;
            const avgContribution = totalMembers > 0 ? Number(totalValueWei) / totalMembers : 0;
            const avgYield = totalPools > 0 ? totalFees / totalPools : 0;

            // Top pool types
            const topPoolTypes = Object.entries(poolTypeCount)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([type, count]) => ({ type, count }));

            // Recent activity (newest pools first) with null checks
            const recentActivity = poolDetailsArray
                .map((pool, index) => ({ ...pool, id: index }))
                .filter(pool => pool && pool.createdAt) // Filter out null pools
                .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
                .slice(0, 10);

            setAnalytics({
                totalPools: poolDetailsArray.length,
                activePools,
                totalMembers,
                totalValue,
                avgPoolSize,
                avgContribution: avgContribution > 0 ? ethers.formatEther(avgContribution.toString()) : "0",
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
        <motion.div
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
            whileHover={{ scale: 1.02, y: -5 }}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
                    {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
                </div>
                <div className={`${color} p-3 rounded-xl`}>
                    {icon}
                </div>
            </div>
        </motion.div>
    );

    if (error) {
        return (
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <div className="text-center py-16">
                    <div className="bg-red-100 dark:bg-red-900/30 rounded-full p-4 w-fit mx-auto mb-4">
                        <Activity size={32} className="text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Analytics Error</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
                    <button
                        onClick={fetchAnalytics}
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <div className="space-y-6">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                        {[1,2,3,4,5].map(i => 
                            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse"></div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {/* Header */}
            <motion.div 
                className="mb-8 flex justify-between items-center"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">Analytics</h1>
                    <p className="text-gray-600 dark:text-gray-400">Platform insights and statistics</p>
                </div>
                <motion.button
                    onClick={fetchAnalytics}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 font-semibold transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                </motion.button>
            </motion.div>

            {/* Main Stats */}
            <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <StatCard
                    title="Total Pools"
                    value={analytics.totalPools.toLocaleString()}
                    subtitle={`${analytics.activePools} active`}
                    icon={<PieChart size={24} className="text-indigo-600 dark:text-indigo-400" />}
                    color="bg-indigo-100 dark:bg-indigo-900/30"
                />
                <StatCard
                    title="Total Members"
                    value={analytics.totalMembers.toLocaleString()}
                    subtitle={`Avg ${analytics.avgPoolSize.toFixed(1)} per pool`}
                    icon={<Users size={24} className="text-emerald-600 dark:text-emerald-400" />}
                    color="bg-emerald-100 dark:bg-emerald-900/30"
                />
                <StatCard
                    title="Total Value Locked"
                    value={`${parseFloat(analytics.totalValue).toFixed(2)} ETH`}
                    subtitle={`$${(parseFloat(analytics.totalValue) * 1600).toLocaleString()}`}
                    icon={<DollarSign size={24} className="text-purple-600 dark:text-purple-400" />}
                    color="bg-purple-100 dark:bg-purple-900/30"
                />
                <StatCard
                    title="Avg Contribution"
                    value={`${parseFloat(analytics.avgContribution).toFixed(3)} ETH`}
                    subtitle={`$${(parseFloat(analytics.avgContribution) * 1600).toFixed(2)}`}
                    icon={<Target size={24} className="text-amber-600 dark:text-amber-400" />}
                    color="bg-amber-100 dark:bg-amber-900/30"
                />
                <StatCard
                    title="ULT Burned"
                    value={`${parseFloat(analytics.totalUltBurned).toLocaleString()} ULT`}
                    subtitle={`Avg ${analytics.avgYield}% APY`}
                    icon={<Coins size={24} className="text-red-600 dark:text-red-400" />}
                    color="bg-red-100 dark:bg-red-900/30"
                />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pool Types Chart */}
                <motion.div 
                    className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <BarChart3 size={20} />
                        Pool Types
                    </h3>
                    {analytics.topPoolTypes.length === 0 ? 
                        <p className="text-gray-500 dark:text-gray-400 text-center py-8">No pool data available</p> :
                        <div className="space-y-3">
                            {analytics.topPoolTypes.map((item, index) => {
                                const percentage = (item.count / analytics.totalPools) * 100;
                                return (
                                    <div key={item.type} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${
                                                index === 0 ? 'from-indigo-500 to-purple-600' :
                                                index === 1 ? 'from-emerald-500 to-teal-600' :
                                                index === 2 ? 'from-amber-500 to-orange-600' :
                                                index === 3 ? 'from-rose-500 to-pink-600' :
                                                'from-gray-500 to-gray-600'
                                            }`} />
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">{item.type}</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">{item.count}</span>
                                        </div>
                                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                                            {percentage.toFixed(1)}%
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    }
                </motion.div>

                {/* Pool Status Distribution */}
                <motion.div 
                    className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Activity size={20} />
                        Pool Status
                    </h3>
                    <div className="space-y-4">
                        {[
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
                            return (
                                <div key={status.label} className={`${status.bgColor} rounded-xl p-4`}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-semibold text-gray-900 dark:text-white">{status.label}</span>
                                        <span className="text-sm font-bold text-gray-600 dark:text-gray-400">{status.count}</span>
                                    </div>
                                    <div className="w-full bg-white dark:bg-gray-600 rounded-full h-2">
                                        <div 
                                            className={`bg-gradient-to-r ${status.color} h-2 rounded-full transition-all duration-500`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {percentage.toFixed(1)}% of all pools
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            </div>

            {/* Recent Activity */}
            <motion.div 
                className="mt-8 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <TrendingUp size={20} />
                    Recent Pool Activity
                </h3>
                {analytics.recentActivity.length === 0 ? 
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">No recent activity</p> :
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {analytics.recentActivity.slice(0, 6).map((pool, index) => {
                            if (!pool || !pool.contributionAmount) return null;
                            
                            const contributionEth = ethers.formatEther(pool.contributionAmount.toString());
                            return (
                                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                                            Pool #{pool.id}
                                        </span>
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                            pool.isCompleted ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' :
                                            pool.isActive ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300' :
                                            'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                        }`}>
                                            {pool.isCompleted ? 'Completed' : pool.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                                        {pool.poolType || "Savings Pool"}
                                    </h4>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                        {contributionEth} ETH • {(pool.totalMembers || 0).toString()}/{(pool.maxMembers || 0).toString()} members
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                        {pool.createdAt ? new Date(Number(pool.createdAt) * 1000).toLocaleDateString() : 'Unknown date'}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                }
            </motion.div>
        </div>
    );
};

export default Analytics;