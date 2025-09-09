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
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    className={`
                        flex items-center bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 text-white px-4 py-2 rounded-md transition-colors ${childStyle}`}
                  >
                    <RiWallet3Line className="mr-2" size={20} />
                    CONNECT WALLET
                  </button>
                );
              }
            }}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};

export default CustomConnectButton;
