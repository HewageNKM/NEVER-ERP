import React from "react";
import { Box, CircularProgress, Typography } from "@mui/material";

const ComponentsLoader = ({
  title = "LOADING",
  position = "absolute",
}: {
  title?: string;
  position?: "fixed" | "absolute" | "relative";
}) => {
  return (
    <Box
      sx={{
        position: position,
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#ffffff", // Solid White foundation
        zIndex: 9999,
        gap: 2,
      }}
    >
      <CircularProgress
        size={40}
        thickness={6} // Extra bold stroke
        sx={{
          color: "#000000", // Pure Black
          "& .MuiCircularProgress-circle": {
            strokeLinecap: "butt", // Sharp, flat ends on the spinner line
          },
        }}
      />

      {/* Industrial Label */}
      <Typography
        variant="caption"
        sx={{
          color: "#000000",
          fontWeight: 900,
          fontSize: "0.7rem",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          fontFamily: "monospace", // Technical feel
        }}
      >
        {title}
      </Typography>
    </Box>
  );
};

export default ComponentsLoader;
