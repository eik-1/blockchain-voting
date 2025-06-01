"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import React from "react";

const Navbar = () => {
  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-xl font-bold">ZK Voting</div>
        <ConnectButton />
      </div>
    </nav>
  );
};

export default Navbar;
