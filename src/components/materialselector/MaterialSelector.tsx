import Carousel3D from './Carousel3D';

// Minimal host that renders the current 3D carousel selector
export interface MaterialSelectorProps {
  // Kept for backward compatibility; currently unused
  onMaterialSelect?: () => void;
}

export default function MaterialSelector(_props: MaterialSelectorProps) {
  return <Carousel3D />;
}
