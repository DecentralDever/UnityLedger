import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletProvider';
import { toast } from 'react-toastify';
import { ethers } from 'ethers';
import { 
  TrendingUp, 
  Zap, 
  Gift, 
  Lock, 
  Unlock, 
  DollarSign, 
  Users, 
  Shield,
  Award,
  AlertCircle,
  CheckCircle 
} from 'lucide-react';

const ULTStaking = () => {
  const { account } = useWallet();
  
  // Network addresses
  const getNetworkAddresses = () => {
    const isMainnet = window.location.hostname === 'http://localhost:5173/';
    return {
      ultToken: isMainnet 
        ? "0x234CFEe105A2c7223Aae5a3F80c109EE6b5bB0F5" // Somnia
        : "0xCaB2f442dBaa702593d915dc1dD5333943081C37"  // Lisk
    };
  };

  const { ultToken: ULT_TOKEN_ADDRESS } = getNetworkAddresses();

  // States
  const [ultBalance, setUltBalance] = useState('0');
  const [stakedAmount, setStakedAmount] = useState('0');
  const [pendingRewards, setPendingRewards] = useState('0');
  const [feeDiscount, setFeeDiscount] = useState('0');
  const [votingPower, setVotingPower] = useState('0');
  const [stakingAPY, setStakingAPY] = useState('10');
  
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [activeTab, setActiveTab] = useState('stake');
  
  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Contract ABI
  const ULT_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function stake(uint256 amount)",
    "function unstake(uint256 amount)", 
    "function claimStakingRewards()",
    "function getStakeInfo(address) view returns (tuple(uint256 amount, uint256 startTime, uint256 lastClaimTime, uint256 rewardRate))",
    "function getPendingRewards(address) view returns (uint256)",
    "function getFeeDiscount(address) view returns (uint256)",
    "function votingPower(address) view returns (uint256)",
    "function stakingRewardRate() view returns (uint256)"
  ];

  // Get ULT contract
  const getULTContract = async () => {
    if (!window.ethereum) return null;
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(ULT_TOKEN_ADDRESS, ULT_ABI, signer);
  };

  // Load staking data
  const loadStakingData = async () => {
    if (!account) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const ultContract = await getULTContract();
      if (!ultContract) return;

      // Get balances
      const balance = await ultContract.balanceOf(account);
      setUltBalance(ethers.formatEther(balance));

      // Get staking info
      const stakeInfo = await ultContract.getStakeInfo(account);
      setStakedAmount(ethers.formatEther(stakeInfo[0])); // amount

      // Get pending rewards
      const pending = await ultContract.getPendingRewards(account);
      setPendingRewards(ethers.formatEther(pending));

      // Get fee discount
      const discount = await ultContract.getFeeDiscount(account);
      setFeeDiscount(discount.toString());

      // Get voting power
      const power = await ultContract.votingPower(account);
      setVotingPower(ethers.formatEther(power));

      // Get staking APY
      const apy = await ultContract.stakingRewardRate();
      setStakingAPY((Number(apy) / 100).toString());

    } catch (error) {
      console.error("Error loading staking data:", error);
      toast.error("Failed to load staking data");
    } finally {
      setIsLoading(false);
    }
  };

  // Stake tokens
  const handleStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (parseFloat(stakeAmount) > parseFloat(ultBalance)) {
      toast.error("Insufficient ULT balance");
      return;
    }

    try {
      setIsStaking(true);
      const ultContract = await getULTContract();
      if (!ultContract) return;

      const amount = ethers.parseEther(stakeAmount);
      
      // Check allowance
      const allowance = await ultContract.allowance(account, ULT_TOKEN_ADDRESS);
      if (allowance < amount) {
        toast.info("Approving ULT for staking...");
        const approveTx = await ultContract.approve(ULT_TOKEN_ADDRESS, ethers.parseEther("10000"));
        await approveTx.wait();
      }

      const tx = await ultContract.stake(amount);
      toast.info("Staking tokens...");
      await tx.wait();
      toast.success(`Successfully staked ${stakeAmount} ULT!`);
      
      setStakeAmount('');
      await loadStakingData();

    } catch (error) {
      console.error("Error staking:", error);
      toast.error("Failed to stake tokens");
    } finally {
      setIsStaking(false);
    }
  };

  // Unstake tokens
  const handleUnstake = async () => {
    if (!unstakeAmount || parseFloat(unstakeAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (parseFloat(unstakeAmount) > parseFloat(stakedAmount)) {
      toast.error("Insufficient staked balance");
      return;
    }

    try {
      setIsUnstaking(true);
      const ultContract = await getULTContract();
      if (!ultContract) return;

      const amount = ethers.parseEther(unstakeAmount);
      const tx = await ultContract.unstake(amount);
      toast.info("Unstaking tokens...");
      await tx.wait();
      toast.success(`Successfully unstaked ${unstakeAmount} ULT!`);
      
      setUnstakeAmount('');
      await loadStakingData();

    } catch (error) {
      console.error("Error unstaking:", error);
      toast.error("Failed to unstake tokens");
    } finally {
      setIsUnstaking(false);
    }
  };

  // Claim rewards
  const handleClaimRewards = async () => {
    if (parseFloat(pendingRewards) <= 0) {
      toast.error("No rewards to claim");
      return;
    }

    try {
      setIsClaiming(true);
      const ultContract = await getULTContract();
      if (!ultContract) return;

      const tx = await ultContract.claimStakingRewards();
      toast.info("Claiming rewards...");
      await tx.wait();
      toast.success(`Successfully claimed ${parseFloat(pendingRewards).toFixed(4)} ULT rewards!`);
      
      await loadStakingData();

    } catch (error) {
      console.error("Error claiming rewards:", error);
      toast.error("Failed to claim rewards");
    } finally {
      setIsClaiming(false);
    }
  };

  useEffect(() => {
    loadStakingData();
  }, [account]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadStakingData, 30000);
    return () => clearInterval(interval);
  }, [account]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6 flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading staking data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full mb-4">
          <TrendingUp size={32} className="text-white" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
          ULT Staking
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Stake ULT tokens to earn rewards and unlock premium benefits
        </p>
      </div>

      {!account ? (
        <div className="text-center py-16">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-6 w-fit mx-auto mb-4">
            <AlertCircle size={32} className="text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Connect Your Wallet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Connect your wallet to start staking ULT tokens
          </p>
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                  <DollarSign size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">ULT Balance</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {parseFloat(ultBalance).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                  <Lock size={20} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Staked Amount</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {parseFloat(stakedAmount).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                  <Gift size={20} className="text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pending Rewards</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {parseFloat(pendingRewards).toFixed(4)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                  <TrendingUp size={20} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Staking APY</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stakingAPY}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Staking Panel */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                {/* Tab Navigation */}
                <div className="flex bg-gray-50 dark:bg-gray-700">
                  <button
                    onClick={() => setActiveTab('stake')}
                    className={`flex-1 px-6 py-4 font-semibold transition-all ${
                      activeTab === 'stake'
                        ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Lock size={18} className="inline mr-2" />
                    Stake
                  </button>
                  <button
                    onClick={() => setActiveTab('unstake')}
                    className={`flex-1 px-6 py-4 font-semibold transition-all ${
                      activeTab === 'unstake'
                        ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Unlock size={18} className="inline mr-2" />
                    Unstake
                  </button>
                </div>

                <div className="p-8">
                  {activeTab === 'stake' ? (
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Stake ULT Tokens
                      </h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Amount to Stake
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={stakeAmount}
                            onChange={(e) => setStakeAmount(e.target.value)}
                            placeholder="Enter amount"
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                          />
                          <button
                            onClick={() => setStakeAmount(ultBalance)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-indigo-600 dark:text-indigo-400 text-sm font-semibold hover:text-indigo-800 dark:hover:text-indigo-300"
                          >
                            MAX
                          </button>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Available: {parseFloat(ultBalance).toLocaleString()} ULT
                        </p>
                      </div>

                      <button
                        onClick={handleStake}
                        disabled={isStaking || !stakeAmount || parseFloat(stakeAmount) <= 0}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
                      >
                        {isStaking ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Staking...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <Lock size={20} />
                            Stake ULT
                          </div>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Unstake ULT Tokens
                      </h3>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Amount to Unstake
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={unstakeAmount}
                            onChange={(e) => setUnstakeAmount(e.target.value)}
                            placeholder="Enter amount"
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                          />
                          <button
                            onClick={() => setUnstakeAmount(stakedAmount)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-indigo-600 dark:text-indigo-400 text-sm font-semibold hover:text-indigo-800 dark:hover:text-indigo-300"
                          >
                            MAX
                          </button>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Staked: {parseFloat(stakedAmount).toLocaleString()} ULT
                        </p>
                      </div>

                      <button
                        onClick={handleUnstake}
                        disabled={isUnstaking || !unstakeAmount || parseFloat(unstakeAmount) <= 0}
                        className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
                      >
                        {isUnstaking ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Unstaking...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <Unlock size={20} />
                            Unstake ULT
                          </div>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Claim Rewards */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Gift size={20} className="text-green-600" />
                  Claim Rewards
                </h3>
                
                <div className="text-center mb-4">
                  <div className="text-3xl font-black text-green-600 dark:text-green-400 mb-1">
                    {parseFloat(pendingRewards).toFixed(4)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">ULT Available</p>
                </div>

                <button
                  onClick={handleClaimRewards}
                  disabled={isClaiming || parseFloat(pendingRewards) <= 0}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
                >
                  {isClaiming ? "Claiming..." : "Claim Rewards"}
                </button>
              </div>

              {/* Staking Benefits */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Your Benefits
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Fee Discount</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {feeDiscount}%
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Voting Power</span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">
                      {parseFloat(votingPower).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Staking APY</span>
                    <span className="font-bold text-green-600 dark:text-green-400">
                      {stakingAPY}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Staking Tiers */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Staking Tiers
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">Bronze</div>
                      <div className="text-xs text-gray-500">1,000+ ULT</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-orange-600">10% Discount</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">Silver</div>
                      <div className="text-xs text-gray-500">10,000+ ULT</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-500">20% Discount</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">Gold</div>
                      <div className="text-xs text-gray-500">50,000+ ULT</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-yellow-600">30% Discount</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white text-sm">Platinum</div>
                      <div className="text-xs text-gray-500">100,000+ ULT</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-purple-600">50% Discount</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ULTStaking;