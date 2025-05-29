// MemberDashboard.jsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ethers } from "ethers";
import { useWallet } from "../context/WalletProvider";
import { useUnityLedgerContract } from "../services/contract";
import {
  Shield,
  Coins,
  Clock,
  TrendingUp,
  Users,
  Gift,
  Award,
  Lock,
  Unlock,
  CheckCircle
} from "lucide-react";

const MemberDashboard = () => {
  const { account } = useWallet();
  const contract = useUnityLedgerContract();
  const [userPools, setUserPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalLocked: "0",
    totalEarned: "0",
    activePools: 0,
    completedPools: 0,
    creatorRewards: "0"
  });

  useEffect(() => {
    if (!contract || !account) return;
    fetchUserData();
  }, [contract, account]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const nextPoolId = await contract.nextPoolId();
      const totalPools = Number(nextPoolId);
      const userPoolIds = [];

      for (let i = 0; i < totalPools; i++) {
        try {
          const members = await contract.getPoolMembers(i);
          if (members.some(m => m.wallet.toLowerCase() === account.toLowerCase())) {
            userPoolIds.push(i);
          }
        } catch (err) {
          console.warn(`Error checking pool ${i}:`, err);
        }
      }

      const poolsData = await Promise.all(
        userPoolIds.map(async (poolId) => {
          // 1. Fetch raw tuple
          const raw = await contract.getPoolDetails(poolId);
          const [
            idBn,
            creator,
            contributionAmountBn,
            cycleDurationBn,
            maxMembersBn,
            totalMembersBn,
            currentCycleBn,
            lastPayoutTimeBn,
            createdAtBn,
            isActive,
            isCompleted,
            payoutOrder,
            poolType,
            feeBn,
            totalContributionsBn,
            creatorRewardsBn
          ] = raw;

          // 2. Get member-specific data
          const members = await contract.getPoolMembers(poolId);
          const memberData = members.find(
            m => m.wallet.toLowerCase() === account.toLowerCase()
          );
          const joinPosition =
            members.findIndex(m => m.wallet.toLowerCase() === account.toLowerCase()) + 1;

          // 3. Locked balance
          let lockedBalanceBn;
          try {
            if (contract.getLockedBalance) {
              lockedBalanceBn = await contract.getLockedBalance(poolId, account);
            } else {
              lockedBalanceBn = contributionAmountBn;
            }
          } catch {
            lockedBalanceBn = contributionAmountBn;
          }
          const lockedBalance = ethers.formatEther(lockedBalanceBn);

          // 4. Return a plain object with named props
          return {
            id: idBn,
            creator,
            contributionAmount: contributionAmountBn,
            cycleDuration: cycleDurationBn,
            maxMembers: maxMembersBn,
            totalMembers: totalMembersBn,
            currentCycle: currentCycleBn,
            lastPayoutTime: lastPayoutTimeBn,
            createdAt: createdAtBn,
            isActive,
            isCompleted,
            payoutOrder,
            poolType,
            fee: feeBn,
            totalContributions: totalContributionsBn,
            creatorRewards: creatorRewardsBn,
            lockedBalance,
            isCreator: creator.toLowerCase() === account.toLowerCase(),
            memberData,
            joinPosition
          };
        })
      );

      setUserPools(poolsData);

      // Compute summary
      const totalLocked = poolsData.reduce(
        (sum, p) => sum + parseFloat(p.lockedBalance),
        0
      );
      const activePools = poolsData.filter(p => p.isActive).length;
      const completedPools = poolsData.filter(p => p.isCompleted).length;
      const creatorRewards = poolsData
        .filter(p => p.isCreator)
        .reduce(
          (sum, p) => sum + parseFloat(ethers.formatEther(p.creatorRewards)),
          0
        );

      setSummary({
        totalLocked: totalLocked.toFixed(4),
        totalEarned: "0", // placeholder
        activePools,
        completedPools,
        creatorRewards: creatorRewards.toFixed(4)
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
    setLoading(false);
  };

  if (!account) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <Shield size={48} className="mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-600">Connect Wallet</h2>
        <p className="text-gray-500">Connect your wallet to view your pool memberships</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse"
            >
              <div className="bg-gray-200 dark:bg-gray-700 h-4 w-20 rounded mb-2" />
              <div className="bg-gray-200 dark:bg-gray-700 h-8 w-32 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Member Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track your pool memberships, locked funds, and rewards
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Locked */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
              <Lock size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Total Locked
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {summary.totalLocked} ETH
          </p>
        </motion.div>

        {/* Active Pools */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-lg">
              <TrendingUp size={24} className="text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Active Pools
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {summary.activePools}
          </p>
        </motion.div>

        {/* Completed Pools */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg">
              <CheckCircle size={24} className="text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Completed
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {summary.completedPools}
          </p>
        </motion.div>

        {/* Creator Rewards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-lg">
              <Gift size={24} className="text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Creator Rewards
          </h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {summary.creatorRewards} ETH
          </p>
        </motion.div>
      </div>

      {/* Pool Details */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Your Pools ({userPools.length})
        </h2>

        {userPools.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <Users size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
              No Pool Memberships
            </h3>
            <p className="text-gray-500 dark:text-gray-500">
              Join or create your first savings pool to get started
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {userPools.map((pool, index) => (
              <motion.div
                key={pool.id.toString()}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
              >
                {/* Pool Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                        Pool #{pool.id.toString()}
                      </span>
                      {pool.isCreator && (
                        <span className="bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 text-xs px-2 py-1 rounded-full font-bold">
                          Creator
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      {pool.poolType}
                    </h3>
                  </div>
                  <div
                    className={`p-2 rounded-lg ${
                      pool.isActive
                        ? "bg-emerald-100 dark:bg-emerald-900/30"
                        : "bg-gray-100 dark:bg-gray-700"
                    }`}
                  >
                    {pool.isCompleted ? (
                      <Unlock
                        size={20}
                        className="text-emerald-600 dark:text-emerald-400"
                      />
                    ) : (
                      <Lock
                        size={20}
                        className="text-blue-600 dark:text-blue-400"
                      />
                    )}
                  </div>
                </div>

                {/* Pool Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Locked Balance
                    </p>
                    <p className="font-bold text-gray-900 dark:text-white">
                      {pool.lockedBalance} ETH
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Join Position
                    </p>
                    <p className="font-bold text-gray-900 dark:text-white">
                      #{pool.joinPosition} of {pool.totalMembers.toString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Current Cycle
                    </p>
                    <p className="font-bold text-gray-900 dark:text-white">
                      {pool.currentCycle.toString()}/
                      {pool.maxMembers.toString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      ULT APY
                    </p>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">
                      {pool.fee.toString()}%
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>Pool Progress</span>
                    <span>
                      {Math.round(
                        (Number(pool.currentCycle) / Number(pool.maxMembers)) * 100
                      )}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          (Number(pool.currentCycle) / Number(pool.maxMembers)) * 100,
                          100
                        )}%`
                      }}
                    />
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex justify-between items-center">
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-bold ${
                      pool.isCompleted
                        ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300"
                        : pool.isActive
                        ? "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {pool.isCompleted ? "Funds Unlocked" : "Funds Locked"}
                  </span>

                  {pool.isCreator &&
                    parseFloat(ethers.formatEther(pool.creatorRewards)) > 0 && (
                      <button className="text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-full font-bold hover:bg-amber-200 dark:hover:bg-amber-900/70 transition-colors">
                        Claim Rewards
                      </button>
                    )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MemberDashboard;
