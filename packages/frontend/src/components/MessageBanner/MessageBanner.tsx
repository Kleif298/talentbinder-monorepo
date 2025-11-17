import React, { useEffect, useState } from "react";
import "./MessageBanner.scss";

export type MessageType = "success" | "error" | "info" | "warning";

export interface Message {
  type: MessageType;
  text: string;
  duration?: number; // milliseconds, 0 = never auto-close
}

interface MessageBannerProps {
  message: Message | null;
  onClose?: () => void;
}

const MessageBanner: React.FC<MessageBannerProps> = ({ message, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
      // Animation duration is 4.6s (2s shown + slide up). After that, close it.
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, 4600);

      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [message, onClose]);

  if (!message || !visible) {
    return null;
  }

  const handleClose = () => {
    setVisible(false);
    if (onClose) onClose();
  };

  return (
    <div className={`message-banner message-banner--${message.type}`}>
      <div className="message-banner__content">
        <div className="message-banner__icon">
          {message.type === "success" && <span>✓</span>}
          {message.type === "error" && <span>✕</span>}
          {message.type === "info" && <span>ℹ</span>}
          {message.type === "warning" && <span>⚠</span>}
        </div>
        <div className="message-banner__text">{message.text}</div>
      </div>
      <button
        className="message-banner__close"
        onClick={handleClose}
        aria-label="Message schließen"
      >
        ×
      </button>
    </div>
  );
};

export default MessageBanner;
