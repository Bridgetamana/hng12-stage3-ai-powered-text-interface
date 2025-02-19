import React from "react";

const ClearChatModal = ({ onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
    <div className="bg-zinc-900 p-4 rounded-md shadow-md">
      <h2 className="text-zinc-300 text-lg font-medium mb-4">Clear Chat</h2>
      <p className="text-zinc-400 mb-6">
        Are you sure you want to clear the chat?
      </p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 border border-zinc-700 text-zinc-300 rounded-md hover:bg-zinc-600 text-sm"
        >
          No
        </button>
        <button
          onClick={onConfirm}
          className="px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
        >
          Yes
        </button>
      </div>
    </div>
  </div>
);

export default ClearChatModal;
