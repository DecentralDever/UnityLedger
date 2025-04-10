// src/components/ContributeForm.tsx
import React, { useState } from "react";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import { useUnityLedgerContract } from "../services/contract";
// Import the named Tooltip component and its CSS from react-tooltip v5
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";

interface ContributeFormProps {
  poolId: string;
}

const ContributeForm: React.FC<ContributeFormProps> = ({ poolId }) => {
  const contract = useUnityLedgerContract();
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleContribute = async () => {
    if (!contract) {
      toast.error("Wallet not connected");
      return;
    }
    if (!amount || isNaN(Number(amount))) {
      toast.error("Please enter a valid amount");
      return;
    }
    try {
      setLoading(true);
      // Convert the entered amount (ETH) to wei
      const tx = await contract.contribute(poolId, {
        value: ethers.parseEther(amount),
      });
      toast.info("Contribution transaction submitted");
      await tx.wait();
      toast.success("Contribution successful");
    } catch (error: any) {
      console.error("Error contributing:", error);
      toast.error("Contribution failed: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div>
      <h3>Make a Contribution</h3>
      <input
        type="number"
        placeholder="Contribution Amount in ETH"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        data-tooltip-id="contribution-tooltip"
        data-tooltip-content="Enter the exact amount required for the pool"
      />
      <button
        onClick={handleContribute}
        disabled={loading}
        data-tooltip-id="contribution-tooltip"
        data-tooltip-content="Click to contribute to the pool"
      >
        {loading ? "Processing..." : "Contribute"}
      </button>
      <Tooltip id="contribution-tooltip" place="top" variant="dark" />
    </div>
  );
};

export default ContributeForm;
