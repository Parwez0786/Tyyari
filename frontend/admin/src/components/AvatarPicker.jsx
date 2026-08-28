import { useRef } from "react";
import { Camera } from "lucide-react";
import Avatar from "./Avatar";
import { compressImage } from "../utils/image";

export default function AvatarPicker({
  name = "",
  email = "",
  src = "",
  size = "lg",
  square = false,
  disabled = false,
  busy = false,
  onChange,
  onRemove,
  onError,
}) {
  const inputRef = useRef(null);

  async function pick(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || disabled || busy) return;
    try {
      const next = await compressImage(file);
      await onChange(next);
    } catch (err) {
      onError?.(err);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="relative shrink-0">
        <Avatar name={name} email={email} src={src} size={size} square={square} />
        {!disabled && (
          <button
            type="button"
            className="absolute -bottom-1 -right-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-line bg-card text-ink shadow-sm hover:bg-field"
            aria-label="Change photo"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            <Camera size={14} />
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={pick}
        />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-mute">JPG or PNG. We crop it square.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-ghost"
            disabled={disabled || busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? "Uploading…" : src ? "Change photo" : "Add photo"}
          </button>
          {src && (
            <button
              type="button"
              className="btn-ghost !text-hard"
              disabled={disabled || busy}
              onClick={onRemove}
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
