import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/components/ContributeForm.tsx
import { useState } from "react";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import { useUnityLedgerContract } from "../services/contract";
// Import the named Tooltip component and its CSS from react-tooltip v5
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
const ContributeForm = ({ poolId }) => {
    const contract = useUnityLedgerContract();
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
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
        }
        catch (error) {
            console.error("Error contributing:", error);
            toast.error("Contribution failed: " + error.message);
        }
        setLoading(false);
    };
    return (_jsxs("div", { children: [_jsx("h3", { children: "Make a Contribution" }), _jsx("input", { type: "number", placeholder: "Contribution Amount in ETH", value: amount, onChange: (e) => setAmount(e.target.value), "data-tooltip-id": "contribution-tooltip", "data-tooltip-content": "Enter the exact amount required for the pool" }), _jsx("button", { onClick: handleContribute, disabled: loading, "data-tooltip-id": "contribution-tooltip", "data-tooltip-content": "Click to contribute to the pool", children: loading ? "Processing..." : "Contribute" }), _jsx(Tooltip, { id: "contribution-tooltip", place: "top", variant: "dark" })] }));
};
export default ContributeForm;
