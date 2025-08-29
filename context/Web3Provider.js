import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import { useAccount, useChainId, useConnect, useBalance } from "wagmi";

//internal import
import { useToast } from "./ToastContext";
import TOKEN_ICO_ABI from "./ABI.json";
import { useEthersProvider, useEtherSigner } from "../provider/hooks";
import { config } from "../provider/wagmiConfigs";
import { handleTransactionError, erc20Abi, generateId } from "./Utility";

const LINKTUM_ADDRESS = process.env.NEXT_PUBLIC_LINKTUM_ADDRESS;
const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY;
const TOKEN_SYMBOL = process.env.NEXT_PUBLIC_TOKEN_SYMBOL;
const TOKEN_DECIMAL = process.env.NEXT_PUBLIC_TOKEN_DECIMAL;
const TOKEN_LOGO = process.env.NEXT_PUBLIC_TOKEN_LOGO;
const DOMAIN_URL = process.env.NEXT_PUBLIC_NEXT_DOMAIN_URL;
const PER_TOKEN_USD_PRICE = process.env.NEXT_PUBLIC_PER_TOKEN_USD_PRICE;
const TokenICOAbi = TOKEN_ICO_ABI.abi;

const Web3Context = createContext();

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_ICO_ADDRESS;
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL;

const fallbackProvider = new ethers.providers.JsonRpcProvider(RPC_URL);

export const Web3Provider = ({ children }) => {
  const { notify } = useToast();

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { balance } = useBalance({ config });
  const { connect, connectors } = useConnect();

  const [reCall, setReCall] = useState(0);
  const [globalLoad, setGlobalLoad] = useState(false);

  const provider = useEthersProvider();
  const signer = useEtherSigner();
  const fallbackProvider = new ethers.providers.JsonRpcProvider(RPC_URL);

  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);

  const [isConnecting, setIsConnecting] = useState(false);

  const [contractInfo, setContractInfo] = useState({
    tbcAddress: null,
    tbcBalance: "0",
    ethPrice: "0",
    totalSold: "0",
  });

  const [tokenBalance, setTokenBalance] = useState({
    usertbcBalance: "0",
    contractEthBalance: null,
    totalSupply: null,
    userEthBalance: null,
    ethPrice: "0",
    tbcBalance: "0",
  });

  const [error, setError] = useState(null);

  useEffect(() => {
    const initContract = () => {
      if (provider && signer) {
        try {
          const contractInstance = new ethers.Contract(
            CONTRACT_ADDRESS,
            TokenICOAbi,
            signer
          );

          setContract(contractInstance);
        } catch (error) {
          console.error("Error initializing contract:", error);
          setError("Failed to initialize contract");
        }
      }
    };

    initContract();
  }, [provider, signer]);

  useEffect(() => {
    const fetchContractInfo = async () => {
      setGlobalLoad(true);
      try {
        const currentProvider = provider || fallbackProvider;

        const readonlyContract = new ethers.Contract(
          CONTRACT_ADDRESS,
          TokenICOAbi,
          currentProvider
        );

        const info = await readonlyContract.getContractInfo();

        const tokenDecimals = parseInt(info.tokenDecimals) || 18;

        setContract({
          tbcAddress: info.tokenAddress,
          tbcBalance: ethers.utils.formatUnits(
            info.tokenBalance,
            tokenDecimals
          ),
          ethPrice: ethers.utils.formatUnits(info.ethPrice, 18),
          totalSold: ethers.utils.formatUnits(info.totalSold, tokenDecimals),
        });

        if (address && info.tokenAddress) {
          const tokenContract = new ethers.Contract(
            info.tokenAddress,
            erc20Abi,
            currentProvider
          );

          const [
            userTokenBalance,
            userEthBalance,
            contractEthBalance,
            totalSupply,
          ] = await Promise.all([
            tokenContract.balanceOf(address),
            currentProvider.getBalance(address),
            currentProvider.getBalance(CONTRACT_ADDRESS),
            tokenContract.totalSupply(),
          ]);

          setTokenBalance({
            ...prev,
            usertbcBalance: ethers.utils.formatUnits(
              userTokenBalance,
              tokenDecimals
            ),
            contractEthBalance: ethers.utils.formatUnits(contractEthBalance),
            totalSupply: ethers.utils.formatUnits(totalSupply, tokenDecimals),
            userEthBalance: ethers.utils.formatUnits(userEthBalance),
            ethPrice: ethers.utils.formatUnits(info.ethPrice, 18),
            tbcBalance: ethers.utils.formatUnits(
              info.tokenBalance,
              tokenDecimals
            ),
          });
        }

        setGlobalLoad(false);
      } catch (error) {
        setGlobalLoad(false);
        console.error("Error fetching contract info:", error);
      }
    };

    fetchContractInfo();
  }, [contract, address, provider, signer, reCall]);

  const buyToken = async (ethAmount) => {
    if (!contract || !address) return null;

    const toastId = notify.start(`Buying ${TOKEN_SYMBOL} with ${CURRENCY}...`);

    try {
      const ethValue = ethers.utils.parseEther(ethAmount);

      const tx = await contract.buyToken({
        value: ethValue,
      });

      notify.update(toastId, "Processing", "Waiting for confirmation");

      const receipt = await tx.wait();

      if (receipt.status === 1) {
        const tokenPrice = PER_TOKEN_USD_PRICE;
        const tokensReceived = parseFloat(ethAmount) / tokenPrice;

        const txDetails = {
          timestamp: Date.now(),
          user: address,
          tokenIn: CURRENCY,
          tokenOut: TOKEN_SYMBOL,
          amountIn: ethAmount,
          amountOut: tokensReceived.toString(),
          transactionType: "BUY",
          hash: receipt.transactionHash,
        };

        saveTransactionToLocalStorage(txDetails);

        setReCall((prev) => prev + 1);

        notify.complete(
          toastId,
          `Successfully purchased ${TOKEN_SYMBOL} tokens`
        );

        return receipt;
      }
    } catch (error) {
      const { message: errorMessage, code: errorCode } = handleTransactionError(
        error,
        "buying tokens"
      );

      if (errorCode == "ACTION_REJECTED") {
        notify.reject(toastId, "Transaction rejected by user");
        return null;
      }

      console.error(errorMessage);
      notify.fail(
        toastId,
        "Transaction failed, Please try again with sufficient gas"
      );
      return null;
    }
  };

  const saveTransactionToLocalStorage = (txData) => {
    try {
      const existingTransactions =
        JSON.parse(localStorage.getItem("tokenTransactions")) || "[]";

      existingTransactions.push(txData);

      localStorage.setItem(
        "tokenTransactions",
        JSON.stringify(existingTransactions)
      );

      console.log("Transaction saved to localStorage:", txData);
    } catch (error) {}
    console.log("Failed to saved to localStorage:", error);
  };

  const updateTokenPrice = async (newPrice) => {
    if (!contract || !address) return null;

    const toastId = notify.start(`Updating token price...`);

    try {
      const parsedPrice = ethers.utils.parseEther(newPrice);

      const tx = await contract.updateTokenPrice(parsedPrice);

      notify.update(toastId, "Processing", "Confirming price update...");

      const receipt = await tx.wait();

      if (receipt.status === 1) {
        setReCall((prev) => prev + 1);
        notify.complete(
          toastId,
          `Token price updated to ${newPrice} ${CURRENCY}`
        );

        return receipt;
      }
    } catch (error) {
      const { message: errorMessage, code: errorCode } = handleTransactionError(
        error,
        "updating token price"
      );

      if (errorCode == "ACTION_REJECTED") {
        notify.reject(toastId, "Transaction rejected by user");
        return null;
      }

      console.error(errorMessage);
      notify.fail(
        toastId,
        "Price updated failed failed, Please check your permissions"
      );
      return null;
    }
  };

  const setSaleToken = async (tokenAddress) => {
    if (!contract || !address) return null;

    const toastId = notify.start(`Setting sale token ...`);

    try {
      const tx = await contract.setSaleToken(tokenAddress);

      notify.update(toastId, "Processing", "Confirming token update...");

      const receipt = await tx.wait();

      if (receipt.status === 1) {
        setReCall((prev) => prev + 1);
        notify.complete(toastId, `Sale token updated successfully`);

        return receipt;
      }
    } catch (error) {
      const { message: errorMessage, code: errorCode } = handleTransactionError(
        error,
        "Setting sale token"
      );

      if (errorCode == "ACTION_REJECTED") {
        notify.reject(toastId, "Transaction rejected by user");
        return null;
      }

      console.error(errorMessage);
      notify.fail(toastId, "Failed to set sale token, Please check address");
      return null;
    }
  };

  const withdrawAllTokens = async () => {
    if (!contract || !address) return null;

    const toastId = notify.start(`withdraw tokens...`);

    try {
      const tx = await contract.withdrawAllTokens();

      notify.update(toastId, "Processing", "Confirming withdrawal...");

      const receipt = await tx.wait();

      if (receipt.status === 1) {
        setReCall((prev) => prev + 1);
        notify.complete(toastId, `All tokens withdrawn successfully`);

        return receipt;
      }
    } catch (error) {
      const { message: errorMessage, code: errorCode } = handleTransactionError(
        error,
        "Withdrawing token"
      );

      if (errorCode == "ACTION_REJECTED") {
        notify.reject(toastId, "Transaction rejected by user");
        return null;
      }

      console.error(errorMessage);
      notify.fail(toastId, "Failed to withdraw token, Please try again");
      return null;
    }
  };

  const rescueTokens = async (tokenAddress) => {
    if (!contract || !address) return null;

    const toastId = notify.start(`Rescue tokens...`);

    try {
      const tx = await contract.rescueTokens(tokenAddress);

      notify.update(toastId, "Processing", "Rescuing tokens...");

      const receipt = await tx.wait();

      if (receipt.status === 1) {
        setReCall((prev) => prev + 1);
        notify.complete(toastId, `Tokens rescued successfully`);

        return receipt;
      }
    } catch (error) {
      const { message: errorMessage, code: errorCode } = handleTransactionError(
        error,
        "Rescuing token"
      );

      if (errorCode == "ACTION_REJECTED") {
        notify.reject(toastId, "Transaction rejected by user");
        return null;
      }

      console.error(errorMessage);
      notify.fail(
        toastId,
        "Failed to rescued token, Please try again / check address"
      );
      return null;
    }
  };

  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(
      address.length - 4
    )}`;
  };

  const formatTokenAmount = (amount, decimals = 18) => {
    if (!amount) return 0;

    return ethers.utils.formatUnits(amount, decimals);
  };

  const isOwner = async () => {
    if (!contract || !address) return false;

    try {
      const ownerAddress = await contract.owner();

      return ownerAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
      const errorMessage = handleTransactionError(error, "withdraw tokens");
      console.log(errorMessage);
      return false;
    }
  };

  const addtokenToMetamask = async () => {
    const toastId = notify.start(`Adding ${TOKEN_SYMBOL} Token to metamask...`);

    try {
      const wasAdded = await window.ethereum.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: LINKTUM_ADDRESS,
            symbol: TOKEN_SYMBOL,
            decimals: TOKEN_DECIMAL,
            image: TOKEN_LOGO,
          },
        },
      });

      if (wasAdded) {
        notify.complete(toastId, `Token added to metamask successfully!`);
      } else {
        notify.complete(toastId, `Failed to added to metamask!`);
      }
    } catch (error) {
      console.log(error);
      const { message: errorMessage, code: errorCode } = handleTransactionError(
        error,
        "Token adding error"
      );

      notify.fail(
        toastId,
        `Transaction failed: ${
          errorMessage === "undefined" ? "Not Supported" : errorMessage
        }`
      );
    }
  };

  const value = {
    provider,
    signer,
    contract,
    account: address,
    chainId,
    isConnected: !!address && !!contract,
    isConnecting,
    contractInfo,
    tokenBalance,
    error,
    reCall,
    globalLoad,
    buyToken,
    updateTokenPrice,
    setSaleToken,
    withdrawAllTokens,
    formatAddress,
    formatTokenAmount,
    isOwner,
    setReCall,
    addtokenToMetamask,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);

  if (!context) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }

  return context;
};

export default Web3Context;
