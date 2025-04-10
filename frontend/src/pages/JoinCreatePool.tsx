// src/pages/JoinCreatePool.tsx
import React, { useState } from "react";
import { useUnityLedgerContract } from "../services/contract";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { ethers } from 'ethers';

const JoinCreatePool: React.FC = () => {
  const contract = useUnityLedgerContract();
  
  // New input states
  const [contributionAmount, setContributionAmount] = useState(""); // in ETH
  const [cycleDurationDays, setCycleDurationDays] = useState(""); // in days
  const [maxMembers, setMaxMembers] = useState("");
  const [payoutOrder, setPayoutOrder] = useState("");
  const [poolReason, setPoolReason] = useState("Savings"); // default option
  const [otherReason, setOtherReason] = useState(""); // for "Other"
  const [apy, setApy] = useState(""); // APY percentage
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreatePool = async () => {
    if (!contract) {
      toast.error("Contract not connected");
      return;
    }
    try {
      setIsSubmitting(true);
      
      // Parse payout order addresses
      const addresses = payoutOrder.split(",").map((addr) => addr.trim());
      
      // Convert contribution amount from ETH to wei using ethers.parseEther (ethers v6 style)
      const weiAmount = ethers.parseEther(contributionAmount);
      
      // Convert cycle duration from days to seconds
      const cycleDurationSeconds = Number(cycleDurationDays) * 86400;
      
      // Determine the pool reason (if "Other" is selected, use the provided text)
      const reason = poolReason === "Other" ? otherReason : poolReason;
      
      // Parse maxMembers and APY as numbers
      const maxMembersNum = Number(maxMembers);
      const apyNum = Number(apy);

      // Call the contract's createPool function with new parameters
      const tx = await contract.createPool(
        weiAmount,
        cycleDurationSeconds,
        maxMembersNum,
        addresses,
        reason,
        apyNum
      );
      
      toast.info("Creating pool...");
      await tx.wait();
      toast.success("Pool created successfully!");
      
      // Clear the form
      setContributionAmount("");
      setCycleDurationDays("");
      setMaxMembers("");
      setPayoutOrder("");
      setPoolReason("Savings");
      setOtherReason("");
      setApy("");
    } catch (error: any) {
      console.error("Error creating pool:", error);
      toast.error("Pool creation failed: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="max-w-md mx-auto bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg transition-colors duration-300"
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
    >
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">
        Create a Pool
      </h2>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
          Contribution Amount (ETH)
        </label>
        <input
          type="number"
          value={contributionAmount}
          onChange={(e) => setContributionAmount(e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          placeholder="Enter amount in ETH"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
          Cycle Duration (days)
        </label>
        <input
          type="number"
          value={cycleDurationDays}
          onChange={(e) => setCycleDurationDays(e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          placeholder="e.g. 1 for 1 day"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
          Max Members
        </label>
        <input
          type="number"
          value={maxMembers}
          onChange={(e) => setMaxMembers(e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          placeholder="e.g. 10"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
          Payout Order
        </label>
        <input
          type="text"
          value={payoutOrder}
          onChange={(e) => setPayoutOrder(e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          placeholder="Comma-separated addresses"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
          Pool Reason
        </label>
        <select
          value={poolReason}
          onChange={(e) => setPoolReason(e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
        >
          <option value="Savings">Savings</option>
          <option value="Investment">Investment</option>
          <option value="Emergency">Emergency</option>
          <option value="Social">Social</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {poolReason === "Other" && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Specify Reason
          </label>
          <input
            type="text"
            value={otherReason}
            onChange={(e) => setOtherReason(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
            placeholder="Enter custom reason"
          />
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
          APY (%) - Earned in ULT Token
        </label>
        <input
          type="number"
          value={apy}
          onChange={(e) => setApy(e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
          placeholder="e.g. 5"
        />
      </div>

      <button
        onClick={handleCreatePool}
        disabled={isSubmitting}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white font-semibold py-2 rounded-lg transition-colors"
      >
        {isSubmitting ? "Creating Pool..." : "Create Pool"}
      </button>
    </motion.div>
  );
};

export default JoinCreatePool;
