// components/ChatBubble.tsx
interface ChatBubbleProps {
  message: string;
  isMine?: boolean;
}

export default function ChatBubble({ message, isMine }: ChatBubbleProps) {
  return (
    <div className={`my-1 flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`px-3 py-2 rounded-lg max-w-xs ${
          isMine ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
        }`}
      >
        {message}
      </div>
    </div>
  );
}
