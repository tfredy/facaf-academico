import { cn } from "@/lib/utils";
import Image from "next/image";

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-xl",
  xl: "h-20 w-20 text-3xl",
};

const imageSizes = { xs: 24, sm: 32, md: 40, lg: 56, xl: 80 };

export function Avatar({ src, name, size = "sm", className }: AvatarProps) {
  const initial = name?.charAt(0)?.toUpperCase() ?? "U";

  if (src) {
    return (
      <div className={cn(
        "relative shrink-0 overflow-hidden rounded-full",
        sizeClasses[size],
        className
      )}>
        <Image
          src={src}
          alt={name ?? "Avatar"}
          width={imageSizes[size]}
          height={imageSizes[size]}
          className="h-full w-full object-cover"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div className={cn(
      "flex shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold",
      sizeClasses[size],
      className
    )}>
      {initial}
    </div>
  );
}
