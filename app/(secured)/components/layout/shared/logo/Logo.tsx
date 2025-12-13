import Link from "next/link";
import { styled } from "@mui/material";
import Image from "next/image";

const LinkStyled = styled(Link)(() => ({
  height: "150px",
  width: "150px",
  overflow: "hidden",
  display: "block",
}));

const Logo = () => {
  return (
    <LinkStyled href="/">
      <Image src="/images/logo.png" alt="logo" height={150} width={150} priority />
    </LinkStyled>
  );
};

export default Logo;
  