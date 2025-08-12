import { forwardRef } from "react";

type GlobalProgressBarProps = React.HTMLAttributes<HTMLDivElement>;

export const GlobalProgressBar = forwardRef<HTMLDivElement, GlobalProgressBarProps>(function GlobalProgressBar(props, ref) {
  const { className, ...rest } = props;
  return (
    <div className={`mb-8 ${className ?? ""}`} {...rest}>
      <div ref={ref} className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-300 ease-out"
          style={{ width: "0%" }}
        />
      </div>
    </div>
  );
});
