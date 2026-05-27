import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#111827",
        cloud: "#f8fafc",
        mint: "#d9fbef",
        aqua: "#d7f7ff",
        lemon: "#fff7cf",
        lavender: "#efe7ff",
        coral: "#ffe3dc"
      },
      boxShadow: {
        soft: "0 16px 60px rgba(15, 23, 42, 0.08)",
        card: "0 1px 0 rgba(15, 23, 42, 0.04), 0 12px 32px rgba(15, 23, 42, 0.08)"
      },
      borderRadius: {
        xxl: "1.75rem"
      }
    }
  },
  plugins: []
};
export default config;
