import React from "react";
import Link from "next/link";
import { IoLockClosed } from "react-icons/io5"; // Ensure you have react-icons installed

const Page = () => {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#ffffff",
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        color: "#000000",
      }}
    >
      <div
        style={{
          textAlign: "center",
          padding: "2rem",
          maxWidth: "500px",
        }}
      >
        {/* Icon */}
        <div
          style={{
            fontSize: "4rem",
            marginBottom: "1rem",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <IoLockClosed style={{ color: "#000000" }} />
        </div>

        {/* Main Heading: Industrial/Speed Look */}
        <h1
          style={{
            color: "#000000",
            fontSize: "3.5rem",
            fontWeight: "900",
            fontStyle: "italic",
            textTransform: "uppercase",
            letterSpacing: "-0.05em",
            lineHeight: "0.9",
            marginBottom: "1.5rem",
          }}
        >
          Restricted
          <br />
          Access
        </h1>

        {/* Subtext: Technical/Spec Look */}
        <p
          style={{
            color: "#757575",
            fontSize: "0.85rem",
            fontWeight: "700",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            lineHeight: "1.6",
            marginBottom: "3rem",
          }}
        >
          You do not have the required permissions
          <br />
          to view this secured area.
        </p>

        {/* Action: Black Pill Button */}
        <Link
          href="/"
          style={{
            color: "#ffffff",
            backgroundColor: "#000000",
            padding: "18px 50px",
            borderRadius: "9999px", // Pill shape
            textDecoration: "none",
            display: "inline-block",
            fontSize: "0.9rem",
            fontWeight: "700",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            transition: "all 0.2s ease",
          }}
        >
          Return to Login
        </Link>
      </div>

      {/* Footer Brand Element */}
      <div
        style={{
          position: "fixed",
          bottom: "2rem",
          fontSize: "0.7rem",
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "#e5e5e5",
        }}
      >
        NEVERBE SECURITY
      </div>
    </main>
  );
};

export default Page;
