import { useEffect, useRef, useState } from "react";

export function useCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  function attachVideo(node) {
    videoRef.current = node;
    if (node && streamRef.current) {
      node.srcObject = streamRef.current;
      node.play().catch(() => {});
    }
  }
  const [stream, setStream] = useState(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const node = videoRef.current;
    if (!node || !stream) return;
    node.srcObject = stream;
    const play = () => node.play().catch(() => {});
    node.addEventListener("loadedmetadata", play);
    play();
    return () => node.removeEventListener("loadedmetadata", play);
  }, [stream]);

  useEffect(() => {
    if (!stream) return undefined;
    const tracks = stream.getVideoTracks();
    function onEnded() {
      setReady(false);
      setError("Camera was turned off. Enable it to continue.");
      streamRef.current = null;
      setStream(null);
    }
    tracks.forEach((track) => track.addEventListener("ended", onEnded));
    return () => tracks.forEach((track) => track.removeEventListener("ended", onEnded));
  }, [stream]);

  async function enable() {
    setError("");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera is not supported in this browser.");
      }
      const next = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = next;
      setStream(next);
      setReady(true);
      if (videoRef.current) {
        videoRef.current.srcObject = next;
        videoRef.current.play().catch(() => {});
      }
      return true;
    } catch (err) {
      const denied = err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError";
      setReady(false);
      streamRef.current = null;
      setStream(null);
      setError(denied
        ? "Camera permission is required before you can enter this assessment."
        : (err?.message || "Could not start the camera."));
      return false;
    }
  }

  function stop() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStream(null);
    setReady(false);
  }

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  return { videoRef: attachVideo, stream, error, ready, enable, stop };
}
