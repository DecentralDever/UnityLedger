import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/components/PoolSelector.tsx
import { useState, useEffect, useCallback } from "react";
import { useUnityLedgerContract } from "../services/contract";
import { useWallet } from "../context/WalletProvider";
import { toast } from "react-toastify";
const PoolSelector = () => {
    const contract = useUnityLedgerContract();
    const { account } = useWallet();
    const [pools, setPools] = useState([]);
    const [loading, setLoading] = useState(false);
    const fetchPools = useCallback(async () => {
        if (!contract)
            return;
        setLoading(true);
        try {
            // Get the total number of pools from the nextPoolId variable.
            const nextPoolId = await contract.nextPoolId();
            const poolCount = Number(nextPoolId);
            // Fetch details for each pool.
            const poolPromises = [];
            for (let i = 0; i < poolCount; i++) {
                poolPromises.push(contract.getPoolDetails(i));
            }
            const poolDetailsArray = await Promise.all(poolPromises);
            // Format the details, converting each numeric value to a native bigint.
            const formattedPools = poolDetailsArray.map((details) => ({
                id: BigInt(details[0].toString()),
                creator: details[1],
                contributionAmount: BigInt(details[2].toString()),
                cycleDuration: BigInt(details[3].toString()),
                maxMembers: BigInt(details[4].toString()),
                totalMembers: BigInt(details[5].toString()),
                currentCycle: BigInt(details[6].toString()),
                lastPayoutTime: BigInt(details[7].toString()),
                isActive: details[8],
            }));
            setPools(formattedPools);
        }
        catch (error) {
            console.error("Error fetching pools:", error);
            toast.error("Error fetching pools");
        }
        setLoading(false);
    }, [contract]);
    useEffect(() => {
        if (contract) {
            fetchPools();
        }
    }, [contract, fetchPools]);
    const joinPoolHandler = async (poolId) => {
        if (!contract || !account) {
            toast.error("Wallet not connected");
            return;
        }
        try {
            const tx = await contract.joinPool(poolId);
            toast.info("Joining pool...");
            await tx.wait();
            toast.success("Successfully joined the pool");
            // Refresh the pool list after joining.
            fetchPools();
        }
        catch (error) {
            console.error("Error joining pool:", error);
            toast.error("Error joining pool: " + error.message);
        }
    };
    if (loading)
        return _jsx("div", { children: "Loading pools..." });
    if (pools.length === 0)
        return _jsx("div", { children: "No pools available to join." });
    return (_jsxs("div", { children: [_jsx("h2", { children: "Available Pools" }), _jsx("ul", { children: pools.map((pool, idx) => (_jsxs("li", { style: {
                        marginBottom: "1rem",
                        padding: "0.5rem",
                        border: "1px solid #ccc",
                    }, children: [_jsxs("p", { children: [_jsx("strong", { children: "Pool ID:" }), " ", pool.id.toString()] }), _jsxs("p", { children: [_jsx("strong", { children: "Creator:" }), " ", pool.creator] }), _jsxs("p", { children: [_jsx("strong", { children: "Contribution Amount:" }), " ", pool.contributionAmount.toString(), " wei"] }), _jsxs("p", { children: [_jsx("strong", { children: "Cycle Duration:" }), " ", pool.cycleDuration.toString(), " seconds"] }), _jsxs("p", { children: [_jsx("strong", { children: "Max Members:" }), " ", pool.maxMembers.toString()] }), _jsxs("p", { children: [_jsx("strong", { children: "Total Members:" }), " ", pool.totalMembers.toString()] }), _jsxs("p", { children: [_jsx("strong", { children: "Is Active:" }), " ", pool.isActive ? "Yes" : "No"] }), _jsx("button", { onClick: () => joinPoolHandler(Number(pool.id)), children: "Join Pool" })] }, idx))) })] }));
};
export default PoolSelector;
