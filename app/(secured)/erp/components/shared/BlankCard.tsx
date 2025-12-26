type Props = {
  className?: string;
  children: JSX.Element | JSX.Element[];
};

const BlankCard = ({ children, className }: Props) => {
  return (
    <div
      className={`bg-white rounded-sm shadow-sm relative ${className || ""}`}
    >
      {children}
    </div>
  );
};

export default BlankCard;
