import React from "react";

const ClearChatModal = ({ onConfirm, onCancel }) => {
  return (
    <div 
      className="fixed inset-0 bg-zinc-900/70 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-lg p-6 m-4">
        <h2 
          id="modal-title"
          className="text-zinc-800 dark:text-zinc-100 text-lg font-medium mb-3"
        >
          Clear Chat History
        </h2>
        
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          Are you sure you want to clear all chat messages? This action cannot be undone.
        </p>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-600 transition-colors"
            aria-label="Cancel clear chat action"
          >
            No
          </button>
          
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20 dark:hover:bg-red-500/20 focus:outline-none focus:ring-2 focus:ring-red-300 dark:focus:ring-red-500/40 transition-colors"
            aria-label="Confirm clear chat action"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClearChatModal;