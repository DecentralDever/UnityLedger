// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/// @notice Minimal interface for a mintable ERC20 (ULT token)
interface IERC20Mintable {
    function mint(address to, uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
}

contract UnityLedger {
    uint256 public nextPoolId;
    address public owner;
    uint256 public platformFee = 100; // 1% in basis points (100/10000)
    uint256 public constant MAX_MEMBERS = 50;
    uint256 public constant MIN_CONTRIBUTION = 0.001 ether;
    uint256 public constant MAX_APY = 50; // 50% max APY

    struct Pool {
        uint256 id;
        address creator;
        uint256 contributionAmount;
        uint256 cycleDuration;
        uint256 maxMembers;
        uint256 totalMembers;
        uint256 currentCycle;
        uint256 lastPayoutTime;
        uint256 createdAt;
        bool isActive;
        bool isCompleted;
        address[] payoutOrder;
        string poolType;
        uint256 fee; // APY (%)
        uint256 totalContributions;
        uint256 totalPayouts;
        mapping(address => bool) hasJoined;
        mapping(uint256 => mapping(address => bool)) hasContributed;
        mapping(uint256 => mapping(address => uint256)) contributionTime;
    }

    struct Member {
        address wallet;
        uint256 joinedAt;
        bool hasReceivedPayout;
        uint256 totalContributed;
        uint256 missedContributions;
    }

    struct PoolInfo {
        uint256 id;
        address creator;
        uint256 contributionAmount;
        uint256 cycleDuration;
        uint256 maxMembers;
        uint256 totalMembers;
        uint256 currentCycle;
        uint256 lastPayoutTime;
        uint256 createdAt;
        bool isActive;
        bool isCompleted;
        string poolType;
        uint256 fee;
        uint256 totalContributions;
        uint256 totalPayouts;
    }

    // Storage
    mapping(uint256 => Pool) private pools;
    mapping(uint256 => Member[]) public poolMembers;
    mapping(uint256 => address) public payoutHistory;
    mapping(address => bool) public isBlacklisted;
    mapping(address => uint256) public missedPayments;
    mapping(uint256 => mapping(address => uint256)) public lastClaimTime;
    mapping(address => uint256[]) public userPools;
    mapping(address => uint256) public userPoolCount;
    
    // ULT token contract for yield rewards
    IERC20Mintable public ultToken;

    // Events
    event PoolCreated(uint256 indexed poolId, address indexed creator, uint256 contributionAmount, uint256 maxMembers);
    event JoinedPool(uint256 indexed poolId, address indexed member, uint256 timestamp);
    event ContributionReceived(uint256 indexed poolId, address indexed member, uint256 amount, uint256 cycle);
    event PayoutSent(uint256 indexed poolId, address indexed recipient, uint256 amount, uint256 cycle);
    event MemberBlacklisted(address indexed member, uint256 missedPayments);
    event NewCycleStarted(uint256 indexed poolId, uint256 cycle, uint256 timestamp);
    event PoolClosed(uint256 indexed poolId, address indexed creator);
    event PoolCompleted(uint256 indexed poolId, uint256 timestamp);
    event YieldClaimed(uint256 indexed poolId, address indexed member, uint256 amount);
    event EmergencyWithdrawal(uint256 indexed poolId, address indexed member, uint256 amount);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyPoolMember(uint256 poolId) {
        require(pools[poolId].hasJoined[msg.sender], "Not a pool member");
        _;
    }

    modifier validPoolId(uint256 poolId) {
        require(poolId < nextPoolId, "Invalid pool ID");
        _;
    }

    modifier notBlacklisted() {
        require(!isBlacklisted[msg.sender], "Address blacklisted");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // Owner functions
    function setUltToken(address tokenAddress) external onlyOwner {
        require(tokenAddress != address(0), "Invalid token address");
        ultToken = IERC20Mintable(tokenAddress);
    }

    function setPlatformFee(uint256 _fee) external onlyOwner {
        require(_fee <= 500, "Fee too high"); // Max 5%
        platformFee = _fee;
    }

    function blacklistAddress(address user) external onlyOwner {
        isBlacklisted[user] = true;
        emit MemberBlacklisted(user, missedPayments[user]);
    }

    function removeFromBlacklist(address user) external onlyOwner {
        isBlacklisted[user] = false;
    }

    // Enhanced pool creation with better validation
    function createPool(
        uint256 contributionAmount,
        uint256 cycleDuration,
        uint256 maxMembers,
        address[] memory payoutOrder,
        string memory poolType,
        uint256 fee
    ) external notBlacklisted returns (uint256) {
        require(contributionAmount >= MIN_CONTRIBUTION, "Contribution too low");
        require(cycleDuration >= 1 days, "Cycle too short");
        require(cycleDuration <= 365 days, "Cycle too long");
        require(maxMembers >= 2 && maxMembers <= MAX_MEMBERS, "Invalid member count");
        require(payoutOrder.length == maxMembers, "Payout order mismatch");
        require(fee <= MAX_APY, "APY too high");
        require(bytes(poolType).length > 0, "Pool type required");

        // Validate payout order addresses
        for (uint256 i = 0; i < payoutOrder.length; i++) {
            require(payoutOrder[i] != address(0), "Invalid payout address");
        }

        Pool storage newPool = pools[nextPoolId];
        newPool.id = nextPoolId;
        newPool.creator = msg.sender;
        newPool.contributionAmount = contributionAmount;
        newPool.cycleDuration = cycleDuration;
        newPool.maxMembers = maxMembers;
        newPool.totalMembers = 0;
        newPool.currentCycle = 0;
        newPool.isActive = true;
        newPool.isCompleted = false;
        newPool.lastPayoutTime = block.timestamp;
        newPool.createdAt = block.timestamp;
        newPool.payoutOrder = payoutOrder;
        newPool.poolType = poolType;
        newPool.fee = fee;
        newPool.totalContributions = 0;
        newPool.totalPayouts = 0;

        // Add creator to user pools tracking
        userPools[msg.sender].push(nextPoolId);
        userPoolCount[msg.sender]++;

        emit PoolCreated(nextPoolId, msg.sender, contributionAmount, maxMembers);
        return nextPoolId++;
    }

    // Enhanced join pool with better validation
    function joinPool(uint256 poolId) external validPoolId(poolId) notBlacklisted {
        Pool storage pool = pools[poolId];
        require(pool.isActive, "Pool not active");
        require(pool.currentCycle == 0, "Pool already started");
        require(!pool.hasJoined[msg.sender], "Already joined");
        require(pool.totalMembers < pool.maxMembers, "Pool full");
        require(msg.sender != pool.creator, "Creator auto-joined");

        pool.hasJoined[msg.sender] = true;
        pool.totalMembers++;
        poolMembers[poolId].push(Member({
            wallet: msg.sender,
            joinedAt: block.timestamp,
            hasReceivedPayout: false,
            totalContributed: 0,
            missedContributions: 0
        }));

        // Track user pools
        userPools[msg.sender].push(poolId);
        userPoolCount[msg.sender]++;

        emit JoinedPool(poolId, msg.sender, block.timestamp);
    }

    // Enhanced contribute function
    function contribute(uint256 poolId) external payable validPoolId(poolId) onlyPoolMember(poolId) notBlacklisted {
        Pool storage pool = pools[poolId];
        require(pool.isActive && !pool.isCompleted, "Pool not accepting contributions");
        require(msg.value == pool.contributionAmount, "Incorrect amount");
        require(!pool.hasContributed[pool.currentCycle][msg.sender], "Already contributed");

        pool.hasContributed[pool.currentCycle][msg.sender] = true;
        pool.contributionTime[pool.currentCycle][msg.sender] = block.timestamp;
        pool.totalContributions += msg.value;

        // Update member stats
        for (uint256 i = 0; i < poolMembers[poolId].length; i++) {
            if (poolMembers[poolId][i].wallet == msg.sender) {
                poolMembers[poolId][i].totalContributed += msg.value;
                break;
            }
        }

        emit ContributionReceived(poolId, msg.sender, msg.value, pool.currentCycle);

        // Check if all members contributed
        uint256 contributionsCount = 0;
        for (uint256 i = 0; i < poolMembers[poolId].length; i++) {
            address member = poolMembers[poolId][i].wallet;
            if (pool.hasContributed[pool.currentCycle][member]) {
                contributionsCount++;
            }
        }

        // Auto-payout when all contributed and cycle duration met
        if (contributionsCount == pool.totalMembers &&
            block.timestamp >= pool.lastPayoutTime + pool.cycleDuration) {
            _payout(poolId);
        }
    }

    // Enhanced payout function
    function _payout(uint256 poolId) internal {
        Pool storage pool = pools[poolId];
        require(pool.currentCycle < pool.maxMembers, "All cycles completed");

        address recipient = pool.payoutOrder[pool.currentCycle];
        uint256 totalAmount = pool.contributionAmount * pool.totalMembers;
        uint256 platformFeeAmount = (totalAmount * platformFee) / 10000;
        uint256 payoutAmount = totalAmount - platformFeeAmount;

        // Update payout tracking
        payoutHistory[pool.currentCycle] = recipient;
        pool.totalPayouts += payoutAmount;
        pool.currentCycle++;
        pool.lastPayoutTime = block.timestamp;

        // Mark recipient as received payout
        for (uint256 i = 0; i < poolMembers[poolId].length; i++) {
            if (poolMembers[poolId][i].wallet == recipient) {
                poolMembers[poolId][i].hasReceivedPayout = true;
                break;
            }
        }

        // Send payments
        payable(recipient).transfer(payoutAmount);
        if (platformFeeAmount > 0) {
            payable(owner).transfer(platformFeeAmount);
        }

        emit PayoutSent(poolId, recipient, payoutAmount, pool.currentCycle - 1);

        // Check if pool completed
        if (pool.currentCycle >= pool.maxMembers) {
            pool.isCompleted = true;
            pool.isActive = false;
            emit PoolCompleted(poolId, block.timestamp);
        }
    }

    // Manual cycle start with penalty tracking
    function startNewCycle(uint256 poolId) external validPoolId(poolId) {
        Pool storage pool = pools[poolId];
        require(pool.isActive && !pool.isCompleted, "Pool not active");
        require(block.timestamp >= pool.lastPayoutTime + pool.cycleDuration, "Cycle not ready");

        // Track missed contributions
        for (uint256 i = 0; i < poolMembers[poolId].length; i++) {
            address member = poolMembers[poolId][i].wallet;
            if (!pool.hasContributed[pool.currentCycle][member]) {
                missedPayments[member]++;
                poolMembers[poolId][i].missedContributions++;
                
                if (missedPayments[member] >= 3) {
                    isBlacklisted[member] = true;
                    emit MemberBlacklisted(member, missedPayments[member]);
                }
            }
        }

        pool.lastPayoutTime = block.timestamp;
        pool.currentCycle++;
        emit NewCycleStarted(poolId, pool.currentCycle, block.timestamp);
    }

    // Enhanced yield claiming
    function claimYield(uint256 poolId) external validPoolId(poolId) onlyPoolMember(poolId) {
        Pool storage pool = pools[poolId];
        require(address(ultToken) != address(0), "ULT token not set");

        uint256 lastClaim = lastClaimTime[poolId][msg.sender];
        uint256 claimStart = lastClaim == 0 ? pool.createdAt : lastClaim;
        uint256 timeElapsed = block.timestamp - claimStart;
        require(timeElapsed >= 1 hours, "Claim too frequent");

        uint256 yieldEarned = (pool.contributionAmount * pool.fee * timeElapsed) / (365 days * 100);
        require(yieldEarned > 0, "No yield earned");

        lastClaimTime[poolId][msg.sender] = block.timestamp;
        ultToken.mint(msg.sender, yieldEarned);

        emit YieldClaimed(poolId, msg.sender, yieldEarned);
    }

    // Pool management functions
    function closePool(uint256 poolId) external validPoolId(poolId) {
        Pool storage pool = pools[poolId];
        require(msg.sender == pool.creator, "Only creator");
        require(pool.isActive, "Pool not active");
        require(pool.currentCycle == 0, "Pool started");

        pool.isActive = false;
        emit PoolClosed(poolId, msg.sender);
    }

    // Emergency withdrawal (only for creator)
    function emergencyWithdraw(uint256 poolId) external validPoolId(poolId) onlyOwner {
        Pool storage pool = pools[poolId];
        require(address(this).balance > 0, "No funds");

        uint256 amount = address(this).balance;
        pool.isActive = false;
        payable(owner).transfer(amount);

        emit EmergencyWithdrawal(poolId, msg.sender, amount);
    }

    // View functions
    function getPoolDetails(uint256 poolId) external view validPoolId(poolId) returns (PoolInfo memory) {
        Pool storage pool = pools[poolId];
        return PoolInfo({
            id: pool.id,
            creator: pool.creator,
            contributionAmount: pool.contributionAmount,
            cycleDuration: pool.cycleDuration,
            maxMembers: pool.maxMembers,
            totalMembers: pool.totalMembers,
            currentCycle: pool.currentCycle,
            lastPayoutTime: pool.lastPayoutTime,
            createdAt: pool.createdAt,
            isActive: pool.isActive,
            isCompleted: pool.isCompleted,
            poolType: pool.poolType,
            fee: pool.fee,
            totalContributions: pool.totalContributions,
            totalPayouts: pool.totalPayouts
        });
    }

    function getPoolMembers(uint256 poolId) external view validPoolId(poolId) returns (Member[] memory) {
        return poolMembers[poolId];
    }

    function getPayoutOrder(uint256 poolId) external view validPoolId(poolId) returns (address[] memory) {
        return pools[poolId].payoutOrder;
    }

    function getUserPools(address user) external view returns (uint256[] memory) {
        return userPools[user];
    }

    function canJoinPool(uint256 poolId, address user) external view validPoolId(poolId) returns (bool) {
        Pool storage pool = pools[poolId];
        return pool.isActive && 
               pool.currentCycle == 0 && 
               !pool.hasJoined[user] && 
               pool.totalMembers < pool.maxMembers && 
               !isBlacklisted[user] &&
               user != pool.creator;
    }

    function canContribute(uint256 poolId, address user) external view validPoolId(poolId) returns (bool) {
        Pool storage pool = pools[poolId];
        return pool.isActive && 
               !pool.isCompleted &&
               pool.hasJoined[user] && 
               !pool.hasContributed[pool.currentCycle][user] &&
               !isBlacklisted[user];
    }

    function hasContributedThisCycle(uint256 poolId, address user) external view validPoolId(poolId) returns (bool) {
        return pools[poolId].hasContributed[pools[poolId].currentCycle][user];
    }

    function getPoolStats() external view returns (uint256 totalPools, uint256 activePools, uint256 totalMembers, uint256 totalValue) {
        totalPools = nextPoolId;
        
        for (uint256 i = 0; i < nextPoolId; i++) {
            if (pools[i].isActive) {
                activePools++;
            }
            totalMembers += pools[i].totalMembers;
            totalValue += pools[i].totalContributions;
        }
    }

    function calculateYield(uint256 poolId, address user) external view validPoolId(poolId) returns (uint256) {
        Pool storage pool = pools[poolId];
        if (!pool.hasJoined[user]) return 0;

        uint256 lastClaim = lastClaimTime[poolId][user];
        uint256 claimStart = lastClaim == 0 ? pool.createdAt : lastClaim;
        uint256 timeElapsed = block.timestamp - claimStart;

        return (pool.contributionAmount * pool.fee * timeElapsed) / (365 days * 100);
    }

    // Receive function
    receive() external payable {}
}