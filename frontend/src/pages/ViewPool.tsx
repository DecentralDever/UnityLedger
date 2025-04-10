// src/pages/ViewPool.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useUnityLedgerContract } from "../services/contract";
import { useWallet } from "../context/WalletProvider";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { Clock, PieChart } from "lucide-react";
import { ethers } from "ethers";
import UltBalanceAndClaim from "../components/UltBalanceAndClaim";

interface PoolDetails {
  id: bigint;
  creator: string;
  contributionAmount: bigint;
  cycleDuration: bigint;
  maxMembers: bigint;
  totalMembers: bigint;
  currentCycle: bigint;
  lastPayoutTime: bigint;
  isActive: boolean;
  poolType?: string; // Pool Reason
  fee?: bigint;     // APY (%), stored as a number
}

const ViewPool: React.FC = () => {
  const { poolId } = useParams<{ poolId: string }>();
  const contract = useUnityLedgerContract();
  const { account } = useWallet();
  const [pool, setPool] = useState<PoolDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isMember, setIsMember] = useState<boolean>(false);

  const fetchPoolDetails = useCallback(async () => {
    if (!contract || !poolId) return;
    setLoading(true);
    try {
      // Fetch pool details using the contract's getPoolDetails function
      const details = await contract.getPoolDetails(Number(poolId));
      const fetchedPool: PoolDetails = {
        id: BigInt(details[0].toString()),
        creator: details[1],
        contributionAmount: BigInt(details[2].toString()),
        cycleDuration: BigInt(details[3].toString()),
        maxMembers: BigInt(details[4].toString()),
        totalMembers: BigInt(details[5].toString()),
        currentCycle: BigInt(details[6].toString()),
        lastPayoutTime: BigInt(details[7].toString()),
        isActive: details[8],
        poolType: details.length > 9 ? details[9] : undefined,
        fee: details.length > 10 ? BigInt(details[10].toString()) : undefined,
      };
      setPool(fetchedPool);

      // Check if the current user is a member of the pool using getPoolMembers
      const members = await contract.getPoolMembers(Number(poolId));
      const joined = members.some(
        (member: any) =>
          member.wallet.toLowerCase() === account?.toLowerCase()
      );
      setIsMember(joined);
    } catch (error) {
      console.error("Error fetching pool details:", error);
      toast.error("Error fetching pool details");
    }
    setLoading(false);
  }, [contract, poolId, account]);

  useEffect(() => {
    if (contract && poolId) {
      fetchPoolDetails();
    }
  }, [contract, poolId, fetchPoolDetails]);

  if (loading || !pool) {
    return (
      <div className="flex justify-center items-center py-16">
        <motion.div
          className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        ></motion.div>
      </div>
    );
  }

  // Convert contribution amount from wei to ETH and cycle duration from seconds to days
  const contributionEth = ethers.formatEther(pool.contributionAmount.toString());
  const cycleDurationDays = Number(pool.cycleDuration) / 86400;
  const apy = pool.fee ? pool.fee.toString() : "N/A";

  // Set button text based on whether the connected account is the creator (you may allow a different flow)
  const actionText =
    pool.creator.toLowerCase() === account?.toLowerCase() ? "Contribute" : "Join Pool";

  // Placeholder action handler – replace with actual join/contribute logic
  const handleAction = async () => {
    toast.info(`Executing "${actionText}" functionality...`);
    // Example:
    // if (!isMember) {
    //   await contract.joinPool(Number(poolId));
    // } else {
    //   await contract.contribute(Number(poolId), { value: pool.contributionAmount });
    // }
    // After action, refresh pool details.
    fetchPoolDetails();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.h1
        className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Pool Details - #{pool.id.toString()}
      </motion.h1>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Creator: {pool.creator.slice(0, 6)}...{pool.creator.slice(-4)}
            </h3>
          </div>
          <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-lg">
            <PieChart size={20} className="text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <strong>Contribution Amount (ETH):</strong> {contributionEth} ETH
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <strong>Cycle Duration (days):</strong> {cycleDurationDays.toFixed(2)} days
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <strong>Max Members:</strong> {pool.maxMembers.toString()}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <strong>Pool Reason:</strong> {pool.poolType || "N/A"}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <strong>APY (%):</strong> {apy}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            <strong>Status:</strong> {pool.isActive ? "Active" : "Inactive"}
          </p>
        </div>
      </div>

      {/* Display the user's ULT balance and claim button */}
      {isMember && (
        <div className="mt-8">
          <UltBalanceAndClaim poolId={poolId as string} />
        </div>
      )}

      {/* Action Button for Join/Contribute */}
      <div className="mt-6">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAction}
          className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium text-sm transition-colors"
        >
          {actionText}
        </motion.button>
      </div>

      {/* Back to Dashboard */}
      <div className="mt-8">
        <Link
          to="/dashboard"
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
        >
          &larr; Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default ViewPool;
