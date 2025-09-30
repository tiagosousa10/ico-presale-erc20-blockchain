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

  //2. add the particle animation effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const baseColor = { r: 189, g: 38, b: 211 }; // #bd26d3

    //set canvas to full width and container
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = canvas.parentElement.offsetHeight;
    };

    resizeCanvas();

    window.addEventListener("resize", resizeCanvas);

    //mouse interaction variables
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };

    window.addEventListener("mousemove", handleMouseMove);

    //perspective settings
    const perspective = 400;
    const focalLength = 300;
    const particleCount = 100;

    //initialize 3d particles
    particlesRef.current = Array(particleCount)
      .fill()
      .map(() => ({
        x: Math.random() * canvas.width - canvas.width / 2,
        y: Math.random() * canvas.height - canvas.height / 2,
        z: Math.random() * 1000,
        size: Math.random() * 4 + 2,
        baseSize: Math.random() * 4 + 2,
        speedX: Math.random() * 0.5 - 0.25,
        speedY: Math.random() * 0.5 - 0.25,
        speedZ: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.3,
      }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      //sort particles by z-index for proper depth rendering
      const sortedParticles = [...particlesRef.current].sort(
        (a, b) => a.z - b.z
      );

      sortedParticles.forEach((particle) => {
        //apply mouse influence (slight attraction)
        const mouseInfluenceX =
          (mouseX - canvas.width / 2 - particle.x) * 0.0001;
        const mouseInfluenceY =
          (mouseY - canvas.height / 2 - particle.y) * 0.0001;

        //update position width subtle mouse influence
        particle.x += particle.speedX + mouseInfluenceX;
        particle.y += particle.speedY + mouseInfluenceY;
        particle.z += particle.speedZ;

        //if particle goes behind the viewer , reset to far distance
        if (particle.z < -focalLength) {
          particle.z = Math.random() * 1000;
          particle.x = Math.random() * canvas.width - canvas.width / 2;
          particle.y = Math.random() * canvas.height - canvas.height / 2;
        }

        //calculate 3d projection
        const scale = focalLength / (focalLength + particle.z);
        const x2d = particle.x * scale + canvas.width / 2;
        const y2d = particle.y * scale + canvas.height / 2;
        const scaledSize = particle.baseSize * scale;

        //calculate color based on depth
        const distance = 1 - Math.min(particle.z / 1000, 1);
        const opacity = particle.opacity * distance;

        //apply color variaton based on depth
        const colorVariation = Math.max(0.6, distance);
        const r = Math.floor(baseColor.r * colorVariation);
        const g = Math.floor(baseColor.g * colorVariation);
        const b = Math.floor(baseColor.b * colorVariation);

        //draw particle
        ctx.beginPath();
        ctx.arc(x2d, y2d, scaledSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        ctx.fill();

        //add glow effect for closer particles
        if (distance > 0.8) {
          ctx.beginPath();
          ctx.arc(x2d, y2d, scaledSize * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity * 0.3})`;
          ctx.fill();
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    //cleanup
    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [isDarkMode]);

  return (
    <div className={` relative mt-12 w-full overflow-hidden ${bgColor}`}>
      {/* background width glowing animation */}
      <div className="absolute inset-0 z-0">
        {/* gradient */}
        <div
          className={`absolute inset-0 ${
            isDarkMode
              ? "bg-gradient-to-b from-[#0E0b12]/80 via-transparent to-[#0e0b12]/80 "
              : "bg-gradient-to-b from-[#f3f3f7]/80 via-transparent to-[#f3f3f7]/80 "
          }`}
        ></div>

        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
          style={{ zIndex: 1 }}
        />

        {/* animated glowing grid pattern */}
        <div className="absolute inset-0 grid-pattern"></div>

        {/* moving light effects */}
        <div className="absolute inset-0 light-rays">
          <div className="light-ray ray1"></div>
          <div className="light-ray ray2"></div>
          <div className="light-ray ray3"></div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="container mx-auto px-4 py-28 md:py-32 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 md:gap-16">
          {/* left side content - text and graphics */}
          <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left">
            {/* header content */}
            <div className="inline-block p-2 px-4 rounded-full bg-gradient-to-r from-teal-400/10 to-indigo-500/10 mb-6">
              <p className="text-sm font-medium bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-500 to-purple-600 animate-gradient-x">
                Presale Now Live
              </p>
            </div>

            <h1
              className={`text-4xl md:text-5xl lg:text-6xl font-bold ${textColor} mb-4`}
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-500 to-purple-600 animate-gradient-x">
                {TOKEN_NAME}
              </span>
            </h1>

            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              <span className="bg-clipt-text text-transparent bg-gradient-to-r from-fuchsia-500 to-purple-600 animate-gradient-x  ">
                Token
              </span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
                {" "}
                Sale
              </span>
              <span className={textColor}>Stage 1</span>
            </h2>

            <p
              className={`${secondaryTextColor} text-base md:text-lg max-w-md mb-8 leading-relaxed`}
            >
              Revolutionizing intelligence through decentralized innovation.
              Join the future of blockchain technology today.
            </p>

            {/* feature highlights */}
            <div className="flex flex-wrap gap-4 mb-8">
              <div
                className={`px-4 py-2 rounded-full ${
                  isDarkMode ? "bg-teal-500/10" : "bg-teal-100"
                } ${
                  isDarkMode ? "text-fuchsia-500 " : "text-teal-700"
                } text-sm font-medium flex items-center`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Limited Presale
              </div>

              <div
                className={`px-4 py-2 rounded-full ${
                  isDarkMode ? "bg-indigo-500/10" : "bg-indigo-100  "
                } ${
                  isDarkMode ? "text-indigo-300" : "text-indigo-700"
                } text-sm font-medium flex items-center`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Exclusive Benefits
              </div>
            </div>

            {/* background decorative elements */}
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-r from-teal-400/10 to-indigo-500/10 rounded-full blur-3xl -z-10"></div>
          </div>

          {/* right side - TOKEN PURCHASE SECTION*/}
          <div className="w-full md:w-1/2 max-w-md mx-auto relative">
            {/* loading */}
            {isLoading && (
              <div className="absolute inset-0 flex z-20 items-center justify-center bg-black/50 backdrop-blur-sm rounded-xl">
                <div className=" flex flex-col items-center">
                  <div className="w-12 h-12 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                </div>
              </div>
            )}

            {/* main card */}
            <div
              className={`${cardBg} backdrop-blur-sm rounded-xl ${cardBorder} border shadow-xl overflow-hidden transform transition duration-500 hover:shadow-2xl`}
            >
              <div className="p-6 md:p-8">
                {(!tokenBalances?.tbcBalance ||
                  Number(tokenBalances?.tbcBalance) === 0) && (
                  <div
                    className={`text-center text-xs ${secondaryTextColor} mb-4 bg-gradient-to-r from-teal-400/5 to-indigo-500/5 py-2 px-4 rounded-lg`}
                  >
                    Can't find tokens in your wallet?
                  </div>
                )}

                {/* card header */}
                <div className="text-center">
                  <div className="inline-block p-1.5 px-3 rounded-full bg-gradient-to-r from-teal-400/10 to-indigo-500/10 mb-2">
                    <p className="text-xs font-medium bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-500 to-purple-600 animate-gradient-x">
                      Limited Time Offer
                    </p>
                  </div>
                  <h3 className="text-xl text-center font-bold mb-1 bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-500 to-purple-600 animate-gradient-x">
                    Stage 1 - Buy {TOKEN_SYMBOL} Now
                  </h3>

                  <div
                    className={`text-center text-sm ${secondaryTextColor} mb-4`}
                  >
                    Until price increase
                  </div>
                </div>

                {/* price information */}
                <div className="flex justify-between items-center text-sm mb-3 px-1">
                  <div className={`${secondaryTextColor} flex flex-col`}>
                    <span className="text-xs mb-1">Current Price</span>
                    <span className={`${textColor} font-medium`}>
                      {PER_TOKEN_USD_PRICE} {CURRENCY}
                    </span>
                  </div>
                  <div className="h-10 w-px bg-gradient-to-b from-transparent via-gray-500/20 to-transparent"></div>
                  <div
                    className={`${secondaryTextColor} flex flex-col text-right`}
                  >
                    <span className="text-xs mb-1">Next Stage Price</span>
                    <span className={`${textColor} font-medium`}>
                      {NEXT_PER_TOKEN_USD_PRICE} {CURRENCY}
                    </span>
                  </div>
                </div>

                {/* progress bar */}
                <div
                  className={`w-full h-4 ${
                    isDarkMode ? "bg-gray-800/70" : "bg-gray-200/70"
                  } rounded-full mb-3 overflow-hidden`}
                >
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${primaryGradient} animated-progress relative`}
                    style={{
                      width: `${Math.max(0.5, calculateProgressPercentage())}%`,
                    }}
                    key={`progress-${calculateProgressPercentage()}`}
                  >
                    <div className="absolute top-0 left-0 w-full h-full bg-white/10 shimmer-effect"></div>
                  </div>
                </div>

                {/* progress bar */}
                <div className="flex justify-between text-xs mb-6 px-1">
                  <div className={secondaryTextColor}>
                    Total Raised:
                    <span>
                      {" "}
                      {parseFloat(contractInfo?.totalSold || 0) *
                        parseFloat(PER_TOKEN_USD_PRICE || 0) >
                      0
                        ? (
                            parseFloat(contractInfo?.totalSold || 0) *
                            parseFloat(PER_TOKEN_USD_PRICE || 0)
                          ).toFixed(2)
                        : "0"}{" "}
                      POL
                    </span>
                  </div>
                  <div className={`${secondaryTextColor} font-medium`}>
                    <span className="text-fuchsia-500 fonsemibold">
                      {calculateProgressPercentage()}%
                    </span>{" "}
                    Complete
                  </div>
                </div>

                {/* divider */}
                <div
                  className={`border-t ${
                    isDarkMode ? "border-gray-800/50" : "border-gray-200/50 "
                  } my-5`}
                ></div>

                {/* token price */}
                <div className="flex items-center justify-center space-x-3 mb-6">
                  <div className="size-10 rounded-full bg-gradient-to-r from-fuchsia-500/20 to-purple-600/20 flex items-center justify-center">
                    <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-purple-600">
                      1
                    </span>
                  </div>
                  <span className={`${textColor} text-lg font-medium`}>
                    {TOKEN_SYMBOL} ={" "}
                  </span>

                  <div className="px-3 py-1 rounded-lg bg-gradient-to-r from-teal-400/10 to-indigo-500/10">
                    <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-purple-600">
                      {PER_TOKEN_USD_PRICE} &nbsp; {CURRENCY}
                    </span>
                  </div>
                </div>

                {/* token selection */}
                <div className="flex space-x-2 mb-4">
                  <button
                    onClick={() => handleTokenSelection("POL")}
                    className={getTokenButtonStyle("POL")}
                  >
                    <img
                      src="/polygon.svg"
                      alt="POL"
                      className={`mr-2 w-4 h-4 ${
                        selectedToken === "POL" ? "filter brightness-200" : ""
                      }`}
                    />
                    Pay with {CURRENCY}
                  </button>
                </div>

                {/* balance display */}
                <div
                  className={`text-sm ${secondaryTextColor} text-center mb-6 py-2 p-4 rounded-lg ${
                    isDarkMode ? "bg-gray-800/30" : "bg-gray-100/70"
                  }`}
                >
                  <span className="mr-2">{selectedToken} Balance:</span>
                  <span className={`${textColor} font-medium`}>
                    {getCurrentBalance()}
                  </span>
                  <span className="ml-1"> {selectedToken}</span>
                </div>

                {/* amount inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                  <div>
                    <label
                      className={`block ${secondaryTextColor} text-xs mb-1 font-medium`}
                    >
                      Pay with {selectedToken}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={inputAmount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        className={`w-full ${inputBg} rounded-lg border px-4 py-3 ${textColor} focus:ring-1 focus:ring-teal-400 focus:border-teal-400 transition-all duration-200`}
                      />
                      <div
                        className={`absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2`}
                      >
                        <span className={`text-xs ${secondaryTextColor}`}>
                          {selectedToken}
                        </span>
                        <div className="w-6 h-6 rounded-full flex items-center justify-center">
                          {getTokenIcon(selectedToken)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label
                      className={`block ${secondaryTextColor} text-xs mb-1 font-medium}`}
                    >
                      Receive {TOKEN_SYMBOL}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={tokenAmount}
                        readOnly
                        className={`w-full ${inputBg} rounded-lg border px-4 py-3 ${textColor}`}
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                        <span className={`text-xs ${secondaryTextColor}`}>
                          {TOKEN_SYMBOL}
                        </span>
                        <div className="w-6 h-6 flex items-center justify-center">
                          <img
                            src="/logo.png"
                            alt={TOKEN_SYMBOL}
                            className="w-5 h-5"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* action button */}
                {isConnected ? (
                  <>
                    <button
                      onClick={executePurchase}
                      disabled={!hasSufficientBalance}
                      className={`w-full ${
                        hasSufficientBalance
                          ? "bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700"
                          : isDarkMode
                          ? "bg-gray-700/70 cursor-not-allowed"
                          : "bg-gray-300 cursor-not-allowed"
                      } text-white rounded-lg py-4 mb-4 flex items-center justify-center transition-all duration-300 shadow-lg font-medium ${
                        hasSufficientBalance
                          ? "hover:shadow-purple-500/20 hover:scale-[1.01]"
                          : ""
                      }`}
                    >
                      {getButtonMessage()}
                    </button>

                    {/* refer a friend button */}
                    <button
                      onClick={() => addtokenToMetamask()}
                      className={`w-full hidden lg:flex bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 text-white rounded-lg py-4 mb-4 flex items-center justify-center transition-all duration-300 shadow-lg font-medium `}
                    >
                      <img
                        src="/logo.png"
                        alt={TOKEN_SYMBOL}
                        className={`w-5 h-5`}
                      />{" "}
                      &nbsp;
                      <span>Add Token to MetaMask</span>
                    </button>
                  </>
                ) : (
                  <CustomConnectButton
                    childStyle={
                      "w-full mb-4 py-4 rounded-lg flex items-center justify-center gap-2 font-medium"
                    }
                  />
                )}

                {/* help links */}
                <div className="flex flex-col space-y-2 text-xs">
                  <div
                    className={`p3 rounded-lg ${
                      isDarkMode ? "bg-gray-800/30" : "bg-gray-100/70"
                    } bg-1`}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <AiOutlineQuestionCircle
                        className={`text-lg text-[#7765f3]`}
                      />
                      <h4 className={`font-medium ${textColor} `}>
                        Need Help?
                      </h4>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={"/dashboard/"}
                        className={`${secondaryTextColor} hover:${textColor} flex items-center text-xs transition-colors duration-200 px-2 py-1 rounded hover:bg-gray-700/20`}
                      >
                        <span className="mr-1">º</span>
                        How to Buy
                      </a>
                      <a
                        href="/dashboard"
                        className={`${secondaryTextColor} hover:${textColor} flex items-center text-xs transition-colors duration-200 px-2 py-1 rounded hover:bg-gray-700/20`}
                      >
                        <span className="mr-1">º</span>
                        Wallet Connection
                      </a>
                      <a
                        href="#TokenInfo"
                        className={`${secondaryTextColor} hover:${textColor} flex items-center text-xs transition-colors duration-200 px-2 py-1 rounded hover:bg-gray-700/20`}
                      >
                        <span className="mr-1">º</span>
                        Token Info
                      </a>
                      <a
                        href="#FAQ"
                        className={`${secondaryTextColor} hover:${textColor} flex items-center text-xs transition-colors duration-200 px-2 py-1 rounded hover:bg-gray-700/20`}
                      >
                        <span className="mr-1">º</span>
                        FAQ
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* scroll to top button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className={`w-10 h-10 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 animate-gradient-x hover:from-fuchsia-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/20 flex items-center justify-center transition-all duration-300 hover:scale-110`}
          aria-label="Scroll to top"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* css for animations */}
      <style jsx>
        {`
          @keyframes pulse-slow {
            0%,
            100% {
              opacity:0.8;
              transform: scale(1);
            }
            50% {
              opacity:1;
              transform: scale(1.02}
            }
          }
          .animate-pulse-slow {
              animation: pulse-slow 3s  infinite;
          }
          .animate-progress {
            animation: progress 1.5s ease-out
          }
          @keyframes progress {
            0%{
              width: 0%;
            }
            100%{
              width: ${Math.max(0.5, calculateProgressPercentage())}%;
            }
          }
          .grid-pattern {
          background-image : ${
            isDarkMode
              ? "linear-gradient(rgba(56,189,248,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,0.06) 1px, transparent 1px)  "
              : "linear-gradient(rgba(79,70,229,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(79,70,229,0.08) 1px, transparent 1px)  "
          }
          background-size: 35px 35px;
          animation: pulse-grid 8s ease-in-out infinite alternate;
          }

          @keyframes pulse-grid {
            0% {
              opacity:0.7;
              background-size: 35px 35px;
            }
            100% {
              opacity:1;
              background-size: 36px 36px;
            }
          }
          .light-rays {
            overflow:hidden;
            opacity: ${isDarkMode ? "0.4" : "0.3"}
          }
          .light-ray {
            position: absolute;
            width: 200%;
            height: 100%;
            background: linear-gradient(90deg, transparent 0%, ${
              isDarkMode
                ? "rgba(119,101,243,0.05) 45%, rgba(146,101,243,0.1) 50%, rgba(119,101,243,0.05) 55%"
                : "rgba(119,101,243,0.03) 45%, rgba(146,101,243,0.07) 50%, rgba(119,101,243,0.03) 55% "
            },
            transparent 100% );
            transform: rotate(45deg);
            top: -50%;
            left: -50%;
          }
          .ray1 {
          animation: moveRay 15s linear infinite;
          }
          .ray2 {
          animation: moveRay 20s linear  5s infinite;
          }
          .ray3 {
          animation: moveRay 25s linear  10s infinite;
          }

          @keyframes moveRay {
            0% {
              transform: rotate(45deg) translateX(-100%);
            }
            100% {
              transform: rotate(45deg) translateX(100%);
            }
          }

          .shimmer-effect {
            animation: shimmer 2s infinite linear;
            background: linear-gradient(
              to right,
              rgba(255, 255, 255, 0) 0%,
              rgba(255, 255, 255, 0.2) 50%,
              rgba(255, 255, 255, 0) 100%,
            );
            background-size: 200% 100%;
          }

          @keyframes shimmer {
            0% {
              background-position: -200% 0;
            }
            100% {
              background-position: 200% 0;
            }
          }
        `}
      </style>
    </div>
  );
};

export default HeroSection;
