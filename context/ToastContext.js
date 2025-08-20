import React, { createContext, useContext } from "react";

import toast, { Toaster } from "react-hot-toast";

const ToastContext = createContext();

const BRAND_COLOR = "#13101A";
const TOAST_STYLE = {
  common: {
    background: BRAND_COLOR,
    color: "white",
    padding: "16px",
    borderRadius: "6px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15",
  },
  processing: {
    borderLeft: "4px solid #facc15",
  },
  approve: {
    borderLeft: "4px solid #22c55e",
  },
  complete: {
    borderLeft: "4px solid #22c55e",
  },
  reject: {
    borderLeft: "4px solid #ef4444",
  },
  failed: {
    borderLeft: "4px solid #f97316",
  },
  info: {
    borderLeft: "4px solid #2ed3c0 ",
  },
};

export const ToastProvider = ({ children }) => {
  const showProcessing = (message) => {
    return toast.loading(message, {
      style: {
        ...TOAST_STYLE.common,
        ...TOAST_STYLE.processing,
      },
    });
  };

  const showApprove = (message) => {
    return toast.success(message, {
      style: {
        ...TOAST_STYLE.common,
        ...TOAST_STYLE.approve,
      },
      duration: 5000,
    });
  };

  const showComplete = (message) => {
    return toast.success(message, {
      style: {
        ...TOAST_STYLE.common,
        ...TOAST_STYLE.complete,
      },
      icon: "✅",
      duration: 5000,
    });
  };

  const showReject = (message) => {
    return toast.error(message, {
      style: {
        ...TOAST_STYLE.common,
        ...TOAST_STYLE.reject,
      },
      duration: 5000,
    });
  };

  const showFailed = (message) => {
    return toast.error(message, {
      style: {
        ...TOAST_STYLE.common,
        ...TOAST_STYLE.failed,
      },
      icon: "❌",
      duration: 5000,
    });
  };

  const showInfo = (message) => {
    return toast.error(message, {
      style: {
        ...TOAST_STYLE.common,
        ...TOAST_STYLE.info,
      },
      duration: 4000,
    });
  };
};
