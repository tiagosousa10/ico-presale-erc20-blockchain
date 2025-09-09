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
  }, []);

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

  return <div>HeroSection</div>;
};

export default HeroSection;
