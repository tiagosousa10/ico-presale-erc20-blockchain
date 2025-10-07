import React from "react";
import Link from "next/link";
import { useForm, ValidationError } from "@formspree/react";
import {
  FaTwitter,
  FaTelegram,
  FaDiscord,
  FaMedium,
  FaGithub,
  FaPaperPlane,
  FaCheck,
} from "react-icons/fa";

const FORMSPREE_API_KEY = process.env.NEXT_PUBLIC_FORMSPREE_API_KEY;

const Footer = ({ isDarkMode }) => {
  const [state, handleSubmit] = useForm(FORMSPREE_API_KEY);

  const bgGradient = isDarkMode
    ? "bg-gradient-to-b from-[#0e0b12] to-[#080610]"
    : "bg-gradient-to-b from-[#f3f3f7] to-[#e8e8f0]";

  const headingColor =
    "bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-500 to-purple-600";

  const linkHoverColor =
    "hover:bg-clip-text hover:text-transparent hover:bg-gradient-to-r hover:from-fuchsia-500 hover:to-purple-600 ";
  const borderColor = isDarkMode ? "border-gray-800/40" : "border-gray-300/40";
  const textColor = isDarkMode ? "text-gray-300" : "text-gray-700";
  const textColorSecondary = isDarkMode ? "text-gray-400" : "text-gray-600";
  const textColorTertiary = isDarkMode ? "text-gray-500" : "text-gray-500";

  return (
    <footer
      className={`py-20 ${bgGradient} ${textColor} transition-colors duration-300 relative overflow-hidden`}
    >
      {/* background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-400/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl"></div>
      </div>
    </footer>
  );
};

export default Footer;
