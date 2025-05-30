// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract ULTToken is ERC20, Ownable, ReentrancyGuard {
    // Supply and burning
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1B tokens
    uint256 public totalBurned;
    
    // Staking
    struct StakeInfo {
        uint256 amount;
        uint256 startTime;
        uint256 lastClaimTime;
        uint256 rewardRate; // APY in basis points
    }
    
    mapping(address => StakeInfo) public stakes;
    uint256 public totalStaked;
    uint256 public stakingRewardRate = 1000; // 10% APY
    
    // Fee discounts
    mapping(address => uint256) public feeDiscountTier; // 0-100 (percentage discount)
    
    // Governance
    mapping(address => uint256) public votingPower;
    uint256 public totalVotingPower;
    
    // Events
    event TokensBurned(uint256 amount, address burner);
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event StakingRewardsClaimed(address indexed user, uint256 amount);
    event FeeDiscountUpdated(address indexed user, uint256 tier);
    event VotingPowerUpdated(address indexed user, uint256 power);

    constructor() ERC20("Unity Ledger Token", "ULT") Ownable(msg.sender) {}
    
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Max supply exceeded");
        _mint(to, amount);
    }
    
    // Burn tokens to create scarcity
    function burn(uint256 amount) external {
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        _burn(msg.sender, amount);
        totalBurned += amount;
        emit TokensBurned(amount, msg.sender);
    }
    
    // Burn tokens from fees (only owner/platform)
    function burnFromFees(uint256 amount) external onlyOwner {
        require(totalSupply() >= amount, "Invalid burn amount");
        _burn(address(this), amount);
        totalBurned += amount;
        emit TokensBurned(amount, address(this));
    }
    
    // Internal function to claim rewards (no reentrancy guard)
    function _claimStakingRewards(address user) internal returns (uint256) {
        StakeInfo storage stakeInfo = stakes[user];
        if (stakeInfo.amount == 0) return 0;
        
        uint256 timeStaked = block.timestamp - stakeInfo.lastClaimTime;
        uint256 rewards = (stakeInfo.amount * stakeInfo.rewardRate * timeStaked) / (365 days * 10000);
        
        if (rewards > 0 && totalSupply() + rewards <= MAX_SUPPLY) {
            _mint(user, rewards);
            stakeInfo.lastClaimTime = block.timestamp;
            emit StakingRewardsClaimed(user, rewards);
            return rewards;
        }
        return 0;
    }
    
    // Staking functions
    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        // Claim existing rewards first using internal function
        if (stakes[msg.sender].amount > 0) {
            _claimStakingRewards(msg.sender);
        }
        
        _transfer(msg.sender, address(this), amount);
        
        stakes[msg.sender].amount += amount;
        stakes[msg.sender].startTime = block.timestamp;
        stakes[msg.sender].lastClaimTime = block.timestamp;
        stakes[msg.sender].rewardRate = stakingRewardRate;
        
        totalStaked += amount;
        
        // Update voting power (1:1 with staked amount)
        _updateVotingPower(msg.sender);
        
        // Update fee discount tier based on stake amount
        _updateFeeDiscount(msg.sender);
        
        emit Staked(msg.sender, amount);
    }
    
    function unstake(uint256 amount) external nonReentrant {
        require(stakes[msg.sender].amount >= amount, "Insufficient staked");
        
        // Claim rewards before unstaking using internal function
        _claimStakingRewards(msg.sender);
        
        stakes[msg.sender].amount -= amount;
        totalStaked -= amount;
        
        _transfer(address(this), msg.sender, amount);
        
        // Update voting power and fee discount
        _updateVotingPower(msg.sender);
        _updateFeeDiscount(msg.sender);
        
        emit Unstaked(msg.sender, amount);
    }
    
    function claimStakingRewards() public nonReentrant {
        uint256 rewards = _claimStakingRewards(msg.sender);
        require(rewards > 0, "No rewards to claim");
    }
    
    // Internal functions
    function _updateVotingPower(address user) internal {
        uint256 oldPower = votingPower[user];
        uint256 newPower = stakes[user].amount; // 1:1 voting power
        
        votingPower[user] = newPower;
        totalVotingPower = totalVotingPower - oldPower + newPower;
        
        emit VotingPowerUpdated(user, newPower);
    }
    
    function _updateFeeDiscount(address user) internal {
        uint256 stakedAmount = stakes[user].amount;
        uint256 newTier;
        
        if (stakedAmount >= 100000 * 10**18) {        // 100k+ tokens = 50% discount
            newTier = 50;
        } else if (stakedAmount >= 50000 * 10**18) {  // 50k+ tokens = 30% discount
            newTier = 30;
        } else if (stakedAmount >= 10000 * 10**18) {  // 10k+ tokens = 20% discount
            newTier = 20;
        } else if (stakedAmount >= 1000 * 10**18) {   // 1k+ tokens = 10% discount
            newTier = 10;
        } else {
            newTier = 0;
        }
        
        feeDiscountTier[user] = newTier;
        emit FeeDiscountUpdated(user, newTier);
    }
    
    // View functions
    function getStakeInfo(address user) external view returns (StakeInfo memory) {
        return stakes[user];
    }
    
    function getPendingRewards(address user) external view returns (uint256) {
        StakeInfo storage stakeInfo = stakes[user];
        if (stakeInfo.amount == 0) return 0;
        
        uint256 timeStaked = block.timestamp - stakeInfo.lastClaimTime;
        return (stakeInfo.amount * stakeInfo.rewardRate * timeStaked) / (365 days * 10000);
    }
    
    function getFeeDiscount(address user) external view returns (uint256) {
        return feeDiscountTier[user];
    }
    
    // Owner functions
    function setStakingRewardRate(uint256 _rate) external onlyOwner {
        require(_rate <= 5000, "Rate too high"); // Max 50% APY
        stakingRewardRate = _rate;
    }
    
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    receive() external payable {}
}