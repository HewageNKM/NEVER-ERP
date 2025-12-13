import React from "react";
import { Box, CircularProgress, Typography } from "@mui/material";

const ComponentsLoader = ({
  title,
  position = "fixed",
}: {
  title?: string;
  position?: any;
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
        // NIKE STYLE: Solid White, No Blur
        backgroundColor: "#ffffff",
        zIndex: 9999,
        // NIKE STYLE: Sharp edges, no shadow
        borderRadius: 0,
        boxShadow: "none",
      }}
    >
      <CircularProgress
        size="2.5rem"
        thickness={5} // Thicker, bolder stroke
        sx={{
          color: "#000000", // Pure Black spinner
        }}
      />
    </Box>
  );
};

export default ComponentsLoader;
