import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#f6f3ee",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Outfit:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <div style={{ textAlign: "center" }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#2c2824",
            fontFamily: "'Fraunces', Georgia, serif",
            marginBottom: 4,
          }}
        >
          ProcessDraw
        </h1>
        <p
          style={{
            fontSize: 13,
            color: "#8a8078",
            marginBottom: 28,
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          Sign in with your employee code
        </p>
        <SignIn
          routing="hash"
          appearance={{
            elements: {
              formButtonPrimary: {
                backgroundColor: "#3d8b8b",
                "&:hover": { backgroundColor: "#2d6b6b" },
              },
              card: {
                borderRadius: "16px",
                boxShadow: "0 8px 32px rgba(44,40,36,0.1)",
              },
            },
          }}
        />
      </div>
    </div>
  );
}
