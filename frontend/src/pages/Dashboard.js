import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/pages/Dashboard.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useUnityLedgerContract } from "../services/contract";
import { useWallet } from "../context/WalletProvider";
import { useTheme } from "../context/ThemeProvider";
import UltBalanceAndClaim from "../components/UltBalanceAndClaim";
import { Sparkles, ArrowRight, TrendingUp, Shield, PieChart, Users, DollarSign, Clock, Wallet, Gift } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ethers } from "ethers";
const Dashboard = () => {
    const contract = useUnityLedgerContract();
    const { account } = useWallet();
    const { isDark } = useTheme();
    const [poolCount, setPoolCount] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [pools, setPools] = useState([]);
    // Dummy stats for the stats cards
    const [stats] = useState({
        tvl: "$4.2M",
        users: "1,452",
        volume24h: "$238K",
        growth: "+12.6%"
    });
    // Framer motion animation variants
    const fadeInUp = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };
    const staggered = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };
    const fadeIn = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
    };
    // Dummy recent activities for the bottom feed
    const activities = [
        {
            id: 1,
            type: "deposit",
            pool: 3,
            user: "0xa1b2...c3d4",
            amount: "500 DAI",
            time: "2 hours ago",
            icon: _jsx(Wallet, { size: 16, className: "text-green-500" })
        },
        {
            id: 2,
            type: "withdrawal",
            pool: 1,
            user: "0x9f8e...7d6c",
            amount: "1,200 USDC",
            time: "5 hours ago",
            icon: _jsx(DollarSign, { size: 16, className: "text-red-500" })
        },
        {
            id: 3,
            type: "payout",
            pool: 2,
            user: "0xb3a2...4f5e",
            amount: "5,000 DAI",
            time: "1 day ago",
            icon: _jsx(Gift, { size: 16, className: "text-indigo-500" })
        }
    ];
    // Fetch pool data from the contract (and membership status if account exists)
    useEffect(() => {
        if (!contract) {
            console.log("Contract not connected.");
            return;
        }
        const fetchPools = async () => {
            setIsLoading(true);
            try {
                const nextPoolId = await contract.nextPoolId();
                const total = Number(nextPoolId);
                setPoolCount(total);
                const poolDetailsArray = await Promise.all(Array.from({ length: total }, (_, i) => contract.getPoolDetails(i)));
                // Map over fetched pools and check membership if account is connected
                const formattedPools = await Promise.all(poolDetailsArray.map(async (p) => {
                    const members = account ? await contract.getPoolMembers(p[0]) : [];
                    const joined = account
                        ? members.some((member) => member.wallet.toLowerCase() === account.toLowerCase())
                        : false;
                    return {
                        id: BigInt(p[0].toString()),
                        creator: p[1],
                        contributionAmount: BigInt(p[2].toString()),
                        cycleDuration: BigInt(p[3].toString()),
                        maxMembers: BigInt(p[4].toString()),
                        totalMembers: BigInt(p[5].toString()),
                        currentCycle: BigInt(p[6].toString()),
                        lastPayoutTime: BigInt(p[7].toString()),
                        isActive: p[8],
                        poolType: p.length > 9 ? p[9] : undefined,
                        fee: p.length > 10 ? BigInt(p[10].toString()) : undefined,
                        joined // Indicates whether the connected account is a member of this pool
                    };
                }));
                setPools(formattedPools);
            }
            catch (error) {
                console.error("Error fetching pools:", error);
            }
            setIsLoading(false);
        };
        fetchPools();
    }, [contract, account]);
    // Conversion helper: Assume 1 ETH = $1600 USD (adjust conversion factor as necessary)
    const convertEthToUSD = (weiValue) => {
        const ethValue = parseFloat(ethers.formatEther(weiValue.toString()));
        return (ethValue * 1600).toFixed(2);
    };
    return (_jsxs("div", { className: "w-full max-w-7xl mx-auto px-4 sm:px-6 py-8", children: [_jsxs(motion.section, { className: "relative rounded-2xl overflow-hidden mb-12", initial: "hidden", animate: "visible", variants: fadeInUp, children: [_jsx("div", { className: `absolute inset-0 ${isDark
                            ? "bg-gradient-to-br from-indigo-900 to-purple-900 opacity-90"
                            : "bg-gradient-to-br from-indigo-600 to-purple-700 opacity-90"}` }), _jsx("div", { className: "absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-20" }), _jsxs("div", { className: "relative z-10 py-16 px-8 text-center", children: [_jsxs(motion.div, { className: "inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-white text-sm font-medium mb-6 backdrop-blur-sm", initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.2 }, children: [_jsx(Sparkles, { size: 16, className: "text-yellow-300" }), _jsx("span", { children: "Decentralized Stokvel" })] }), _jsxs(motion.h1, { className: "text-4xl sm:text-5xl font-bold text-white mb-4", initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.3 }, children: ["Welcome to ", _jsx("span", { className: "text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300", children: "UnityLedger" })] }), _jsx(motion.img, { src: "/images/UL.png", alt: "UnityLedger Logo", className: "mx-auto mb-6 h-16 sm:h-20", initial: { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.6 } }), _jsx(motion.p, { className: "text-xl text-white/90 mb-8 max-w-2xl mx-auto", initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.5 }, children: account
                                    ? `Connected as ${account.slice(0, 6)}...${account.slice(-4)}`
                                    : "Connect your wallet to join decentralized savings and lending pools" }), !account && (_jsx(motion.button, { className: "bg-white dark:bg-white/90 text-indigo-700 font-semibold py-3 px-6 rounded-lg hover:bg-indigo-50 dark:hover:bg-white/80 transition-all shadow-md", whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.6 }, children: "Connect Wallet" }))] })] }), _jsx(motion.section, { className: "mb-12", variants: staggered, initial: "hidden", animate: "visible", transition: { delay: 0.2 }, children: _jsx("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-6", children: [
                        {
                            title: "Total Value Locked",
                            value: stats.tvl,
                            change: stats.growth,
                            icon: _jsx(PieChart, { size: 24, className: "text-indigo-600 dark:text-indigo-400" }),
                            bg: "bg-indigo-100 dark:bg-indigo-900/40"
                        },
                        {
                            title: "Active Users",
                            value: stats.users,
                            change: "+5.2%",
                            icon: _jsx(Users, { size: 24, className: "text-purple-600 dark:text-purple-400" }),
                            bg: "bg-purple-100 dark:bg-purple-900/40"
                        },
                        {
                            title: "24h Volume",
                            value: stats.volume24h,
                            change: "+8.7%",
                            icon: _jsx(TrendingUp, { size: 24, className: "text-cyan-600 dark:text-cyan-400" }),
                            bg: "bg-cyan-100 dark:bg-cyan-900/40"
                        },
                        {
                            title: "Security Rating",
                            value: "A+",
                            change: "Audited",
                            icon: _jsx(Shield, { size: 24, className: "text-green-600 dark:text-green-400" }),
                            bg: "bg-green-100 dark:bg-green-900/40"
                        }
                    ].map((stat, index) => (_jsx(motion.div, { variants: fadeIn, whileHover: { scale: 1.03, y: -5 }, className: "bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-all", children: _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: `${stat.bg} p-3 rounded-lg`, children: stat.icon }), _jsxs("div", { children: [_jsx("p", { className: "text-gray-500 dark:text-gray-400 text-sm", children: stat.title }), _jsxs("div", { className: "flex items-end gap-2", children: [_jsx("h3", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: stat.value }), _jsx("span", { className: "text-xs font-medium text-green-600 dark:text-green-400", children: stat.change })] })] })] }) }, index))) }) }), _jsxs(motion.section, { initial: "hidden", animate: "visible", variants: fadeInUp, transition: { delay: 0.4 }, className: "mb-12", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-800 dark:text-white", children: isLoading ? (_jsx("div", { className: "bg-gray-200 dark:bg-gray-700 animate-pulse h-8 w-40 rounded" })) : (_jsxs("span", { className: "flex items-center", children: ["Explore", " ", _jsx("span", { className: "text-indigo-600 dark:text-indigo-400 mx-1", children: poolCount || 0 }), " ", "Available Pools"] })) }), _jsxs(Link, { to: "/join-create", className: "inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium transition-colors", children: ["Create New Pool", _jsx(ArrowRight, { size: 16, className: "ml-1" })] })] }), _jsx(AnimatePresence, { children: isLoading ? (_jsx(motion.div, { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", exit: { opacity: 0 }, children: [1, 2, 3].map((i) => (_jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-xl p-6 h-64 shadow-sm animate-pulse", children: [_jsx("div", { className: "bg-gray-200 dark:bg-gray-700 h-6 w-1/3 mb-4 rounded" }), _jsx("div", { className: "bg-gray-200 dark:bg-gray-700 h-4 w-2/3 mb-2 rounded" }), _jsx("div", { className: "bg-gray-200 dark:bg-gray-700 h-4 w-1/2 mb-6 rounded" }), _jsxs("div", { className: "flex gap-3 mb-6", children: [_jsx("div", { className: "bg-gray-200 dark:bg-gray-700 h-10 w-20 rounded-full" }), _jsx("div", { className: "bg-gray-200 dark:bg-gray-700 h-10 w-20 rounded-full" })] }), _jsx("div", { className: "bg-gray-200 dark:bg-gray-700 h-20 w-full rounded" })] }, i))) })) : (_jsx(motion.div, { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.5 }, children: pools.map((pool) => {
                                const poolIdStr = pool.id.toString();
                                const totalMembersStr = pool.totalMembers.toString();
                                const cycleDurationDays = Number(pool.cycleDuration) / 86400;
                                const contributionEth = ethers.formatEther(pool.contributionAmount.toString());
                                const contributionUSD = parseFloat(contributionEth) * 1600; // Adjust conversion factor as necessary
                                // Determine action text:
                                // If connected account is the creator or already joined, show "Contribute"; otherwise, "Join Pool"
                                const actionText = (pool.creator.toLowerCase() === account?.toLowerCase() || pool.joined)
                                    ? "Contribute"
                                    : "Join Pool";
                                return (_jsx(Link, { to: `/pool/${poolIdStr}`, children: _jsxs(motion.div, { whileHover: { scale: 1.02, y: -5 }, className: "bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-all cursor-pointer", children: [_jsxs("div", { className: "flex justify-between items-start mb-4", children: [_jsxs("div", { children: [_jsxs("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300", children: ["Pool #", poolIdStr] }), _jsxs("h3", { className: "text-lg font-semibold mt-2 text-gray-900 dark:text-white", children: ["Creator: ", pool.creator.slice(0, 6), "...", pool.creator.slice(-4)] })] }), _jsx("div", { className: "bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-lg", children: _jsx(PieChart, { size: 20, className: "text-indigo-600 dark:text-indigo-400" }) })] }), _jsxs("p", { className: "text-sm text-gray-600 dark:text-gray-300 mb-4", children: ["Contribution: ", contributionEth, " ETH ($", contributionUSD.toFixed(2), "), Cycle Duration: ", cycleDurationDays.toFixed(2), " days, APY: ", pool.fee ? pool.fee.toString() + "%" : "N/A"] }), _jsxs("div", { className: "flex flex-wrap gap-2 mb-4", children: [_jsxs("span", { className: "px-2 py-1 rounded-md text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300", children: [totalMembersStr, " Members"] }), _jsxs("span", { className: "px-2 py-1 rounded-md text-xs font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300", children: ["Cycle ", pool.currentCycle.toString()] }), _jsx("span", { className: "px-2 py-1 rounded-md text-xs font-medium bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300", children: pool.isActive ? "Active" : "Inactive" })] }), account && pool.creator.toLowerCase() !== account.toLowerCase() && pool.joined && (_jsx("div", { className: "mb-4", children: _jsx(UltBalanceAndClaim, { poolId: poolIdStr }) })), _jsx(motion.button, { whileHover: { scale: 1.03 }, whileTap: { scale: 0.98 }, className: "w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium text-sm transition-colors", children: actionText })] }) }, poolIdStr));
                            }) })) })] }), _jsxs(motion.section, { initial: "hidden", animate: "visible", variants: fadeInUp, transition: { delay: 0.6 }, children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-800 dark:text-white", children: "Recent Activity" }), _jsxs(Link, { to: "/activity", className: "inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium transition-colors", children: ["View All", _jsx(ArrowRight, { size: 16, className: "ml-1" })] })] }), _jsx("div", { className: "bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700", children: _jsx("ul", { className: "divide-y divide-gray-100 dark:divide-gray-700", children: activities.map((activity) => (_jsx(motion.li, { whileHover: {
                                    backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.01)"
                                }, className: "px-6 py-4", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "flex-shrink-0", children: activity.icon }), _jsxs("div", { className: "ml-4", children: [_jsxs("p", { className: "text-sm font-medium text-gray-900 dark:text-white", children: [activity.type === "deposit" && "Deposit to", activity.type === "withdrawal" && "Withdrawal from", activity.type === "payout" && "Payout from", " ", _jsxs("span", { className: "text-indigo-600 dark:text-indigo-400", children: ["Pool #", activity.pool] })] }), _jsxs("p", { className: "text-xs text-gray-500 dark:text-gray-400", children: [activity.user, " \u2022 ", activity.amount] })] }), _jsx("div", { className: "ml-auto", children: _jsxs("div", { className: "flex items-center", children: [_jsx(Clock, { size: 12, className: "text-gray-400 mr-1" }), _jsx("span", { className: "text-xs text-gray-500 dark:text-gray-400", children: activity.time })] }) })] }) }, activity.id))) }) })] }), _jsx(motion.section, { className: "mt-16 mb-8", initial: "hidden", animate: "visible", variants: fadeInUp, transition: { delay: 0.8 }, children: _jsxs("div", { className: `relative rounded-2xl overflow-hidden ${isDark ? "bg-gradient-to-r from-purple-900 to-indigo-900" : "bg-gradient-to-r from-purple-600 to-indigo-600"}`, children: [_jsx("div", { className: "absolute inset-0 bg-[url('/images/dots-pattern.svg')] opacity-10" }), _jsxs("div", { className: "relative z-10 p-8 md:p-12 text-center", children: [_jsx("h2", { className: "text-3xl font-bold text-white mb-4", children: "Ready to Transform Your Savings?" }), _jsx("p", { className: "text-white/80 max-w-2xl mx-auto mb-8", children: "Join thousands who are already using UnityLedger to build wealth together through decentralized stokvels and savings pools." }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-4 justify-center", children: [_jsx(motion.button, { whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, className: "bg-white text-indigo-700 font-semibold py-3 px-8 rounded-lg shadow-lg", children: "Get Started" }), _jsx(motion.button, { whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 }, className: "bg-transparent border border-white text-white font-semibold py-3 px-8 rounded-lg", children: "Learn More" })] })] })] }) }), _jsxs("footer", { className: "mt-16 mb-8 pt-8 border-t border-gray-200 dark:border-gray-700", children: [_jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-8", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-900 dark:text-white mb-4", children: "Product" }), _jsxs("ul", { className: "space-y-2", children: [_jsx("li", { children: _jsx("a", { href: "#", className: "text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400", children: "Features" }) }), _jsx("li", { children: _jsx("a", { href: "#", className: "text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400", children: "Roadmap" }) }), _jsx("li", { children: _jsx("a", { href: "#", className: "text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400", children: "Security" }) }), _jsx("li", { children: _jsx("a", { href: "#", className: "text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400", children: "Pricing" }) })] })] }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-900 dark:text-white mb-4", children: "Resources" }), _jsxs("ul", { className: "space-y-2", children: [_jsx("li", { children: _jsx("a", { href: "#", className: "text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400", children: "Documentation" }) }), _jsx("li", { children: _jsx("a", { href: "#", className: "text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400", children: "Guides" }) }), _jsx("li", { children: _jsx("a", { href: "#", className: "text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400", children: "Support" }) }), _jsx("li", { children: _jsx("a", { href: "#", className: "text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400", children: "API" }) })] })] }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-900 dark:text-white mb-4", children: "Company" }), _jsxs("ul", { className: "space-y-2", children: [_jsx("li", { children: _jsx("a", { href: "#", className: "text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400", children: "About" }) }), _jsx("li", { children: _jsx("a", { href: "#", className: "text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400", children: "Blog" }) }), _jsx("li", { children: _jsx("a", { href: "#", className: "text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400", children: "Jobs" }) }), _jsx("li", { children: _jsx("a", { href: "#", className: "text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400", children: "Partners" }) })] })] }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-900 dark:text-white mb-4", children: "Legal" }), _jsxs("ul", { className: "space-y-2", children: [_jsx("li", { children: _jsx("a", { href: "#", className: "text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400", children: "Privacy" }) }), _jsx("li", { children: _jsx("a", { href: "#", className: "text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400", children: "Terms" }) }), _jsx("li", { children: _jsx("a", { href: "#", className: "text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400", children: "Cookies" }) }), _jsx("li", { children: _jsx("a", { href: "#", className: "text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400", children: "Licenses" }) })] })] })] }), _jsx("div", { className: "mt-12 text-center", children: _jsx("p", { className: "text-sm text-gray-500 dark:text-gray-400", children: "\u00A9 2025 UnityLedger. All rights reserved." }) })] })] }));
};
export default Dashboard;
