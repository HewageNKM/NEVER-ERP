"use client";
import React, { useState } from "react";
import { Item } from "@/model";
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Stack,
  Typography,
  IconButton,
  Tooltip,
} from "@mui/material";
import { IoPencil, IoTrashBin } from "react-icons/io5";
import { useRouter } from "next/navigation";
import ComponentsLoader from "@/app/components/ComponentsLoader";

const ItemCard = ({ item, onEdit }: { item: Item; onEdit: any }) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  return (
    <Card
      onClick={() => router.push(`/dashboard/oldInventory/${item.itemId}`)}
      sx={{
        position: "relative",
        borderRadius: 3,
        overflow: "hidden",
        boxShadow: "0px 2px 8px rgba(0,0,0,0.08)",
        transition: "transform 0.25s ease, box-shadow 0.25s ease",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0px 6px 16px rgba(0,0,0,0.12)",
        },
        width: 250,
        height: 400,
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.paper",
      }}
    >
      {/* Thumbnail Section */}
      <Box sx={{ position: "relative" }}>
        <CardMedia
          component="img"
          image={item.thumbnail?.url}
          alt={item.name}
          sx={{
            height: 180,
            objectFit: "cover",
            cursor: "pointer",
          }}
        />

        {/* Hover Overlay */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            bgcolor: "rgba(0,0,0,0.45)",
            opacity: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 2,
            transition: "opacity 0.2s ease",
            "&:hover": { opacity: 1 },
          }}
        >
          <Tooltip title="Edit">
            <IconButton
              onClick={onEdit}
              sx={{
                color: "white",
                bgcolor: "rgba(255,255,255,0.15)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.3)" },
              }}
            >
              <IoPencil size={20} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Delete">
            <IconButton
              sx={{
                color: "white",
                bgcolor: "rgba(255,0,0,0.2)",
                "&:hover": { bgcolor: "rgba(255,0,0,0.4)" },
              }}
            >
              <IoTrashBin size={20} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Status Overlay */}
        {item.status === "Inactive" && (
          <Box
            sx={{
              position: "absolute",
              top: 8,
              left: 8,
              bgcolor: "rgba(0,0,0,0.6)",
              px: 1,
              py: 0.3,
              borderRadius: 1,
            }}
          >
            <Typography variant="caption" sx={{ color: "white" }}>
              Inactive
            </Typography>
          </Box>
        )}

        {/* Top-right Badges */}
        <Stack
          direction="row"
          spacing={1}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
          }}
        >
          <Chip
            size="small"
            label={item.type}
            sx={{
              bgcolor: "primary.main",
              color: "white",
              textTransform: "capitalize",
            }}
          />
        </Stack>
      </Box>

      {/* Product Details */}
      <CardContent
        sx={{
          p: 2,
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography
            variant="subtitle2"
            sx={{
              color: "text.secondary",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {item.itemId}
          </Typography>

          <Typography
            variant="h6"
            noWrap
            sx={{
              fontWeight: 600,
              textTransform: "capitalize",
              mt: 0.3,
              mb: 1,
            }}
          >
            {item.name}
          </Typography>

          <Stack spacing={0.3}>
            <Typography variant="body2" color="text.primary">
              <strong>Buying:</strong> LKR {item.buyingPrice.toFixed(2)}
            </Typography>
            <Typography variant="body2" color="text.primary">
              <strong>Selling:</strong> LKR{" "}
              {(
                Math.round(
                  (item.sellingPrice -
                    (item.discount * item.sellingPrice) / 100) /
                    10
                ) * 10
              ).toFixed(2)}
            </Typography>
            <Typography variant="body2" color="text.primary">
              <strong>Discount:</strong> {item.discount.toFixed(2)}%
            </Typography>
          </Stack>
        </Box>

        <Box>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mt={1.5}
          >
            <Stack spacing={0.3}>
              <Typography
                variant="body2"
                sx={{ color: item.status === "Active" ? "green" : "red" }}
              >
                Status: {item.status}
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: item.listing === "Active" ? "green" : "red" }}
              >
                Listing: {item.listing}
              </Typography>
            </Stack>

            <Chip
              label={`${item.variants.length} variants`}
              size="small"
              sx={{
                bgcolor: "grey.200",
                color: "text.primary",
                fontWeight: 500,
              }}
            />
          </Stack>

          <Stack direction="row" spacing={1} mt={1.5}>
            <Chip
              label={item.manufacturer}
              size="small"
              sx={{
                bgcolor: "success.main",
                color: "white",
                textTransform: "capitalize",
              }}
            />
            <Chip
              label={item.brand}
              size="small"
              sx={{
                bgcolor: "info.main",
                color: "white",
                textTransform: "capitalize",
              }}
            />
          </Stack>
        </Box>
      </CardContent>

      {isLoading && <ComponentsLoader title="Working..." position="" />}
    </Card>
  );
};

export default ItemCard;
