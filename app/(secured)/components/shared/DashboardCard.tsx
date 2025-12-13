import React from "react";

type Props = {
  title?: string;
  subtitle?: string;
  action?: JSX.Element | any;
  footer?: JSX.Element;
  cardheading?: string | JSX.Element;
  headtitle?: string | JSX.Element;
  headsubtitle?: string | JSX.Element;
  children?: JSX.Element;
  middlecontent?: string | JSX.Element;
};

const DashboardCard = ({
  title,
  subtitle,
  children,
  action,
  footer,
  cardheading,
  headtitle,
  headsubtitle,
  middlecontent,
}: Props) => {
  return (
    <div className="bg-white border border-gray-200 w-full h-full relative overflow-hidden">
      {cardheading ? (
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-black uppercase tracking-tighter">
            {headtitle}
          </h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
            {headsubtitle}
          </p>
        </div>
      ) : (
        <div className="p-6">
          {title ? (
            <div className="flex justify-between items-center mb-6">
              <div>
                {title ? (
                  <h2 className="text-xl font-black uppercase tracking-tighter text-black">
                    {title}
                  </h2>
                ) : null}

                {subtitle ? (
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                    {subtitle}
                  </p>
                ) : null}
              </div>
              {action}
            </div>
          ) : null}

          {children}
        </div>
      )}

      {middlecontent}
      {footer}
    </div>
  );
};

export default DashboardCard;
