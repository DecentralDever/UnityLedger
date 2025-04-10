import { jsx as _jsx } from "react/jsx-runtime";
// src/components/PayoutButton.tsx
import { useState } from "react";
import { toast } from "react-toastify";
import { useUnityLedgerContract } from "../services/contract";
const PayoutButton = ({ poolId }) => {
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
        }
        catch (error) {
            console.error("Error triggering payout:", error);
            toast.error("Payout failed: " + error.message);
        }
        setLoading(false);
    };
    return (_jsx("button", { onClick: handlePayout, disabled: loading, children: loading ? "Processing Payout..." : "Trigger Payout" }));
};
export default PayoutButton;
