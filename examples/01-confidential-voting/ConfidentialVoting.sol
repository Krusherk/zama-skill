// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, ebool, euint64, externalEbool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

contract ConfidentialVoting is ZamaEthereumConfig {
    mapping(address voter => bool) public hasVoted;
    mapping(address voter => ebool) private _votes;

    euint64 private _yesVotes;
    euint64 private _noVotes;

    uint256 public immutable votingEndsAt;
    uint256 public immutable finalityDelaySeconds;
    uint256 public disclosureScheduledAt;
    bool public publicResultRequested;
    bool public publicResultFinalized;

    uint64 public finalYesVotes;
    uint64 public finalNoVotes;

    event VoteCast(address indexed voter);
    event ResultPublicationScheduled(uint256 scheduledAt);
    event ResultPublicDecryptionRequested(bytes32 yesHandle, bytes32 noHandle);
    event ResultFinalized(uint64 yesVotes, uint64 noVotes);

    constructor(uint256 votingDurationSeconds, uint256 finalityDelaySeconds_) {
        require(votingDurationSeconds > 0, "voting duration is zero");
        require(finalityDelaySeconds_ > 0, "finality delay is zero");

        votingEndsAt = block.timestamp + votingDurationSeconds;
        finalityDelaySeconds = finalityDelaySeconds_;
    }

    function confidentialVote(externalEbool encryptedSupport, bytes calldata inputProof) external {
        require(block.timestamp < votingEndsAt, "voting closed");
        require(!hasVoted[msg.sender], "already voted");

        ebool support = FHE.fromExternal(encryptedSupport, inputProof);

        hasVoted[msg.sender] = true;
        _votes[msg.sender] = support;
        FHE.allowThis(support);
        FHE.allow(support, msg.sender);

        euint64 one = FHE.asEuint64(1);

        euint64 nextYesVotes = FHE.select(support, FHE.add(_yesVotes, one), _yesVotes);
        euint64 nextNoVotes = FHE.select(support, _noVotes, FHE.add(_noVotes, one));

        _yesVotes = nextYesVotes;
        _noVotes = nextNoVotes;

        FHE.allowThis(nextYesVotes);
        FHE.allowThis(nextNoVotes);

        emit VoteCast(msg.sender);
    }

    function encryptedVoteOf(address voter) external view returns (ebool) {
        return _votes[voter];
    }

    function encryptedTotals() external view returns (euint64 yesVotes, euint64 noVotes) {
        return (_yesVotes, _noVotes);
    }

    function scheduleResultPublication() external {
        require(block.timestamp >= votingEndsAt, "voting still active");
        require(disclosureScheduledAt == 0, "already scheduled");

        disclosureScheduledAt = block.timestamp;
        emit ResultPublicationScheduled(disclosureScheduledAt);
    }

    function requestPublicResult() external {
        require(disclosureScheduledAt != 0, "not scheduled");
        require(block.timestamp >= disclosureScheduledAt + finalityDelaySeconds, "finality delay");
        require(!publicResultRequested, "already requested");

        publicResultRequested = true;

        FHE.makePubliclyDecryptable(_yesVotes);
        FHE.makePubliclyDecryptable(_noVotes);

        emit ResultPublicDecryptionRequested(FHE.toBytes32(_yesVotes), FHE.toBytes32(_noVotes));
    }

    function finalizePublicResult(bytes calldata abiEncodedClearTotals, bytes calldata decryptionProof) external {
        require(publicResultRequested, "result not requested");
        require(!publicResultFinalized, "already finalized");

        bytes32[] memory handles = new bytes32[](2);
        handles[0] = FHE.toBytes32(_yesVotes);
        handles[1] = FHE.toBytes32(_noVotes);

        FHE.checkSignatures(handles, abiEncodedClearTotals, decryptionProof);

        (uint64 yesVotesClear, uint64 noVotesClear) = abi.decode(abiEncodedClearTotals, (uint64, uint64));

        publicResultFinalized = true;
        finalYesVotes = yesVotesClear;
        finalNoVotes = noVotesClear;

        emit ResultFinalized(yesVotesClear, noVotesClear);
    }
}
