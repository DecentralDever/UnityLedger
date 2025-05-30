// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

interface IERC20Mintable {
    function mint(address to, uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function burn(uint256 amount) external;
    function getFeeDiscount(address user) external view returns (uint256);
}

contract UnityLedger {
    uint256 public nextPoolId;
    address public owner;
    uint256 public platformFee = 100; // 1% in basis points (100/10000)
    uint256 public creatorRewardRate = 50; // 0.5% per member (50/10000)
    uint256 public constant MAX_MEMBERS = 50;
    uint256 public constant MIN_CONTRIBUTION = 0.001 ether;
    uint256 public constant MAX_APY = 50; // 50% max APY
    
    // ULT Integration
    uint256 public poolCreationFeeULT = 500 * 10**18; // 500 ULT to create pool
    uint256 public premiumPoolFeeULT = 2000 * 10**18; // 2000 ULT for premium pools
    bool public ultFeesEnabled = true;

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
        address[] memberJoinOrder;
        string poolType;
        uint256 fee; // APY (%)
        uint256 totalContributions;
        uint256 totalPayouts;
        uint256 creatorRewards;
        bool creatorJoined;
        bool isPremium; // Premium pools have higher yields
        mapping(address => bool) hasJoined;
        mapping(uint256 => mapping(address => bool)) hasContributed;
        mapping(uint256 => mapping(address => uint256)) contributionTime;
        mapping(address => uint256) lockedBalances;
    }

    struct Member {
        address wallet;
        uint256 joinedAt;
        bool hasReceivedPayout;
        uint256 totalContributed;
        uint256 missedContributions;
        uint256 lockedBalance;
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
        uint256 creatorRewards;
        bool creatorJoined;
        bool isPremium;
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
    
    // ULT token contract
    IERC20Mintable public ultToken;
    uint256 public totalUltBurned;

    // Events
    event PoolCreated(uint256 indexed poolId, address indexed creator, uint256 contributionAmount, uint256 maxMembers, bool isPremium);
    event JoinedPool(uint256 indexed poolId, address indexed member, uint256 timestamp, uint256 position);
    event ContributionReceived(uint256 indexed poolId, address indexed member, uint256 amount, uint256 cycle);
    event PayoutSent(uint256 indexed poolId, address indexed recipient, uint256 amount, uint256 cycle);
    event CreatorRewardEarned(uint256 indexed poolId, address indexed creator, uint256 amount);
    event CreatorRewardClaimed(uint256 indexed poolId, address indexed creator, uint256 amount);
    event FundsLocked(uint256 indexed poolId, address indexed member, uint256 amount);
    event FundsUnlocked(uint256 indexed poolId, address indexed member, uint256 amount);
    event MemberBlacklisted(address indexed member, uint256 missedPayments);
    event NewCycleStarted(uint256 indexed poolId, uint256 cycle, uint256 timestamp);
    event PoolClosed(uint256 indexed poolId, address indexed creator);
    event PoolCompleted(uint256 indexed poolId, uint256 timestamp);
    event YieldClaimed(uint256 indexed poolId, address indexed member, uint256 amount);
    event EmergencyWithdrawal(uint256 indexed poolId, address indexed member, uint256 amount);
    event UltBurned(uint256 amount, string reason);
    event FeeDiscountApplied(address indexed user, uint256 discount, uint256 originalFee, uint256 discountedFee);
    event UltMinted(address indexed recipient, uint256 amount);

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

    function setCreatorRewardRate(uint256 _rate) external onlyOwner {
        require(_rate <= 200, "Rate too high"); // Max 2%
        creatorRewardRate = _rate;
    }

    function setPoolCreationFee(uint256 _fee) external onlyOwner {
        require(_fee <= 10000 * 10**18, "Fee too high"); // Max 10k ULT
        poolCreationFeeULT = _fee;
    }

    function setPremiumPoolFee(uint256 _fee) external onlyOwner {
        require(_fee <= 50000 * 10**18, "Fee too high"); // Max 50k ULT
        premiumPoolFeeULT = _fee;
    }

    function toggleUltFees(bool enabled) external onlyOwner {
        ultFeesEnabled = enabled;
    }

    function blacklistAddress(address user) external onlyOwner {
        isBlacklisted[user] = true;
        emit MemberBlacklisted(user, missedPayments[user]);
    }

    function removeFromBlacklist(address user) external onlyOwner {
        isBlacklisted[user] = false;
    }

    function mintUltToAddress(address to, uint256 amount) external onlyOwner {
        require(address(ultToken) != address(0), "ULT token not set");
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be > 0");
        
        ultToken.mint(to, amount);
        
        emit UltMinted(to, amount);
    }

    // Enhanced pool creation with ULT fees
    function createPool(
        uint256 contributionAmount,
        uint256 cycleDuration,
        uint256 maxMembers,
        string memory poolType,
        uint256 fee,
        bool isPremium
    ) external notBlacklisted returns (uint256) {
        require(contributionAmount >= MIN_CONTRIBUTION, "Contribution too low");
        require(cycleDuration >= 1 days, "Cycle too short");
        require(cycleDuration <= 365 days, "Cycle too long");
        require(maxMembers >= 2 && maxMembers <= MAX_MEMBERS, "Invalid member count");
        require(fee <= MAX_APY, "APY too high");
        require(bytes(poolType).length > 0, "Pool type required");

        // Charge ULT creation fee
        if (ultFeesEnabled && address(ultToken) != address(0)) {
            uint256 creationFee = isPremium ? premiumPoolFeeULT : poolCreationFeeULT;
            require(
                ultToken.transferFrom(msg.sender, address(this), creationFee),
                "ULT fee payment failed"
            );
            
            // Burn 50% of creation fee - FIXED: use burn() instead of burnFromFees()
            uint256 burnAmount = creationFee / 2;
            ultToken.burn(burnAmount);
            totalUltBurned += burnAmount;
            emit UltBurned(burnAmount, "Pool creation fee");
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
        newPool.poolType = poolType;
        newPool.fee = isPremium ? fee + 5 : fee; // Premium pools get 5% bonus APY
        newPool.totalContributions = 0;
        newPool.totalPayouts = 0;
        newPool.creatorRewards = 0;
        newPool.creatorJoined = false;
        newPool.isPremium = isPremium;

        // Add creator to user pools tracking
        userPools[msg.sender].push(nextPoolId);
        userPoolCount[msg.sender]++;

        emit PoolCreated(nextPoolId, msg.sender, contributionAmount, maxMembers, isPremium);
        return nextPoolId++;
    }

    // Enhanced join pool with automatic payout order
    function joinPool(uint256 poolId) external validPoolId(poolId) notBlacklisted {
        Pool storage pool = pools[poolId];
        require(pool.isActive, "Pool not active");
        require(pool.currentCycle == 0, "Pool already started");
        require(!pool.hasJoined[msg.sender], "Already joined");
        require(pool.totalMembers < pool.maxMembers, "Pool full");

        // Creator can join their own pool
        if (msg.sender == pool.creator) {
            pool.creatorJoined = true;
        }

        pool.hasJoined[msg.sender] = true;
        pool.totalMembers++;
        
        // Add to join order (becomes payout order)
        pool.memberJoinOrder.push(msg.sender);
        
        poolMembers[poolId].push(Member({
            wallet: msg.sender,
            joinedAt: block.timestamp,
            hasReceivedPayout: false,
            totalContributed: 0,
            missedContributions: 0,
            lockedBalance: 0
        }));

        // Track user pools
        userPools[msg.sender].push(poolId);
        userPoolCount[msg.sender]++;

        // Creator earns reward for each new member (except themselves)
        if (msg.sender != pool.creator) {
            uint256 creatorReward = (pool.contributionAmount * creatorRewardRate) / 10000;
            pool.creatorRewards += creatorReward;
            emit CreatorRewardEarned(poolId, pool.creator, creatorReward);
        }

        emit JoinedPool(poolId, msg.sender, block.timestamp, pool.totalMembers);
    }

    // Enhanced contribute function with ULT fee discounts
    function contribute(uint256 poolId) external payable validPoolId(poolId) onlyPoolMember(poolId) notBlacklisted {
        Pool storage pool = pools[poolId];
        require(pool.isActive && !pool.isCompleted, "Pool not accepting contributions");
        require(msg.value == pool.contributionAmount, "Incorrect amount");
        require(!pool.hasContributed[pool.currentCycle][msg.sender], "Already contributed");

        pool.hasContributed[pool.currentCycle][msg.sender] = true;
        pool.contributionTime[pool.currentCycle][msg.sender] = block.timestamp;
        pool.totalContributions += msg.value;

        // Lock funds in contract
        pool.lockedBalances[msg.sender] += msg.value;

        // Update member stats
        for (uint256 i = 0; i < poolMembers[poolId].length; i++) {
            if (poolMembers[poolId][i].wallet == msg.sender) {
                poolMembers[poolId][i].totalContributed += msg.value;
                poolMembers[poolId][i].lockedBalance += msg.value;
                break;
            }
        }

        emit ContributionReceived(poolId, msg.sender, msg.value, pool.currentCycle);
        emit FundsLocked(poolId, msg.sender, msg.value);

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

    // Enhanced payout with ULT fee discounts
    function _payout(uint256 poolId) internal {
        Pool storage pool = pools[poolId];
        require(pool.currentCycle < pool.maxMembers, "All cycles completed");

        address recipient = pool.memberJoinOrder[pool.currentCycle];
        uint256 totalAmount = pool.contributionAmount * pool.totalMembers;
        
        // Apply ULT staking discount to platform fee
        uint256 effectivePlatformFee = _getEffectivePlatformFee(recipient);
        uint256 platformFeeAmount = (totalAmount * effectivePlatformFee) / 10000;
        uint256 payoutAmount = totalAmount - platformFeeAmount;

        // Update payout tracking
        payoutHistory[pool.currentCycle] = recipient;
        pool.totalPayouts += payoutAmount;
        pool.currentCycle++;
        pool.lastPayoutTime = block.timestamp;

        // Mark recipient as received payout (funds still locked)
        for (uint256 i = 0; i < poolMembers[poolId].length; i++) {
            if (poolMembers[poolId][i].wallet == recipient) {
                poolMembers[poolId][i].hasReceivedPayout = true;
                break;
            }
        }

        // Send payout (but member's contributions remain locked)
        payable(recipient).transfer(payoutAmount);
        if (platformFeeAmount > 0) {
            payable(owner).transfer(platformFeeAmount);
        }

        emit PayoutSent(poolId, recipient, payoutAmount, pool.currentCycle - 1);

        // Check if pool completed
        if (pool.currentCycle >= pool.maxMembers) {
            pool.isCompleted = true;
            pool.isActive = false;
            _unlockAllFunds(poolId);
            emit PoolCompleted(poolId, block.timestamp);
        }
    }

    // Get effective platform fee with ULT discount
    function _getEffectivePlatformFee(address user) internal returns (uint256) {
        if (address(ultToken) == address(0)) return platformFee;
        
        uint256 discount = ultToken.getFeeDiscount(user);
        if (discount > 0) {
            uint256 discountedFee = platformFee * (100 - discount) / 100;
            emit FeeDiscountApplied(user, discount, platformFee, discountedFee);
            return discountedFee;
        }
        
        return platformFee;
    }

    // Unlock all member funds when pool completes
    function _unlockAllFunds(uint256 poolId) internal {
        Pool storage pool = pools[poolId];
        
        for (uint256 i = 0; i < poolMembers[poolId].length; i++) {
            address member = poolMembers[poolId][i].wallet;
            uint256 lockedAmount = pool.lockedBalances[member];
            
            if (lockedAmount > 0) {
                pool.lockedBalances[member] = 0;
                poolMembers[poolId][i].lockedBalance = 0;
                
                // Transfer unlocked funds to member
                payable(member).transfer(lockedAmount);
                emit FundsUnlocked(poolId, member, lockedAmount);
            }
        }
    }

    // Creator can claim accumulated rewards
    function claimCreatorRewards(uint256 poolId) external validPoolId(poolId) {
        Pool storage pool = pools[poolId];
        require(msg.sender == pool.creator, "Only creator");
        require(pool.creatorRewards > 0, "No rewards available");

        uint256 rewards = pool.creatorRewards;
        pool.creatorRewards = 0;

        payable(pool.creator).transfer(rewards);
        emit CreatorRewardClaimed(poolId, pool.creator, rewards);
    }

    // Enhanced yield claiming with premium pool bonuses
    function claimYield(uint256 poolId) external validPoolId(poolId) onlyPoolMember(poolId) {
        Pool storage pool = pools[poolId];
        require(address(ultToken) != address(0), "ULT token not set");

        uint256 lastClaim = lastClaimTime[poolId][msg.sender];
        uint256 claimStart = lastClaim == 0 ? pool.createdAt : lastClaim;
        uint256 timeElapsed = block.timestamp - claimStart;
        require(timeElapsed >= 1 hours, "Claim too frequent");

        uint256 yieldEarned = (pool.contributionAmount * pool.fee * timeElapsed) / (365 days * 100);
        
        // Premium pool bonus
        if (pool.isPremium) {
            yieldEarned = yieldEarned * 120 / 100; // 20% bonus for premium pools
        }
        
        require(yieldEarned > 0, "No yield earned");

        lastClaimTime[poolId][msg.sender] = block.timestamp;
        ultToken.mint(msg.sender, yieldEarned);

        emit YieldClaimed(poolId, msg.sender, yieldEarned);
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
            totalPayouts: pool.totalPayouts,
            creatorRewards: pool.creatorRewards,
            creatorJoined: pool.creatorJoined,
            isPremium: pool.isPremium
        });
    }

    function getPoolMembers(uint256 poolId) external view validPoolId(poolId) returns (Member[] memory) {
        return poolMembers[poolId];
    }

    function getMemberJoinOrder(uint256 poolId) external view validPoolId(poolId) returns (address[] memory) {
        return pools[poolId].memberJoinOrder;
    }

    function getLockedBalance(uint256 poolId, address member) external view validPoolId(poolId) returns (uint256) {
        return pools[poolId].lockedBalances[member];
    }

    function canJoinPool(uint256 poolId, address user) external view validPoolId(poolId) returns (bool) {
        Pool storage pool = pools[poolId];
        return pool.isActive && 
               pool.currentCycle == 0 && 
               !pool.hasJoined[user] && 
               pool.totalMembers < pool.maxMembers && 
               !isBlacklisted[user];
    }

    function canContribute(uint256 poolId, address user) external view validPoolId(poolId) returns (bool) {
        Pool storage pool = pools[poolId];
        return pool.isActive && 
               !pool.isCompleted &&
               pool.hasJoined[user] && 
               !pool.hasContributed[pool.currentCycle][user] &&
               !isBlacklisted[user];
    }

    function getEffectiveFeeForUser(address user) external view returns (uint256) {
        if (address(ultToken) == address(0)) return platformFee;
        
        uint256 discount = ultToken.getFeeDiscount(user);
        return platformFee * (100 - discount) / 100;
    }

    function getTotalStats() external view returns (
        uint256 totalPools,
        uint256 totalUltBurnedAmount,
        uint256 totalValueLocked,
        uint256 totalPayoutsAmount
    ) {
        totalPools = nextPoolId;
        totalUltBurnedAmount = totalUltBurned;
        
        // Calculate TVL and total payouts
        for (uint256 i = 0; i < nextPoolId; i++) {
            totalValueLocked += pools[i].totalContributions;
            totalPayoutsAmount += pools[i].totalPayouts;
        }
    }

    receive() external payable {}
}