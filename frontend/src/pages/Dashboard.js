import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useUnityLedgerContract } from "../services/contract";
import { useWallet } from "../context/WalletProvider";
import { useTheme } from "../context/ThemeProvider";
import UltBalanceAndClaim from "../components/UltBalanceAndClaim";
import { toast } from "react-toastify";
import { 
  Sparkles, 
  ArrowRight, 
  TrendingUp, 
  Shield, 
  PieChart, 
  Users, 
  DollarSign, 
  Clock, 
  Wallet, 
  Gift, 
  AlertCircle,
  Plus,
  Activity,
  Star,
  Zap,
  Target,
  Award,
  Coins,
  TrendingDown,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ethers } from "ethers";

const Dashboard = () => {
    const contract = useUnityLedgerContract();
    const { account } = useWallet();
    const { isDark } = useTheme();
    const [poolCount, setPoolCount] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [pools, setPools] = useState([]);
    const [error, setError] = useState(null);
    const [activities, setActivities] = useState([]);
    const [activitiesLoading, setActivitiesLoading] = useState(true);
    const [addresses, setAddresses] = useState(null);
    const [ultBalance, setUltBalance] = useState('0');
    const [ultPrice, setUltPrice] = useState('0.05'); // Mock price

    // Network detection
    const getNetworkAddresses = async () => {
        if (!window.ethereum) return null;
        
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const network = await provider.getNetwork();
            const chainId = Number(network.chainId);
            
            if (chainId === 50311) {
                return {
                    ultToken: "0x2Da2331B2a0E669785e8EAAadc19e63e20E19E5f"
                };
            } else if (chainId === 4202) {
                return {
                    ultToken: "0x9C6adb7DC4b27fbFe381D726606248Ad258F4228"
                };
            } else {
                return {
                    ultToken: "0x9C6adb7DC4b27fbFe381D726606248Ad258F4228"
                };
            }
        } catch (error) {
            return {
                ultToken: "0x9C6adb7DC4b27fbFe381D726606248Ad258F4228"
            };
        }
    };

    const ULT_ABI = [
        "function balanceOf(address) external view returns (uint256)"
    ];

    const getULTContract = async () => {
        if (!window.ethereum || !addresses) return null;
        const provider = new ethers.BrowserProvider(window.ethereum);
        return new ethers.Contract(addresses.ultToken, ULT_ABI, provider);
    };

    // Initialize addresses
    useEffect(() => {
        const initAddresses = async () => {
            const networkAddresses = await getNetworkAddresses();
            setAddresses(networkAddresses);
        };
        initAddresses();
    }, []);

    // Enhanced animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { 
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30, scale: 0.9 },
        visible: { 
            opacity: 1, 
            y: 0, 
            scale: 1,
            transition: { 
                type: "spring", 
                stiffness: 300, 
                damping: 30 
            }
        }
    };

    const cardHoverVariants = {
        rest: { scale: 1, y: 0 },
        hover: { 
            scale: 1.03, 
            y: -8,
            transition: { 
                type: "spring", 
                stiffness: 400, 
                damping: 17 
            }
        }
    };

    // Calculate stats from actual pool data
    const [stats, setStats] = useState({
        tvl: "$0",
        activePools: "0",
        totalMembers: "0",
        avgYield: "0%",
        ultMarketCap: "$0"
    });

    // Fetch ULT balance
    const fetchULTBalance = async () => {
        if (!account || !addresses) return;
        
        try {
            const ultContract = await getULTContract();
            if (!ultContract) return;

            const balance = await ultContract.balanceOf(account);
            setUltBalance(ethers.formatEther(balance));
        } catch (error) {
            console.error("Error fetching ULT balance:", error);
        }
    };

    // Fetch real activity from blockchain events
    const fetchRecentActivity = async () => {
        if (!contract) return;
        
        setActivitiesLoading(true);
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const currentBlock = await provider.getBlockNumber();
            const fromBlock = Math.max(0, currentBlock - 1000); // Last ~1000 blocks

            // Get recent events
            const joinEvents = await contract.queryFilter(
                contract.filters.JoinedPool(),
                fromBlock,
                currentBlock
            );

            const payoutEvents = await contract.queryFilter(
                contract.filters.PayoutSent(),
                fromBlock,
                currentBlock
            );

            const rewardEvents = await contract.queryFilter(
                contract.filters.CreatorRewardEarned(),
                fromBlock,
                currentBlock
            );

            // Combine and sort events by block number
            const allEvents = [
                ...joinEvents.map(e => ({
                    type: 'join',
                    poolId: e.args.poolId.toString(),
                    user: e.args.member,
                    blockNumber: e.blockNumber,
                    transactionHash: e.transactionHash,
                    amount: null
                })),
                ...payoutEvents.map(e => ({
                    type: 'payout',
                    poolId: e.args.poolId.toString(),
                    user: e.args.recipient,
                    blockNumber: e.blockNumber,
                    transactionHash: e.transactionHash,
                    amount: ethers.formatEther(e.args.amount)
                })),
                ...rewardEvents.map(e => ({
                    type: 'reward',
                    poolId: e.args.poolId.toString(),
                    user: e.args.creator,
                    blockNumber: e.blockNumber,
                    transactionHash: e.transactionHash,
                    amount: ethers.formatEther(e.args.amount)
                }))
            ].sort((a, b) => b.blockNumber - a.blockNumber).slice(0, 10);

            // Get timestamps for recent events
            const activitiesWithTime = await Promise.all(
                allEvents.map(async (event) => {
                    try {
                        const block = await provider.getBlock(event.blockNumber);
                        const timeAgo = Math.floor((Date.now() - block.timestamp * 1000) / 1000);
                        
                        let timeString = "";
                        if (timeAgo < 60) timeString = "Just now";
                        else if (timeAgo < 3600) timeString = `${Math.floor(timeAgo / 60)}m ago`;
                        else if (timeAgo < 86400) timeString = `${Math.floor(timeAgo / 3600)}h ago`;
                        else timeString = `${Math.floor(timeAgo / 86400)}d ago`;

                        return {
                            ...event,
                            time: timeString,
                            timestamp: block.timestamp,
                            icon: getActivityIcon(event.type)
                        };
                    } catch (err) {
                        return {
                            ...event,
                            time: "Unknown",
                            timestamp: 0,
                            icon: getActivityIcon(event.type)
                        };
                    }
                })
            );

            setActivities(activitiesWithTime);
        } catch (error) {
            console.error("Error fetching activities:", error);
            setActivities([]); // Fallback to empty array
        }
        setActivitiesLoading(false);
    };

    const getActivityIcon = (type) => {
        switch (type) {
            case 'join':
                return _jsx(Users, { size: 16, className: "text-emerald-500" });
            case 'payout':
                return _jsx(Gift, { size: 16, className: "text-violet-500" });
            case 'reward':
                return _jsx(Star, { size: 16, className: "text-amber-500" });
            default:
                return _jsx(Activity, { size: 16, className: "text-gray-500" });
        }
    };

    // Calculate real-time stats from pool data
    const calculateStats = (poolsData) => {
        const activePools = poolsData.filter(p => p.isActive).length;
        const totalMembers = poolsData.reduce((sum, p) => sum + Number(p.totalMembers), 0);
        
        const tvlWei = poolsData.reduce((sum, p) => {
            return sum + (Number(p.contributionAmount) * Number(p.totalMembers));
        }, 0);
        const tvlEth = ethers.formatEther(tvlWei.toString());
        const tvlUsd = (parseFloat(tvlEth) * 1600).toFixed(0);
        
        const avgYield = poolsData.length > 0 
            ? poolsData.reduce((sum, p) => sum + Number(p.fee || 0), 0) / poolsData.length
            : 0;

        // Calculate ULT market cap (mock calculation)
        const ultSupply = 1000000000; // 1B tokens
        const ultMarketCap = (ultSupply * parseFloat(ultPrice)).toFixed(0);

        setStats({
            tvl: `${Number(tvlUsd).toLocaleString()}`,
            activePools: activePools.toString(),
            totalMembers: totalMembers.toString(),
            avgYield: `${avgYield.toFixed(1)}%`,
            ultMarketCap: `${Number(ultMarketCap).toLocaleString()}`
        });
    };

    const getPoolAction = (pool) => {
        if (!account) {
            return { text: "Connect Wallet", disabled: true, variant: "secondary" };
        }
        
        const isCreator = pool.creator.toLowerCase() === account.toLowerCase();
        
        // Creator can join their own pool if not yet joined and pool hasn't started
        if (isCreator && !pool.joined && pool.currentCycle === 0n && pool.totalMembers < pool.maxMembers) {
            return { text: "Join Your Pool", disabled: false, variant: "success" };
        }
        
        // Check if creator can contribute after joining
        if (isCreator && pool.joined && pool.canContribute) {
            return { text: "Contribute", disabled: false, variant: "primary" };
        }
        
        // Non-creator actions
        if (pool.canJoin) {
            return { text: "Join Pool", disabled: false, variant: "success" };
        }
        
        if (pool.canContribute) {
            return { text: "Contribute", disabled: false, variant: "primary" };
        }
        
        if (pool.joined) {
            return { text: "View Details", disabled: false, variant: "secondary" };
        }
        
        // Creator manage option (fallback)
        if (isCreator) {
            return { text: "Manage Pool", disabled: false, variant: "primary" };
        }
        
        if (!pool.isActive) {
            return { text: "Inactive", disabled: true, variant: "secondary" };
        }
        
        if (Number(pool.totalMembers) >= Number(pool.maxMembers)) {
            return { text: "Pool Full", disabled: true, variant: "secondary" };
        }
        
        return { text: "Started", disabled: true, variant: "secondary" };
    };

    // Handle pool actions
    const handlePoolAction = async (e, pool, action) => {
        // Don't prevent default for "View Details" - let Link handle navigation
        if (action.text === "View Details") {
            return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        
        if (!contract || !account) return;
        
        try {
            if (action.text === "Join Your Pool" || action.text === "Join Pool") {
                const tx = await contract.joinPool(Number(pool.id));
                toast.info("Joining pool...");
                await tx.wait();
                toast.success("Successfully joined pool!");
                // Refresh data
                setTimeout(() => {
                    fetchUserData();
                    fetchRecentActivity();
                }, 1000);
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("Action failed: " + (error.reason || error.message));
        }
    };

    const getButtonClasses = (variant, disabled) => {
        const base = "w-full mt-4 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 transform";
        
        if (disabled) {
            return `${base} bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed`;
        }
        
        switch (variant) {
            case "success":
                return `${base} bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-emerald-200/50 dark:hover:shadow-emerald-900/20 hover:scale-105`;
            case "secondary":
                return `${base} bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/20 hover:scale-105`;
            default:
                return `${base} bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-indigo-200/50 dark:hover:shadow-indigo-900/20 hover:scale-105`;
        }
    };

    // Fetch pool data with enhanced error handling and membership status
    const fetchUserData = async () => {
        if (!contract) {
            setIsLoading(false);
            setPools([]);
            setPoolCount(0);
            return;
        }

        setIsLoading(true);
        setError(null);
        
        try {
            const nextPoolId = await contract.nextPoolId();
            const total = Number(nextPoolId);
            setPoolCount(total);

            if (total === 0) {
                setPools([]);
                setIsLoading(false);
                return;
            }

            const poolDetailsArray = await Promise.all(
                Array.from({ length: total }, (_, i) => contract.getPoolDetails(i))
            );

            // Enhanced pool formatting with membership and action detection
            const formattedPools = await Promise.all(
                poolDetailsArray.map(async (poolInfo) => {
                    let joined = false;
                    let canJoin = false;
                    let canContribute = false;

                    if (account) {
                        try {
                            const members = await contract.getPoolMembers(poolInfo.id);
                            joined = members.some((member) =>
                                member.wallet.toLowerCase() === account.toLowerCase()
                            );

                            canJoin = await contract.canJoinPool(poolInfo.id, account);
                            canContribute = await contract.canContribute(poolInfo.id, account);
                        } catch (memberError) {
                            console.warn("Error checking membership for pool", poolInfo.id, memberError);
                        }
                    }

                    return {
                        id: BigInt(poolInfo.id.toString()),
                        creator: poolInfo.creator,
                        contributionAmount: BigInt(poolInfo.contributionAmount.toString()),
                        cycleDuration: BigInt(poolInfo.cycleDuration.toString()),
                        maxMembers: BigInt(poolInfo.maxMembers.toString()),
                        totalMembers: BigInt(poolInfo.totalMembers.toString()),
                        currentCycle: BigInt(poolInfo.currentCycle.toString()),
                        lastPayoutTime: BigInt(poolInfo.lastPayoutTime.toString()),
                        isActive: poolInfo.isActive,
                        isCompleted: poolInfo.isCompleted,
                        poolType: poolInfo.poolType,
                        fee: poolInfo.fee ? BigInt(poolInfo.fee.toString()) : BigInt(0),
                        creatorRewards: poolInfo.creatorRewards ? BigInt(poolInfo.creatorRewards.toString()) : BigInt(0),
                        joined,
                        canJoin,
                        canContribute
                    };
                })
            );

            setPools(formattedPools);
            calculateStats(formattedPools);
        } catch (error) {
            console.error("Error fetching pools:", error);
            setError("Failed to fetch pool data");
        }
        
        setIsLoading(false);
    };

    useEffect(() => {
        if (addresses && account) {
            fetchULTBalance();
        }
    }, [addresses, account]);

    useEffect(() => {
        fetchUserData();
        fetchRecentActivity();
    }, [contract, account]);

    // Auto-refresh data every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            if (contract) {
                fetchRecentActivity();
                if (account && addresses) {
                    fetchULTBalance();
                }
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [contract, account, addresses]);

    // Enhanced error state
    if (error) {
        return _jsx("div", { 
            className: "w-full max-w-7xl mx-auto px-4 sm:px-6 py-8", 
            children: _jsx(motion.div, { 
                className: "flex items-center justify-center py-16",
                initial: { opacity: 0, scale: 0.9 },
                animate: { opacity: 1, scale: 1 },
                transition: { duration: 0.5 },
                children: _jsxs("div", { 
                    className: "text-center bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-100 dark:border-gray-700", 
                    children: [
                        _jsx("div", { 
                            className: "bg-red-100 dark:bg-red-900/30 rounded-full p-4 w-fit mx-auto mb-4", 
                            children: _jsx(AlertCircle, { size: 32, className: "text-red-500" }) 
                        }),
                        _jsx("h2", { 
                            className: "text-xl font-bold text-gray-900 dark:text-white mb-2", 
                            children: "Connection Error" 
                        }),
                        _jsx("p", { 
                            className: "text-gray-600 dark:text-gray-400 mb-6", 
                            children: error 
                        }),
                        _jsx(motion.button, {
                            onClick: () => window.location.reload(),
                            className: "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105",
                            whileHover: { scale: 1.05 },
                            whileTap: { scale: 0.95 },
                            children: "Retry Connection"
                        })
                    ] 
                }) 
            }) 
        });
    }

    return _jsxs("div", { 
        className: "w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-12", 
        children: [
            // Enhanced Hero Section with ULT Integration
            _jsx(motion.section, { 
                className: "relative rounded-3xl overflow-hidden",
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.7 },
                children: [
                    _jsx("div", { 
                        className: `absolute inset-0 ${isDark 
                            ? "bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900"
                            : "bg-gradient-to-br from-indigo-600 via-purple-700 to-pink-600"}`
                    }),
                    
                    // Animated background elements
                    _jsxs("div", { 
                        className: "absolute inset-0", 
                        children: [
                            _jsx("div", { className: "absolute top-0 left-0 w-72 h-72 bg-yellow-300/10 rounded-full blur-3xl animate-pulse" }),
                            _jsx("div", { className: "absolute bottom-0 right-0 w-96 h-96 bg-pink-300/10 rounded-full blur-3xl animate-pulse delay-1000" }),
                            _jsx("div", { className: "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-300/10 rounded-full blur-3xl animate-pulse delay-2000" })
                        ] 
                    }),
                    
                    _jsxs("div", { 
                        className: "relative z-10 py-20 px-8 text-center", 
                        children: [
                            _jsxs(motion.div, { 
                                className: "inline-flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-full px-6 py-2 text-white text-sm font-semibold mb-8 border border-white/20",
                                initial: { opacity: 0, y: -20 },
                                animate: { opacity: 1, y: 0 },
                                transition: { delay: 0.3, duration: 0.6 },
                                children: [
                                    _jsx(Sparkles, { size: 18, className: "text-yellow-300" }),
                                    _jsx("span", { children: "Decentralized Stokvel Platform" }),
                                    _jsx("div", { className: "w-2 h-2 bg-green-400 rounded-full animate-pulse" })
                                ] 
                            }),
                            
                            _jsxs(motion.h1, { 
                                className: "text-5xl sm:text-7xl font-black text-white mb-6 leading-tight",
                                initial: { opacity: 0, scale: 0.8 },
                                animate: { opacity: 1, scale: 1 },
                                transition: { delay: 0.4, duration: 0.8, type: "spring", stiffness: 100 },
                                children: [
                                    "Welcome to ",
                                    _jsx("span", { 
                                        className: "text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 animate-pulse", 
                                        children: "UnityLedger" 
                                    })
                                ] 
                            }),
                            
                            // ULT Balance Display for Connected Users
                            account && _jsx(motion.div, {
                                className: "bg-white/10 backdrop-blur-md rounded-2xl p-4 mb-6 max-w-md mx-auto border border-white/20",
                                initial: { opacity: 0, scale: 0.8 },
                                animate: { opacity: 1, scale: 1 },
                                transition: { delay: 0.5, duration: 0.6 },
                                children: _jsxs("div", {
                                    className: "flex items-center justify-between text-white",
                                    children: [
                                        _jsxs("div", {
                                            children: [
                                                _jsx("p", { className: "text-sm text-white/70", children: "Your ULT Balance" }),
                                                _jsxs("p", { className: "text-2xl font-bold", children: [parseFloat(ultBalance).toLocaleString(), " ULT"] })
                                            ]
                                        }),
                                        _jsx(Coins, { size: 32, className: "text-yellow-300" })
                                    ]
                                })
                            }),
                            
                            _jsx(motion.div, {
                                className: "flex justify-center mb-8",
                                initial: { opacity: 0, scale: 0.5 },
                                animate: { opacity: 1, scale: 1 },
                                transition: { delay: 0.6, duration: 0.6 },
                                children: _jsxs("div", { 
                                    className: "relative", 
                                    children: [
                                        _jsx("img", { 
                                            src: "/images/UL.png",
                                            alt: "UnityLedger Logo",
                                            className: "h-20 sm:h-24 filter drop-shadow-2xl"
                                        }),
                                        _jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-pink-400/20 rounded-full blur-xl" })
                                    ] 
                                })
                            }),
                            
                            _jsxs(motion.p, { 
                                className: "text-xl sm:text-2xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed font-medium",
                                initial: { opacity: 0 },
                                animate: { opacity: 1 },
                                transition: { delay: 0.8, duration: 0.6 },
                                children: [
                                    "Build wealth together through transparent, decentralized savings pools with ",
                                    _jsx("span", { className: "text-yellow-300 font-semibold", children: "automated payouts" }),
                                    " and ",
                                    _jsx("span", { className: "text-pink-300 font-semibold", children: "ULT yield rewards" })
                                ] 
                            }),

                            _jsx(motion.div, {
                                className: "flex flex-col sm:flex-row gap-4 justify-center items-center",
                                initial: { opacity: 0, y: 20 },
                                animate: { opacity: 1, y: 0 },
                                transition: { delay: 1, duration: 0.6 },
                                children: _jsxs("div", {
                                    className: "flex gap-4",
                                    children: [
                                        _jsxs(Link, {
                                            to: "/join-create",
                                            className: "group bg-white/10 backdrop-blur-md hover:bg-white/20 text-white border border-white/30 hover:border-white/50 px-8 py-4 rounded-2xl font-bold transition-all duration-300 flex items-center gap-3 shadow-xl hover:shadow-2xl transform hover:scale-105",
                                            children: [
                                                _jsx(Plus, { size: 20 }),
                                                "Create Pool",
                                                _jsx(ArrowRight, { size: 18, className: "group-hover:translate-x-1 transition-transform" })
                                            ]
                                        }),
                                        _jsxs(Link, {
                                            to: "/faucet",
                                            className: "group bg-yellow-400/20 backdrop-blur-md hover:bg-yellow-400/30 text-white border border-yellow-300/30 hover:border-yellow-300/50 px-8 py-4 rounded-2xl font-bold transition-all duration-300 flex items-center gap-3 shadow-xl hover:shadow-2xl transform hover:scale-105",
                                            children: [
                                                _jsx(Gift, { size: 20 }),
                                                "Get ULT",
                                                _jsx(ArrowRight, { size: 18, className: "group-hover:translate-x-1 transition-transform" })
                                            ]
                                        })
                                    ]
                                })
                            })
                        ] 
                    })
                ]
            }),

            // Enhanced Stats Section with ULT Market Data
            _jsx(motion.section, { 
                variants: containerVariants,
                initial: "hidden",
                animate: "visible",
                children: _jsx("div", { 
                    className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6", 
                    children: [
                        {
                            title: "Total Value Locked",
                            value: `$${stats.tvl}`,
                            change: "+12.6%",
                            icon: _jsx(DollarSign, { size: 28, className: "text-indigo-600 dark:text-indigo-400" }),
                            bg: "bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20",
                            border: "border-indigo-200 dark:border-indigo-800"
                        },
                        {
                            title: "ULT Market Cap",
                            value: `$${stats.ultMarketCap}`,
                            change: "+3.2%",
                            icon: _jsx(Coins, { size: 28, className: "text-yellow-600 dark:text-yellow-400" }),
                            bg: "bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20",
                            border: "border-yellow-200 dark:border-yellow-800"
                        },
                        {
                            title: "Active Pools",
                            value: stats.activePools,
                            change: "+5.2%",
                            icon: _jsx(Activity, { size: 28, className: "text-emerald-600 dark:text-emerald-400" }),
                            bg: "bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20",
                            border: "border-emerald-200 dark:border-emerald-800"
                        },
                        {
                            title: "Total Members",
                            value: stats.totalMembers,
                            change: "+8.7%",
                            icon: _jsx(Users, { size: 28, className: "text-purple-600 dark:text-purple-400" }),
                            bg: "bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20",
                            border: "border-purple-200 dark:border-purple-800"
                        },
                        {
                            title: "Average Yield",
                            value: stats.avgYield,
                            change: "Audited",
                            icon: _jsx(Award, { size: 28, className: "text-amber-600 dark:text-amber-400" }),
                            bg: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20",
                            border: "border-amber-200 dark:border-amber-800"
                        }
                    ].map((stat, index) => 
                        _jsx(motion.div, { 
                            variants: itemVariants,
                            whileHover: { 
                                scale: 1.05,
                                y: -8,
                                transition: { type: "spring", stiffness: 300, damping: 20 }
                            },
                            className: `bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-2xl border ${stat.border} transition-all duration-300 group cursor-pointer`,
                            children: [
                                _jsxs("div", { 
                                    className: "flex items-start justify-between mb-4", 
                                    children: [
                                        _jsx("div", { 
                                            className: `${stat.bg} p-4 rounded-xl group-hover:scale-110 transition-transform duration-300`, 
                                            children: stat.icon 
                                        }),
                                        _jsx("div", { 
                                            className: "text-right", 
                                            children: _jsx("span", { 
                                                className: "text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-full", 
                                                children: stat.change 
                                            }) 
                                        })
                                    ] 
                                }),
                                _jsxs("div", { 
                                    children: [
                                        _jsx("p", { 
                                            className: "text-gray-500 dark:text-gray-400 text-sm font-medium mb-1", 
                                            children: stat.title 
                                        }),
                                        _jsx("h3", { 
                                            className: "text-2xl font-black text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors", 
                                            children: stat.value 
                                        })
                                    ] 
                                })
                            ] 
                        }, index)
                    )
                }) 
            }),

            // Navigation Cards Section
            _jsx(motion.section, {
                className: "mb-12",
                variants: containerVariants,
                initial: "hidden",
                animate: "visible",
                children: _jsx("div", { 
                    className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", 
                    children: [
                        _jsx(Link, { 
                            key: "pools-link",
                            to: "/pools", 
                            className: "group bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-2xl p-6 text-white transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl", 
                            children: [
                                _jsx(motion.div, {
                                    whileHover: { scale: 1.1, rotate: 5 },
                                    children: _jsx(PieChart, { size: 32, className: "mb-3" })
                                }),
                                _jsx("h3", { className: "font-bold text-lg mb-2", children: "Explore All Pools" }),
                                _jsx("p", { className: "text-sm opacity-90", children: "Browse and filter all available savings pools" }),
                                _jsx(ArrowRight, { size: 16, className: "mt-2 group-hover:translate-x-1 transition-transform" })
                            ]
                        }),
                        
                        _jsx(Link, { 
                            key: "member-dashboard-link",
                            to: "/memberdashboard", 
                            className: "group bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 rounded-2xl p-6 text-white transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl", 
                            children: [
                                _jsx(motion.div, {
                                    whileHover: { scale: 1.1, rotate: -5 },
                                    children: _jsx(Users, { size: 32, className: "mb-3" })
                                }),
                                _jsx("h3", { className: "font-bold text-lg mb-2", children: "Your Dashboard" }),
                                _jsx("p", { className: "text-sm opacity-90", children: "Manage your pools and track contributions" }),
                                _jsx(ArrowRight, { size: 16, className: "mt-2 group-hover:translate-x-1 transition-transform" })
                            ]
                        }),
                        
                        _jsx(Link, { 
                            key: "staking-link",
                            to: "/staking", 
                            className: "group bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-2xl p-6 text-white transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl", 
                            children: [
                                _jsx(motion.div, {
                                    whileHover: { scale: 1.1, rotate: -5 },
                                    children: _jsx(TrendingUp, { size: 32, className: "mb-3" })
                                }),
                                _jsx("h3", { className: "font-bold text-lg mb-2", children: "Stake ULT" }),
                                _jsx("p", { className: "text-sm opacity-90", children: "Earn 10% APY and unlock fee discounts" }),
                                _jsx(ArrowRight, { size: 16, className: "mt-2 group-hover:translate-x-1 transition-transform" })
                            ]
                        }),
                        
                        _jsx(Link, { 
                            key: "faucet-link",
                            to: "/faucet", 
                            className: "group bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 rounded-2xl p-6 text-white transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl", 
                            children: [
                                _jsx(motion.div, {
                                    whileHover: { scale: 1.1, rotate: 5 },
                                    children: _jsx(Gift, { size: 32, className: "mb-3" })
                                }),
                                _jsx("h3", { className: "font-bold text-lg mb-2", children: "Get ULT Tokens" }),
                                _jsx("p", { className: "text-sm opacity-90", children: "Claim free tokens from the faucet" }),
                                _jsx(ArrowRight, { size: 16, className: "mt-2 group-hover:translate-x-1 transition-transform" })
                            ]
                        }),
                        
                    ] 
                })
            }),

            // Enhanced Pools Section
            _jsx(motion.section, {
                variants: containerVariants,
                initial: "hidden",
                animate: "visible",
                children: [
                    _jsxs("div", { 
                        className: "flex justify-between items-center mb-8", 
                        children: [
                            _jsxs("div", { 
                                children: [
                                    _jsx("h2", { 
                                        className: "text-3xl font-black text-gray-800 dark:text-white mb-2", 
                                        children: isLoading ? 
                                            _jsx("div", { className: "bg-gray-200 dark:bg-gray-700 animate-pulse h-9 w-48 rounded-xl" }) :
                                            _jsxs("span", { 
                                                className: "flex items-center gap-3", 
                                                children: [
                                                    _jsx(Zap, { className: "text-yellow-500", size: 32 }),
                                                    "Explore ",
                                                    _jsx("span", { 
                                                        className: "text-indigo-600 dark:text-indigo-400", 
                                                        children: poolCount || 0 
                                                    }),
                                                    " ",
                                                    poolCount === 1 ? "Pool" : "Pools"
                                                ] 
                                            })
                                    }),
                                    _jsx("p", { 
                                        className: "text-gray-600 dark:text-gray-400", 
                                        children: "Join active savings pools or create your own" 
                                    })
                                ] 
                            }),
                            _jsx(motion.div, { 
                                whileHover: { scale: 1.05 }, 
                                whileTap: { scale: 0.95 }, 
                                children: _jsxs(Link, {
                                    to: "/join-create",
                                    className: "inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl",
                                    children: [
                                        _jsx(Plus, { size: 18 }),
                                        "Create Pool",
                                        _jsx(ArrowRight, { size: 16 })
                                    ]
                                })
                            })
                        ] 
                    }),

                    _jsx(AnimatePresence, { 
                        mode: "wait",
                        children: isLoading ? 
                            _jsx(motion.div, { 
                                className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
                                key: "loading",
                                exit: { opacity: 0 },
                                children: [1, 2, 3].map((i) => 
                                    _jsxs("div", {
                                        className: "bg-white dark:bg-gray-800 rounded-2xl p-6 h-80 shadow-lg animate-pulse border border-gray-100 dark:border-gray-700",
                                        children: [
                                            _jsxs("div", { 
                                                className: "space-y-4", 
                                                children: [
                                                    _jsx("div", { className: "bg-gray-200 dark:bg-gray-700 h-6 w-1/3 rounded-lg" }),
                                                    _jsx("div", { className: "bg-gray-200 dark:bg-gray-700 h-8 w-2/3 rounded-lg" }),
                                                    _jsx("div", { className: "bg-gray-200 dark:bg-gray-700 h-4 w-1/2 rounded-lg" }),
                                                    _jsxs("div", { 
                                                        className: "flex gap-2", 
                                                        children: [
                                                            _jsx("div", { className: "bg-gray-200 dark:bg-gray-700 h-8 w-20 rounded-full" }),
                                                            _jsx("div", { className: "bg-gray-200 dark:bg-gray-700 h-8 w-16 rounded-full" })
                                                        ] 
                                                    }),
                                                    _jsx("div", { className: "bg-gray-200 dark:bg-gray-700 h-20 w-full rounded-xl" })
                                                ] 
                                            })
                                        ]
                                    }, i)
                                )
                            }) :
                        pools.length === 0 ? 
                            _jsx(motion.div, {
                                className: "text-center py-20",
                                key: "empty",
                                initial: { opacity: 0, scale: 0.9 },
                                animate: { opacity: 1, scale: 1 },
                                exit: { opacity: 0, scale: 0.9 },
                                children: _jsxs("div", { 
                                    className: "bg-gray-50 dark:bg-gray-800 rounded-3xl p-12 border-2 border-dashed border-gray-200 dark:border-gray-700", 
                                    children: [
                                        _jsx("div", { 
                                            className: "bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-full p-6 w-fit mx-auto mb-6", 
                                            children: _jsx(PieChart, { size: 48, className: "text-indigo-600 dark:text-indigo-400" }) 
                                        }),
                                        _jsx("h3", { 
                                            className: "text-2xl font-bold text-gray-900 dark:text-white mb-3", 
                                            children: "No Pools Available Yet" 
                                        }),
                                        _jsx("p", { 
                                            className: "text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto", 
                                            children: "Be the pioneer! Create the first savings pool and start building wealth together with your community." 
                                        }),
                                        _jsx(motion.div, { 
                                            whileHover: { scale: 1.05 }, 
                                            whileTap: { scale: 0.95 }, 
                                            children: _jsxs(Link, {
                                                to: "/join-create",
                                                className: "inline-flex items-center gap-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl",
                                                children: [
                                                    _jsx(Star, { size: 20 }),
                                                    "Create First Pool",
                                                    _jsx(ArrowRight, { size: 18 })
                                                ]
                                            })
                                        })
                                    ] 
                                })
                            }) :
                            _jsx(motion.div, { 
                                className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
                                key: "pools",
                                variants: containerVariants,
                                initial: "hidden",
                                animate: "visible",
                                children: pools.slice(0, 6).map((pool) => {
                                    const poolIdStr = pool.id.toString();
                                    const totalMembersStr = pool.totalMembers.toString();
                                    const maxMembersStr = pool.maxMembers.toString();
                                    const cycleDurationDays = Number(pool.cycleDuration) / 86400;
                                    const contributionEth = ethers.formatEther(pool.contributionAmount.toString());
                                    const contributionUSD = parseFloat(contributionEth) * 1600;
                                    const action = getPoolAction(pool);
                                    const completionPercentage = (Number(pool.totalMembers) / Number(pool.maxMembers)) * 100;
                                    const isCreator = account && pool.creator.toLowerCase() === account.toLowerCase();
                                    const creatorRewardsEth = pool.creatorRewards ? ethers.formatEther(pool.creatorRewards.toString()) : "0";

                                    return _jsx(motion.div, {
                                        variants: itemVariants,
                                        whileHover: "hover",
                                        initial: "rest",
                                        className: "group",
                                        children: _jsx(Link, { 
                                            to: `/pool/${poolIdStr}`, 
                                            children: _jsxs(motion.div, {
                                                variants: cardHoverVariants,
                                                className: "bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-2xl border border-gray-100 dark:border-gray-700 transition-all duration-300 h-full relative overflow-hidden",
                                                children: [
                                                    // Background gradient overlay
                                                    _jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/10 dark:to-purple-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" }),
                                                    
                                                    _jsxs("div", { 
                                                        className: "relative z-10", 
                                                        children: [
                                                            _jsxs("div", { 
                                                                className: "flex justify-between items-start mb-4", 
                                                                children: [
                                                                    _jsxs("div", { 
                                                                        className: "flex-1", 
                                                                        children: [
                                                                            _jsxs("div", { 
                                                                                className: "flex items-center gap-2 mb-2", 
                                                                                children: [
                                                                                    _jsxs("span", { 
                                                                                        className: "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-100 to-emerald-200 dark:from-emerald-900/50 dark:to-emerald-800/50 text-emerald-800 dark:text-emerald-300", 
                                                                                        children: ["Pool #", poolIdStr] 
                                                                                    }),
                                                                                    pool.joined && _jsxs("span", { 
                                                                                        className: "inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 text-blue-800 dark:text-blue-300", 
                                                                                        children: [
                                                                                            _jsx(Star, { size: 10, className: "mr-1" }),
                                                                                            "Joined"
                                                                                        ] 
                                                                                    }),
                                                                                    isCreator && _jsxs("span", { 
                                                                                        className: "inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-100 to-amber-200 dark:from-amber-900/50 dark:to-amber-800/50 text-amber-800 dark:text-amber-300", 
                                                                                        children: [
                                                                                            _jsx(Award, { size: 10, className: "mr-1" }),
                                                                                            "Creator"
                                                                                        ] 
                                                                                    })
                                                                                ] 
                                                                            }),
                                                                            
                                                                            _jsx("h3", { 
                                                                                className: "text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors", 
                                                                                children: pool.poolType || "Savings Pool" 
                                                                            }),
                                                                            
                                                                            _jsxs("p", { 
                                                                                className: "text-sm text-gray-500 dark:text-gray-400", 
                                                                                children: ["By: ", pool.creator.slice(0, 6), "...", pool.creator.slice(-4)] 
                                                                            })
                                                                        ] 
                                                                    }),
                                                                    
                                                                    _jsx("div", { 
                                                                        className: "bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300", 
                                                                        children: _jsx(PieChart, { size: 24, className: "text-indigo-600 dark:text-indigo-400" }) 
                                                                    })
                                                                ] 
                                                            }),
                                                            
                                                            // Pool stats
                                                            _jsxs("div", { 
                                                                className: "space-y-3 mb-4", 
                                                                children: [
                                                                    _jsxs("div", { 
                                                                        className: "flex justify-between items-center", 
                                                                        children: [
                                                                            _jsx("span", { className: "text-sm font-medium text-gray-600 dark:text-gray-400", children: "Contribution" }),
                                                                            _jsxs("div", { 
                                                                                className: "text-right", 
                                                                                children: [
                                                                                    _jsxs("div", { 
                                                                                        className: "text-sm font-bold text-gray-900 dark:text-white", 
                                                                                        children: [contributionEth, " ETH"] 
                                                                                    }),
                                                                                    _jsxs("div", { 
                                                                                        className: "text-xs text-gray-500 dark:text-gray-400", 
                                                                                        children: ["$", contributionUSD.toFixed(2)] 
                                                                                    })
                                                                                ] 
                                                                            })
                                                                        ] 
                                                                    }),
                                                                    
                                                                    _jsxs("div", { 
                                                                        className: "flex justify-between items-center", 
                                                                        children: [
                                                                            _jsx("span", { className: "text-sm font-medium text-gray-600 dark:text-gray-400", children: "ULT APY" }),
                                                                            _jsx("span", { 
                                                                                className: "text-sm font-bold text-emerald-600 dark:text-emerald-400", 
                                                                                children: pool.fee ? pool.fee.toString() + "%" : "0%" 
                                                                            })
                                                                        ] 
                                                                    })
                                                                ] 
                                                            }),
                                                            
                                                            // Progress bar for pool completion
                                                            _jsxs("div", { 
                                                                className: "mb-4", 
                                                                children: [
                                                                    _jsxs("div", { 
                                                                        className: "flex justify-between items-center mb-2", 
                                                                        children: [
                                                                            _jsx("span", { className: "text-sm font-medium text-gray-600 dark:text-gray-400", children: "Pool Progress" }),
                                                                            _jsxs("span", { 
                                                                                className: "text-sm font-bold text-gray-900 dark:text-white", 
                                                                                children: [totalMembersStr, "/", maxMembersStr] 
                                                                            })
                                                                        ] 
                                                                    }),
                                                                    _jsx("div", { 
                                                                        className: "w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden", 
                                                                        children: _jsx(motion.div, { 
                                                                            className: "h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full",
                                                                            initial: { width: 0 },
                                                                            animate: { width: `${completionPercentage}%` },
                                                                            transition: { duration: 1, delay: 0.5 }
                                                                        }) 
                                                                    })
                                                                ] 
                                                            }),

                                                            // ULT Balance & Claim Section
                                                            account && pool.joined && !isCreator && 
                                                                _jsx("div", { 
                                                                    className: "mb-4", 
                                                                    children: _jsx(UltBalanceAndClaim, { poolId: poolIdStr }) 
                                                                }),

                                                            _jsx(motion.button, {
                                                                onClick: (e) => handlePoolAction(e, pool, action),
                                                                whileHover: !action.disabled ? { scale: 1.02 } : {},
                                                                whileTap: !action.disabled ? { scale: 0.98 } : {},
                                                                className: getButtonClasses(action.variant, action.disabled),
                                                                disabled: action.disabled,
                                                                children: action.text
                                                            })
                                                        ] 
                                                    })
                                                ]
                                            })
                                        })
                                    }, poolIdStr);
                                })
                            })
                    })
                ]
            }),

            // Enhanced Real Activity Feed
            _jsx(motion.section, {
                variants: containerVariants,
                initial: "hidden",
                animate: "visible",
                children: [
                    _jsxs("div", { 
                        className: "flex justify-between items-center mb-6", 
                        children: [
                            _jsxs("div", { 
                                children: [
                                    _jsx("h2", { className: "text-2xl font-bold text-gray-800 dark:text-white mb-1", children: "Recent Activity" }),
                                    _jsx("p", { className: "text-gray-600 dark:text-gray-400", children: "Latest transactions across all pools" })
                                ] 
                            }),
                            _jsxs("div", {
                                className: "flex gap-3",
                                children: [
                                    _jsx(motion.button, {
                                        onClick: fetchRecentActivity,
                                        className: "inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 font-semibold transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700",
                                        whileHover: { scale: 1.05 },
                                        whileTap: { scale: 0.95 },
                                        children: _jsx(RefreshCw, { size: 16, className: activitiesLoading ? "animate-spin" : "" })
                                    }),
                                    _jsxs(Link, {
                                        to: "/pools",
                                        className: "inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold transition-colors group",
                                        children: [
                                            "View All Pools",
                                            _jsx(ArrowRight, { size: 16, className: "group-hover:translate-x-1 transition-transform" })
                                        ]
                                    })
                                ]
                            })
                        ] 
                    }),

                    _jsx("div", { 
                        className: "bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden", 
                        children: activitiesLoading ? 
                            _jsx("div", {
                                className: "p-6 text-center",
                                children: _jsxs("div", {
                                    className: "flex items-center justify-center gap-3 text-gray-500 dark:text-gray-400",
                                    children: [
                                        _jsx("div", { className: "w-5 h-5 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin" }),
                                        "Loading recent activity..."
                                    ]
                                })
                            }) :
                        activities.length === 0 ?
                            _jsx("div", {
                                className: "p-8 text-center",
                                children: _jsxs("div", {
                                    children: [
                                        _jsx("div", {
                                            className: "bg-gray-100 dark:bg-gray-700 rounded-full p-4 w-fit mx-auto mb-4",
                                            children: _jsx(Activity, { size: 32, className: "text-gray-400" })
                                        }),
                                        _jsx("h3", {
                                            className: "text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2",
                                            children: "No Recent Activity"
                                        }),
                                        _jsx("p", {
                                            className: "text-gray-500 dark:text-gray-500",
                                            children: "Pool transactions will appear here when they happen"
                                        })
                                    ]
                                })
                            }) :
                            _jsx("ul", { 
                                className: "divide-y divide-gray-100 dark:divide-gray-700", 
                                children: activities.map((activity, index) => 
                                    _jsx(motion.li, {
                                        key: `${activity.transactionHash}-${index}`,
                                        whileHover: {
                                            backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
                                            scale: 1.01
                                        },
                                        className: "px-6 py-4 cursor-pointer transition-all duration-200",
                                        children: _jsxs("div", { 
                                            className: "flex items-center justify-between", 
                                            children: [
                                                _jsxs("div", { 
                                                    className: "flex items-center gap-4", 
                                                    children: [
                                                        _jsx("div", { 
                                                            className: "flex-shrink-0 p-2 rounded-lg bg-gray-50 dark:bg-gray-700", 
                                                            children: activity.icon 
                                                        }),
                                                        _jsxs("div", { 
                                                            children: [
                                                                _jsxs("p", { 
                                                                    className: "text-sm font-semibold text-gray-900 dark:text-white", 
                                                                    children: [
                                                                        activity.type === "join" && "Joined",
                                                                        activity.type === "payout" && "Payout received from",
                                                                        activity.type === "reward" && "Creator reward from",
                                                                        " ",
                                                                        _jsxs("span", { 
                                                                            className: "text-indigo-600 dark:text-indigo-400 font-bold", 
                                                                            children: ["Pool #", activity.poolId] 
                                                                        })
                                                                    ] 
                                                                }),
                                                                _jsxs("p", { 
                                                                    className: "text-xs text-gray-500 dark:text-gray-400", 
                                                                    children: [
                                                                        activity.user.slice(0, 8), 
                                                                        "...",
                                                                        activity.user.slice(-6),
                                                                        activity.amount && " • ",
                                                                        activity.amount && _jsxs("span", { 
                                                                            className: "font-semibold", 
                                                                            children: [activity.amount, " ETH"] 
                                                                        })
                                                                    ] 
                                                                })
                                                            ] 
                                                        })
                                                    ] 
                                                }),
                                                _jsxs("div", { 
                                                    className: "flex items-center gap-2 text-gray-400", 
                                                    children: [
                                                        _jsx(Clock, { size: 14 }),
                                                        _jsx("span", { 
                                                            className: "text-xs font-medium", 
                                                            children: activity.time 
                                                        })
                                                    ] 
                                                })
                                            ] 
                                        })
                                    })
                                ) 
                            }) 
                    })
                ]
            })
        ] 
    });
};

export default Dashboard;