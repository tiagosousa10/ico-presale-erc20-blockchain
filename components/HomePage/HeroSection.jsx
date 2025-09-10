import React, { useState, useEffect, useMemo, useRef } from "react";
import { FaEthereum } from "react-icons/fa";
import { SiTether } from "react-icons/si";
import { IoWalletOutline } from "react-icons/io5";
import { AiOutlineQuestionCircle } from "react-icons/ai";
import { BsFillInfoCircleFill, BsCurrencyDollar } from "react-icons/bs";
import { RiUsdCircleFill } from "react-icons/ri";
import { CustomConnectButton } from "../index";
import { useWeb3 } from "@/context/Web3Provider";
import { ethers } from "ethers";

const TOKEN_NAME = process.env.NEXT_PUBLIC_TOKEN_NAME;
const TOKEN_SYMBOL = process.env.NEXT_PUBLIC_TOKEN_SYMBOL;
const TOKEN_SUPPLY = process.env.NEXT_PUBLIC_TOKEN_SUPPLY;
const PER_TOKEN_USD_PRICE = process.env.NEXT_PUBLIC_PER_TOKEN_USD_PRICE;
const NEXT_PER_TOKEN_USD_PRICE =
  process.env.NEXT_PUBLIC_NEXT_PER_TOKEN_USD_PRICE;
const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY;
const BLOCKCHAIN = process.env.NEXT_PUBLIC_BLOCKCHAIN;

const HeroSection = ({ isDarkMode, setIsReferralPopupOpen }) => {
  const {
    account,
    isConnected,
    contractInfo,
    tokenBalances,
    buyToken,
    addtokenToMetamask,
  } = useWeb3();

  const [selectedToken, setSelectedToken] = useState("POL");
  const [inputAmount, setInputAmount] = useState("0");
  const [tokenAmount, setTokenAmount] = useState("0");
  const [hasSufficientBalance, setHasSufficientBalance] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAttemptedRegistration, setHasAttemptedRegistration] =
    useState(false);

  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animationRef = useRef(null);

  //calculate progress percentage based on sold tokens vs total supply
  const calculateProgressPercentage = () => {
    //check if required data exists
    if (!contractInfo?.totalSold || !contractInfo?.tbcBalance) {
      return 0;
    }

    //convert string values to numbers
    const totalSold = parseFloat(contractInfo.totalSold);
    const tbcBalance = parseFloat(contractInfo.tbcBalance);

    //calculate total supply (sold + available balance)
    const totalSupply = totalSold + tbcBalance;

    //calculate  percentage
    const percentage = (totalSold / totalSupply) * 100;

    //return percentage
    return isNaN(percentage)
      ? 0
      : Math.min(parseFloat(percentage.toFixed(2)), 100);
  };

  //calculate handle the price calculations with useMemo to avoid recalculations
  const prices = useMemo(() => {
    //default fallback values
    const defaultEthPrice = contractInfo?.ethPrice;

    let ethPrice;

    try {
      //handle eth price
      if (contractInfo?.ethPrice) {
        //if it's already a bigNumber or a BigNumber-compatible object
        if (
          typeof contractInfo.ethPrice === "object" &&
          contractInfo.ethPrice._isBigNumber
        ) {
          ethPrice = contractInfo.ethPrice;
        } else {
          //if it's a string, convert it to a bigNumber
          ethPrice = ethers.utils.parseEther(contractInfo.ethPrice.toString());
        }
      } else {
        // default fallback
        ethPrice = ethers.utils.parseEther(defaultEthPrice);
      }
    } catch (error) {
      console.error("Error parsing prices:", error);
      ethPrice = ethers.utils.parseEther(defaultEthPrice);
    }

    return { ethPrice };
  }, [contractInfo]);

  //start loading effect when component mounts
  useEffect(() => {
    setIsLoading(true);

    //set timeout to hide loader after 3 seconds
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    //clean up the timer if component unmounts
    return () => clearTimeout(timeout);
  }, []);

  // check if user has enough balance and if token supply is sufficient
  useEffect(() => {
    if (!isConnected || !tokenBalances) {
      setHasSufficientBalance(false);
      return;
    }

    //check if FSX balance is below threshold
    const lowTokenSupply = parseFloat(tokenBalances?.tbcBalance || "0") < 20;

    if (lowTokenSupply) {
      setHasSufficientBalance(false);
      return;
    }

    const inputAmountFloat = parseFloat(inputAmount) || 0;
    let hasBalance = false;

    switch (selectedToken) {
      case "POL":
        const ethBalance = parseFloat(tokenBalances?.userEthBalance || "0");
        hasBalance = ethBalance >= inputAmountFloat && inputAmountFloat > 0;
        break;
      default:
        hasBalance = false;
    }

    setHasSufficientBalance(hasBalance);
  }, [isConnected, inputAmount, selectedToken, tokenBalances]);

  //calculate token amount based on input amount and seleceted token
  const calculateTokenAmount = (amount, token) => {
    if (isNaN(amount) || parseFloat(amount) <= 0) return "0";

    let calculatedAmount;
    try {
      switch (token) {
        case "POL":
          //convert eth value to tokens based on contracts formula
          const amountInWei = ethers.utils.parseEther(amount);
          const tokensPerEth = ethers.utils.formatEther(prices.ethPrice);

          calculatedAmount = parseFloat(amount) / parseFloat(tokensPerEth);
          break;
        default:
          calculatedAmount = 0;
      }
    } catch (error) {
      console.error(`Error calculating token amount: ${error}`);
      calculatedAmount = 0;
    }

    return calculatedAmount.toFixed(2);
  };

  //handle input amount change
  const handleAmountChange = (value) => {
    setInputAmount(value);
    setTokenAmount(calculateTokenAmount(value, selectedToken));
  };

  //handle token selection change
  const handleTokenSelection = (token) => {
    setSelectedToken(token);
    setTokenAmount(calculateTokenAmount(inputAmount, token));
  };

  //execeute purchase based on selected token
  const executePurchase = async () => {
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }

    if (parseFloat(inputAmount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (!hasSufficientBalance) {
      if (parseFloat(tokenBalances?.fsxBalance || "0") < 20) {
        alert("Insufficient token supply. Please try again later.");
      } else {
        alert(`Insufficient ${selectedToken} balance`);
      }
      return;
    }

    try {
      let tx;
      console.log(`Buying with ${inputAmount} ${selectedToken}`);

      switch (selectedToken) {
        case "POL":
          tx = await buyToken(inputAmount);
          break;
        default:
          alert("Please select a valid token");
          return;
      }

      console.log(tx);
      console.log(
        `Successfully purchased ${tokenAmount} ${TOKEN_SYMBOL} tokens!`
      );

      //reset amounts
      setInputAmount("0");
      setTokenAmount("0");
    } catch (error) {
      console.error(`Error buying with ${selectedToken} `, error);
      alert("Transaction failed. Please try again.");
    }
  };

  //get current balance based on selected token
  const getCurrentBalance = () => {
    if (!tokenBalances) return "0";
    switch (selectedToken) {
      case "POL":
        return tokenBalances.userEthBalance || "0";
      default:
        return "0";
    }
  };

  //determine button state message
  const getButtonMessage = () => {
    if (inputAmount === "0" || inputAmount === "") {
      return "Enter an amount";

      if (parseFloat(tokenBalances?.tbc || "0") < 20) {
        return "Insufficient token supply. Please try again later.";
      }

      return hasSufficientBalance
        ? `BUY ${TOKEN_SYMBOL}`
        : `INSUFFICIENT ${selectedToken} BALANCE`;
    }
  };

  //get token icon/logo based on selected token
  const getTokenIcon = (token) => {
    switch (token) {
      case "POL":
        return <img src="/polygon.svg" className="w-5 h-5" alt="polygon" />;
      default:
        return null;
    }
  };

  //theme variables
  const bgColor = isDarkMode ? "bg-[#0e0b12]" : "bg-[#f5f7fa]";
  const textColor = isDarkMode ? "text-white" : "text-gray-800";
  const secondaryTextColor = isDarkMode ? "text-gray-400" : "text-gray-600";
  const cardBg = isDarkMode ? "bg-[#13101a]" : "bg-white/95";
  const cardBorder = isDarkMode ? "border-gray-800/30" : "border-gray-100";
  const inputBg = isDarkMode
    ? "bg-gray-900/60 border-gray-800/50"
    : "bg-gray-100 border-gray-200/70";
  const primaryGradient = "from-fuchsia-500 to-purple-600";
  const primaryGradientHover = "from-fuchsia-600 to-purple-700";
  const accentColor = "text-[#7765f3]";

  //token button styling

  //update buttons
  const getTokenButtonStyle = (token) => {
    const isSelected = selectedToken === token;
    const baseClasses =
      "flex flex-1 items-center justify-center rounded-lg py-2.5 transition-all duration-300";

    if (isSelected) {
      let selectedColorClass;
      switch (token) {
        case "POL":
          selectedColorClass =
            "bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 text-white";
          break;
        default:
          selectedColorClass = "";
      }

      return `${baseClasses} ${selectedColorClass} text-white shadow-lg`;
    }
    return `${baseClasses} ${
      isDarkMode
        ? "bg-gray-800/40 hover:bg-gray-800/60 text-gray-300"
        : "bg-gray-200 hover:bg-gray-300 text-gray-700"
    }`;
  };

  return <div>HeroSection</div>;
};

export default HeroSection;
