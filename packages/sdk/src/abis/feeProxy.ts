/**
 * ABI for the multi-tenant `FeeProxy` singleton (Intuition periphery).
 *
 * Authored from the canonical interface
 * `0xIntuition/intuition-contracts-v2@feat/v1.1.0-core-upgrade/src/interfaces/IFeeProxy.sol`,
 * extended with the AccessControl + Pausable surface the deployed contract
 * inherits (roles, `paused()`, role events) which the admin tooling needs.
 *
 * Built with viem's `parseAbi` so the human-readable signatures stay in lockstep
 * with the Solidity interface — far less error-prone than a hand-written JSON
 * blob. When Intuition publishes the compiled artifact, swap the body of this
 * module for `import abi from './FeeProxy.json'; export const FeeProxyABI = abi`
 * — the export name stays stable for every consumer.
 */
import { parseAbi } from 'viem'

export const FeeProxyABI = parseAbi([
  // ---- structs ----
  'struct FeeConfig { uint256 depositBps; uint256 creationBps; uint256 depositFixedFee; uint256 creationFixedFee; }',
  'struct AffiliateConfig { FeeConfig fees; address feeRecipient; uint64 registeredAt; bool paused; }',
  'struct FeeGuard { uint256 maxFeeBps; uint256 maxFixedFee; }',
  'struct AffiliateStats { uint256 txCount; uint256 uniqueUsers; uint256 totalGrossAssets; uint256 totalFees; uint256 totalForwardedAssets; uint256 depositCount; uint256 depositGrossAssets; uint256 depositFees; uint256 depositForwardedAssets; uint256 creationCount; uint256 creationGrossAssets; uint256 creationFees; uint256 creationForwardedAssets; }',
  'struct AffiliateUserStats { uint256 txCount; uint256 totalGrossAssets; uint256 totalFees; uint256 totalForwardedAssets; uint256 depositCount; uint256 depositGrossAssets; uint256 depositFees; uint256 depositForwardedAssets; uint256 creationCount; uint256 creationGrossAssets; uint256 creationFees; uint256 creationForwardedAssets; }',

  // ---- registry writes ----
  'function registerAffiliate(FeeConfig fees, address feeRecipient) payable returns (address affiliate)',
  'function pauseAffiliate(address affiliate)',
  'function unpauseAffiliate(address affiliate)',
  'function updateAffiliateFees(FeeConfig fees)',
  'function updateFeeRecipient(address recipient)',
  'function pause()',
  'function unpause()',

  // ---- routing writes ----
  'function depositVia(address affiliate, address receiver, bytes32 termId, uint256 curveId, uint256 grossAssets, uint256 minShares, FeeGuard feeGuard) payable returns (uint256 shares)',
  'function depositBatchVia(address affiliate, address receiver, bytes32[] termIds, uint256[] curveIds, uint256[] assets, uint256[] minShares, FeeGuard feeGuard) payable returns (uint256[] shares)',
  'function createAtomsVia(address affiliate, bytes[] atomDatas, uint256[] assets, FeeGuard feeGuard) payable returns (bytes32[] termIds)',
  'function createTriplesVia(address affiliate, bytes32[] subjectIds, bytes32[] predicateIds, bytes32[] objectIds, uint256[] assets, FeeGuard feeGuard) payable returns (bytes32[] termIds)',
  'function claimRefund() returns (uint256 amount)',
  'function claimRefundTo(address recipient) returns (uint256 amount)',

  // ---- admin config setters ----
  'function setMaxBps(uint256 newMaxBps)',
  'function setMaxFixedFee(uint256 newMaxFixedFee)',
  'function setRegistrationFee(uint256 newRegistrationFee)',

  // ---- views ----
  'function affiliateConfig(address affiliate) view returns (AffiliateConfig config)',
  'function isAffiliateRegistered(address affiliate) view returns (bool)',
  'function isAffiliateActive(address affiliate) view returns (bool)',
  'function previewDepositFee(address affiliate, uint256 grossAssets) view returns (uint256 fee, uint256 forwarded)',
  'function previewCreationFee(address affiliate, uint256 grossAssets) view returns (uint256 fee, uint256 forwarded)',
  'function affiliateStats(address affiliate) view returns (AffiliateStats stats)',
  'function affiliateUserStats(address affiliate, address user) view returns (AffiliateUserStats stats)',
  'function pendingRefund(address user) view returns (uint256 amount)',

  // ---- config getters ----
  'function maxBps() view returns (uint256)',
  'function maxFixedFee() view returns (uint256)',
  'function registrationFee() view returns (uint256)',
  'function multiVault() view returns (address)',
  'function treasury() view returns (address)',
  'function BPS_DIVISOR() view returns (uint256)',

  // ---- AccessControl (inherited) ----
  'function hasRole(bytes32 role, address account) view returns (bool)',
  'function getRoleAdmin(bytes32 role) view returns (bytes32)',
  'function grantRole(bytes32 role, address account)',
  'function revokeRole(bytes32 role, address account)',
  'function renounceRole(bytes32 role, address callerConfirmation)',
  'function DEFAULT_ADMIN_ROLE() view returns (bytes32)',
  'function PAUSER_ROLE() view returns (bytes32)',
  'function supportsInterface(bytes4 interfaceId) view returns (bool)',

  // ---- Pausable (inherited) ----
  'function paused() view returns (bool)',

  // ---- events ----
  'event AffiliateRegistered(address indexed affiliate, address indexed feeRecipient, FeeConfig fees, uint256 registrationFee)',
  'event AffiliatePaused(address indexed affiliate)',
  'event AffiliateUnpaused(address indexed affiliate)',
  'event AffiliateFeesUpdated(address indexed affiliate, FeeConfig previous, FeeConfig current)',
  'event AffiliateFeeRecipientUpdated(address indexed affiliate, address indexed previous, address indexed current)',
  'event RegistrationFeeForwarded(address indexed treasury, uint256 amount)',
  'event MaxBpsUpdated(uint256 previous, uint256 current)',
  'event MaxFixedFeeUpdated(uint256 previous, uint256 current)',
  'event RegistrationFeeUpdated(uint256 previous, uint256 current)',
  'event DepositedVia(address indexed user, address indexed affiliate, bytes32 indexed termId, uint256 grossAssets, uint256 fee, uint256 forwardedAssets, uint256 shares)',
  'event DepositedBatchVia(address indexed user, address indexed affiliate, uint256 totalGrossAssets, uint256 totalFee, uint256 totalForwardedAssets)',
  'event CreatedAtomsVia(address indexed user, address indexed affiliate, uint256 totalGrossAssets, uint256 totalFee, uint256 totalForwardedAssets, uint256 atomCount)',
  'event CreatedTriplesVia(address indexed user, address indexed affiliate, uint256 totalGrossAssets, uint256 totalFee, uint256 totalForwardedAssets, uint256 tripleCount)',
  'event AffiliateFeeAccrued(address indexed affiliate, address indexed user, uint256 amount)',
  'event RefundCredited(address indexed user, uint256 amount)',
  'event RefundClaimed(address indexed user, uint256 amount)',
  'event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole)',
  'event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)',
  'event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)',
  'event Paused(address account)',
  'event Unpaused(address account)',

  // ---- errors ----
  'error FeeProxy_RegistrationFeeMismatch(uint256 sent, uint256 required)',
  'error FeeProxy_AffiliateAlreadyRegistered(address affiliate)',
  'error FeeProxy_AffiliateNotRegistered(address affiliate)',
  'error FeeProxy_AffiliatePaused(address affiliate)',
  'error FeeProxy_AffiliateAlreadyPaused(address affiliate)',
  'error FeeProxy_AffiliateNotPaused(address affiliate)',
  'error FeeProxy_BpsExceedsCap(uint256 bps, uint256 cap)',
  'error FeeProxy_FixedFeeExceedsCap(uint256 fixedFee, uint256 cap)',
  'error FeeProxy_BpsExceedsCallerGuard(uint256 configured, uint256 callerMax)',
  'error FeeProxy_FixedFeeExceedsCallerGuard(uint256 configured, uint256 callerMax)',
  'error FeeProxy_ZeroAddress()',
  'error FeeProxy_ReceiverNotApproved(address receiver, address caller)',
  'error FeeProxy_ProxyNotApprovedForDeposit(address receiver, address proxy)',
  'error FeeProxy_ProxyNotApprovedForCreation(address creator, address proxy)',
  'error FeeProxy_ZeroValue()',
  'error FeeProxy_LengthMismatch()',
  'error FeeProxy_InsufficientValue(uint256 supplied, uint256 required)',
  'error FeeProxy_FeeExceedsGross(uint256 fee, uint256 gross)',
  'error FeeProxy_MaxBpsOutOfRange(uint256 requested)',
  'error FeeProxy_RefundRecipientIsProxy()',
  'error FeeProxy_NoRefundOwed()',
  'error FeeProxy_UnauthorizedEthSender(address sender)',
])
