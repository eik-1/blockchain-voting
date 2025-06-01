"use client";

import React, { useState, useEffect } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useWatchContractEvent,
} from "wagmi"; // react hooks for interacting with blockchain apps
import { contractAbi, contractAddress } from "@/lib/contracts";
import { isAddress, Log } from "viem";

import Navbar from "@/components/navbar";

///////////////////
// Types         //
///////////////////

type Address = `0x${string}`;

interface VoterRegisteredArgs {
  voter?: Address;
}
interface VotingSessionStartedArgs {
  endTime?: bigint;
  parties?: string[];
}
interface VoteCastArgs {
  voter?: Address;
  party?: string;
}
interface VotingSessionEndedArgs {
  winningParty?: string;
  parties?: string[];
  voteCounts?: bigint[];
}
type TypedLog<TArgs, TEventName extends string> = Omit<
  Log,
  "args" | "eventName"
> & {
  args: TArgs;
  eventName: TEventName;
};

export default function DashboardPage() {
  const { address, isConnected, chain } = useAccount();
  const [userRole, setUserRole] = useState<
    "admin" | "voter" | "unauthorized" | "loading"
  >("loading");

  // State for Admin actions
  const [voterToRegister, setVoterToRegister] = useState<string>("");
  const [adminToAdd, setAdminToAdd] = useState<string>("");
  const [partiesInput, setPartiesInput] = useState<string>("");
  const [durationInput, setDurationInput] = useState<string>("");

  // State for Voter actions
  const [selectedParty, setSelectedParty] = useState<string>("");

  // Read current session ID to pass to hasVotedInSession
  const {
    data: currentSessionId,
    isLoading: currentSessionIdLoading,
    refetch: refetchCurrentSessionId,
  } = useReadContract({
    abi: contractAbi,
    address: contractAddress,
    functionName: "currentSessionId",
    query: { enabled: isConnected },
  });

  // Contract interaction hooks
  const { data: isAdmin, isLoading: isAdminLoading } = useReadContract({
    abi: contractAbi,
    address: contractAddress,
    functionName: "isAdmin",
    args: [address!],
    query: {
      enabled: isConnected && !!address,
    },
  });

  const {
    data: isVoterRegistered,
    isLoading: isVoterRegisteredLoading,
    refetch: refetchIsVoterRegistered,
  } = useReadContract({
    abi: contractAbi,
    address: contractAddress,
    functionName: "isVoterRegistered",
    args: [address!],
    query: {
      enabled: isConnected && !!address && !isAdmin,
    },
  });

  const {
    data: votingStatus,
    isLoading: votingStatusLoading,
    refetch: refetchVotingStatus,
  } = useReadContract({
    abi: contractAbi,
    address: contractAddress,
    functionName: "votingStarted",
    query: { enabled: isConnected },
  });

  const {
    data: currentPartiesData,
    isLoading: currentPartiesLoading,
    refetch: refetchCurrentParties,
  } = useReadContract({
    abi: contractAbi,
    address: contractAddress,
    functionName: "getParties",
    query: { enabled: isConnected && votingStatus === true },
  });
  const currentParties = currentPartiesData as string[] | undefined;

  const {
    data: votingEndTimeData,
    isLoading: votingEndTimeLoading,
    refetch: refetchVotingEndTime,
  } = useReadContract({
    abi: contractAbi,
    address: contractAddress,
    functionName: "votingEndTime",
    query: { enabled: isConnected && votingStatus === true },
  });
  const votingEndTime = votingEndTimeData as bigint | undefined;

  const {
    data: hasVoted,
    isLoading: isLoadingHasVoted,
    refetch: refetchHasVoted,
  } = useReadContract({
    abi: contractAbi,
    address: contractAddress,
    functionName: "hasVotedInSession",
    args: [currentSessionId as bigint, address!],
    query: {
      enabled:
        isConnected &&
        !!address &&
        votingStatus === true &&
        userRole === "voter" &&
        typeof currentSessionId === "bigint",
    },
  });

  // Effect to determine user role
  useEffect(() => {
    if (!isConnected || !address) {
      setUserRole("loading");
      return;
    }
    if (isAdminLoading || isVoterRegisteredLoading || currentSessionIdLoading) {
      setUserRole("loading");
      return;
    }
    if (isAdmin) {
      setUserRole("admin");
    } else if (isVoterRegistered) {
      setUserRole("voter");
    } else {
      setUserRole("unauthorized");
    }
  }, [
    isConnected,
    address,
    isAdmin,
    isVoterRegistered,
    isAdminLoading,
    isVoterRegisteredLoading,
    currentSessionIdLoading,
  ]);

  // Helper function to manage transaction states consistently
  const useManageTransaction = () => {
    const [hash, setHash] = useState<Address | undefined>(undefined);
    const { isLoading, isSuccess, error } = useWaitForTransactionReceipt({
      hash,
      confirmations: 1,
      chainId: chain?.id,
    });
    return { hash, setHash, isLoading, isSuccess, error };
  };

  const registerVoterTx = useManageTransaction();
  const addAdminTx = useManageTransaction();
  const startVotingTx = useManageTransaction();
  const stopVotingTx = useManageTransaction();
  const voteTx = useManageTransaction();

  const { writeContract, isPending: isWritePending } = useWriteContract();

  useWatchContractEvent({
    address: contractAddress,
    abi: contractAbi,
    eventName: "VoterRegistered",
    onLogs(logs: Log[]) {
      const typedLogs = logs as TypedLog<
        VoterRegisteredArgs,
        "VoterRegistered"
      >[];
      console.log("Voter Registered:", typedLogs);
      if (typedLogs && typedLogs.length > 0 && typedLogs[0].args?.voter) {
        alert(`Voter Registered: ${typedLogs[0].args.voter}`);
      }
      refetchIsVoterRegistered();
      refetchCurrentSessionId();
    },
  });

  useWatchContractEvent({
    address: contractAddress,
    abi: contractAbi,
    eventName: "VotingSessionStarted",
    onLogs(logs: Log[]) {
      const typedLogs = logs as TypedLog<
        VotingSessionStartedArgs,
        "VotingSessionStarted"
      >[];
      console.log("Voting Session Started:", typedLogs);
      alert("New voting session has started!");
      refetchVotingStatus();
      refetchCurrentParties();
      refetchVotingEndTime();
      refetchHasVoted();
      refetchCurrentSessionId();
    },
  });

  useWatchContractEvent({
    address: contractAddress,
    abi: contractAbi,
    eventName: "VoteCast",
    onLogs(logs: Log[]) {
      const typedLogs = logs as TypedLog<VoteCastArgs, "VoteCast">[];
      console.log("Vote Cast:", typedLogs);
      if (
        typedLogs &&
        typedLogs.length > 0 &&
        typedLogs[0].args?.voter &&
        typedLogs[0].args?.party
      ) {
        alert(
          `Vote Cast by ${typedLogs[0].args.voter} for ${typedLogs[0].args.party}`
        );
      }
      refetchHasVoted();
    },
  });

  const [lastWinningParty, setLastWinningParty] = useState<string>("");
  const [lastResults, setLastResults] = useState<
    { party: string; votes: bigint }[]
  >([]);

  useWatchContractEvent({
    address: contractAddress,
    abi: contractAbi,
    eventName: "VotingSessionEnded",
    onLogs(logs: Log[]) {
      const typedLogs = logs as TypedLog<
        VotingSessionEndedArgs,
        "VotingSessionEnded"
      >[];
      console.log("Voting Session Ended:", typedLogs);
      const eventArgs = typedLogs[0]?.args;
      if (eventArgs) {
        const { winningParty, parties: endedParties, voteCounts } = eventArgs;
        if (winningParty) {
          alert(`Voting ended! Winner: ${winningParty}`);
          setLastWinningParty(winningParty);
        }
        if (endedParties && voteCounts) {
          const results = endedParties.map((party: string, index: number) => ({
            party,
            votes: voteCounts[index],
          }));
          setLastResults(results);
        }
      }
      refetchVotingStatus();
      refetchCurrentParties();
      refetchVotingEndTime();
      refetchCurrentSessionId();
    },
  });

  // ---- Admin Functions ----
  const handleRegisterVoter = () => {
    if (!isAddress(voterToRegister)) {
      alert("Invalid voter address.");
      return;
    }
    writeContract(
      {
        address: contractAddress,
        abi: contractAbi,
        functionName: "registerVoter",
        args: [voterToRegister as Address],
      },
      {
        onSuccess: registerVoterTx.setHash,
        onError: (e) =>
          alert("Register Voter Error: " + e.message.split("Details:")[0]),
      }
    );
  };

  const handleAddAdmin = () => {
    if (!isAddress(adminToAdd)) {
      alert("Invalid admin address.");
      return;
    }
    writeContract(
      {
        address: contractAddress,
        abi: contractAbi,
        functionName: "addAdmin",
        args: [adminToAdd as Address],
      },
      {
        onSuccess: addAdminTx.setHash,
        onError: (e) =>
          alert("Add Admin Error: " + e.message.split("Details:")[0]),
      }
    );
  };

  const handleStartVoting = () => {
    const partiesArray = partiesInput
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p);
    if (partiesArray.length === 0) {
      alert("Please enter at least one party.");
      return;
    }
    const durationSeconds = parseInt(durationInput) * 60;
    if (isNaN(durationSeconds) || durationSeconds <= 0) {
      alert("Invalid duration.");
      return;
    }
    writeContract(
      {
        address: contractAddress,
        abi: contractAbi,
        functionName: "startVoting",
        args: [partiesArray, BigInt(durationSeconds)],
      },
      {
        onSuccess: startVotingTx.setHash,
        onError: (e) =>
          alert("Start Voting Error: " + e.message.split("Details:")[0]),
      }
    );
  };

  const handleStopVoting = () => {
    writeContract(
      {
        address: contractAddress,
        abi: contractAbi,
        functionName: "stopVoting",
      },
      {
        onSuccess: stopVotingTx.setHash,
        onError: (e) =>
          alert("Stop Voting Error: " + e.message.split("Details:")[0]),
      }
    );
  };

  // ---- Voter Functions ----
  const handleVote = () => {
    if (!selectedParty) {
      alert("Please select a party to vote for.");
      return;
    }
    writeContract(
      {
        address: contractAddress,
        abi: contractAbi,
        functionName: "vote",
        args: [selectedParty],
      },
      {
        onSuccess: voteTx.setHash,
        onError: (e) => alert("Vote Error: " + e.message.split("Details:")[0]),
      }
    );
  };

  if (!isConnected) {
    return (
      <>
        <Navbar />
        <div className="flex items-center min-h-[80vh] justify-center">
          <h1 className="text-2xl font-bold">
            Please connect your wallet to continue
          </h1>
        </div>
      </>
    );
  }

  if (
    userRole === "loading" ||
    votingStatusLoading ||
    votingEndTimeLoading ||
    currentSessionIdLoading ||
    (userRole === "voter" && votingStatus === true && isLoadingHasVoted)
  ) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        Loading blockchain data...
      </div>
    );
  }

  const renderTransactionStatus = (
    tx: ReturnType<typeof useManageTransaction>,
    name: string
  ) => (
    <div>
      {tx.hash && (
        <p style={{ fontSize: "0.8em" }}>
          <span style={{ fontWeight: "bold" }}>{name} Tx:</span>{" "}
          {tx.hash.substring(0, 10)}...
        </p>
      )}
      {tx.isLoading && (
        <p style={{ fontSize: "0.8em", color: "blue" }}>Confirming {name}...</p>
      )}
      {tx.isSuccess && (
        <p style={{ fontSize: "0.8em", color: "green" }}>{name} successful!</p>
      )}
      {tx.error && (
        <p style={{ fontSize: "0.8em", color: "red" }}>
          {name} error: {tx.error.message.split("Details:")[0]}
        </p>
      )}
    </div>
  );

  const inputStyle = {
    marginRight: "10px",
    padding: "8px",
    marginBottom: "10px",
    border: "1px solid #ccc",
    borderRadius: "4px",
  };
  const buttonStyle = {
    padding: "8px 15px",
    cursor: "pointer",
    border: "none",
    borderRadius: "4px",
    backgroundColor: "#007bff",
    color: "white",
  };
  const disabledButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#ccc",
    cursor: "not-allowed",
  };
  const sectionStyle = {
    border: "1px solid #ddd",
    padding: "20px",
    marginBottom: "25px",
    borderRadius: "8px",
    backgroundColor: "#f9f9f9",
  };
  const fieldsetStyle = {
    border: "1px solid #ccc",
    padding: "10px",
    margin: "10px 0",
    borderRadius: "5px",
  };
  const legendStyle = {
    fontWeight: "bold",
    marginBottom: "10px",
  };

  // Ensure votingEndTime is a bigint for comparison, or handle its loading state
  const isVotingTimeElapsed =
    typeof votingEndTime === "bigint"
      ? BigInt(Date.now()) >= votingEndTime * BigInt(1000)
      : false;
  const isStopVotingDisabled =
    isWritePending ||
    stopVotingTx.isLoading ||
    votingStatus !== true ||
    !isVotingTimeElapsed;

  const showVotingEndTime =
    votingStatus === true && typeof votingEndTime === "bigint";

  return (
    <>
      <Navbar />
      <div
        style={{
          padding: "2rem",
          maxWidth: "700px",
          margin: "auto",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            marginBottom: "1.5rem",
            padding: "10px",
            border: "1px solid #eee",
            borderRadius: "5px",
            backgroundColor: "#f0f0f0",
          }}
        >
          <p>
            <strong>Your Address:</strong> {address}
          </p>
          <p>
            <strong>Role:</strong> {userRole.toUpperCase()}
          </p>
          <p>
            <strong>Voting Active:</strong>{" "}
            {votingStatusLoading ? "Loading..." : votingStatus ? "Yes" : "No"}
          </p>
          {showVotingEndTime && (
            <p>
              <strong>Voting Ends:</strong>
              {new Date(Number(votingEndTime!) * 1000).toLocaleString()}
              <br />
              (Time left:{" "}
              {Math.max(
                0,
                Math.floor((Number(votingEndTime!) * 1000 - Date.now()) / 1000)
              )}
              s)
            </p>
          )}
        </div>

        {userRole === "admin" && (
          <div style={sectionStyle}>
            <h2
              style={{
                marginTop: 0,
                borderBottom: "1px solid #eee",
                paddingBottom: "10px",
                marginBottom: "15px",
              }}
            >
              Admin Panel
            </h2>
            <fieldset style={fieldsetStyle}>
              <legend>Register Voter</legend>
              <input
                type="text"
                placeholder="Voter Address (0x...)"
                value={voterToRegister}
                onChange={(e) => setVoterToRegister(e.target.value)}
                style={inputStyle}
              />
              <button
                onClick={handleRegisterVoter}
                disabled={isWritePending || registerVoterTx.isLoading}
                style={
                  isWritePending || registerVoterTx.isLoading
                    ? disabledButtonStyle
                    : buttonStyle
                }
              >
                Register
              </button>
              {renderTransactionStatus(registerVoterTx, "Register Voter")}
            </fieldset>
            <fieldset style={fieldsetStyle}>
              <legend>Add Admin</legend>
              <input
                type="text"
                placeholder="New Admin Address (0x...)"
                value={adminToAdd}
                onChange={(e) => setAdminToAdd(e.target.value)}
                style={inputStyle}
              />
              <button
                onClick={handleAddAdmin}
                disabled={isWritePending || addAdminTx.isLoading}
                style={
                  isWritePending || addAdminTx.isLoading
                    ? disabledButtonStyle
                    : buttonStyle
                }
              >
                Add Admin
              </button>
              {renderTransactionStatus(addAdminTx, "Add Admin")}
            </fieldset>
            <fieldset style={fieldsetStyle}>
              <legend>Start Voting Session</legend>
              <input
                type="text"
                placeholder="Parties (comma-separated)"
                value={partiesInput}
                onChange={(e) => setPartiesInput(e.target.value)}
                style={inputStyle}
              />
              <input
                type="number"
                placeholder="Duration (minutes)"
                value={durationInput}
                onChange={(e) => setDurationInput(e.target.value)}
                style={inputStyle}
              />
              <button
                onClick={handleStartVoting}
                disabled={
                  isWritePending ||
                  startVotingTx.isLoading ||
                  votingStatus === true
                }
                style={
                  isWritePending ||
                  startVotingTx.isLoading ||
                  votingStatus === true
                    ? disabledButtonStyle
                    : buttonStyle
                }
              >
                Start Voting
              </button>
              {renderTransactionStatus(startVotingTx, "Start Voting")}
            </fieldset>
            {votingStatus === true && (
              <fieldset style={fieldsetStyle}>
                <legend>Stop Voting Session</legend>
                <button
                  onClick={handleStopVoting}
                  disabled={isStopVotingDisabled}
                  style={
                    isStopVotingDisabled ? disabledButtonStyle : buttonStyle
                  }
                >
                  Stop Voting & Get Results
                </button>
                {!isVotingTimeElapsed && typeof votingEndTime === "bigint" && (
                  <p style={{ fontSize: "0.8em", color: "orange" }}>
                    Voting session has not ended yet.
                  </p>
                )}
                {renderTransactionStatus(stopVotingTx, "Stop Voting")}
              </fieldset>
            )}
          </div>
        )}

        {userRole === "voter" && votingStatus === true && (
          <div style={sectionStyle}>
            <h2
              style={{
                marginTop: 0,
                borderBottom: "1px solid #eee",
                paddingBottom: "10px",
                marginBottom: "15px",
              }}
            >
              Voter Panel
            </h2>

            {currentPartiesLoading && <p>Loading parties...</p>}

            {!currentPartiesLoading && (
              <>
                {Array.isArray(currentParties) &&
                  currentParties.length > 0 &&
                  hasVoted !== true && (
                    <fieldset style={fieldsetStyle}>
                      <legend style={legendStyle}>Cast Your Vote</legend>
                      <select
                        value={selectedParty}
                        onChange={(e) => setSelectedParty(e.target.value)}
                        style={{
                          ...inputStyle,
                          minWidth: "250px",
                          width: "auto",
                        }}
                      >
                        <option value="">-- Select a Party --</option>
                        {currentParties.map((party) => (
                          <option key={party} value={party}>
                            {party}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={handleVote}
                        disabled={
                          isWritePending || voteTx.isLoading || !selectedParty
                        }
                        style={
                          isWritePending || voteTx.isLoading || !selectedParty
                            ? disabledButtonStyle
                            : buttonStyle
                        }
                      >
                        Vote
                      </button>
                      {renderTransactionStatus(voteTx, "Vote")}
                    </fieldset>
                  )}

                {hasVoted === true && (
                  <p>
                    You have already voted in this session. Results will be
                    available after the voting period ends.
                  </p>
                )}

                {hasVoted !== true &&
                  (!Array.isArray(currentParties) ||
                    currentParties.length === 0) && (
                    <p>
                      No parties available for voting currently, or the voting
                      session may not have started correctly.
                    </p>
                  )}
              </>
            )}
          </div>
        )}

        {votingStatus === false &&
          (lastWinningParty || lastResults.length > 0) && (
            <div style={sectionStyle}>
              <h3
                style={{
                  marginTop: 0,
                  borderBottom: "1px solid #eee",
                  paddingBottom: "10px",
                  marginBottom: "15px",
                }}
              >
                Previous Voting Session Results
              </h3>
              {lastWinningParty && (
                <p>
                  <strong>Winning Party:</strong> {lastWinningParty}
                </p>
              )}
              {lastResults.length > 0 && (
                <ul style={{ listStyleType: "none", paddingLeft: 0 }}>
                  {lastResults.map((r) => (
                    <li key={r.party} style={{ marginBottom: "5px" }}>
                      {r.party}: {r.votes.toString()} votes
                    </li>
                  ))}
                </ul>
              )}
              {!lastWinningParty && lastResults.length === 0 && (
                <p>
                  No results from the last session, or it might have been reset.
                </p>
              )}
            </div>
          )}

        {userRole === "unauthorized" && (
          <p
            style={{
              color: "red",
              marginTop: "20px",
              textAlign: "center",
              fontWeight: "bold",
            }}
          >
            You are not authorized to participate. Please contact an admin to
            get registered as a voter.
          </p>
        )}
      </div>
    </>
  );
}
