import { useEffect, useState } from "react";

/** True on phones — used for journal selection UI (independent of tablet/desktop). */
export function usePhoneLayout(): boolean {
  const [phone, setPhone] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 639px)").matches
      : false,
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setPhone(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return phone;
}
