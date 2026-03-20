// Replace CLERK_JWT_ISSUER_DOMAIN with your Clerk Frontend API URL
// Format: https://verb-noun-00.clerk.accounts.dev
// Set this as an environment variable in your Convex dashboard

const authConfig = {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};

export default authConfig;
