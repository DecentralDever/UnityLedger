import React, { useEffect, useState } from "react";
import { useUnityLedgerContract } from "../services/contract";
import { useWallet } from "../context/WalletProvider";
import { useTheme } from "../context/ThemeProvider";
import PoolSelector from "../components/PoolSelector";
import { 
  Sparkles, ArrowRight, TrendingUp, Shield, PieChart, 
  Users, DollarSign, Clock, Wallet, Gift
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Dashboard: React.FC = () => {
  const contract = useUnityLedgerContract();
  const { account } = useWallet();
  const { isDark } = useTheme();
  const [poolCount, setPoolCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    tvl: "$4.2M",
    users: "1,452",
    volume24h: "$238K",
    growth: "+12.6%"
  });

  useEffect(() => {
    if (!contract) {
      console.log("Contract not connected.");
      return;
    }
    
    const fetchPoolData = async () => {
      setIsLoading(true);
      try {
        const count = await contract.nextPoolId();
        setPoolCount(Number(count));
        // In a real implementation, update stats with real data
        
        // Simulating API delay
        setTimeout(() => {
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Error fetching pool data:", error);
        setIsLoading(false);
      }
    };
    
    fetchPoolData();
  }, [contract]);

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  
  const staggered = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1 
      } 
    }
  };
  
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  // Placeholder activities for the activity feed
  const activities = [
    {
      id: 1,
      type: "deposit",
      pool: 3,
      user: "0xa1b2...c3d4",
      amount: "500 DAI",
      time: "2 hours ago",
      icon: <Wallet size={16} className="text-green-500" />
    },
    {
      id: 2,
      type: "withdrawal",
      pool: 1,
      user: "0x9f8e...7d6c",
      amount: "1,200 USDC",
      time: "5 hours ago",
      icon: <DollarSign size={16} className="text-red-500" />
    },
    {
      id: 3,
      type: "payout",
      pool: 2,
      user: "0xb3a2...4f5e",
      amount: "5,000 DAI",
      time: "1 day ago",
      icon: <Gift size={16} className="text-indigo-500" />
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero Section */}
      <motion.section 
        className="relative rounded-2xl overflow-hidden mb-12"
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
      >
        <div className={`absolute inset-0 ${isDark 
          ? 'bg-gradient-to-br from-indigo-900 to-purple-900 opacity-90' 
          : 'bg-gradient-to-br from-indigo-600 to-purple-700 opacity-90'}`} 
        />
        <div className="absolute inset-0 bg-[url('/images/grid-pattern.svg')] opacity-20" />
        
        <div className="relative z-10 py-16 px-8 text-center">
          <motion.div 
            className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-white text-sm font-medium mb-6 backdrop-blur-sm"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Sparkles size={16} className="text-yellow-300" />
            <span>Decentralized Stokvel</span>
          </motion.div>
          
          <motion.h1 
            className="text-4xl sm:text-5xl font-bold text-white mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-300">UnityLedger</span>
          </motion.h1>
          
          <motion.img 
            src="/images/UL.png"
            alt="UnityLedger Logo"
            className="mx-auto mb-6 h-16 sm:h-20"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          />
          
          <motion.p 
            className="text-xl text-white/90 mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {account 
              ? `Connected as ${account.slice(0, 6)}...${account.slice(-4)}`
              : "Connect your wallet to join decentralized savings and lending pools"
            }
          </motion.p>
          
          {!account && (
            <motion.button 
              className="bg-white dark:bg-white/90 text-indigo-700 font-semibold py-3 px-6 rounded-lg hover:bg-indigo-50 dark:hover:bg-white/80 transition-all shadow-md"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              Connect Wallet
            </motion.button>
          )}
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.section 
        className="mb-12"
        variants={staggered}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              title: "Total Value Locked",
              value: stats.tvl,
              change: stats.growth,
              icon: <PieChart size={24} className="text-indigo-600 dark:text-indigo-400" />,
              bg: "bg-indigo-100 dark:bg-indigo-900/40",
            },
            {
              title: "Active Users",
              value: stats.users,
              change: "+5.2%",
              icon: <Users size={24} className="text-purple-600 dark:text-purple-400" />,
              bg: "bg-purple-100 dark:bg-purple-900/40",
            },
            {
              title: "24h Volume",
              value: stats.volume24h,
              change: "+8.7%",
              icon: <TrendingUp size={24} className="text-cyan-600 dark:text-cyan-400" />,
              bg: "bg-cyan-100 dark:bg-cyan-900/40",
            },
            {
              title: "Security Rating",
              value: "A+",
              change: "Audited",
              icon: <Shield size={24} className="text-green-600 dark:text-green-400" />,
              bg: "bg-green-100 dark:bg-green-900/40",
            }
          ].map((stat, index) => (
            <motion.div 
              key={index}
              variants={fadeIn}
              whileHover={{ scale: 1.03, y: -5 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className={`${stat.bg} p-3 rounded-lg`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{stat.title}</p>
                  <div className="flex items-end gap-2">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</h3>
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">
                      {stat.change}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Pools and Activity Section */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        transition={{ delay: 0.4 }}
        className="mb-12"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            {isLoading ? (
              <div className="bg-gray-200 dark:bg-gray-700 animate-pulse h-8 w-40 rounded"></div>
            ) : (
              <span className="flex items-center">
                Explore <span className="text-indigo-600 dark:text-indigo-400 mx-1">{poolCount || 0}</span> Available Pools
              </span>
            )}
          </h2>
          
          <a href="/join-create" className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium transition-colors">
            Create New Pool
            <ArrowRight size={16} className="ml-1" />
          </a>
        </div>
        
        <AnimatePresence>
          {isLoading ? (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              exit={{ opacity: 0 }}
            >
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-6 h-64 shadow-sm animate-pulse">
                  <div className="bg-gray-200 dark:bg-gray-700 h-6 w-1/3 mb-4 rounded"></div>
                  <div className="bg-gray-200 dark:bg-gray-700 h-4 w-2/3 mb-2 rounded"></div>
                  <div className="bg-gray-200 dark:bg-gray-700 h-4 w-1/2 mb-6 rounded"></div>
                  <div className="flex gap-3 mb-6">
                    <div className="bg-gray-200 dark:bg-gray-700 h-10 w-20 rounded-full"></div>
                    <div className="bg-gray-200 dark:bg-gray-700 h-10 w-20 rounded-full"></div>
                  </div>
                  <div className="bg-gray-200 dark:bg-gray-700 h-20 w-full rounded"></div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <PoolSelector />
              
              {/* Featured Pool Card */}
              <motion.div 
                whileHover={{ scale: 1.02, y: -5 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300">
                      Featured
                    </span>
                    <h3 className="text-lg font-semibold mt-2 text-gray-900 dark:text-white">Community Savings Pool</h3>
                  </div>
                  <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-lg">
                    <PieChart size={20} className="text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Our most popular rotating savings pool with weekly contributions and monthly payouts.
                </p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2 py-1 rounded-md text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300">
                    15 Members
                  </span>
                  <span className="px-2 py-1 rounded-md text-xs font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300">
                    3.2% APY
                  </span>
                  <span className="px-2 py-1 rounded-md text-xs font-medium bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300">
                    USDC
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-6">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Pool value</span>
                  <span className="text-xs text-gray-900 dark:text-white font-medium text-right">$45,600</span>
                  
                  <span className="text-xs text-gray-500 dark:text-gray-400">Min. contribution</span>
                  <span className="text-xs text-gray-900 dark:text-white font-medium text-right">$100/week</span>
                  
                  <span className="text-xs text-gray-500 dark:text-gray-400">Next payout</span>
                  <span className="text-xs text-gray-900 dark:text-white font-medium text-right">3 days</span>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium text-sm transition-colors"
                >
                  Join Pool
                </motion.button>
              </motion.div>
              
              {/* Modern Stokvel Pool Card */}
              <motion.div 
                whileHover={{ scale: 1.02, y: -5 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300">
                      New
                    </span>
                    <h3 className="text-lg font-semibold mt-2 text-gray-900 dark:text-white">Modern Stokvel</h3>
                  </div>
                  <div className="bg-purple-100 dark:bg-purple-900/50 p-2 rounded-lg">
                    <Users size={20} className="text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Join our modern take on traditional stokvels with flexible contributions and emergency loans.
                </p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-2 py-1 rounded-md text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300">
                    8 Members
                  </span>
                  <span className="px-2 py-1 rounded-md text-xs font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300">
                    4.5% APY
                  </span>
                  <span className="px-2 py-1 rounded-md text-xs font-medium bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300">
                    DAI
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-6">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Pool value</span>
                  <span className="text-xs text-gray-900 dark:text-white font-medium text-right">$32,200</span>
                  
                  <span className="text-xs text-gray-500 dark:text-gray-400">Min. contribution</span>
                  <span className="text-xs text-gray-900 dark:text-white font-medium text-right">$50/week</span>
                  
                  <span className="text-xs text-gray-500 dark:text-gray-400">Next payout</span>
                  <span className="text-xs text-gray-900 dark:text-white font-medium text-right">12 days</span>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-medium text-sm transition-colors"
                >
                  Join Pool
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>
      
      {/* Activity Feed Section */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        transition={{ delay: 0.6 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Recent Activity</h2>
          
          <a href="/activity" className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium transition-colors">
            View All
            <ArrowRight size={16} className="ml-1" />
          </a>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {activities.map((activity) => (
              <motion.li
                key={activity.id}
                whileHover={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)' }}
                className="px-6 py-4"
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {activity.icon}
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.type === 'deposit' && 'Deposit to'}
                      {activity.type === 'withdrawal' && 'Withdrawal from'}
                      {activity.type === 'payout' && 'Payout from'}
                      {' '}
                      <span className="text-indigo-600 dark:text-indigo-400">Pool #{activity.pool}</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.user} • {activity.amount}
                    </p>
                  </div>
                  <div className="ml-auto">
                    <div className="flex items-center">
                      <Clock size={12} className="text-gray-400 mr-1" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {activity.time}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      </motion.section>

      {/* Call to Action Section */}
      <motion.section
        className="mt-16 mb-8"
        initial="hidden"
        animate="visible"
        variants={fadeInUp}
        transition={{ delay: 0.8 }}
      >
        <div className={`relative rounded-2xl overflow-hidden ${
          isDark ? 'bg-gradient-to-r from-purple-900 to-indigo-900' 
          : 'bg-gradient-to-r from-purple-600 to-indigo-600'
        }`}>
          <div className="absolute inset-0 bg-[url('/images/dots-pattern.svg')] opacity-10" />
          
          <div className="relative z-10 p-8 md:p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Savings?</h2>
            <p className="text-white/80 max-w-2xl mx-auto mb-8">
              Join thousands of people who are already using UnityLedger to build wealth together through decentralized stokvels and savings pools.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-indigo-700 font-semibold py-3 px-8 rounded-lg shadow-lg"
              >
                Get Started
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-transparent border border-white text-white font-semibold py-3 px-8 rounded-lg"
              >
                Learn More
              </motion.button>
            </div>
          </div>
        </div>
      </motion.section>
      
      {/* Footer Section */}
      <footer className="mt-16 mb-8 pt-8 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-4">Product</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">Features</a></li>
              <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">Roadmap</a></li>
              <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">Security</a></li>
              <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">Pricing</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-4">Resources</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">Documentation</a></li>
              <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">Guides</a></li>
              <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">Support</a></li>
              <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">API</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-4">Company</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">About</a></li>
              <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">Blog</a></li>
              <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">Jobs</a></li>
              <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">Partners</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">Privacy</a></li>
              <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">Terms</a></li>
              <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">Cookies</a></li>
              <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400">Licenses</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © 2025 UnityLedger. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;