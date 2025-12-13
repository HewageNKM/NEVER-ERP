// Import React to use React.Fragment
import React, { useState } from "react"; 
import {
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Collapse,
  styled,
  useTheme,
  List,
} from "@mui/material";
import Link from "next/link";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";

interface NavItemProps {
  item: any;
  level?: number;
  pathDirect: string;
  onClick: () => void;
}

const NavItem = ({ item, level = 1, pathDirect, onClick }: NavItemProps) => {
  const theme = useTheme();
  const hasChildren = Array.isArray(item.children) && item.children.length > 0;

  const isChildActive = hasChildren
    ? item.children.some(
        (child: any) => child.href && pathDirect.startsWith(child.href)
      )
    : false;

  const [open, setOpen] = useState(isChildActive);
  const Icon = item.icon;

  const ListItemStyled = styled(ListItem)(() => ({
    padding: 0,
    ".MuiButtonBase-root": {
      whiteSpace: "nowrap",
      marginBottom: "2px",
      padding: "8px 10px",
      borderRadius: "8px",
      backgroundColor: level > 1 ? "transparent !important" : "inherit",
      color: theme.palette.text.secondary,
      paddingLeft: `${level * 16}px`,
      "&:hover": {
        backgroundColor: theme.palette.primary.light,
        color: theme.palette.primary.main,
      },
      "&.Mui-selected": {
        color: "white",
        backgroundColor: theme.palette.primary.main,
        "&:hover": {
          backgroundColor: theme.palette.primary.main,
          color: "white",
        },
      },
    },
  }));

  const isSelected =
    (level === 1 && pathDirect === item.href) ||
    (level > 1 && item.href && pathDirect.startsWith(item.href));

  return (
    // --- FIX: Changed from <List> to <React.Fragment> ---
    <React.Fragment>
      <ListItemStyled>
        <ListItemButton
          component={item.href ? Link : "button"}
          href={item.href || undefined}
          selected={isSelected}
          onClick={() => {
            if (hasChildren) setOpen(!open);
            if (onClick) onClick();
          }}
        >
          {item.icon && (
            <ListItemIcon sx={{ minWidth: 36, p: "3px 0", color: "inherit" }}>
              <Icon stroke={1.5} size="1.3rem" />
            </ListItemIcon>
          )}
          <ListItemText>{item.title}</ListItemText>
          {hasChildren &&
            (open ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />)}
        </ListItemButton>
      </ListItemStyled>

      {hasChildren && (
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {item.children.map((child: any) => (
              <NavItem
                key={child.id}
                item={child}
                level={level + 1}
                pathDirect={pathDirect}
                onClick={onClick}
              />
            ))}
          </List>
        </Collapse>
      )}
    </React.Fragment>
  );
};

export default NavItem;