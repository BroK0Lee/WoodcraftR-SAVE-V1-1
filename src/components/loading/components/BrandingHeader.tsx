import { forwardRef } from "react";
import { TreePine } from "lucide-react";

type BrandingHeaderProps = React.HTMLAttributes<HTMLDivElement>;

export const BrandingHeader = forwardRef<HTMLDivElement, BrandingHeaderProps>(function BrandingHeader(props, ref) {
  const { className, ...rest } = props;
  return (
    <div ref={ref} className={`mb-8 ${className ?? ""}`} {...rest}>
      <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-amber-600 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
        <TreePine className="w-10 h-10 text-white" />
      </div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">WoodcraftR</h1>
      <p className="text-gray-600 text-sm">Votre atelier de découpe bois personnalisé</p>
    </div>
  );
});
