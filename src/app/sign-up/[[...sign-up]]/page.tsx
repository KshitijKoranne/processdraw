import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#f5f0e8",
        fontFamily: "'Playfair Display', Georgia, serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#2c2a26",
            marginBottom: 8,
          }}
        >
          ProcessDraw
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "#6b6560",
            marginBottom: 32,
            fontFamily: "'Source Sans 3', sans-serif",
          }}
        >
          Create your account
        </p>
        <SignUp routing="hash" />
      </div>
    </div>
  );
}
