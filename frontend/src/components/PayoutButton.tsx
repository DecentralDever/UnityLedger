// src/components/PayoutButton.tsx
import React, { useState } from "react";
import { toast } from "react-toastify";
import { useUnityLedgerContract } from "../services/contract";

interface PayoutButtonProps {
  poolId: string;
}

const PayoutButton: React.FC<PayoutButtonProps> = ({ poolId }) => {
  const contract = useUnityLedgerContract();
  const [loading, setLoading] = useState(false);

  const handlePayout = async () => {
    if (!contract) {
      toast.error("Wallet not connected");
      return;
    }
    setLoading(true);
    try {
      // Call startNewCycle to trigger the payout/new cycle
      const tx = await contract.startNewCycle(poolId);
      toast.info("Payout transaction submitted...");
      await tx.wait();
      toast.success("Payout triggered successfully");
    } catch (error: any) {
      console.error("Error triggering payout:", error);
      toast.error("Payout failed: " + error.message);
    }
    setLoading(false);
  };

  return (
    <button onClick={handlePayout} disabled={loading}>
      {loading ? "Processing Payout..." : "Trigger Payout"}
    </button>
  );
};

export default PayoutButton;
