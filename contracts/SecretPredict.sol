// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, ebool, externalEbool} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title SecretPredict
 * @notice Simplified encrypted prediction platform using Zama FHEVM on Sepolia.
 * - Users can create predictions (name, description, end time)
 * - Users place bets on yes/no. Each bet unit costs 0.0001 ETH
 * - Choice (yes/no) is provided as encrypted boolean via relayer-sdk
 * - Totals for yes/no are maintained as encrypted counters
 * - After end time, anyone can request decryption; plain totals are stored on-chain
 */
contract SecretPredict is SepoliaConfig {
    uint256 public constant PRICE_PER_UNIT_WEI = 1e14; // 0.0001 ETH

    struct Prediction {
        // Metadata
        address creator;
        string name;
        string content;
        uint64 endTime;

        // Encrypted totals
        euint32 yesTotalEnc;
        euint32 noTotalEnc;

        // Public results available after settlement
        uint32 yesTotal;
        uint32 noTotal;
        bool settled;

        // Decryption orchestration
        bool decryptionPending;
        uint256 decryptionRequestId;
    }

    // Predictions store
    uint256 public nextPredictionId;
    mapping(uint256 => Prediction) private predictions;

    // Map requestId to predictionId for async decryption callbacks
    mapping(uint256 => uint256) private requestToPrediction;

    event PredictionCreated(uint256 indexed id, address indexed creator, string name, uint64 endTime);
    event BetPlaced(uint256 indexed id, address indexed bettor, uint32 units);
    event DecryptionRequested(uint256 indexed id, uint256 requestId);
    event PredictionSettled(uint256 indexed id, uint32 yesTotal, uint32 noTotal);

    function createPrediction(string calldata name, string calldata content, uint64 endTime) external returns (uint256 id) {
        require(bytes(name).length > 0, "name required");
        require(bytes(content).length > 0, "content required");
        require(endTime > block.timestamp, "end in future");

        id = nextPredictionId++;
        Prediction storage p = predictions[id];
        p.creator = msg.sender;
        p.name = name;
        p.content = content;
        p.endTime = endTime;

        // Initialize encrypted totals to zero and grant access
        p.yesTotalEnc = FHE.asEuint32(0);
        p.noTotalEnc = FHE.asEuint32(0);
        FHE.allowThis(p.yesTotalEnc);
        FHE.allowThis(p.noTotalEnc);

        emit PredictionCreated(id, msg.sender, name, endTime);
    }

    /**
     * @notice Place a bet on a prediction.
     * @param id Prediction id
     * @param encYes Encrypted boolean for YES (true) / NO (false)
     * @param inputProof Proof provided by relayer-sdk
     * @param units Number of bet units (each costs 0.0001 ETH)
     */
    function placeBet(uint256 id, externalEbool encYes, bytes calldata inputProof, uint32 units) external payable {
        Prediction storage p = predictions[id];
        require(p.endTime != 0, "not found");
        require(block.timestamp < p.endTime, "ended");
        require(units > 0, "units>0");

        uint256 cost = uint256(units) * PRICE_PER_UNIT_WEI;
        require(msg.value == cost, "invalid value");

        // Convert encrypted boolean and plaintext units
        ebool choice = FHE.fromExternal(encYes, inputProof);
        euint32 unitsEnc = FHE.asEuint32(units);

        // Conditionally increment encrypted totals using FHE.select
        euint32 incYes = FHE.select(choice, unitsEnc, FHE.asEuint32(0));
        euint32 incNo = FHE.select(choice, FHE.asEuint32(0), unitsEnc);

        p.yesTotalEnc = FHE.add(p.yesTotalEnc, incYes);
        p.noTotalEnc = FHE.add(p.noTotalEnc, incNo);

        // Maintain access control for updated ciphertexts
        FHE.allowThis(p.yesTotalEnc);
        FHE.allowThis(p.noTotalEnc);

        emit BetPlaced(id, msg.sender, units);
    }

    /**
     * @notice Request decryption of encrypted totals after end time.
     *         Stores the plaintext results on-chain in the callback.
     */
    function settle(uint256 id) external {
        Prediction storage p = predictions[id];
        require(p.endTime != 0, "not found");
        require(block.timestamp >= p.endTime, "not ended");
        require(!p.settled, "settled");
        require(!p.decryptionPending, "pending");

        bytes32[] memory cts = new bytes32[](2);
        cts[0] = FHE.toBytes32(p.yesTotalEnc);
        cts[1] = FHE.toBytes32(p.noTotalEnc);

        uint256 requestId = FHE.requestDecryption(cts, this.decryptionCallback.selector);
        p.decryptionPending = true;
        p.decryptionRequestId = requestId;
        requestToPrediction[requestId] = id;
        emit DecryptionRequested(id, requestId);
    }

    /**
     * @notice Callback invoked by the decryption oracle with cleartexts.
     *         Verifies signatures and records public results.
     */
    function decryptionCallback(
        uint256 requestId,
        bytes memory cleartexts,
        bytes memory decryptionProof
    ) public returns (bool) {
        uint256 id = requestToPrediction[requestId];
        Prediction storage p = predictions[id];
        require(p.decryptionPending && p.decryptionRequestId == requestId, "invalid req");

        FHE.checkSignatures(requestId, cleartexts, decryptionProof);

        (uint32 yesClear, uint32 noClear) = abi.decode(cleartexts, (uint32, uint32));
        p.yesTotal = yesClear;
        p.noTotal = noClear;
        p.decryptionPending = false;
        p.settled = true;

        emit PredictionSettled(id, yesClear, noClear);
        return true;
    }

    // ========= Views =========

    /**
     * @notice Allow caller to access encrypted totals for user decryption
     * @param id Prediction id
     */
    function allowAccessToEncryptedTotals(uint256 id) external {
        Prediction storage p = predictions[id];
        require(p.endTime != 0, "not found");
        FHE.allow(p.yesTotalEnc, msg.sender);
        FHE.allow(p.noTotalEnc, msg.sender);
    }

    function getPrediction(uint256 id)
        external
        view
        returns (
            address creator,
            string memory name,
            string memory content,
            uint64 endTime,
            euint32 yesTotalEnc,
            euint32 noTotalEnc,
            uint32 yesTotal,
            uint32 noTotal,
            bool settled,
            bool decryptionPending
        )
    {
        Prediction storage p = predictions[id];
        require(p.endTime != 0, "not found");
        return (
            p.creator,
            p.name,
            p.content,
            p.endTime,
            p.yesTotalEnc,
            p.noTotalEnc,
            p.yesTotal,
            p.noTotal,
            p.settled,
            p.decryptionPending
        );
    }

    function totalPredictions() external view returns (uint256) {
        return nextPredictionId;
    }
}

