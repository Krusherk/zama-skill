// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {FHE, externalEuint64, euint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {ERC7984} from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";

contract ConfidentialToken is ZamaEthereumConfig, ERC7984, Ownable2Step {
    constructor(address owner_) ERC7984("Skill Token", "SKILL", "ipfs://skill-token") Ownable(owner_) {}

    function confidentialMint(
        address to,
        externalEuint64 encryptedAmount,
        bytes calldata inputProof
    ) external onlyOwner returns (euint64 minted) {
        minted = _mint(to, FHE.fromExternal(encryptedAmount, inputProof));
        FHE.allowTransient(minted, msg.sender);
    }
}
