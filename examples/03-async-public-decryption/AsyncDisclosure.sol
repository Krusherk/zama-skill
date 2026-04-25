// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract AsyncDisclosure is ZamaEthereumConfig, Ownable {
    euint64 private _sealedValue;

    uint256 public immutable finalityDelaySeconds;
    uint256 public immutable rewardWei;
    uint256 public disclosureScheduledAt;
    uint256 private _nextRequestId;

    mapping(uint256 requestId => bytes32 handle) private _pendingHandle;
    mapping(uint256 requestId => address requester) private _pendingRequester;

    uint64 public lastDisclosedValue;
    address public lastRequester;

    event SealedValueUpdated(bytes32 encryptedValueHandle);
    event DisclosureScheduled(uint256 scheduledAt);
    event DisclosureRequested(uint256 indexed requestId, bytes32 indexed handle, address indexed requester);
    event DisclosureFinalized(uint256 indexed requestId, uint64 clearValue, address indexed requester);

    constructor(uint256 finalityDelaySeconds_, uint256 rewardWei_) payable Ownable(msg.sender) {
        require(finalityDelaySeconds_ > 0, "delay is zero");

        finalityDelaySeconds = finalityDelaySeconds_;
        rewardWei = rewardWei_;
    }

    function setSealedValue(externalEuint64 encryptedValue, bytes calldata inputProof) external onlyOwner {
        euint64 sealedValue = FHE.fromExternal(encryptedValue, inputProof);
        _sealedValue = sealedValue;

        FHE.allowThis(sealedValue);
        FHE.allow(sealedValue, owner());

        emit SealedValueUpdated(FHE.toBytes32(sealedValue));
    }

    function confidentialValue() external view returns (euint64) {
        return _sealedValue;
    }

    function scheduleDisclosure() external onlyOwner {
        require(disclosureScheduledAt == 0, "already scheduled");
        disclosureScheduledAt = block.timestamp;
        emit DisclosureScheduled(disclosureScheduledAt);
    }

    function requestPublicDisclosure() external returns (uint256 requestId) {
        require(disclosureScheduledAt != 0, "not scheduled");
        require(block.timestamp >= disclosureScheduledAt + finalityDelaySeconds, "finality delay");

        FHE.makePubliclyDecryptable(_sealedValue);

        requestId = ++_nextRequestId;
        _pendingHandle[requestId] = FHE.toBytes32(_sealedValue);
        _pendingRequester[requestId] = msg.sender;

        emit DisclosureRequested(requestId, _pendingHandle[requestId], msg.sender);
    }

    function pendingDisclosure(uint256 requestId) external view returns (bytes32 handle, address requester) {
        return (_pendingHandle[requestId], _pendingRequester[requestId]);
    }

    function finalizePublicDisclosure(
        uint256 requestId,
        bytes calldata abiEncodedClearValue,
        bytes calldata decryptionProof
    ) external {
        bytes32 handle = _pendingHandle[requestId];
        address requester = _pendingRequester[requestId];

        require(requester != address(0), "invalid request");

        delete _pendingHandle[requestId];
        delete _pendingRequester[requestId];

        bytes32[] memory handles = new bytes32[](1);
        handles[0] = handle;

        FHE.checkSignatures(handles, abiEncodedClearValue, decryptionProof);

        uint64 clearValue = abi.decode(abiEncodedClearValue, (uint64));

        lastDisclosedValue = clearValue;
        lastRequester = requester;

        if (rewardWei > 0) {
            (bool ok,) = requester.call{value: rewardWei}("");
            require(ok, "reward transfer failed");
        }

        emit DisclosureFinalized(requestId, clearValue, requester);
    }

    receive() external payable {}
}
