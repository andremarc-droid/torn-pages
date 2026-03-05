import logoImage from "@/assets/transparent logo.png";

type LogoProps = {
  className?: string;
};

export default function Logo({ className = "h-8" }: LogoProps) {
  return (
    <img
      src={logoImage}
      alt="Notes & Ears logo"
      className={`w-auto ${className}`}
    />
  );
}
