import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import Link from "next/link";

const NotFound = () => {
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      sx={{
        height: "100vh",
        backgroundColor: "#ffffff",
        color: "#000000",
        padding: 4,
        textAlign: "center",
      }}
    >
      <Box sx={{ mb: 6 }}>
        {/* Massive 404 Text */}
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: "8rem", md: "14rem" }, // Responsive giant text
            fontWeight: 900,
            fontStyle: "italic",
            lineHeight: 0.8,
            letterSpacing: "-0.05em",
            textTransform: "uppercase",
            color: "#000000",
            userSelect: "none",
          }}
        >
          404
        </Typography>

        {/* Technical Subtitle */}
        <Typography
          variant="subtitle1"
          sx={{
            mt: 4,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            color: "#9e9e9e",
            fontSize: "0.875rem",
          }}
        >
          The page you are looking for
          <br />
          has been moved or does not exist.
        </Typography>
      </Box>

      {/* Black Pill Button */}
      <Link href="/" style={{ textDecoration: "none" }}>
        <Box
          sx={{
            backgroundColor: "#000000",
            color: "#ffffff",
            padding: "18px 50px",
            borderRadius: "9999px", // Pill shape
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            fontSize: "0.9rem",
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              backgroundColor: "#333333",
              transform: "translateY(-2px)",
            },
          }}
        >
          Return Home
        </Box>
      </Link>

      {/* Footer Brand Mark */}
      <Box
        sx={{
          position: "absolute",
          bottom: 40,
          opacity: 0.3,
          fontWeight: 900,
          fontStyle: "italic",
          fontSize: "1.5rem",
          letterSpacing: "-0.05em",
        }}
      >
        NEVERBE
      </Box>
    </Stack>
  );
};

export default NotFound;
