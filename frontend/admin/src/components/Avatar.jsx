export default function Avatar({ name = "", email = "", size = "sm", square = false }) {
  const source = (name || email || "T").trim();
  const initial = source.charAt(0).toUpperCase();
  const dim = size === "lg" ? "h-14 w-14 text-xl" : "h-9 w-9 text-sm";
  const radius = square ? "rounded-2xl" : "rounded-full";

  return (
    <span className={`inline-flex shrink-0 items-center justify-center ${dim} ${radius} bg-orange-500 font-bold text-white`}>
      {initial}
    </span>
  );
}
