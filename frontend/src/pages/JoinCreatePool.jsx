import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useUnityLedgerContract } from "../services/contract";
import { useWallet } from "../context/WalletProvider";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { ethers } from 'ethers';
import { Calculator, Users, Clock, Percent, Target, Gift, Star, Zap, AlertCircle, ExternalLink } from "lucide-react";

const JoinCreatePool = () => {
  const contract = useUnityLedgerContract();
  const { account } = useWallet();
  
  // Network addresses state
  const [networkAddresses, setNetworkAddresses] = useState(null);
  
  // Get network addresses based on chainId -->
  const getNetworkAddresses = async () => {
    if (!window.ethereum) return null;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);
      if (chainId === 50311) {
        console.log("Connected to Somnia network");
        return {
          unityLedger: "0xC2E82087CEce1850ba3F10926Ff56f558B7E6Ad0",
          ultToken:    "0x2Da2331B2a0E669785e8EAAadc19e63e20E19E5f"
        };
      } else if (chainId === 4202) {
        console.log("Connected to Lisk Sepolia network");
        return {
          unityLedger: "0xF7C911C3542687F49Dd42a3F0D54A2cB1D2142A8",
          ultToken:    "0x9C6adb7DC4b27fbFe381D726606248Ad258F4228"
        };
      } else {
        console.warn("Unknown network, defaulting to Lisk Sepolia");
        return {
          unityLedger: "0xF7C911C3542687F49Dd42a3F0D54A2cB1D2142A8",
          ultToken:    "0x9C6adb7DC4b27fbFe381D726606248Ad258F4228"
        };
      }
    } catch (error) {
      console.error("Error detecting network:", error);
      return {
        unityLedger: "0xF7C911C3542687F49Dd42a3F0D54A2cB1D2142A8",
          ultToken:    "0x9C6adb7DC4b27fbFe381D726606248Ad258F4228"
      };
    }
  };
  
  // Form states
  const [contributionAmount, setContributionAmount] = useState("");
  const [cycleDurationDays, setCycleDurationDays] = useState("");
  const [maxMembers, setMaxMembers] = useState("2");
  const [poolReason, setPoolReason] = useState("Savings");
  const [otherReason, setOtherReason] = useState("");
  const [apy, setApy] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // ULT states
  const [ultBalance, setUltBalance] = useState("0");
  const [needsApproval, setNeedsApproval] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [ultFeesEnabled, setUltFeesEnabled] = useState(true);
  const [allowance, setAllowance] = useState("0");

  // Initialize network addresses
  useEffect(() => {
    (async () => {
      const addresses = await getNetworkAddresses();
      setNetworkAddresses(addresses);
    })();
  }, []);

  // Check ULT balance and approval
  const checkUltRequirements = async () => {
    if (!account || !networkAddresses) {
      setUltFeesEnabled(false);
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const ultContract = new ethers.Contract(
        networkAddresses.ultToken,
        [
          "function balanceOf(address) view returns (uint256)",
          "function allowance(address owner, address spender) view returns (uint256)"
        ],
        signer
      );

      const balance = await ultContract.balanceOf(account);
      const currentAllowance = await ultContract.allowance(
        account,
        networkAddresses.unityLedger
      );

      setUltBalance(ethers.formatEther(balance));
      setAllowance(ethers.formatEther(currentAllowance));

      const requiredFee = isPremium
        ? ethers.parseEther("2000")
        : ethers.parseEther("500");
      setNeedsApproval(currentAllowance < requiredFee);
    } catch (error) {
      console.error("Error checking ULT requirements:", error);
      setUltFeesEnabled(false);
    }
  };

  // Approve ULT spending
  const handleApproveUlt = async () => {
    if (!networkAddresses) return;
    try {
      setIsApproving(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const ultContract = new ethers.Contract(
        networkAddresses.ultToken,
        ["function approve(address spender, uint256 amount) returns (bool)"],
        signer
      );

      const tx = await ultContract.approve(
        networkAddresses.unityLedger,
        ethers.parseEther("10000")
      );
      toast.info("Approving ULT spending...");
      await tx.wait();
      toast.success("ULT spending approved!");
      await checkUltRequirements();
    } catch (error) {
      console.error("Error approving ULT:", error);
      toast.error("Failed to approve ULT spending");
    } finally {
      setIsApproving(false);
    }
  };

  useEffect(() => {
    if (networkAddresses && account) {
      checkUltRequirements();
    }
  }, [account, isPremium, networkAddresses]);

  // Utility calculations
  const calculateCreatorRewards = () => {
    const c = parseFloat(contributionAmount) || 0;
    const m = parseInt(maxMembers) || 0;
    return (c * m * 0.005).toFixed(4);
  };
  const calculatePoolValue = () => {
    const c = parseFloat(contributionAmount) || 0;
    const m = parseInt(maxMembers) || 0;
    return (c * m).toFixed(4);
  };
  const getCreationFee = () =>
    ultFeesEnabled
      ? isPremium
        ? "2,000 ULT"
        : "500 ULT"
      : "Free (ULT disabled)";
  const getEffectiveAPY = () => {
    const base = parseFloat(apy) || 0;
    return isPremium ? (base + 5).toFixed(1) : base.toFixed(1);
  };

  // Enhanced error decoding
  const decodeCustomError = (data) => {
    if (!data || data.length < 10) return "Unknown error";
    const sel = data.slice(0, 10);
    const codes = {
      "0xe450d38c": "Insufficient ULT tokens or allowance",
      "0x7939f424": "Insufficient funds",
      "0xcd78605e": "Invalid parameters",
      "0x8baa579f": "Pool creation failed",
      "0xa2a7201c": "Contract paused",
      "0x4e487b71": "Panic error - check parameters"
    };
    return codes[sel] || `Custom error: ${sel}`;
  };

  // Validate contract connection
  const validateContract = async () => {
    if (!contract) {
      throw new Error("Contract not connected");
    }
    
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contractAddress = contract.target || contract.address;
    const code = await provider.getCode(contractAddress);
    
    if (code === "0x") {
      throw new Error("Contract not deployed at address");
    }

    // Check if contract is paused (if this method exists)
    try {
      const isPaused = await contract.paused();
      if (isPaused) {
        throw new Error("Contract is currently paused");
      }
    } catch (e) {
      // Method might not exist, ignore
    }
  };

  const handleCreatePool = async () => {
    try {
      setIsSubmitting(true);

      // Validate contract first
      await validateContract();

      // Parse and validate inputs
      const contribution = parseFloat(contributionAmount);
      const durationDays = parseInt(cycleDurationDays, 10);
      const members = parseInt(maxMembers, 10);
      const apyValue = parseFloat(apy);

      // Enhanced validation
      if (!contribution || contribution < 0.001) {
        throw new Error("Contribution must be at least 0.001 ETH");
      }
      if (durationDays < 1 || durationDays > 365) {
        throw new Error("Duration must be between 1 and 365 days");
      }
      if (members < 2 || members > 50) {
        throw new Error("Members must be between 2 and 50");
      }
      if (apyValue < 0 || apyValue > 50) {
        throw new Error("APY must be between 0% and 50%");
      }

      const reason = poolReason === "Other" ? otherReason.trim() : poolReason;
      if (!reason) {
        throw new Error("Pool reason cannot be empty");
      }

      // Setup provider/signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Check wallet ETH balance (only need gas, not total pool value)
      const walletBalance = await provider.getBalance(account);
      const weiAmount = ethers.parseEther(contributionAmount);
      const gasBuffer = ethers.parseEther("0.005"); // 0.005 ETH buffer for gas
      
      if (walletBalance < gasBuffer) {
        throw new Error(`Insufficient ETH for gas. You have ${ethers.formatEther(walletBalance)} ETH, need at least ${ethers.formatEther(gasBuffer)} ETH. Get testnet ETH from Lisk Sepolia faucet.`);
      }

      // Refresh and validate ULT requirements
      await checkUltRequirements();
      if (ultFeesEnabled) {
        const needed = isPremium ? 2000 : 500;
        if (parseFloat(ultBalance) < needed) {
          throw new Error(`Need ${needed} ULT, you have ${parseFloat(ultBalance).toFixed(2)}`);
        }
        
        // Auto-approve if user has balance but insufficient allowance
        if (parseFloat(allowance) < needed) {
          toast.info("Approving ULT spending...");
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          const ultContract = new ethers.Contract(
            networkAddresses.ultToken,
            ["function approve(address spender, uint256 amount) returns (bool)"],
            signer
          );

          const approveTx = await ultContract.approve(
            networkAddresses.unityLedger,
            ethers.parseEther("10000")
          );
          await approveTx.wait();
          toast.success("ULT spending approved!");
          
          // Re-check allowance
          await checkUltRequirements();
        }
      }

      const cycleDurationSeconds = durationDays * 86400;

      console.log("Creating pool with:", {
        weiAmount: weiAmount.toString(),
        cycleDurationSeconds,
        members,
        reason,
        apy: Math.floor(apyValue),
        isPremium
      });

      // CRITICAL FIX: Proper gas estimation with error handling
      let gasLimit;
      try {
        const estimatedGas = await contract.createPool.estimateGas(
          weiAmount,
          cycleDurationSeconds,
          members,
          reason,
          Math.floor(apyValue),
          isPremium
          // NO VALUE HERE - createPool is not payable!
        );
        
        // Add 20% buffer to estimated gas
        gasLimit = estimatedGas + (estimatedGas * BigInt(20)) / BigInt(100);
        console.log("Gas estimated:", estimatedGas.toString(), "Using:", gasLimit.toString());
      } catch (estimateError) {
        console.error("Gas estimation failed:", estimateError);
        
        // If estimation fails with revert data, don't proceed
        if (estimateError.data || estimateError.reason) {
          const errorMsg = estimateError.data 
            ? decodeCustomError(estimateError.data)
            : estimateError.reason || estimateError.message;
          throw new Error(`Transaction would fail: ${errorMsg}`);
        }
        
        // If no revert data, use fallback gas limit
        gasLimit = BigInt(800000); // Increased from 500k
        console.warn("Using fallback gas limit:", gasLimit.toString());
      }

      // Send transaction with proper error handling - NO ETH VALUE!
      const tx = await contract.createPool(
        weiAmount,
        cycleDurationSeconds,
        members,
        reason,
        Math.floor(apyValue),
        isPremium,
        {
          gasLimit: gasLimit
          // NO VALUE - createPool doesn't accept ETH!
        }
      );
      
      toast.info("Transaction submitted, waiting for confirmation...");
      
      // Wait for transaction with timeout
      const receipt = await Promise.race([
        tx.wait(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Transaction timeout")), 60000)
        )
      ]);
      
      if (receipt.status === 0) {
        throw new Error("Transaction failed on-chain");
      }
      
      toast.success("Pool created successfully!");

      // Reset form
      setContributionAmount("");
      setCycleDurationDays("");
      setMaxMembers("2");
      setPoolReason("Savings");
      setOtherReason("");
      setApy("");
      setIsPremium(false);
      await checkUltRequirements();
      
    } catch (err) {
      console.error("Error creating pool:", err);
      
      let errorMessage = "Pool creation failed";
      
      // Enhanced error parsing
      if (err.data) {
        errorMessage = decodeCustomError(err.data);
      } else if (err.reason && err.reason !== "unknown") {
        errorMessage = err.reason;
      } else if (err.message) {
        // Clean up common ethers error messages
        if (err.message.includes("user rejected")) {
          errorMessage = "Transaction rejected by user";
        } else if (err.message.includes("insufficient funds")) {
          errorMessage = "Insufficient funds for transaction";
        } else if (err.message.includes("network")) {
          errorMessage = "Network error - please try again";
        } else {
          errorMessage = err.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fadeInUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

  if (!networkAddresses) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading pool creation...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">Create a Savings Pool</h2>
        <p className="text-indigo-100">Set up your decentralized savings group with automatic rewards</p>
      </div>

      <div className="p-8 space-y-8">
        {/* ULT Requirements Alert */}
        {ultFeesEnabled && parseFloat(ultBalance) < (isPremium ? 2000 : 500) && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-amber-800 dark:text-amber-300 mb-1">
                  Insufficient ULT Tokens
                </h4>
                <p className="text-sm text-amber-700 dark:text-amber-400 mb-2">
                  You need {isPremium ? "2,000" : "500"} ULT tokens to create this pool. 
                  You currently have {parseFloat(ultBalance).toLocaleString()} ULT.
                </p>
                <div className="text-xs text-amber-600 dark:text-amber-400">
                  <strong>Get ULT tokens from:</strong>
                  <ul className="mt-1 space-y-1">
                    <li>• Claim from the ULT faucet</li>
                    <li>• Join pools and claim yield rewards</li>
                    <li>• Stake ULT for 10% APY rewards</li>
                    <li>• Trade on the ULT DEX platform</li>
                  </ul>
                </div>
                <Link 
                  to="/faucet" 
                  className="inline-flex items-center gap-1 mt-2 text-sm font-semibold text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200"
                >
                  Get ULT from Faucet <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ULT Approval Required */}
        {ultFeesEnabled && needsApproval && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-blue-800 dark:text-blue-300">ULT Approval Required</h4>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  Approve ULT spending for pool creation fees
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                  Current allowance: {parseFloat(allowance).toLocaleString()} ULT
                </p>
              </div>
              <button
                onClick={handleApproveUlt}
                disabled={isApproving}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-semibold"
              >
                {isApproving ? "Approving..." : "Approve ULT"}
              </button>
            </div>
          </div>
        )}

        {/* Pool Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Form */}
          <div className="space-y-6">
            {/* Premium Pool Toggle */}
            {ultFeesEnabled && (
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Star size={20} className="text-amber-600" />
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Premium Pool</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400">+5% APY bonus, 20% yield bonus</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPremium}
                      onChange={(e) => setIsPremium(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-amber-600"></div>
                  </label>
                </div>
                <div className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                  Cost: {getCreationFee()} (50% burned for scarcity)
                </div>
              </div>
            )}

            {/* Contribution Amount */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                <Target size={16} />
                Contribution Amount (ETH)
              </label>
              <input 
                type="number" 
                step="0.001"
                min="0.001"
                value={contributionAmount} 
                onChange={(e) => setContributionAmount(e.target.value)} 
                className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                placeholder="0.001"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Each member contributes this amount per cycle
              </p>
            </div>

            {/* Cycle Duration */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                <Clock size={16} />
                Cycle Duration (days)
              </label>
              <input 
                type="number" 
                min="1"
                max="365"
                value={cycleDurationDays} 
                onChange={(e) => setCycleDurationDays(e.target.value)} 
                className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                placeholder="30"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Time between payouts (1-365 days)
              </p>
            </div>

            {/* Max Members */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                <Users size={16} />
                Max Members
              </label>
              <input 
                type="number" 
                min="2"
                max="50"
                value={maxMembers} 
                onChange={(e) => setMaxMembers(e.target.value)} 
                className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                placeholder="10"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Payout order determined by join sequence
              </p>
            </div>

            {/* Pool Purpose */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                <Calculator size={16} />
                Pool Purpose
              </label>
              <select 
                value={poolReason} 
                onChange={(e) => setPoolReason(e.target.value)} 
                className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="Savings">Savings</option>
                <option value="Investment">Investment</option>
                <option value="Emergency">Emergency Fund</option>
                <option value="Social">Social/Community</option>
                <option value="Business">Business</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Custom Reason */}
            {poolReason === "Other" && (
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  Custom Purpose
                </label>
                <input 
                  type="text" 
                  value={otherReason} 
                  onChange={(e) => setOtherReason(e.target.value)} 
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                  placeholder="Describe your pool purpose"
                />
              </div>
            )}

            {/* APY */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                <Percent size={16} />
                Base APY (%) - ULT Token Rewards
              </label>
              <input 
                type="number" 
                min="0"
                max="50"
                step="0.1"
                value={apy} 
                onChange={(e) => setApy(e.target.value)} 
                className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                placeholder="5.0"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Annual yield in ULT tokens (claimable hourly)
              </p>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 space-y-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Calculator size={20} />
              Pool Preview
            </h3>

            {/* Premium Badge */}
            {isPremium && (
              <div className="bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-amber-600" />
                  <span className="font-semibold text-amber-700 dark:text-amber-300">Premium Pool</span>
                </div>
              </div>
            )}

            {/* Pool Stats */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Your ULT Balance:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {parseFloat(ultBalance).toLocaleString()} ULT
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">ULT Allowance:</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {parseFloat(allowance).toLocaleString()} ULT
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total Pool Value:</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {calculatePoolValue()} ETH
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Pool Duration:</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {maxMembers && cycleDurationDays
                    ? `${parseInt(maxMembers) * parseInt(cycleDurationDays)} days`
                    : "0 days"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Effective APY:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {getEffectiveAPY()}%
                  {isPremium && <span className="text-xs ml-1 text-amber-600">(+5% bonus)</span>}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Creation Fee:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <Zap size={12} />
                  {getCreationFee()}
                </span>
              </div>
            </div>

            {/* Creator Rewards */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                <Gift size={16} className="text-yellow-600" />
                Creator Rewards
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Reward Rate:</span>
                  <span className="font-bold text-yellow-700 dark:text-yellow-400">0.5% per member</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Rewards:</span>
                  <span className="font-bold text-yellow-700 dark:text-yellow-400">
                    {calculateCreatorRewards()} ETH
                  </span>
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">How It Works</h4>
              <ol className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <li>1. {ultFeesEnabled ? "Pay ULT creation fee (50% burned)" : "Create pool (free)"}</li>
                <li>2. Members join and form payout order</li>
                <li>3. All contribute each cycle</li>
                <li>4. First joiner gets first payout</li>
                <li>5. Funds stay locked until pool ends</li>
                <li>6. ULT rewards claimable hourly</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <motion.button
          onClick={handleCreatePool}
          disabled={
            isSubmitting ||
            (ultFeesEnabled && (needsApproval || parseFloat(ultBalance) < (isPremium ? 2000 : 500)))
          }
          whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
          whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          {isSubmitting ? "Creating Pool..." : `Create ${isPremium ? "Premium " : ""}Pool`}
        </motion.button>

        {/* Footer Info */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          {ultFeesEnabled
            ? needsApproval
              ? "Please approve ULT spending to create pools"
              : parseFloat(ultBalance) < (isPremium ? 2000 : 500)
              ? `Need ${isPremium ? "2,000" : "500"} ULT (you have ${parseFloat(ultBalance).toLocaleString()})`
              : `Pool creation fee: ${getCreationFee()}`
            : "ULT fees are currently disabled - pool creation is free"}
        </div>
      </div>
    </motion.div>
  );
};

export default JoinCreatePool;