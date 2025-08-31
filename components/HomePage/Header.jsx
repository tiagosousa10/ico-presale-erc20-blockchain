import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  FiMenu,
  FiX,
  FiMoon,
  FiSun,
  FiChevronDown,
  FiBook,
  FiMap,
  FiFileText,
  FiCompass,
  FiActivity,
  FiCpu,
  FiLayers,
  FiDatabase,
  FiCode,
  FiInfo,
} from "react-icons/fi";
import { RiWallet3Line } from "react-icons/ri";
import CustomConnectButton from "../Global/CustomConnectButton";

const TOKEN_NAME = process.env.NEXT_PUBLIC_TOKEN_NAME;
const TOKEN_SYMBOL = process.env.NEXT_PUBLIC_TOKEN_SYMBOL;
const TOKEN_SUPPLY = process.env.NEXT_PUBLIC_TOKEN_SUPPLY;
const PER_TOKEN_USD_PRICE = process.env.NEXT_PUBLIC_PER_TOKEN_USD_PRICE;
const NEXT_PER_TOKEN_USD_PRICE =
  process.env.NEXT_PUBLIC_NEXT_PER_TOKEN_USD_PRICE;
const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY;
const BLOCKCHAIN = process.env.NEXT_PUBLIC_BLOCKCHAIN;
const EXPLORER_TOKEN_URL = process.env.NEXT_PUBLIC_EXPLORER_TOKEN_URL;
const EXPLORER_ADDRESS_URL = process.env.NEXT_PUBLIC_EXPLORER_ADDRESS_URL;
const TBC_ADDRESS = process.env.NEXT_PUBLIC_TBC_ADDRESS;

const Header = ({ isDarkMode, toggleDarkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const timeoutRef = useRef(null);
  const menuRef = useRef(null);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMegaMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleMenuLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveMegaMenu(null);
    }, 3000);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.pageYOffset > 50);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const headerClasses = `w-full transition-all duration-500 ease-out ${
    isDarkMode
      ? "bg-[#0e0b12]/95 backdrop-blur-md"
      : "bg-white/95 backdrop-blur-md"
  } ${
    isHeaderSticky
      ? "fixed top-0 left-0 z-50 w-full shadow-lg animate-slowSlideDown border-b  "
      : "relative border-b"
  } ${isDarkMode ? "border-gray-800/50" : "border-gray-200/50"}`;

  // Mega menu content
  const megaMenus = {
    ecosystem: {
      title: "Ecosystem",
      columns: [
        {
          title: "Core Technology",
          links: [
            {
              icon: <FiActivity className="text-fuchsia-500" />,
              label: "Linktum AI",
              href: "https://linktum.gitbook.io/linktum",
            },
            {
              icon: <FiCpu className="text-indigo-500" />,
              label: "AIVM",
              href: "https://linktum.gitbook.io/linktum/linktum-docs/quickstart",
            },
            {
              icon: <FiLayers className="text-fuchsia-500" />,
              label: "Framework",
              href: "https://linktum.gitbook.io/linktum/linktum-docs",
            },
          ],
        },
        {
          title: "Applications",
          links: [
            {
              icon: <FiCode className="text-fuchsia-500" />,
              label: "How To Buy",
              href: "https://linktum.gitbook.io/linktum/linktum-docs/publish-your-docs",
            },
            {
              icon: <FiCompass className="text-indigo-500" />,
              label: "Explorer",
              href: `${EXPLORER_TOKEN_URL}${TBC_ADDRESS}`,
            },
            {
              icon: <FiMap className="text-fuchsia-500" />,
              label: "Create Wallet",
              href: "https://linktum.gitbook.io/linktum/linktum-docs/publish-your-docs/create-a-wallet",
            },
          ],
        },
        {
          title: "Community",
          links: [
            {
              icon: <FiFileText className="text-indigo-500" />,
              label: "Token Documentation",
              href: "https://linktum.gitbook.io/linktum/tokenomics",
            },
            {
              icon: <FiBook className="text-fuchsia-500" />,
              label: "Referral",
              href: "https://linktum.gitbook.io/linktum/referral",
            },
            {
              icon: <FiCompass className="text-indigo-500" />,
              label: "Audits",
              href: "https://linktum.gitbook.io/linktum/audits",
            },
          ],
        },
      ],
      featuredBox: {
        title: "Join Our Community",
        description:
          "Be part of the Linktum revolution and help shape the future of AI-driven blockchain.",
        linkText: "Join Discord",
        linkUrl: "https://discord.gg/hCEy5vREwr",
        bgClass: isDarkMode ? "bg-indigo-500/10" : "bg-indigo-100/60",
      },
    },
    resources: {
      title: "Resources",
      columns: [
        {
          title: "Learn",
          links: [
            {
              icon: <FiFileText className="text-fuchsia-500" />,
              label: "Whitepaper",
              href: "https://linktum.gitbook.io/linktum/linktum-docs/quickstart",
            },
            {
              icon: <FiMap className="text-indigo-500" />,
              label: "Import Token",
              href: "https://linktum.gitbook.io/linktum/import-token",
            },
            {
              icon: <FiBook className="text-fuchsia-500" />,
              label: "Documentation",
              href: "https://linktum.gitbook.io/linktum/import-token",
            },
          ],
        },
        {
          title: "Tools",
          links: [
            {
              icon: <FiCompass className="text-fuchsia-500" />,
              label: "Block Explorer",
              href: `${EXPLORER_ADDRESS_URL}${TBC_ADDRESS}`,
            },
            {
              icon: <FiDatabase className="text-indigo-500" />,
              label: "Analytics",
              href: "/dashboard",
            },
            {
              icon: <FiCpu className="text-fuchsia-500" />,
              label: "Dashboard",
              href: "/dashboard",
            },
          ],
        },
      ],
      featuredBox: {
        title: "Start Building Today",
        description:
          "Access developer resources and start building on the Linktum Protocol.",
        linkText: "Developer Portal",
        linkUrl: "/dashboard",
        bgClass: isDarkMode ? "bg-teal-500/10" : "bg-teal-100/60",
      },
    },
  };
  return (
    <>
      {isHeaderSticky && <div className="h-[90px] md:h-[98px]"></div>}

      <header
        className={`w-full transition-all duration-500 ease-out fixed top-0 left-0 z-50 shadow-lg animate-slowSlideDown border-b ${
          isDarkMode
            ? "bg-[#0e0b12]/95 backdrop-blur-md border-gray-800/50"
            : "bg-white/95 backdrop-blur-md border-gray-200/50 "
        }`}
        ref={menuRef}
      >
        {!isScrolled && (
          <div className="relative py-3 overflow-hidden whitespace-nowrap">
            <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 text-white z-0"></div>

            <div
              className="absolute inset-0 z-0 opacity-20 "
              style={{
                backgroundImage:
                  "radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px), radial-gradient(circle,rgba(255,255,255,0.1) 1px, transparent 1px)",
                backgroundSize: "20px 20px 30px 30px",
                backgroundPosition: "0 0, 15px 15px",
              }}
            ></div>

            <div className="animate-marquee inline-block whitespace-nowrap text-white relative z-10">
              <span className="mx-4 text-sm md:text-base">
                {TOKEN_NAME}({TOKEN_SYMBOL})PreSale is NOW ALIVE! Be part of the
                future-claim your discounted tokens and exclusive access to AI
                Blockchain technology
                <span className="mx-1">🌍</span>
                Don&apos;t wait, join the innovation wave today!
                <span className="ml-1">🔥</span>
              </span>
            </div>
          </div>
        )}

        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Link href={"/"} className="flex items-center group">
              <div className="relative w-10 h-10 mr-3 overflow-hidden">
                <div className="absolute inset-0"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <img
                    src="/logo.png"
                    alt="Logo"
                    className="size-8 object-contain"
                  />
                </div>
              </div>
              <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-500 to-purple-600 animate-gradient-x">
                {TOKEN_NAME}
              </span>
            </Link>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
