export const clerkGlobalAppearance = {
  layout: {
    socialButtonsPlacement: "bottom",
    socialButtonsVariant: "blockButton",
  },
  variables: {
    colorPrimary: "hsl(221.2, 83.2%, 53.3%)",
    colorBackground: "#ffffff",
    colorText: "#0f172a",
    colorTextSecondary: "#64748b",
    colorInputBackground: "#f8fafc",
    colorInputText: "#0f172a",
    colorDanger: "hsl(346.8, 77.2%, 49.8%)",
    colorSuccess: "#059669",
  },
  elements: {
    card: {
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
      padding: "2.5rem",
      borderRadius: "1.25rem",
    },
    headerTitle: {
      color: "#0f172a",
      fontWeight: "800",
      fontSize: "1.5rem",
      letterSpacing: "-0.02em",
    },
    headerSubtitle: {
      color: "#64748b",
      fontSize: "0.875rem",
    },
    formFieldLabel: {
      color: "#1e293b",
      fontWeight: "700",
      fontSize: "0.8rem",
    },
    formFieldInput: {
      border: "1.5px solid #e2e8f0",
      borderRadius: "0.75rem",
      fontSize: "0.875rem",
      padding: "0.75rem 0.875rem",
      background: "#f8fafc",
      color: "#0f172a",
      transition: "all 0.2s ease",
      "&:focus": {
        borderColor: "hsl(221.2, 83.2%, 53.3%)",
        background: "#ffffff",
      }
    },
    otpCodeFieldInput: {
      border: "1.5px solid #e2e8f0",
      borderRadius: "0.5rem",
      background: "#f8fafc",
      color: "#0f172a",
      "&:focus": {
        borderColor: "hsl(221.2, 83.2%, 53.3%)",
        background: "#ffffff",
      }
    },
    formButtonPrimary: {
      borderRadius: "0.75rem",
      fontSize: "0.875rem",
      fontWeight: "700",
      padding: "0.875rem 1rem",
      background: "hsl(221.2, 83.2%, 53.3%)",
      color: "#ffffff",
      boxShadow: "0 4px 12px rgba(37, 99, 235, 0.15)",
      transition: "all 0.2s ease",
      "&:hover": {
        background: "hsl(221.2, 83.2%, 48%)",
      }
    },
    dividerLine: { background: "#e2e8f0" },
    dividerText: { color: "#94a3b8", fontSize: "0.75rem" },
    footerActionLink: { color: "hsl(221.2, 83.2%, 53.3%)", fontWeight: "700" },
    footerActionText: { color: "#64748b" },
    formFieldErrorText: { color: "hsl(346.8, 77.2%, 49.8%)" },
    formFieldSuccessText: { color: "#059669" },
    developmentModeWarning: { display: "none" },
    badge: { display: "none" },
    devModeWarning: { display: "none" },
    footer: { display: "none" },
    rootBox: { width: "100%" },
    identityPreviewText: { color: "#0f172a", fontWeight: "600" },
    identityPreview: { background: "#f8fafc", border: "1px solid #e2e8f0" },
    identityPreviewEditButtonIcon: { color: "#64748b" },
  },
} as const;
