import { useState } from "react";
import { openModalTween, closeModalTween } from "../utils/gsapTweens";

export function useModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const open = (
    id: string,
    modalRef: React.RefObject<HTMLDivElement>,
    contentRef: React.RefObject<HTMLDivElement>
  ) => {
    setSelectedId(id);
    setIsOpen(true);
    if (modalRef.current && contentRef.current) {
      openModalTween(modalRef.current, contentRef.current);
    }
  };

  const close = (
    modalRef: React.RefObject<HTMLDivElement>,
    contentRef: React.RefObject<HTMLDivElement>,
    onAfter?: () => void
  ) => {
    if (modalRef.current && contentRef.current) {
      closeModalTween(modalRef.current, contentRef.current, () => {
        setIsOpen(false);
        setSelectedId(null);
        if (onAfter) onAfter();
      });
    } else {
      setIsOpen(false);
      setSelectedId(null);
      if (onAfter) onAfter();
    }
  };

  return { isOpen, selectedId, open, close };
}
