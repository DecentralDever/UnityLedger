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

  // Detect network and return the correct ULT token address
  const getNetworkAddresses = async () => {
    if (!window.ethereum) return { ultToken: '' };
    const provider = new ethers.BrowserProvider(window.ethereum);
    const { chainId } = await provider.getNetwork();

    switch (chainId) {
      case 50311: // Somnia Devnet
        return { ultToken: '0x234CFEe105A2c7223Aae5a3F80c109EE6b5bB0F5' };
      case 4202: // Lisk Sepolia
        return { ultToken: '0xCaB2f442dBaa702593d915dc1dD5333943081C37' };
      default:
        console.warn('Unknown network, defaulting to Lisk Sepolia');
        return { ultToken: '0xCaB2f442dBaa702593d915dc1dD5333943081C37' };
    }
  };

  // Contract ABI
  const ULT_ABI = [
    'function balanceOf(address) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function stake(uint256 amount)',
    'function unstake(uint256 amount)',
    'function claimStakingRewards()',
    'function getStakeInfo(address) view returns (tuple(uint256 amount, uint256 startTime, uint256 lastClaimTime, uint256 rewardRate))',
    'function getPendingRewards(address) view returns (uint256)',
    'function getFeeDiscount(address) view returns (uint256)',
    'function votingPower(address) view returns (uint256)',
    'function stakingRewardRate() view returns (uint256)'
  ];

  // Instantiate ULT contract for the current network and signer
  const getULTContract = async () => {
    if (!window.ethereum) return null;
    const { ultToken } = await getNetworkAddresses();
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(ultToken, ULT_ABI, signer);
  };

  // State
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

  // Load all staking-related data
  const loadStakingData = async () => {
    if (!account) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const ultContract = await getULTContract();
      if (!ultContract) return;

      // ULT balance
      const balance = await ultContract.balanceOf(account);
      setUltBalance(ethers.formatEther(balance));

      // Staked info
      const stakeInfo = await ultContract.getStakeInfo(account);
      setStakedAmount(ethers.formatEther(stakeInfo.amount || stakeInfo[0]));

      // Pending rewards
      const pending = await ultContract.getPendingRewards(account);
      setPendingRewards(ethers.formatEther(pending));

      // Fee discount
      const discount = await ultContract.getFeeDiscount(account);
      setFeeDiscount(discount.toString());

      // Voting power
      const power = await ultContract.votingPower(account);
      setVotingPower(ethers.formatEther(power));

      // APY
      const apy = await ultContract.stakingRewardRate();
      setStakingAPY((Number(apy) / 100).toString());
    } catch (error) {
      console.error('Error loading staking data:', error);
      toast.error('Failed to load staking data');
    } finally {
      setIsLoading(false);
    }
  };

  // Stake tokens
  const handleStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (parseFloat(stakeAmount) > parseFloat(ultBalance)) {
      toast.error('Insufficient ULT balance');
      return;
    }

    try {
      setIsStaking(true);
      const ultContract = await getULTContract();
      if (!ultContract) return;

      const amount = ethers.parseEther(stakeAmount);

      // Ensure allowance
      const allowance = await ultContract.allowance(account, ultContract.address);
      if (allowance < amount) {
        toast.info('Approving ULT for staking...');
        const approveTx = await ultContract.approve(ultContract.address, ethers.parseEther('10000'));
        await approveTx.wait();
      }

      const tx = await ultContract.stake(amount);
      toast.info('Staking tokens...');
      await tx.wait();
      toast.success(`Successfully staked ${stakeAmount} ULT!`);

      setStakeAmount('');
      await loadStakingData();
    } catch (error) {
      console.error('Error staking:', error);
      toast.error('Failed to stake tokens');
    } finally {
      setIsStaking(false);
    }
  };

  // Unstake tokens
  const handleUnstake = async () => {
    if (!unstakeAmount || parseFloat(unstakeAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (parseFloat(unstakeAmount) > parseFloat(stakedAmount)) {
      toast.error('Insufficient staked balance');
      return;
    }

    try {
      setIsUnstaking(true);
      const ultContract = await getULTContract();
      if (!ultContract) return;

      const amount = ethers.parseEther(unstakeAmount);
      const tx = await ultContract.unstake(amount);
      toast.info('Unstaking tokens...');
      await tx.wait();
      toast.success(`Successfully unstaked ${unstakeAmount} ULT!`);

      setUnstakeAmount('');
      await loadStakingData();
    } catch (error) {
      console.error('Error unstaking:', error);
      toast.error('Failed to unstake tokens');
    } finally {
      setIsUnstaking(false);
    }
  };

  // Claim rewards
  const handleClaimRewards = async () => {
    if (parseFloat(pendingRewards) <= 0) {
      toast.error('No rewards to claim');
      return;
    }

    try {
      setIsClaiming(true);
      const ultContract = await getULTContract();
      if (!ultContract) return;

      const tx = await ultContract.claimStakingRewards();
      toast.info('Claiming rewards...');
      await tx.wait();
      toast.success(`Successfully claimed ${parseFloat(pendingRewards).toFixed(4)} ULT rewards!`);

      await loadStakingData();
    } catch (error) {
      console.error('Error claiming rewards:', error);
      toast.error('Failed to claim rewards');
    } finally {
      setIsClaiming(false);
    }
  };

  // Initial & auto-refresh effects
  useEffect(() => {
    loadStakingData();
  }, [account]);

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
      {/* ...rest of your JSX (unchanged) */}
    </div>
  );
};

export default ULTStaking;
