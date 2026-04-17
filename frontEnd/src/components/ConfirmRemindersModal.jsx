import { useState, useEffect } from "react";
import SubscriptionCard from "./SubscriptionCard";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ;
  
const API = BACKEND_URL;

export default function ConfirmRemindersModal({ subscriptions, onClose, onSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    // Check authentication status on modal open
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsAuthLoading(true);
      const response = await fetch(`${API}/auth/status`);
      const data = await response.json();
      setIsAuthenticated(data.is_authenticated || false);
      if (!data.is_authenticated) {
        setAuthError("Please connect your Google Calendar to create reminders.");
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      setIsAuthenticated(false);
      setAuthError("Failed to check authentication status.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      setIsAuthLoading(true);
      const response = await fetch(`${API}/auth/login`);
      const data = await response.json();
      
      if (data.auth_url) {
        // Open OAuth login in new window
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        
        const authWindow = window.open(
          data.auth_url,
          "GoogleOAuth",
          `left=${left},top=${top},width=${width},height=${height}`
        );

        // Poll for window close and recheck auth
        const pollInterval = setInterval(() => {
          if (authWindow.closed) {
            clearInterval(pollInterval);
            // Recheck auth status after OAuth window closes
            setTimeout(() => {
              checkAuthStatus();
            }, 1000);
          }
        }, 500);
      }
    } catch (error) {
      console.error("Login error:", error);
      setAuthError("Failed to initiate Google Calendar login.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleCreateReminders = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const payload = {
        subscriptions: subscriptions.map(sub => ({
          name: sub.name,
          amount: sub.amount,
          currency: sub.currency,
          expiry_date_str: sub.expiry_date_str
        }))
      };

      const response = await fetch(`${API}/batch-create-reminders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to create reminders");
      }

      setSuccessMessage(`✅ Successfully created ${data.created_count} reminder(s)!`);
      
      // Auto-close after success
      setTimeout(() => {
        if (onSuccess) onSuccess(data);
        onClose();
      }, 2000);

    } catch (error) {
      console.error("Error creating reminders:", error);
      setErrorMessage(`❌ ${error.message || "Failed to create reminders"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-start sm:items-center sticky top-0 z-10 shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-1.5 sm:gap-2">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Create Reminders
            </h2>
            <p className="text-blue-100 text-xs sm:text-sm mt-1">Set up reminders for expiring subscriptions</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-700 p-1.5 sm:p-2 rounded-lg transition-colors -mr-1 sm:mr-0 shrink-0"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-y-auto">
          
          {/* Loading State - Auth Check */}
          {isAuthLoading && !isAuthenticated && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 flex items-center gap-3">
              <div className="animate-spin shrink-0">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 15" />
                </svg>
              </div>
              <p className="text-sm text-blue-700">Checking authentication status...</p>
            </div>
          )}

          {/* Auth Error */}
          {authError && !isAuthenticated && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
              <h3 className="font-semibold text-red-800 mb-1.5 sm:mb-2 text-sm sm:text-base">⚠️ Authentication Required</h3>
              <p className="text-xs sm:text-sm text-red-700 mb-3 sm:mb-4">{authError}</p>
              <button
                onClick={handleLogin}
                disabled={isAuthLoading}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-2.5 sm:py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.658 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                {isAuthLoading ? "Connecting..." : "Connect Google Calendar"}
              </button>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
              <p className="text-sm text-green-700 font-semibold">{successMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
              <p className="text-sm text-red-700 font-semibold">{errorMessage}</p>
            </div>
          )}

          {/* Subscriptions List */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Subscriptions to Remind ({subscriptions.length})
            </h3>
            <div className="space-y-2.5 sm:space-y-3">
              {subscriptions.map((sub, i) => (
                <SubscriptionCard key={i} subscription={sub} compact={true} />
              ))}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
            <p className="text-[11px] sm:text-xs text-blue-700 leading-relaxed">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1.5 sm:mr-2 -mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Each reminder will be created on the subscription's expiry date at 09:00 AM (Asia/Kolkata timezone) with both email and popup notifications.
            </p>
          </div>

        </div>

        {/* Footer */}
        {/* Changed from row-only to column-reverse on mobile so buttons stack neatly and span full width */}
        <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 justify-end sticky bottom-0 shrink-0">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-gray-700 hover:bg-gray-200 disabled:text-gray-400 rounded-lg font-medium transition-colors flex items-center justify-center text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateReminders}
            disabled={isLoading || !isAuthenticated || isAuthLoading}
            className="w-full sm:w-auto px-6 py-2.5 sm:py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm sm:text-base shadow-sm"
          >
            {isLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 15" />
                </svg>
                Creating...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create {subscriptions.length} Reminder{subscriptions.length > 1 ? "s" : ""}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}