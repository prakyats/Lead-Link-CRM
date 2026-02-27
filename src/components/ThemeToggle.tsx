import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes@0.4.6";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function ThemeToggle({ className, onClick, ...props }: Props) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const isDark = (theme ?? "dark") === "dark";

  return (
    <button
      type={props.type ?? "button"}
      aria-label={mounted ? (isDark ? "Switch to light mode" : "Switch to dark mode") : "Toggle theme"}
      onClick={(e) => {
        setTheme(isDark ? "light" : "dark");
        onClick?.(e);
      }}
      className={className}
      {...props}
    >
      {mounted ? (
        isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />
      ) : (
        <div className="w-4 h-4" />
      )}
    </button>
  );
}

