// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Voting {
    address[] public admins;
    mapping(address => bool) public isVoterRegistered;
    mapping(uint256 => mapping(address => bool)) public hasVotedInSession;
    uint256 public currentSessionId;

    mapping(string => uint256) public votesPerParty;

    string[] public parties;
    uint256 public votingEndTime;
    bool public votingStarted;
    address public contractDeployer;

    event VoterRegistered(address indexed voter);
    event VotingSessionStarted(uint256 endTime, string[] parties);
    event VoteCast(address indexed voter, string party);
    event VotingSessionEnded(string winningParty, string[] parties, uint256[] voteCounts);

    modifier onlyAdmin() {
        bool isAdmin = false;
        for (uint i = 0; i < admins.length; i++) {
            if (admins[i] == msg.sender) {
                isAdmin = true;
                break;
            }
        }
        require(isAdmin, "Only admins can perform this action");
        _;
    }

    modifier onlyRegisteredVoter() {
        require(isVoterRegistered[msg.sender], "Only registered voters can perform this action");
        _;
    }

    constructor() {
        contractDeployer = msg.sender;
        admins.push(msg.sender); 
        currentSessionId = 0; 
    }

    function addAdmin(address _newAdmin) public onlyAdmin {
        for (uint i = 0; i < admins.length; i++) {
            require(admins[i] != _newAdmin, "Address is already an admin");
        }
        admins.push(_newAdmin);
    }

    function registerVoter(address _voter) public onlyAdmin {
        require(!isVoterRegistered[_voter], "Voter already registered");
        isVoterRegistered[_voter] = true;
        emit VoterRegistered(_voter);
    }

    function startVoting(string[] memory _parties, uint256 _durationInSeconds) public onlyAdmin {
        require(!votingStarted, "Voting session already active");
        require(_parties.length > 0, "At least one party is required");

        currentSessionId++; // Increment session ID for the new session
        parties = _parties;
        votingEndTime = block.timestamp + _durationInSeconds;
        votingStarted = true;

        for (uint i = 0; i < parties.length; i++) {
            votesPerParty[parties[i]] = 0;
        }
        // No need to iterate and reset hasVotedInSession here,
        // as we check against the currentSessionId in the vote function.

        emit VotingSessionStarted(votingEndTime, _parties);
    }

    function vote(string memory _party) public onlyRegisteredVoter {
        require(votingStarted, "Voting session not active");
        require(block.timestamp < votingEndTime, "Voting session has ended");
        require(!hasVotedInSession[currentSessionId][msg.sender], "You have already voted in this session");

        bool partyExists = false;
        for (uint i = 0; i < parties.length; i++) {
            if (keccak256(abi.encodePacked(parties[i])) == keccak256(abi.encodePacked(_party))) {
                partyExists = true;
                break;
            }
        }
        require(partyExists, "Invalid party");

        votesPerParty[_party]++;
        hasVotedInSession[currentSessionId][msg.sender] = true;
        emit VoteCast(msg.sender, _party);
    }

    function stopVoting() public onlyAdmin {
        require(votingStarted, "No voting session is active");
        require(block.timestamp >= votingEndTime, "Voting session has not ended yet");

        string memory winningParty = "";
        uint256 maxVotes = 0;

        uint256 numParties = parties.length;
        string[] memory currentParties = new string[](numParties);
        uint256[] memory currentVoteCounts = new uint256[](numParties);

        for (uint i = 0; i < numParties; i++) {
            string memory party = parties[i];
            uint256 votes = votesPerParty[party];

            currentParties[i] = party;
            currentVoteCounts[i] = votes;

            if (votes > maxVotes) {
                maxVotes = votes;
                winningParty = party;
            }
        }

        emit VotingSessionEnded(winningParty, currentParties, currentVoteCounts);

        votingStarted = false;
        delete parties;
        votingEndTime = 0;
    }

    function getParties() public view returns (string[] memory) {
        return parties;
    }

    function isAdmin(address _addr) public view returns (bool) {
        for (uint i = 0; i < admins.length; i++) {
            if (admins[i] == _addr) {
                return true;
            }
        }
        return false;
    }
}