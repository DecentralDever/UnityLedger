import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletProvider';
import { toast } from 'react-toastify';
import { ethers } from 'ethers';
import { Droplets, Clock, Users, Zap, Gift, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

const ULTFaucet = () => {
  const { account } = useWallet();
  
  // Contract addresses
  const getNetworkAddresses = async () => {
    if (!window.ethereum) return null;
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      
      // Somnia Devnet chainId: 50311
      // Lisk Sepolia chainId: 4202
      if (chainId === 50311) {
        console.log("Connected to Somnia network");
        return {
          faucet: "0xC37c0B74cEb68a712DD979109f259dC849Cf9440",
          ultToken: "0x234CFEe105A2c7223Aae5a3F80c109EE6b5bB0F5"
        };
      } else if (chainId === 4202) {
        console.log("Connected to Lisk Sepolia network");
        return {
          faucet: "0x8BC2745a3Ef097c3423FBcDBa6afEb3700A70902",
          ultToken: "0xCaB2f442dBaa702593d915dc1dD5333943081C37"
        };
      } else {
        console.warn("Unknown network, defaulting to Lisk Sepolia");
        return {
          faucet: "0x00b996F01bF4a381A443AE70C9e5079646555396",
          ultToken: "0xCaB2f442dBaa702593d915dc1dD5333943081C37"
        };
      }
    } catch (error) {
      console.error("Error detecting network:", error);
      // Default to Lisk Sepolia
      return {
        faucet: "0x00b996F01bF4a381A443AE70C9e5079646555396",
        ultToken: "0xCaB2f442dBaa702593d915dc1dD5333943081C37"
      };
    }
  };
  
  // States
  const [addresses, setAddresses] = useState(null);
  const [canClaim, setCanClaim] = useState(false);
  const [timeUntilNext, setTimeUntilNext] = useState(0);
  const [userBalance, setUserBalance] = useState('0');
  const [totalClaimed, setTotalClaimed] = useState('0');
  const [isClaiming, setIsClaiming] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Faucet stats
  const [faucetStats, setFaucetStats] = useState({
    totalDispensed: '0',
    totalUsers: '0',
    faucetAmount: '0',
    cooldownHours: '0',
    maxBalance: '0',
    isActive: false
  });

  // Contract ABIs
  const FAUCET_ABI = [
    "function claimTokens() external",
    "function canClaim(address) external view returns (bool)",
    "function getUserStats(address) external view returns (uint256, uint256, uint256, bool)",
    "function getFaucetStats() external view returns (uint256, uint256, uint256, uint256, uint256, bool)"
  ];

  const ULT_ABI = [
    "function balanceOf(address) external view returns (uint256)"
  ];

  // Get contract instances
  const getFaucetContract = async () => {
    if (!window.ethereum || !addresses) return null;
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(addresses.faucet, FAUCET_ABI, signer);
  };

  const getULTContract = async () => {
    if (!window.ethereum || !addresses) return null;
    const provider = new ethers.BrowserProvider(window.ethereum);
    return new ethers.Contract(addresses.ultToken, ULT_ABI, provider);
  };

  // Load faucet data
  const loadFaucetData = async () => {
    if (!account || !addresses) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      const faucetContract = await getFaucetContract();
      const ultContract = await getULTContract();
      
      if (!faucetContract || !ultContract) return;

      console.log("Loading data from contracts:", {
        faucet: addresses.faucet,
        ultToken: addresses.ultToken
      });

      // Get faucet stats
      const [totalDispensed, totalUsers, faucetAmount, cooldownPeriod, maxBalance, isActive] = 
        await faucetContract.getFaucetStats();
      
      setFaucetStats({
        totalDispensed: ethers.formatEther(totalDispensed),
        totalUsers: totalUsers.toString(),
        faucetAmount: ethers.formatEther(faucetAmount),
        cooldownHours: (Number(cooldownPeriod) / 3600).toString(),
        maxBalance: ethers.formatEther(maxBalance),
        isActive
      });

      // Get user stats
      const [userTotalClaimed, lastClaimTime, timeUntilNextClaim, userCanClaim] = 
        await faucetContract.getUserStats(account);
      
      setTotalClaimed(ethers.formatEther(userTotalClaimed));
      setCanClaim(userCanClaim);
      setTimeUntilNext(Number(timeUntilNextClaim));

      // Get user balance
      const balance = await ultContract.balanceOf(account);
      setUserBalance(ethers.formatEther(balance));
      console.log("User balance:", ethers.formatEther(balance));

    } catch (error) {
      console.error("Error loading faucet data:", error);
      toast.error("Failed to load faucet data");
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize addresses
  useEffect(() => {
    const initAddresses = async () => {
      const networkAddresses = await getNetworkAddresses();
      setAddresses(networkAddresses);
    };
    initAddresses();
  }, []);

  // Claim tokens
  const handleClaim = async () => {
    if (!canClaim || !account || !addresses) return;
    
    try {
      setIsClaiming(true);
      
      const faucetContract = await getFaucetContract();
      if (!faucetContract) return;

      const tx = await faucetContract.claimTokens();
      toast.info("Claiming tokens...");
      
      await tx.wait();
      toast.success(`Successfully claimed ${faucetStats.faucetAmount} ULT!`);
      
      // Wait a bit for the blockchain to update
      setTimeout(() => {
        loadFaucetData();
      }, 2000);
      
    } catch (error) {
      console.error("Error claiming tokens:", error);
      let errorMessage = "Failed to claim tokens";
      
      if (error.reason) {
        errorMessage += ": " + error.reason;
      } else if (error.message) {
        if (error.message.includes("Cooldown period not met")) {
          errorMessage = "Cooldown period not met";
        } else if (error.message.includes("Balance exceeds maximum")) {
          errorMessage = "Your balance exceeds the maximum allowed";
        } else {
          errorMessage += ": " + error.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsClaiming(false);
    }
  };

  // Timer effect
  useEffect(() => {
    if (timeUntilNext > 0) {
      const timer = setInterval(() => {
        setTimeUntilNext(prev => {
          if (prev <= 1) {
            setCanClaim(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [timeUntilNext]);

  // Load data on mount and account/addresses change
  useEffect(() => {
    if (addresses && account) {
      loadFaucetData();
    }
  }, [account, addresses]);

  // Format time
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Loading state
  if (isLoading || !addresses) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading faucet data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full mb-4">
          <Droplets size={32} className="text-white" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
          ULT Token Faucet
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Get free ULT tokens to start using Unity Ledger
        </p>
      </div>

      {/* Faucet Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <Gift size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Dispensed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {parseFloat(faucetStats.totalDispensed).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
              <Users size={20} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{faucetStats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
              <Zap size={20} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Claim Amount</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {parseFloat(faucetStats.faucetAmount).toLocaleString()} ULT
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Claim Panel */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <Droplets size={24} className="text-blue-600" />
              Claim ULT Tokens
            </h2>

            {!account ? (
              <div className="text-center py-12">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-6 w-fit mx-auto mb-4">
                  <AlertCircle size={32} className="text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Connect Your Wallet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Connect your wallet to claim free ULT tokens
                </p>
              </div>
            ) : !faucetStats.isActive ? (
              <div className="text-center py-12">
                <div className="bg-red-100 dark:bg-red-900/50 rounded-full p-6 w-fit mx-auto mb-4">
                  <AlertCircle size={32} className="text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Faucet Inactive
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  The faucet is currently inactive. Please check back later.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Claim Button */}
                <div className="text-center">
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-8 border border-blue-200 dark:border-blue-800 mb-6">
                    <div className="text-4xl font-black text-blue-600 dark:text-blue-400 mb-2">
                      {parseFloat(faucetStats.faucetAmount).toLocaleString()} ULT
                    </div>
                    <p className="text-blue-700 dark:text-blue-300">Available to claim</p>
                  </div>

                  {canClaim ? (
                    <button
                      onClick={handleClaim}
                      disabled={isClaiming}
                      className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 disabled:opacity-50 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                    >
                      {isClaiming ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Claiming...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <Gift size={20} />
                          Claim {parseFloat(faucetStats.faucetAmount).toLocaleString()} ULT
                        </div>
                      )}
                    </button>
                  ) : (
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-6">
                      <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                        <Clock size={20} />
                        <span className="font-semibold">Next claim available in:</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {timeUntilNext > 0 ? formatTime(timeUntilNext) : 'Ready to claim!'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Rules */}
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                  <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-2">Faucet Rules</h4>
                  <ul className="text-sm text-amber-700 dark:text-amber-400 space-y-1">
                    <li>• Claim {parseFloat(faucetStats.faucetAmount).toLocaleString()} ULT every {faucetStats.cooldownHours} hours</li>
                    <li>• Maximum balance of {parseFloat(faucetStats.maxBalance).toLocaleString()} ULT to claim</li>
                    <li>• One claim per wallet address</li>
                    <li>• Use tokens to create pools or trade on DEX</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* User Stats */}
          {account && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp size={20} />
                Your Stats
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">ULT Balance</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {parseFloat(userBalance).toLocaleString()}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Total Claimed</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {parseFloat(totalClaimed).toLocaleString()}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Status</span>
                  <span className={`flex items-center gap-1 text-sm font-semibold ${
                    canClaim ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
                  }`}>
                    {canClaim ? <CheckCircle size={16} /> : <Clock size={16} />}
                    {canClaim ? 'Ready' : 'Cooldown'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* What to do with ULT */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Use Your ULT
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold text-sm">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Create Pools</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Use 500 ULT to create savings pools</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Stake & Earn</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Stake for 10% APY and fee discounts</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 dark:text-purple-400 font-bold text-sm">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Trade & Swap</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Use on DEX for trading other tokens</p>
                </div>
              </div>
            </div>
          </div>

          {/* Need More ULT? */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Need More ULT?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Join pools and claim yield rewards to earn more ULT tokens continuously.
            </p>
            <button 
              onClick={() => window.location.href = '/pools'}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-2 px-4 rounded-lg font-semibold text-sm"
            >
              Explore Pools
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ULTFaucet;