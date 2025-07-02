import React, { useState } from "react";
import ChatWindow from "./ChatWindow";

const ChatIcon: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
       <div
        style={{
          position: "fixed",
          top: 150,
          right: 20,
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 8,
        }}
      >
      {isOpen && <ChatWindow onClose={() => setIsOpen(false)} />}
      <button
        className="btn btn-primary rounded-circle"
        style={{
          width: 60,
          height: 60,
          fontSize: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="チャットを開く"
      >
        💬
      </button>      
      </div>
    </>
  );
};

export default ChatIcon;

