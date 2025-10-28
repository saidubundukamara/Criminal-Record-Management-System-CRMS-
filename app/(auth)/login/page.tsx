"use client";

/**
 * Login Page
 *
 * Authentication page for officers using Badge + PIN.
 * Uses NextAuth.js credentials provider for authentication.
 *
 * Pan-African Design: Simple, accessible login for all officers
 */
import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

/**
 * Login form schema
 */
const loginSchema = z.object({
  badge: z
    .string()
    .min(3, "Badge number must be at least 3 characters")
    .max(20, "Badge number must not exceed 20 characters")
    .regex(
      /^[A-Z0-9-]+$/,
      "Badge must contain only uppercase letters, numbers, and hyphens"
    ),
  pin: z
    .string()
    .length(8, "PIN must be exactly 8 digits")
    .regex(/^\d+$/, "PIN must contain only digits"),
});

type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Inner LoginForm component that uses useSearchParams
 */
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get error from URL params (e.g., session expired)
  const urlError = searchParams.get("error");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        badge: data.badge,
        pin: data.pin,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid credentials. Please check your badge and PIN.");
      } else if (result?.ok) {
        // Successful login - redirect to dashboard
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred during login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Officer Login</h2>
        <p className="mt-2 text-sm text-slate-600">
          Enter your badge number and PIN to access the system
        </p>
      </div>

      {/* Error Messages */}
      {(error || urlError) && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-red-600 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Authentication Failed
              </h3>
              <p className="mt-1 text-sm text-red-700">
                {error ||
                  (urlError === "AccountInactive"
                    ? "Your account is inactive. Please contact your administrator."
                    : "Session expired. Please log in again.")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Badge Number Field */}
        <div>
          <label
            htmlFor="badge"
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            Badge Number
          </label>
          <input
            id="badge"
            type="text"
            placeholder="SA-00001"
            disabled={isLoading}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
              errors.badge
                ? "border-red-300 bg-red-50"
                : "border-slate-300 bg-white"
            } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            {...register("badge", {
              onChange: (e) => {
                // Auto-uppercase
                e.target.value = e.target.value.toUpperCase();
              },
            })}
          />
          {errors.badge && (
            <p className="mt-2 text-sm text-red-600">{errors.badge.message}</p>
          )}
          <p className="mt-2 text-xs text-slate-500">
            Format: AA-NNNNN (e.g., SA-00001, HQ-12345)
          </p>
        </div>

        {/* PIN Field */}
        <div>
          <label
            htmlFor="pin"
            className="block text-sm font-medium text-slate-700 mb-2"
          >
            PIN
          </label>
          <input
            id="pin"
            type="password"
            placeholder="••••••••"
            disabled={isLoading}
            maxLength={8}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${
              errors.pin
                ? "border-red-300 bg-red-50"
                : "border-slate-300 bg-white"
            } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            {...register("pin")}
          />
          {errors.pin && (
            <p className="mt-2 text-sm text-red-600">{errors.pin.message}</p>
          )}
          <p className="mt-2 text-xs text-slate-500">
            Enter your 8-digit PIN
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 px-4 rounded-lg font-medium text-white transition ${
            isLoading
              ? "bg-blue-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
          } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Authenticating...
            </span>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      {/* Security Notice */}
      <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-slate-600 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="ml-3">
            <p className="text-sm text-slate-700">
              <strong>Security Notice:</strong> Your account will be locked
              after 5 failed login attempts for 30 minutes.
            </p>
          </div>
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-6 text-center">
        <p className="text-sm text-slate-600">
          Forgot your PIN?{" "}
          <span className="text-blue-600 font-medium">
            Contact your station commander
          </span>
        </p>
      </div>
    </div>
  );
}

/**
 * Main LoginPage component with Suspense boundary
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center text-slate-600">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
