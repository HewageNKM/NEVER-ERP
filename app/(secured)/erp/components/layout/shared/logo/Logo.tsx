import Image from "next/image";

const Logo = () => {
  return (
    <Image
      src="/images/logo.png"
      alt="logo"
      height={150}
      width={150}
      priority
    />
  );
};

export default Logo;
