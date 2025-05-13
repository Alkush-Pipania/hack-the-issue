"use client"

import { useEffect, useState } from "react";
import Chatcomponent from "@/components/chatbot/Chatcomponent";

export default function ChatPage() {
  const [greeting, setGreeting] = useState<string>("");

  useEffect(() => {
    const getGreeting = () => {
      // We'll just use "How was your day, Anant?" to match the design
      const secretKey = localStorage.getItem('secretKey');
      return secretKey ? `How was your day, ${secretKey}? ` : "How can we help you today?";
    };

    setGreeting(getGreeting());
  }, []);

  return (
    <div className="flex justify-center items-center">
      <div className="max-w-[800px] w-full">
        <Chatcomponent greetings={greeting} />
      </div>
    </div>
  );
}