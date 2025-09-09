"use client";
import React from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { RiWallet3Line } from "react-icons/ri";

const CustomConnectButton = ({ active, childStyle }) => {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: { opacity: 0, pointerEvents: "none", userSelect: "none" },
            })}
          >
            {!connected ? (
              <button
                onClick={openConnectModal}
                className={`flex items-center bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 text-white px-4 py-2 rounded-md transition-colors ${childStyle}`}
              >
                <RiWallet3Line className="mr-2" size={20} />
                CONNECT WALLET
              </button>
            ) : chain?.unsupported ? (
              <button
                onClick={openChainModal}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Wrong network
              </button>
            ) : (
              <div className="flex items-center gap-4">
                {active && (
                  <button
                    onClick={openChainModal}
                    className="bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                  >
                    {chain?.hasIcon && chain?.iconUrl && (
                      <img
                        src={chain.iconUrl}
                        alt={chain.name ?? "Chain icon"}
                        className="size-5"
                      />
                    )}
                  </button>
                )}

                <button
                  onClick={openAccountModal}
                  className="bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  {account?.displayName}
                  {account?.displayBalance
                    ? ` (${account.displayBalance})`
                    : null}
                </button>
              </div>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};

export default CustomConnectButton;
