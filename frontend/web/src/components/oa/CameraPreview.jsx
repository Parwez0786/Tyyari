export default function CameraPreview({
  videoRef,
  ready,
  compact = false,
  variant = "default",
  label = "Camera preview",
}) {
  if (variant === "check") {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-slate-100 dark:bg-white/5">
        <video
          ref={videoRef}
          className={`aspect-[16/10] w-full object-cover ${ready ? "block" : "hidden"}`}
          autoPlay
          muted
          playsInline
          aria-label={label}
        />
        {!ready && (
          <div className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-3 text-slate-400">
            <CameraGlyph />
            <p className="text-sm font-medium">Camera feed inactive</p>
          </div>
        )}
        <span
          className={`absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            ready
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              : "bg-white/90 text-slate-500 shadow-sm dark:bg-black/50 dark:text-slate-300"
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${ready ? "bg-emerald-500" : "bg-slate-400"}`} />
          {ready ? "Camera On" : "Camera Off"}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl border border-white/10 bg-black ${compact ? "h-24 w-32" : "aspect-video w-full"}`}>
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        autoPlay
        muted
        playsInline
        aria-label={label}
      />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 px-3 text-center text-xs font-medium text-mute">
          Camera off
        </div>
      )}
    </div>
  );
}

function CameraGlyph() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M15 10l4.5-3v10L15 14" />
      <rect x="3" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}
