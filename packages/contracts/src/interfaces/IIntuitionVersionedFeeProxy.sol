// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @title IIntuitionVersionedFeeProxy
/// @notice ERC-7936 compliant interface for the Intuition versioned fee-proxy.
/// @dev The proxy stores a registry of implementations indexed by `bytes32` version
///      identifiers. A caller may either:
///       - omit the version (normal call → fallback → default version), or
///       - pin explicitly to a version via `executeAtVersion`.
interface IIntuitionVersionedFeeProxy {
    // ============ Events (ERC-7936) ============

    event VersionRegistered(bytes32 indexed version, address indexed implementation);
    event VersionRemoved(bytes32 indexed version);
    event DefaultVersionChanged(bytes32 indexed oldVersion, bytes32 indexed newVersion);

    /// @notice Emitted when an address gains the proxyAdmin role.
    event ProxyAdminGranted(address indexed admin);
    /// @notice Emitted when an address loses the proxyAdmin role.
    event ProxyAdminRevoked(address indexed admin);

    /// @notice Emitted when the proxy's human-readable name is set or changed.
    event NameChanged(bytes32 indexed oldName, bytes32 indexed newName);

    // ============ Admin (proxy-admin gated) ============

    function registerVersion(bytes32 version, address implementation) external;
    function removeVersion(bytes32 version) external;
    function setDefaultVersion(bytes32 version) external;

    /// @notice Grant or revoke the proxyAdmin role for an address.
    ///         `status = true` adds; `status = false` removes. Idempotent
    ///         calls (status already matches) revert with
    ///         `ProxyAdminAlreadySet`. The last remaining admin cannot
    ///         self-revoke (revert `LastProxyAdmin`).
    /// @dev    Any current proxyAdmin can call this. For production, the
    ///         recommended setup is to keep at least one Gnosis Safe
    ///         multisig in the whitelist — the Safe's internal quorum
    ///         provides the safety net the previous 2-step transfer flow
    ///         used to enforce.
    function setProxyAdmin(address admin, bool status) external;

    /// @notice Set or rename the proxy's human-readable label. Pass bytes32(0) to clear.
    /// @dev    ⚠️ **The name is NOT a trust anchor.** Any proxy-admin can
    ///         rename the proxy at any time — including to mimic a known
    ///         brand. Frontends MUST NOT use `name` to derive an "official"
    ///         / "verified" badge. Use the Factory's `isProxyFromFactory`
    ///         mapping or the proxy address itself (allowlist) as the
    ///         authoritative identity.
    function setName(bytes32 newName) external;

    // ============ Views ============

    function getImplementation(bytes32 version) external view returns (address);
    function getDefaultVersion() external view returns (bytes32);
    function getVersions() external view returns (bytes32[] memory);

    /// @notice Returns true if `candidate` is currently a proxyAdmin.
    function isProxyAdmin(address candidate) external view returns (bool);

    /// @notice Returns the number of addresses currently holding the proxyAdmin role.
    function proxyAdminCount() external view returns (uint256);

    /// @notice Returns the proxy's current human-readable label.
    /// @dev    ⚠️ See the warning on `setName` — a name is admin-controlled
    ///         metadata, never a source of trust.
    function getName() external view returns (bytes32);

    // ============ ERC-7936 execute-at-version ============

    /// @notice Call a specific version with arbitrary calldata.
    /// @dev Delegatecalls `implementations[version]` with `data`. Reverts if the
    ///      version is not registered or if the delegatecall reverts.
    function executeAtVersion(bytes32 version, bytes calldata data)
        external
        payable
        returns (bytes memory);
}
