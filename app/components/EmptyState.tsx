import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import { IoWarningOutline } from "react-icons/io5";

const EmptyState = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) => {
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      spacing={3}
      sx={{
        height: "100%",
        minHeight: 300,
        textAlign: "center",
        color: "#000000",
        borderRadius: 0, // NIKE STYLE: Sharp edges
        border: "1px solid #e5e5e5", // Industrial border
        backgroundColor: "#ffffff",
        p: 6,
      }}
    >
      <Box sx={{ fontSize: 64, color: "#000000" }}>
        <IoWarningOutline style={{ strokeWidth: "20px" }} />
      </Box>

      <Box>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 900, // Black weight
            color: "#000000",
            textTransform: "uppercase",
            fontStyle: "italic", // Speed/Motion
            letterSpacing: "-0.05em", // Tight tracking
            lineHeight: 1,
            mb: 1,
          }}
        >
          {title}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            textTransform: "uppercase",
            letterSpacing: "0.15em", // Technical wide tracking
            fontWeight: 700,
            color: "#9e9e9e", // Technical gray
            fontSize: "0.7rem",
          }}
        >
          {subtitle}
        </Typography>
      </Box>
    </Stack>
  );
};

export default EmptyState;
