import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { 
  Sparkles, ArrowRight, TrendingUp, PieChart, Users, DollarSign, Clock, Gift, AlertCircle, Plus, Activity, Star, Zap, Award, Coins, RefreshCw, ChevronRight, Shield, Target, Wallet, BarChart3, ArrowUp, ArrowDown, Settings, Bell, Search, Filter, Calendar, Download, Share, BookOpen, Compass, Menu, X, Play, Pause, Volume2, VolumeX, RotateCcw, Bookmark, Heart, MessageCircle, Send, Copy, ExternalLink, Info, HelpCircle, Lightbulb, Cpu, Database, Cloud, Lock, Unlock, Trash2, Edit3, Save, Upload, Image, Video, Music, FileText, Folder, Hash, CreditCard, Smartphone
} from "lucide-react";
import { useUnityLedgerContract } from "../services/contract";
import { useWallet } from "../context/WalletProvider";
import { useTheme } from "../context/ThemeProvider";
import UltBalanceAndClaim from "../components/UltBalanceAndClaim";
import { toast } from "react-toastify";
import { ethers } from "ethers";

// BIGINT FIX: Helper function to safely convert values to BigInt
const safeBigInt = (value) => {
  if (!value) return BigInt(0);
  if (typeof value === 'bigint') return value;
  
  let str = value.toString();
  
  if (str.includes('e+')) {
    const num = parseFloat(str);
    if (!isNaN(num)) {
      str = num.toLocaleString('fullwide', { useGrouping: false });
    }
  }
  
  if (str.includes('.')) {
    str = str.split('.')[0];
  }
  
  str = str.replace(/[^0-9]/g, '');
  
  return str ? BigInt(str) : BigInt(0);
};

const safeFormatEther = (value) => {
  try {
    const bigIntValue = safeBigInt(value);
    return ethers.formatEther(bigIntValue);
  } catch (error) {
    console.warn('Failed to format ether:', value, error);
    return '0';
  }
};

// Bank Card Chip Component
const CardChip = () => (
  <div className="relative w-10 h-8 sm:w-12 sm:h-10 rounded-md bg-gradient-to-br from-yellow-200 via-yellow-300 to-yellow-400 shadow-lg overflow-hidden">
    <div className="absolute inset-0 grid grid-cols-3 gap-[1px] p-1">
      {[...Array(9)].map((_, i) => (
        <div key={i} className="bg-yellow-600/20 rounded-[1px]" />
      ))}
    </div>
    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/30 to-transparent" />
  </div>
);

// Contactless Payment Icon
const ContactlessIcon = () => (
  <svg className="w-6 h-6 sm:w-8 sm:h-8" viewBox="0 0 24 24" fill="none">
    <path d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Enhanced Wallet Connection Modal with Network Selection
const WalletConnectionModal = ({ isOpen, onConnect, onClose, error, isConnecting, needsNetworkSwitch, targetNetwork, onSwitchNetwork }) => {
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [step, setStep] = useState('welcome'); // 'welcome' or 'connecting'

  const networks = [
    {
      id: 50312,
      name: "Somnia Devnet",
      shortName: "Somnia",
      description: "Lightning-fast Layer 1 blockchain",
      icon: "⚡",
      color: "from-purple-500 to-pink-500",
      features: ["Sub-second finality", "High throughput", "Low fees"],
      chainId: "0xc488",
      rpcUrl: "https://dream-rpc.somnia.network",
      nativeCurrency: { name: "Somnia Test Token", symbol: "STT", decimals: 18 },
      blockExplorerUrls: ["https://shannon-explorer.somnia.network"],
      ultToken: "0x2Da2331B2a0E669785e8EAAadc19e63e20E19E5f"
    },
    {
      id: 4202,
      name: "Lisk Sepolia",
      shortName: "Lisk",
      description: "Ethereum L2 optimized for scalability",
      icon: "🔷",
      color: "from-blue-500 to-cyan-500",
      features: ["Low gas fees", "Ethereum compatible", "Fast transactions"],
      chainId: "0x106a",
      rpcUrl: "https://rpc.sepolia-api.lisk.com",
      nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
      blockExplorerUrls: ["https://sepolia-blockscout.lisk.com"],
      ultToken: "0x9C6adb7DC4b27fbFe381D726606248Ad258F4228"
    }
  ];

  const handleNetworkSelect = async (network) => {
    setSelectedNetwork(network);
    setStep('connecting');
    
    console.log(`🔄 Attempting to connect to ${network.shortName}...`);
    console.log('Network config:', network);
    
    try {
      if (!window.ethereum) {
        throw new Error("Please install MetaMask to continue");
      }

      console.log(`📡 Checking current network...`);
      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
      console.log(`Current Chain ID: ${currentChainId}, Target: ${network.chainId}`);

      // Try to switch to selected network first
      try {
        console.log(`🔄 Attempting to switch to ${network.shortName} (${network.chainId})...`);
        
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: network.chainId }],
        });
        
        console.log(`✅ Network switch successful!`);
        
        // Network exists and switched successfully, now connect wallet
        console.log(`🔗 Connecting wallet...`);
        await onConnect();
        console.log(`✅ Wallet connected!`);
        
      } catch (switchError) {
        console.log(`⚠️ Switch error:`, switchError);
        
        // Network doesn't exist in wallet, add it
        if (switchError.code === 4902) {
          console.log(`📝 Network doesn't exist. Adding ${network.shortName}...`);
          
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: network.chainId,
                chainName: network.name,
                nativeCurrency: network.nativeCurrency,
                rpcUrls: [network.rpcUrl],
                blockExplorerUrls: network.blockExplorerUrls,
              }],
            });
            
            console.log(`✅ Network added successfully!`);
            
            // Network added successfully, now connect wallet
            console.log(`🔗 Connecting wallet after adding network...`);
            await onConnect();
            console.log(`✅ Wallet connected!`);
            
          } catch (addError) {
            console.error(`❌ Error adding network:`, addError);
            
            // User rejected adding network
            if (addError.code === 4001) {
              throw new Error("You cancelled adding the network. Please try again.");
            }
            throw new Error(`Failed to add network: ${addError.message || 'Unknown error'}`);
          }
        } else if (switchError.code === 4001) {
          // User rejected switching network
          console.log(`❌ User rejected network switch`);
          throw new Error("You cancelled switching networks. Please try again.");
        } else {
          console.error(`❌ Unexpected switch error:`, switchError);
          throw new Error(`Network switch failed: ${switchError.message || 'Please try again'}`);
        }
      }
    } catch (err) {
      console.error("❌ Connection failed:", err);
      console.error("Error details:", {
        message: err.message,
        code: err.code,
        network: network.shortName
      });
      
      setStep('welcome');
      setSelectedNetwork(null);
      
      // Show error through toast
      if (err.message) {
        toast.error(err.message);
      } else {
        toast.error(`Failed to connect to ${network.shortName}. Please try again.`);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-indigo-900/90 via-purple-900/90 to-pink-900/90 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (step === 'welcome') onClose();
          }}
        />

        {/* Floating particles animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.2, 0.5, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-4xl w-full shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden"
          style={{ maxHeight: '90vh', overflowY: 'auto' }}
        >
          {/* Gradient overlay */}
          <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 pointer-events-none" />

          <div className="relative z-10">
            {step === 'welcome' ? (
              <>
                {/* Header with Logo */}
                <motion.div 
                  className="text-center mb-8"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {/* Logo with glow effect */}
                  <motion.div
                    className="relative inline-block mb-6"
                    animate={{
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur-2xl opacity-50 animate-pulse" />
                    <img 
                      src="/images/UL.png"
                      alt="UnityLedger"
                      className="relative h-24 w-24 filter drop-shadow-2xl"
                    />
                  </motion.div>

                  <motion.h1 
                    className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 mb-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    Welcome to UnityLedger
                  </motion.h1>
                  
                  <motion.p 
                    className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    Join thousands building wealth through <span className="font-bold text-indigo-600 dark:text-indigo-400">decentralized community savings</span>. 
                    Choose your network to get started! 🚀
                  </motion.p>
                </motion.div>

                {/* Features Grid */}
                <motion.div 
                  className="grid grid-cols-3 gap-4 mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  {[
                    { icon: "🔒", text: "Secure", desc: "Bank-grade security" },
                    { icon: "⚡", text: "Fast", desc: "Instant transactions" },
                    { icon: "💎", text: "Rewards", desc: "Earn ULT tokens" }
                  ].map((feature, idx) => (
                    <motion.div
                      key={idx}
                      className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl"
                      whileHover={{ scale: 1.05 }}
                      transition={{ delay: 0.6 + idx * 0.1 }}
                    >
                      <div className="text-3xl mb-2">{feature.icon}</div>
                      <div className="font-bold text-gray-900 dark:text-white text-sm">{feature.text}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{feature.desc}</div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Network Selection */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">
                    Choose Your Network
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {networks.map((network, idx) => (
                      <motion.button
                        key={network.id}
                        onClick={() => handleNetworkSelect(network)}
                        className={`relative group text-left p-6 rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
                          selectedNetwork?.id === network.id
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 bg-white dark:bg-gray-800'
                        }`}
                        whileHover={{ scale: 1.02, y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, x: idx === 0 ? -20 : 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + idx * 0.1 }}
                        disabled={isConnecting}
                      >
                        {/* Gradient background on hover */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${network.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                        
                        <div className="relative z-10">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="text-4xl">{network.icon}</div>
                              <div>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                                  {network.shortName}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {network.name}
                                </p>
                              </div>
                            </div>
                            <motion.div
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                selectedNetwork?.id === network.id
                                  ? 'border-indigo-500 bg-indigo-500'
                                  : 'border-gray-300 dark:border-gray-600'
                              }`}
                              whileHover={{ scale: 1.1 }}
                            >
                              {selectedNetwork?.id === network.id && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="w-3 h-3 bg-white rounded-full"
                                />
                              )}
                            </motion.div>
                          </div>

                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {network.description}
                          </p>

                          <div className="flex flex-wrap gap-2">
                            {network.features.map((feature, fIdx) => (
                              <span
                                key={fIdx}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                              >
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Shimmer effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
                        />
                      </motion.button>
                    ))}
                  </div>
                </motion.div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
                  >
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                      <AlertCircle size={18} />
                      <p className="text-sm font-medium">{error}</p>
                    </div>
                  </motion.div>
                )}

                {/* Info Box */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl"
                >
                  <div className="flex gap-3">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900 dark:text-blue-300">
                      <p className="font-medium mb-1">Need a wallet?</p>
                      <p className="text-blue-700 dark:text-blue-400">
                        Install <a href="https://metamask.io" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-blue-600">MetaMask</a> or another Web3 wallet to continue.
                      </p>
                    </div>
                  </div>
                </motion.div>
              </>
            ) : (
              // Connecting State
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="inline-block mb-6"
                >
                  <div className="w-20 h-20 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 rounded-full" />
                </motion.div>

                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Connecting to {selectedNetwork?.shortName}...
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Please confirm the connection in your wallet
                </p>

                {selectedNetwork && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                    <span className="text-2xl">{selectedNetwork.icon}</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {selectedNetwork.shortName}
                    </span>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Close button (only on welcome step) */}
          {step === 'welcome' && (
            <motion.button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X size={24} />
            </motion.button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const Dashboard = () => {
  const contract = useUnityLedgerContract();
  const { account, connect } = useWallet();
  const { isDark } = useTheme();

  // All state declarations
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [walletConnecting, setWalletConnecting] = useState(false);
  const [walletError, setWalletError] = useState(null);
  const [needsNetworkSwitch, setNeedsNetworkSwitch] = useState(false);
  const [targetNetwork, setTargetNetwork] = useState(null);
  const [poolCount, setPoolCount] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pools, setPools] = useState([]);
  const [sortBy, setSortBy] = useState('newest'); // Sorting state
  const [error, setError] = useState(null);
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [addresses, setAddresses] = useState(null);
  const [ultBalance, setUltBalance] = useState('0');
  const [ultPrice] = useState('0.05');
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Sort pools based on selected sort option
  const sortedPools = useMemo(() => {
    if (!pools || pools.length === 0) return [];
    
    const poolsCopy = [...pools];
    
    switch (sortBy) {
      case 'newest':
        return poolsCopy.sort((a, b) => Number(b.id) - Number(a.id));
      
      case 'oldest':
        return poolsCopy.sort((a, b) => Number(a.id) - Number(b.id));
      
      case 'amount-high':
        return poolsCopy.sort((a, b) => {
          const aAmount = safeBigInt(a.contributionAmount);
          const bAmount = safeBigInt(b.contributionAmount);
          return Number(bAmount - aAmount);
        });
      
      case 'amount-low':
        return poolsCopy.sort((a, b) => {
          const aAmount = safeBigInt(a.contributionAmount);
          const bAmount = safeBigInt(b.contributionAmount);
          return Number(aAmount - bAmount);
        });
      
      case 'apy-high':
        return poolsCopy.sort((a, b) => {
          const aFee = Number(a.fee || 0);
          const bFee = Number(b.fee || 0);
          return bFee - aFee;
        });
      
      case 'capacity-high':
        return poolsCopy.sort((a, b) => {
          const aPercentage = (Number(a.totalMembers) / Number(a.maxMembers)) * 100;
          const bPercentage = (Number(b.totalMembers) / Number(b.maxMembers)) * 100;
          return bPercentage - aPercentage;
        });
      
      case 'capacity-low':
        return poolsCopy.sort((a, b) => {
          const aPercentage = (Number(a.totalMembers) / Number(a.maxMembers)) * 100;
          const bPercentage = (Number(b.totalMembers) / Number(b.maxMembers)) * 100;
          return aPercentage - bPercentage;
        });
      
      default:
        return poolsCopy;
    }
  }, [pools, sortBy]);

  const SUPPORTED_NETWORKS = useMemo(() => ({
    50312: {
      name: "Somnia",
      rpcUrl: "https://dream-rpc.somnia.network",
      chainId: "0xc488",
      nativeCurrency: { name: "Somnia Test Token", symbol: "STT", decimals: 18 },
      blockExplorerUrls: ["https://shannon-explorer.somnia.network"],
      ultToken: "0x2Da2331B2a0E669785e8EAAadc19e63e20E19E5f"
    },
    4202: {
      name: "Lisk Sepolia",
      rpcUrl: "https://rpc.sepolia-api.lisk.com",
      chainId: "0x106a",
      nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
      blockExplorerUrls: ["https://sepolia-blockscout.lisk.com"],
      ultToken: "0x9C6adb7DC4b27fbFe381D726606248Ad258F4228"
    }
  }), []);

  const PREFERRED_NETWORK = useMemo(() => SUPPORTED_NETWORKS[4202], [SUPPORTED_NETWORKS]);

  useEffect(() => {
    if (!account) {
      setShowWalletModal(true);
    } else {
      setShowWalletModal(false);
    }
  }, [account]);

  const checkNetwork = useCallback(async () => {
    if (!window.ethereum) return false;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      
      if (!SUPPORTED_NETWORKS[chainId]) {
        setTargetNetwork(PREFERRED_NETWORK);
        setNeedsNetworkSwitch(true);
        return false;
      }
      setNeedsNetworkSwitch(false);
      return true;
    } catch (error) {
      console.error("Network check failed:", error);
      return false;
    }
  }, [SUPPORTED_NETWORKS, PREFERRED_NETWORK]);

  const switchNetwork = useCallback(async (targetNet = PREFERRED_NETWORK) => {
    if (!window.ethereum) return false;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetNet.chainId }],
      });
      setNeedsNetworkSwitch(false);
      return true;
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: targetNet.chainId,
              chainName: targetNet.name,
              nativeCurrency: targetNet.nativeCurrency,
              rpcUrls: [targetNet.rpcUrl],
              blockExplorerUrls: targetNet.blockExplorerUrls,
            }],
          });
          setNeedsNetworkSwitch(false);
          return true;
        } catch (addError) {
          throw new Error(`Failed to add network: ${addError.message}`);
        }
      } else {
        throw new Error(`Failed to switch network: ${switchError.message}`);
      }
    }
  }, [PREFERRED_NETWORK]);

  const handleWalletConnect = useCallback(async () => {
    setWalletConnecting(true);
    setWalletError(null);
    try {
      if (!window.ethereum) {
        throw new Error("Please install MetaMask or another Web3 wallet.");
      }
      const networkOk = await checkNetwork();
      if (!networkOk && needsNetworkSwitch) {
        return;
      }
      const result = await connect();
      if (result) {
        setShowWalletModal(false);
        toast.success("Wallet connected successfully!");
      } else {
        throw new Error("Failed to connect wallet");
      }
    } catch (error) {
      console.error("Wallet connection failed:", error);
      setWalletError(error.message);
    } finally {
      setWalletConnecting(false);
    }
  }, [connect, checkNetwork, needsNetworkSwitch]);

  const getNetworkAddresses = async () => {
    if (!window.ethereum) return null;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      
      if (chainId === 50312) {
        return { ultToken: "0x2Da2331B2a0E669785e8EAAadc19e63e20E19E5f" };
      } else if (chainId === 4202) {
        return { ultToken: "0x9C6adb7DC4b27fbFe381D726606248Ad258F4228" };
      } else {
        return { ultToken: "0x9C6adb7DC4b27fbFe381D726606248Ad258F4228" };
      }
    } catch (error) {
      return { ultToken: "0x9C6adb7DC4b27fbFe381D726606248Ad258F4228" };
    }
  };

  useEffect(() => {
    const initAddresses = async () => {
      if (account) {
        const addresses = await getNetworkAddresses();
        setAddresses(addresses);
      }
    };
    initAddresses();
  }, [account]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || showWalletModal) return;

    const ctx = canvas.getContext('2d');
    const particles = [];
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();

    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 25 : 50;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.3 + 0.1,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59, 130, 246, ${particle.opacity})`;
        ctx.fill();
      });
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    window.addEventListener('resize', resizeCanvas);
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [showWalletModal]);

  const ULT_ABI = useMemo(() => ["function balanceOf(address) external view returns (uint256)"], []);

  const getULTContract = useCallback(async () => {
    if (!window.ethereum || !addresses) return null;
    const provider = new ethers.BrowserProvider(window.ethereum);
    return new ethers.Contract(addresses.ultToken, ULT_ABI, provider);
  }, [addresses, ULT_ABI]);

  const [stats, setStats] = useState(() => ({
    tvl: "0",
    activePools: "0",
    totalMembers: "0",
    avgYield: "0%",
    ultMarketCap: "0"
  }));

  const fetchULTBalance = useCallback(async () => {
    if (!account || !addresses) return;
    try {
      const ultContract = await getULTContract();
      if (!ultContract) return;
      const balance = await ultContract.balanceOf(account);
      setUltBalance(ethers.formatEther(balance));
    } catch (error) {
      console.error("Error fetching ULT balance:", error);
    }
  }, [account, addresses, getULTContract]);

  const fetchRecentActivity = useCallback(async () => {
    if (!contract) return;
    setActivitiesLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 1000);

      const [joinEvents, payoutEvents, rewardEvents] = await Promise.all([
        contract.queryFilter(contract.filters.JoinedPool(), fromBlock, currentBlock),
        contract.queryFilter(contract.filters.PayoutSent(), fromBlock, currentBlock),
        contract.queryFilter(contract.filters.CreatorRewardEarned(), fromBlock, currentBlock)
      ]);

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
      setActivities([]);
    }
    setActivitiesLoading(false);
  }, [contract]);

  const getActivityIcon = useCallback((type) => {
    switch (type) {
      case 'join':
        return <Users size={16} className="text-emerald-500" />;
      case 'payout':
        return <Gift size={16} className="text-violet-500" />;
      case 'reward':
        return <Star size={16} className="text-amber-500" />;
      default:
        return <Activity size={16} className="text-gray-500" />;
    }
  }, []);

  const calculateStats = useCallback((poolsData) => {
    const activePools = poolsData.filter(p => p.isActive).length;
    const totalMembers = poolsData.reduce((sum, p) => sum + Number(p.totalMembers), 0);
    const tvlWei = poolsData.reduce((sum, p) => {
      const contribution = Number(p.contributionAmount) || 0;
      const members = Number(p.totalMembers) || 0;
      return sum + (contribution * members);
    }, 0);
    const tvlEth = safeFormatEther(tvlWei.toString());
    const tvlUsd = (parseFloat(tvlEth) * 1600).toFixed(0);
    const avgYield = poolsData.length > 0 
      ? poolsData.reduce((sum, p) => sum + Number(p.fee || 0), 0) / poolsData.length
      : 0;
    const ultSupply = 1000000000;
    const ultMarketCap = (ultSupply * parseFloat(ultPrice)).toFixed(0);

    setStats({
      tvl: Number(tvlUsd).toLocaleString(),
      activePools: activePools.toString(),
      totalMembers: totalMembers.toString(),
      avgYield: `${avgYield.toFixed(1)}%`,
      ultMarketCap: Number(ultMarketCap).toLocaleString()
    });
  }, [ultPrice]);

  const getPoolAction = useCallback((pool) => {
    if (!account) {
      return { text: "Connect Wallet", disabled: true, variant: "secondary" };
    }
    const isCreator = pool.creator.toLowerCase() === account.toLowerCase();
    if (isCreator && !pool.joined && pool.currentCycle === BigInt(0) && Number(pool.totalMembers) < Number(pool.maxMembers)) {
      return { text: "Join Your Pool", disabled: false, variant: "success" };
    }
    if (isCreator && pool.joined && pool.canContribute) {
      return { text: "Contribute", disabled: false, variant: "primary" };
    }
    if (pool.canJoin) {
      return { text: "Join Pool", disabled: false, variant: "success" };
    }
    if (pool.canContribute) {
      return { text: "Contribute", disabled: false, variant: "primary" };
    }
    if (pool.joined) {
      return { text: "View Details", disabled: false, variant: "secondary" };
    }
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
  }, [account]);

  const handlePoolAction = useCallback(async (e, pool, action) => {
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
        setTimeout(() => {
          fetchUserData();
          fetchRecentActivity();
        }, 1000);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Action failed: " + (error.reason || error.message));
    }
  }, [contract, account]);

  const getButtonClasses = useCallback((variant, disabled) => {
    const base = "w-full mt-3 sm:mt-4 py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-200 transform";
    if (disabled) {
      return `${base} bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed`;
    }
    switch (variant) {
      case "success":
        return `${base} bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-emerald-200/50 dark:hover:shadow-emerald-900/20 active:scale-95`;
      case "secondary":
        return `${base} bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-900/20 active:scale-95`;
      default:
        return `${base} bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-indigo-200/50 dark:hover:shadow-indigo-900/20 active:scale-95`;
    }
  }, []);

  const fetchUserData = useCallback(async () => {
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
            id: safeBigInt(poolInfo.id),
            creator: poolInfo.creator,
            contributionAmount: safeBigInt(poolInfo.contributionAmount),
            cycleDuration: safeBigInt(poolInfo.cycleDuration),
            maxMembers: safeBigInt(poolInfo.maxMembers),
            totalMembers: safeBigInt(poolInfo.totalMembers),
            currentCycle: safeBigInt(poolInfo.currentCycle),
            lastPayoutTime: safeBigInt(poolInfo.lastPayoutTime),
            isActive: poolInfo.isActive,
            isCompleted: poolInfo.isCompleted,
            poolType: poolInfo.poolType,
            fee: safeBigInt(poolInfo.fee || 0),
            creatorRewards: safeBigInt(poolInfo.creatorRewards || 0),
            totalContributions: safeBigInt(poolInfo.totalContributions || 0),
            totalPayouts: safeBigInt(poolInfo.totalPayouts || 0),
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
  }, [contract, account, calculateStats]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchUserData(),
        fetchRecentActivity(),
        account && addresses ? fetchULTBalance() : Promise.resolve()
      ]);
    } catch (error) {
      console.error("Refresh failed:", error);
    }
    setRefreshing(false);
  }, [fetchUserData, fetchRecentActivity, fetchULTBalance, account, addresses]);

  useEffect(() => {
    if (addresses && account) {
      fetchULTBalance();
    }
  }, [addresses, account, fetchULTBalance]);

  useEffect(() => {
    if (account && contract) {
      fetchUserData();
      fetchRecentActivity();
    }
  }, [contract, account, fetchUserData, fetchRecentActivity]);

  const statsData = useMemo(() => [
    {
      title: "Total Value Locked",
      value: `$${stats.tvl}`,
      change: "+12.6%",
      icon: <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" />,
      bg: "bg-gradient-to-br from-blue-100 via-blue-200 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-800/50",
      badgeColor: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300",
      chartColor: "#3b82f6"
    },
    {
      title: "ULT Market Cap",
      value: `$${stats.ultMarketCap}`,
      change: "+3.2%",
      icon: <Coins className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600 dark:text-yellow-400" />,
      bg: "bg-gradient-to-br from-yellow-100 via-amber-200 to-orange-100 dark:from-yellow-900/30 dark:to-orange-800/50",
      badgeColor: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300",
      chartColor: "#eab308"
    },
    {
      title: "Active Pools",
      value: stats.activePools,
      change: "+5.2%",
      icon: <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600 dark:text-emerald-400" />,
      bg: "bg-gradient-to-br from-emerald-100 via-green-200 to-teal-100 dark:from-emerald-900/30 dark:to-teal-800/50",
      badgeColor: "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300",
      chartColor: "#10b981"
    },
    {
      title: "Community Members", 
      value: stats.totalMembers,
      change: "+8.7%",
      icon: <Users className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 dark:text-purple-400" />,
      bg: "bg-gradient-to-br from-purple-100 via-violet-200 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-800/50",
      badgeColor: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300",
      chartColor: "#8b5cf6"
    },
    {
      title: "Average Yield",
      value: stats.avgYield,
      change: "Verified",
      icon: <Award className="w-6 h-6 sm:w-8 sm:h-8 text-pink-600 dark:text-pink-400" />,
      bg: "bg-gradient-to-br from-pink-100 via-rose-200 to-red-100 dark:from-pink-900/30 dark:to-red-800/50",
      badgeColor: "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300",
      chartColor: "#ec4899"
    }
  ], [stats]);

  const StatCard = React.memo(({ stat, index }) => {
    const cardRef = useRef(null);
    const isInView = useInView(cardRef, { once: true, threshold: 0.3 });

    return (
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ delay: index * 0.1, duration: 0.5 }}
        className="group bg-gradient-to-br from-white/50 to-white/30 dark:from-gray-800/50 dark:to-gray-900/30 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-lg hover:shadow-xl border border-white/20 dark:border-gray-700/20 transition-all duration-300 cursor-pointer relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-out" />
        </div>

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div className={`${stat.bg} p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-md`}>
              {stat.icon}
            </div>
            <div className={`text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full ${stat.badgeColor} flex items-center gap-1`}>
              {stat.change.includes('%') ? (
                stat.change.includes('+') ? <ArrowUp size={8} className="sm:w-2.5 sm:h-2.5 text-emerald-600" /> : <ArrowDown size={8} className="sm:w-2.5 sm:h-2.5 text-red-600" />
              ) : (
                <Shield size={8} className="sm:w-2.5 sm:h-2.5 text-blue-600" />
              )}
              <span className="hidden xs:inline">{stat.change}</span>
              <span className="xs:hidden">{stat.change.replace('Verified', '✓')}</span>
            </div>
          </div>
          <div className="mb-3 sm:mb-4">
            <p className="text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs font-medium mb-0.5 sm:mb-1 uppercase tracking-wide line-clamp-1">
              {stat.title}
            </p>
            <h3 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
              {stat.value}
            </h3>
            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs mt-1.5 sm:mt-2">
              <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-400 rounded-full animate-pulse" />
              <span className="text-gray-500">Live Data</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  });

  const containerVariants = useMemo(() => ({
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.04, 
        delayChildren: 0.1,
        when: "beforeChildren"
      }
    }
  }), []);

  const itemVariants = useMemo(() => ({
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: "spring", stiffness: 200, damping: 20 }
    }
  }), []);

  // Card gradient themes
  const cardThemes = [
    {
      gradient: "from-indigo-500 via-purple-500 to-pink-500",
      shine: "from-white/20 via-white/40 to-transparent",
      glow: "shadow-indigo-500/20",
      brand: "UnityLedger"
    },
    {
      gradient: "from-blue-600 via-cyan-500 to-teal-500",
      shine: "from-white/20 via-white/40 to-transparent",
      glow: "shadow-blue-500/20",
      brand: "Savings Pool"
    },
    {
      gradient: "from-violet-600 via-purple-600 to-fuchsia-600",
      shine: "from-white/20 via-white/40 to-transparent",
      glow: "shadow-purple-500/20",
      brand: "Premium"
    },
    {
      gradient: "from-emerald-500 via-green-500 to-teal-600",
      shine: "from-white/20 via-white/40 to-transparent",
      glow: "shadow-emerald-500/20",
      brand: "Active"
    },
    {
      gradient: "from-orange-500 via-amber-500 to-yellow-500",
      shine: "from-white/20 via-white/40 to-transparent",
      glow: "shadow-amber-500/20",
      brand: "Gold"
    },
    {
      gradient: "from-rose-500 via-pink-500 to-red-500",
      shine: "from-white/20 via-white/40 to-transparent",
      glow: "shadow-rose-500/20",
      brand: "Elite"
    }
  ];

  if (!account) {
    return (
      <>
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 min-h-screen flex items-center justify-center">
          <div className="text-center px-4">
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full p-4 sm:p-6 w-fit mx-auto mb-4 sm:mb-6">
              <Wallet className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Welcome to UnityLedger
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 max-w-md mx-auto">
              Connect your wallet to start participating in decentralized savings pools and earn ULT rewards.
            </p>
            <button
              onClick={() => setShowWalletModal(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Connect Wallet
            </button>
          </div>
        </div>
        
        <WalletConnectionModal
          isOpen={showWalletModal}
          onConnect={handleWalletConnect}
          onClose={() => setShowWalletModal(false)}
          error={walletError}
          isConnecting={walletConnecting}
          needsNetworkSwitch={needsNetworkSwitch}
          targetNetwork={targetNetwork}
          onSwitchNetwork={() => switchNetwork(targetNetwork)}
        />
      </>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <motion.div 
          className="flex items-center justify-center py-12 sm:py-16"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 shadow-xl border border-gray-100 dark:border-gray-700 mx-4">
            <div className="bg-red-100 dark:bg-red-900/30 rounded-full p-3 sm:p-4 w-fit mx-auto mb-3 sm:mb-4">
              <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
              Connection Error
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 break-words">
              {error}
            </p>
            <motion.button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform active:scale-95"
              whileTap={{ scale: 0.95 }}
            >
              Retry Connection
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 space-y-6 sm:space-y-8 md:space-y-12 relative"
      style={{ 
        background: isDark 
          ? 'radial-gradient(ellipse at top, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(ellipse at bottom, rgba(147, 51, 234, 0.1) 0%, transparent 50%)'
          : 'radial-gradient(ellipse at top, rgba(59, 130, 246, 0.05) 0%, transparent 50%), radial-gradient(ellipse at bottom, rgba(147, 51, 234, 0.05) 0%, transparent 50%)'
      }}
    >
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
        style={{ mixBlendMode: isDark ? 'screen' : 'multiply' }}
      />

      {/* Floating Action Menu */}
      <motion.div
        className="fixed bottom-4 sm:bottom-6 md:bottom-8 right-4 sm:right-6 md:right-8 z-40"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1 }}
      >
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-2xl flex items-center justify-center text-white font-bold hover:shadow-3xl transition-all duration-300"
        >
          <motion.div
            animate={{ rotate: sidebarOpen ? 45 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
          </motion.div>
        </motion.button>
      </motion.div>

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            />
            
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed top-0 right-0 w-full sm:w-80 md:w-96 h-full bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl shadow-2xl z-50 p-4 sm:p-6 md:p-8 overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">Quick Actions</h2>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                {[
                  { icon: <Plus size={18} />, title: 'Create Pool', desc: 'Start a new savings pool', to: '/join-create' },
                  { icon: <Search size={18} />, title: 'Find Pools', desc: 'Browse available pools', to: '/pools' },
                  { icon: <BarChart3 size={18} />, title: 'Your Dashboard', desc: 'Manage your pools', to: '/memberdashboard' },
                  { icon: <TrendingUp size={18} />, title: 'Stake ULT', desc: 'Earn rewards by staking', to: '/stake' },
                  { icon: <Gift size={18} />, title: 'Get ULT', desc: 'Claim from faucet', to: '/faucet' }
                ].map((action, index) => (
                  <Link
                    key={action.title}
                    to={action.to}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl sm:rounded-2xl text-left hover:shadow-lg transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg sm:rounded-xl text-blue-600 dark:text-blue-400">
                          {action.icon}
                        </div>
                        <div>
                          <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">{action.title}</h3>
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{action.desc}</p>
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Hero Section - Minimalist Bank Card Design */}
      <motion.section 
        className="relative rounded-2xl overflow-hidden mb-6 sm:mb-8 perspective-1000"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <motion.div
          whileHover={{ 
            scale: 1.01,
            transition: { duration: 0.3 }
          }}
          className="relative transform-gpu"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Premium Gradient Background */}
          <div className={`absolute inset-0 ${isDark 
            ? "bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600"
            : "bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500"}`}
          />
          
          {/* Holographic Shine Effect */}
          <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-700">
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/20 transform -skew-x-12 translate-x-[-100%] hover:translate-x-[200%] transition-transform duration-1500 ease-out" />
          </div>

          {/* Glossy Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/20 pointer-events-none" />
          
          {/* Card Pattern/Texture */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.05) 10px, rgba(255,255,255,.05) 20px)'
            }} />
          </div>

          {/* Logo Watermark Background */}
          <div className="absolute top-1/2 right-8 -translate-y-1/2 opacity-10 pointer-events-none">
            <img 
              src="/images/UL.png"
              alt="UnityLedger"
              className="h-32 w-32 sm:h-40 sm:w-40 filter brightness-0 invert"
            />
          </div>
          
          <div className="relative z-10 py-6 sm:py-8 px-6 sm:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center max-w-5xl mx-auto">
              {/* Left Side - Card Information */}
              <div className="space-y-4 sm:space-y-5">
                {/* Card Brand & Chip */}
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    {/* Bank/Brand Name */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="font-black text-xl sm:text-2xl text-white tracking-wider">
                        UNITYLEDGER
                      </div>
                    </motion.div>
                    
                    {/* EMV Chip */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <CardChip />
                    </motion.div>
                  </div>

                  {/* Contactless Icon */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-white/70"
                  >
                    <ContactlessIcon />
                  </motion.div>
                </div>

                {/* Card Type Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/30"
                >
                  <Sparkles size={14} className="text-yellow-300" />
                  <span className="text-white text-xs font-semibold tracking-wide">DECENTRALIZED SAVINGS</span>
                </motion.div>

                {/* Card Number */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-1"
                >
                  <div className="font-mono text-lg sm:text-xl tracking-[0.25em] font-medium text-white">
                    {"•••• •••• •••• " + (account ? account.slice(-4) : "****")}
                  </div>
                  <div className="text-[10px] sm:text-xs text-white/60 font-medium tracking-wider">
                    MEMBER CARD
                  </div>
                </motion.div>

                {/* Valid Thru / Network */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center gap-6"
                >
                  <div>
                    <div className="text-[9px] sm:text-[10px] text-white/60 uppercase tracking-widest font-medium mb-0.5">
                      Valid Thru
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-white tracking-wider">
                      ∞
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] sm:text-[10px] text-white/60 uppercase tracking-widest font-medium mb-0.5">
                      Network
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-white tracking-wider">
                      WEB3
                    </div>
                  </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex flex-wrap gap-2 pt-1"
                >
                  <Link
                    to="/join-create"
                    className="group bg-white/20 backdrop-blur-md hover:bg-white/30 text-white border border-white/40 hover:border-white/60 px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 text-xs sm:text-sm shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                  >
                    <Plus size={16} />
                    <span>Create Pool</span>
                  </Link>
                  <Link
                    to="/faucet"
                    className="group bg-yellow-400/25 backdrop-blur-md hover:bg-yellow-400/35 text-white border border-yellow-300/40 hover:border-yellow-300/60 px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 text-xs sm:text-sm shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                  >
                    <Gift size={16} />
                    <span>Get ULT</span>
                  </Link>
                </motion.div>
              </div>

              {/* Right Side - Welcome & Balance */}
              <div className="space-y-4 lg:pl-6">
                {/* Welcome Message */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-2"
                >
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
                    Welcome to{" "}
                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-300 to-pink-300">
                      UnityLedger
                    </span>
                  </h1>
                  
                  <p className="text-sm sm:text-base text-white/90">
                    Build wealth with{" "}
                    <span className="font-bold text-yellow-200">automated payouts</span> and{" "}
                    <span className="font-bold text-pink-200">ULT rewards</span>
                  </p>
                </motion.div>

                {/* ULT Balance Card */}
                {account && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/30 shadow-xl"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-white/70 mb-1 uppercase tracking-wider font-medium">Available Balance</p>
                        <div className="flex items-baseline gap-2">
                          <Coins size={20} className="text-yellow-300" />
                          <p className="text-2xl font-black text-white">{parseFloat(ultBalance).toFixed(3)}</p>
                          <span className="text-sm font-bold text-white/80">ULT</span>
                        </div>
                        <p className="text-[10px] text-white/60 mt-0.5">
                          ≈ ${(parseFloat(ultBalance) * parseFloat(ultPrice) * 1600).toFixed(2)} USD
                        </p>
                      </div>
                      <div className="text-white/30">
                        <BarChart3 size={36} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Corner Accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-bl-full pointer-events-none" />
        </motion.div>
      </motion.section>

      {/* Stats Section */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6 lg:gap-8"
      >
        {statsData.map((stat, index) => (
          <StatCard key={index} stat={stat} index={index} />
        ))}
      </motion.section>

      {/* Navigation Cards */}
      <motion.section
        className="mb-6 sm:mb-8 md:mb-12"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {[
            {
              to: "/pools",
              icon: <PieChart className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 mb-2 sm:mb-3" />,
              title: "Explore Pools",
              desc: "Browse available pools",
              gradient: "from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
            },
            {
              to: "/memberdashboard",
              icon: <Users className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 mb-2 sm:mb-3" />,
              title: "Dashboard", 
              desc: "Manage your pools",
              gradient: "from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
            },
            {
              to: "/stake",
              icon: <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 mb-2 sm:mb-3" />,
              title: "Stake ULT",
              desc: "Earn 10% APY",
              gradient: "from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
            },
            {
              to: "/faucet",
              icon: <Gift className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 mb-2 sm:mb-3" />,
              title: "Get ULT",
              desc: "Claim free tokens",
              gradient: "from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            }
          ].map((card, index) => (
            <Link
              key={card.title}
              to={card.to}
              className={`group bg-gradient-to-r ${card.gradient} rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-white transition-all duration-300 transform active:scale-95 sm:hover:scale-105 shadow-lg hover:shadow-xl`}
            >
              <motion.div variants={itemVariants}>
                {card.icon}
              </motion.div>
              <h3 className="font-bold text-sm sm:text-base md:text-lg mb-1 sm:mb-2">{card.title}</h3>
              <p className="text-xs sm:text-sm opacity-90 line-clamp-2">{card.desc}</p>
              <ArrowRight size={14} className="sm:w-4 sm:h-4 mt-1 sm:mt-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          ))}
        </div>
      </motion.section>

      {/* Bank Card Style Pools Section */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 md:mb-8 gap-3 sm:gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-800 dark:text-white mb-1 sm:mb-2">
              {isLoading ? (
                <div className="bg-gray-200 dark:bg-gray-700 animate-pulse h-8 sm:h-9 w-40 sm:w-48 rounded-xl" />
              ) : (
                <span className="flex items-center gap-2 sm:gap-3">
                  <CreditCard className="text-indigo-500 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
                  <span className="text-xl sm:text-2xl md:text-3xl">
                    {poolCount || 0} Savings {poolCount === 1 ? "Pool" : "Pools"}
                  </span>
                </span>
              )}
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400">
              Build wealth together with automated savings
            </p>
          </div>
          
          {/* Sorting Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer hover:border-indigo-400"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="amount-high">Amount: High to Low</option>
              <option value="amount-low">Amount: Low to High</option>
              <option value="apy-high">APY: High to Low</option>
              <option value="capacity-high">Most Filled</option>
              <option value="capacity-low">Least Filled</option>
            </select>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6"
              key="loading"
              exit={{ opacity: 0 }}
            >
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-2xl sm:rounded-3xl p-6 sm:p-7 md:p-8 h-72 sm:h-80 shadow-2xl animate-pulse border border-gray-300 dark:border-gray-600"
                >
                  <div className="space-y-4">
                    <div className="bg-gray-300 dark:bg-gray-600 h-8 w-12 rounded-md" />
                    <div className="bg-gray-300 dark:bg-gray-600 h-6 w-2/3 rounded-lg" />
                    <div className="bg-gray-300 dark:bg-gray-600 h-4 w-1/2 rounded-lg" />
                  </div>
                </div>
              ))}
            </motion.div>
          ) : sortedPools.length === 0 ? (
            <motion.div
              className="text-center py-12 sm:py-16 md:py-20"
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 border-2 border-dashed border-gray-200 dark:border-gray-700 mx-4">
                <div className="bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-full p-4 sm:p-5 md:p-6 w-fit mx-auto mb-4 sm:mb-5 md:mb-6">
                  <CreditCard className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
                  No Pools Available Yet
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 sm:mb-8 max-w-md mx-auto px-4">
                  Be the pioneer! Create the first premium savings pool and start building wealth together.
                </p>
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/join-create"
                    className="inline-flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-sm sm:text-base font-bold transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Star size={18} className="sm:w-5 sm:h-5" />
                    Create First Pool
                    <ArrowRight size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5"
              key="pools"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {sortedPools.slice(0, 6).map((pool, idx) => {
                const poolIdStr = pool.id.toString();
                const totalMembersStr = pool.totalMembers.toString();
                const maxMembersStr = pool.maxMembers.toString();
                const contributionEth = safeFormatEther(pool.contributionAmount);
                const contributionUSD = parseFloat(contributionEth) * 1600;
                const action = getPoolAction(pool);
                const completionPercentage = (Number(pool.totalMembers) / Number(pool.maxMembers)) * 100;
                const isCreator = account && pool.creator.toLowerCase() === account.toLowerCase();
                const theme = cardThemes[idx % cardThemes.length];

                return (
                  <motion.div
                    key={poolIdStr}
                    variants={itemVariants}
                    className="group perspective-1000"
                  >
                    <Link to={`/pool/${poolIdStr}`}>
                      <motion.div
                        whileHover={{ 
                          scale: 1.02,
                          transition: { duration: 0.3 }
                        }}
                        whileTap={{ scale: 0.98 }}
                        className={`relative bg-gradient-to-br ${theme.gradient} rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-xl hover:shadow-2xl ${theme.glow} transition-all duration-500 overflow-hidden transform-gpu`}
                        style={{
                          transformStyle: 'preserve-3d',
                        }}
                      >
                        {/* Holographic Shine Effect */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                          <div className={`absolute inset-0 bg-gradient-to-br ${theme.shine} transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000 ease-out`} />
                        </div>

                        {/* Glossy Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/20 pointer-events-none" />

                        <div className="relative z-10 text-white h-full flex flex-col">
                          {/* Card Header */}
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              {/* Brand */}
                              <div className="flex items-center gap-2 mb-3">
                                <div className="font-black text-sm tracking-wider opacity-90">
                                  {theme.brand}
                                </div>
                                {pool.joined && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/20 backdrop-blur-sm border border-white/30">
                                    <Star size={8} className="mr-0.5" />
                                    MEMBER
                                  </span>
                                )}
                                {isCreator && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-yellow-400/30 backdrop-blur-sm border border-yellow-300/50">
                                    <Award size={8} className="mr-0.5" />
                                    CREATOR
                                  </span>
                                )}
                              </div>
                              
                              {/* Chip */}
                              <div className="w-9 h-7">
                                <CardChip />
                              </div>
                            </div>

                            {/* Contactless Icon */}
                            <div className="text-white/60">
                              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                                <path d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                            </div>
                          </div>

                          {/* Card Number (Pool ID) */}
                          <div className="mb-4">
                            <div className="font-mono text-base tracking-[0.25em] font-medium mb-1">
                              {"•••• •••• " + poolIdStr.padStart(4, '0')}
                            </div>
                            <div className="text-[9px] opacity-70 tracking-wider">SAVINGS POOL</div>
                          </div>

                          {/* Card Details */}
                          <div className="flex justify-between items-end mb-3">
                            <div>
                              <div className="text-[9px] opacity-70 mb-0.5 uppercase tracking-wider">Amount</div>
                              <div className="font-bold text-base">
                                {parseFloat(contributionEth).toFixed(3)} ETH
                              </div>
                              <div className="text-[10px] opacity-80">
                                ${contributionUSD.toFixed(0)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-[9px] opacity-70 mb-0.5 uppercase tracking-wider">APY</div>
                              <div className="font-bold text-base text-yellow-300">
                                {pool.fee ? pool.fee.toString() + "%" : "0%"}
                              </div>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mb-3">
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="text-[9px] opacity-80 uppercase tracking-wide">Capacity</span>
                              <span className="text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded">
                                {totalMembersStr}/{maxMembersStr}
                              </span>
                            </div>
                            <div className="relative">
                              <div className="w-full bg-black/20 rounded-full h-1.5 overflow-hidden backdrop-blur-sm">
                                <motion.div 
                                  className="h-full bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-300 rounded-full relative shadow-md"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${completionPercentage}%` }}
                                  transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
                                >
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
                                </motion.div>
                              </div>
                              <p className="text-[9px] opacity-70 mt-1">
                                {completionPercentage.toFixed(0)}% filled
                              </p>
                            </div>
                          </div>

                          {/* ULT Balance (for members) */}
                          {account && pool.joined && !isCreator && (
                            <div className="mb-3 p-2.5 bg-black/20 backdrop-blur-sm rounded-lg border border-white/20">
                              <UltBalanceAndClaim poolId={poolIdStr} />
                            </div>
                          )}

                          {/* Action Button */}
                          <motion.button
                            onClick={(e) => handlePoolAction(e, pool, action)}
                            whileTap={!action.disabled ? { scale: 0.98 } : {}}
                            className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs transition-all duration-200 ${
                              action.disabled
                                ? 'bg-white/10 text-white/40 cursor-not-allowed'
                                : 'bg-white/25 hover:bg-white/35 backdrop-blur-sm border border-white/30 hover:border-white/50 text-white shadow-lg hover:shadow-xl'
                            }`}
                            disabled={action.disabled}
                          >
                            <span className="relative z-10">{action.text}</span>
                          </motion.button>
                        </div>

                        {/* Corner Accent */}
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/10 to-transparent rounded-bl-full" />
                      </motion.div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* Activity Feed - Keep original styling */}
      <motion.section
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2 sm:gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-0.5 sm:mb-1">Recent Activity</h2>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400">Latest transactions</p>
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <motion.button
              onClick={fetchRecentActivity}
              className="inline-flex items-center gap-1.5 sm:gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 text-xs sm:text-sm font-semibold transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw size={14} className={`sm:w-4 sm:h-4 ${activitiesLoading ? "animate-spin" : ""}`} />
            </motion.button>
            <Link
              to="/pools"
              className="inline-flex items-center gap-1.5 sm:gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-xs sm:text-sm font-semibold transition-colors group"
            >
              <span className="hidden xs:inline">View All</span>
              <span className="xs:hidden">All</span>
              <ArrowRight size={14} className="sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          {activitiesLoading ? (
            <div className="p-4 sm:p-6 text-center">
              <div className="flex items-center justify-center gap-2 sm:gap-3 text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin" />
                Loading activity...
              </div>
            </div>
          ) : activities.length === 0 ? (
            <div className="p-6 sm:p-8 text-center">
              <div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-3 sm:p-4 w-fit mx-auto mb-3 sm:mb-4">
                  <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-600 dark:text-gray-400 mb-1 sm:mb-2">
                  No Recent Activity
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">
                  Transactions will appear here
                </p>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {activities.map((activity, index) => (
                <motion.li
                  key={`${activity.transactionHash}-${index}`}
                  whileTap={{
                    backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
                  }}
                  className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 cursor-pointer transition-all duration-200"
                >
                  <div className="flex items-center justify-between gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0">
                      <div className="flex-shrink-0 p-1.5 sm:p-2 rounded-lg bg-gray-50 dark:bg-gray-700">
                        {activity.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {activity.type === "join" && "Joined"}
                          {activity.type === "payout" && "Payout from"}
                          {activity.type === "reward" && "Reward from"}{" "}
                          <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                            Pool #{activity.poolId}
                          </span>
                        </p>
                        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">
                          {activity.user.slice(0, 6)}...{activity.user.slice(-4)}
                          {activity.amount && " • "}
                          {activity.amount && (
                            <span className="font-semibold">{parseFloat(activity.amount).toFixed(4)} ETH</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-1.5 text-gray-400 flex-shrink-0">
                      <Clock size={12} className="sm:w-3.5 sm:h-3.5" />
                      <span className="text-[10px] sm:text-xs font-medium whitespace-nowrap">{activity.time}</span>
                    </div>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </motion.section>
    </div>
  );
};

export default Dashboard;