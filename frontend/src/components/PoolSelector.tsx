// src/components/PoolSelector.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useUnityLedgerContract } from "../services/contract";
import { useWallet } from "../context/WalletProvider";
import { toast } from "react-toastify";

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
}

const PoolSelector: React.FC = () => {
  const contract = useUnityLedgerContract();
  const { account } = useWallet();
  const [pools, setPools] = useState<PoolDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchPools = useCallback(async () => {
    if (!contract) return;
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
      const formattedPools = poolDetailsArray.map((details: any) => ({
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
    } catch (error: any) {
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

  const joinPoolHandler = async (poolId: number) => {
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
    } catch (error: any) {
      console.error("Error joining pool:", error);
      toast.error("Error joining pool: " + error.message);
    }
  };

  if (loading) return <div>Loading pools...</div>;
  if (pools.length === 0) return <div>No pools available to join.</div>;

  return (
    <div>
      <h2>Available Pools</h2>
      <ul>
        {pools.map((pool, idx) => (
          <li
            key={idx}
            style={{
              marginBottom: "1rem",
              padding: "0.5rem",
              border: "1px solid #ccc",
            }}
          >
            <p><strong>Pool ID:</strong> {pool.id.toString()}</p>
            <p><strong>Creator:</strong> {pool.creator}</p>
            <p>
              <strong>Contribution Amount:</strong>{" "}
              {pool.contributionAmount.toString()} wei
            </p>
            <p>
              <strong>Cycle Duration:</strong>{" "}
              {pool.cycleDuration.toString()} seconds
            </p>
            <p>
              <strong>Max Members:</strong> {pool.maxMembers.toString()}
            </p>
            <p>
              <strong>Total Members:</strong> {pool.totalMembers.toString()}
            </p>
            <p>
              <strong>Is Active:</strong> {pool.isActive ? "Yes" : "No"}
            </p>
            <button onClick={() => joinPoolHandler(Number(pool.id))}>
              Join Pool
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PoolSelector;
