// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/// @notice Minimal interface for a mintable ERC20 (ULT token)
interface IERC20Mintable {
    function mint(address to, uint256 amount) external;
}

contract UnityLedger {
    uint256 public nextPoolId;

    struct Pool {
        uint256 id;
        address creator;
        uint256 contributionAmount;
        uint256 cycleDuration;
        uint256 maxMembers;
        uint256 totalMembers;
        uint256 currentCycle;
        uint256 lastPayoutTime;
        bool isActive;
        address[] payoutOrder;
        string poolType;  // Pool Reason
        uint256 fee;      // APY (%) expressed as a whole number (for example, 5 means 5% APY)
        mapping(address => bool) hasJoined;
        mapping(uint256 => mapping(address => bool)) hasContributed; // cycle => member => status
    }

    struct Member {
        address wallet;
        uint256 joinedAt;
        bool hasReceivedPayout;
    }

    // Storage
    mapping(uint256 => Pool) private pools;
    mapping(uint256 => Member[]) public poolMembers;
    mapping(uint256 => address) public payoutHistory;
    mapping(address => bool) public isBlacklisted;
    mapping(address => uint256) public missedPayments;

    // Mapping to track last yield claim time per pool per member
    mapping(uint256 => mapping(address => uint256)) public lastClaimTime;
    
    // ULT token contract for yield rewards
    IERC20Mintable public ultToken;

    // Events
    event PoolCreated(uint256 indexed poolId, address indexed creator);
    event JoinedPool(uint256 indexed poolId, address indexed member);
    event ContributionReceived(uint256 indexed poolId, address indexed member, uint256 amount);
    event PayoutSent(uint256 indexed poolId, address indexed recipient, uint256 amount);
    event MemberBlacklisted(address indexed member);
    event NewCycleStarted(uint256 indexed poolId, uint256 cycle);
    event PoolClosed(uint256 indexed poolId);
    event YieldClaimed(uint256 indexed poolId, address indexed member, uint256 amount);

    // Modifier
    modifier onlyPoolMember(uint256 poolId) {
        require(pools[poolId].hasJoined[msg.sender], "Not a pool member");
        _;
    }

    // Set the ULT token address; in production, add appropriate access control
    function setUltToken(address tokenAddress) external {
        ultToken = IERC20Mintable(tokenAddress);
    }

    // Create a new pool with six parameters (including poolType and fee for yield/APY)
    function createPool(
        uint256 contributionAmount,
        uint256 cycleDuration,
        uint256 maxMembers,
        address[] memory payoutOrder,
        string memory poolType,
        uint256 fee
    ) external returns (uint256) {
        require(payoutOrder.length == maxMembers, "Payout order must match max members");

        Pool storage newPool = pools[nextPoolId];
        newPool.id = nextPoolId;
        newPool.creator = msg.sender;
        newPool.contributionAmount = contributionAmount;
        newPool.cycleDuration = cycleDuration;
        newPool.maxMembers = maxMembers;
        newPool.totalMembers = 0;
        newPool.currentCycle = 0;
        newPool.isActive = true;
        newPool.lastPayoutTime = block.timestamp;
        newPool.payoutOrder = payoutOrder;
        newPool.poolType = poolType;
        newPool.fee = fee;

        emit PoolCreated(nextPoolId, msg.sender);
        return nextPoolId++;
    }

    // Allow a new member to join a pool only if no cycle has started yet
    function joinPool(uint256 poolId) external {
        Pool storage pool = pools[poolId];
        require(pool.isActive, "Pool not active");
        require(pool.currentCycle == 0, "Pool already started");
        require(!pool.hasJoined[msg.sender], "Already joined");
        require(pool.totalMembers < pool.maxMembers, "Pool is full");
        require(!isBlacklisted[msg.sender], "Blacklisted member");

        pool.hasJoined[msg.sender] = true;
        pool.totalMembers++;
        poolMembers[poolId].push(Member({ wallet: msg.sender, joinedAt: block.timestamp, hasReceivedPayout: false }));
        emit JoinedPool(poolId, msg.sender);
    }

    // Contribute to the pool (requires membership)
    function contribute(uint256 poolId) external payable onlyPoolMember(poolId) {
        Pool storage pool = pools[poolId];
        require(msg.value == pool.contributionAmount, "Incorrect contribution amount");
        require(!pool.hasContributed[pool.currentCycle][msg.sender], "Already contributed this cycle");

        pool.hasContributed[pool.currentCycle][msg.sender] = true;
        emit ContributionReceived(poolId, msg.sender, msg.value);

        uint256 contributionsCount;
        for (uint256 i = 0; i < poolMembers[poolId].length; i++) {
            address member = poolMembers[poolId][i].wallet;
            if (pool.hasContributed[pool.currentCycle][member]) {
                contributionsCount++;
            } else {
                missedPayments[member]++;
                if (missedPayments[member] >= 3 && !isBlacklisted[member]) {
                    isBlacklisted[member] = true;
                    emit MemberBlacklisted(member);
                }
            }
        }

        if (contributionsCount == pool.totalMembers) {
            require(
                block.timestamp >= pool.lastPayoutTime + pool.cycleDuration,
                "Cycle duration not met"
            );
            _payout(poolId);
        }
    }

    // Internal payout function: transfers pool funds to the designated recipient
    function _payout(uint256 poolId) internal {
        Pool storage pool = pools[poolId];
        address recipient = pool.payoutOrder[pool.currentCycle];
        uint256 totalAmount = pool.contributionAmount * pool.totalMembers;
        payoutHistory[pool.currentCycle] = recipient;
        pool.currentCycle++;
        pool.lastPayoutTime = block.timestamp;
        payable(recipient).transfer(totalAmount);
        emit PayoutSent(poolId, recipient, totalAmount);
    }

    // Allow the creator to close a pool before it starts (cancel the pool)
    function closePool(uint256 poolId) external {
        Pool storage pool = pools[poolId];
        require(msg.sender == pool.creator, "Only creator can close the pool");
        require(pool.isActive, "Pool already closed");
        require(pool.currentCycle == 0, "Pool cycle already started");

        pool.isActive = false;
        emit PoolClosed(poolId);
    }

    // Manually trigger the start of a new cycle after contributions
    function startNewCycle(uint256 poolId) public {
        Pool storage pool = pools[poolId];
        require(pool.isActive, "Pool is not active");
        require(
            block.timestamp >= pool.lastPayoutTime + pool.cycleDuration,
            "Cycle duration not yet passed"
        );

        for (uint256 i = 0; i < poolMembers[poolId].length; i++) {
            address member = poolMembers[poolId][i].wallet;
            if (!pool.hasContributed[pool.currentCycle][member]) {
                missedPayments[member]++;
                if (missedPayments[member] >= 3 && !isBlacklisted[member]) {
                    isBlacklisted[member] = true;
                    emit MemberBlacklisted(member);
                }
            }
        }

        pool.lastPayoutTime = block.timestamp;
        pool.currentCycle++;
        emit NewCycleStarted(poolId, pool.currentCycle);
    }

    // On-demand yield claim function
    // Members earn yield (APY in ULT) on their contribution over time
    // APY is stored in pool.fee (e.g. 5 for 5% APY)
    function claimYield(uint256 poolId) external {
        Pool storage pool = pools[poolId];
        require(pool.hasJoined[msg.sender], "Not a pool member");

        // Determine when the member last claimed yield; if never, use pool.lastPayoutTime
        uint256 lastClaim = lastClaimTime[poolId][msg.sender];
        uint256 claimStart = lastClaim == 0 ? pool.lastPayoutTime : lastClaim;
        uint256 timeElapsed = block.timestamp - claimStart;
        require(timeElapsed > 0, "No yield available yet");

        // Calculate yield: (contribution * fee * elapsed time) / (365 days * 100)
        uint256 yieldEarned = (pool.contributionAmount * pool.fee * timeElapsed) / (365 days * 100);
        require(yieldEarned > 0, "Yield below minimum threshold");

        // Update last claim time
        lastClaimTime[poolId][msg.sender] = block.timestamp;

        // Ensure ultToken has been set and mint yield tokens to the caller
        require(address(ultToken) != address(0), "ULT token not set");
        ultToken.mint(msg.sender, yieldEarned);

        emit YieldClaimed(poolId, msg.sender, yieldEarned);
    }

    // Getter function for pool details (including poolType and fee)
    function getPoolDetails(uint256 poolId)
        external
        view
        returns (
            uint256 id,
            address creator,
            uint256 contributionAmount,
            uint256 cycleDuration,
            uint256 maxMembers,
            uint256 totalMembers,
            uint256 currentCycle,
            uint256 lastPayoutTime,
            bool isActive,
            string memory poolType,
            uint256 fee
        )
    {
        Pool storage pool = pools[poolId];
        return (
            pool.id,
            pool.creator,
            pool.contributionAmount,
            pool.cycleDuration,
            pool.maxMembers,
            pool.totalMembers,
            pool.currentCycle,
            pool.lastPayoutTime,
            pool.isActive,
            pool.poolType,
            pool.fee
        );
    }

    // Getter function for pool members
    function getPoolMembers(uint256 poolId) external view returns (Member[] memory) {
        return poolMembers[poolId];
    }

    // Getter function for payout order
    function getPayoutOrder(uint256 poolId) external view returns (address[] memory) {
        return pools[poolId].payoutOrder;
    }
}
